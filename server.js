require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify');

const app = express();
const PORT = process.env.PORT || 3000;

// Check DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Please add PostgreSQL to your Railway project and link it.');
  process.exit(1);
}

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database tables
async function initDB() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  }
}

// ====== Survey Routes ======

// POST /api/session - find or create submission
app.post('/api/session', async (req, res) => {
  const { phone, class_name } = req.body;
  if (!phone) {
    return res.status(400).json({ error: '전화번호를 입력해주세요.' });
  }
  try {
    // Find existing incomplete submission
    const existing = await pool.query(
      'SELECT id FROM submissions WHERE phone = $1 AND is_complete = FALSE ORDER BY created_at DESC LIMIT 1',
      [phone]
    );
    if (existing.rows.length > 0) {
      return res.json({ submission_id: existing.rows[0].id });
    }
    // Create new submission
    const result = await pool.query(
      'INSERT INTO submissions (phone, class_name) VALUES ($1, $2) RETURNING id',
      [phone, class_name || '']
    );
    res.json({ submission_id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/session/:id - get submission + responses
app.get('/api/session/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const subResult = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);
    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: '설문을 찾을 수 없습니다.' });
    }
    const responses = await pool.query(
      'SELECT * FROM responses WHERE submission_id = $1',
      [id]
    );
    res.json({
      submission: subResult.rows[0],
      responses: responses.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// POST /api/response - upsert response for a child slot
app.post('/api/response', async (req, res) => {
  const { submission_id, child_slot, child_name, child_age, ...qs } = req.body;
  if (!submission_id || !child_slot) {
    return res.status(400).json({ error: '필수 값이 누락되었습니다.' });
  }

  const qFields = [];
  const qValues = [];
  for (let i = 1; i <= 26; i++) {
    const val = qs[`q${i}`];
    qFields.push(`q${i}`);
    qValues.push(val !== undefined && val !== '' ? parseInt(val) : null);
  }

  try {
    // Check if response exists
    const existing = await pool.query(
      'SELECT id FROM responses WHERE submission_id = $1 AND child_slot = $2',
      [submission_id, child_slot]
    );

    if (existing.rows.length > 0) {
      // Update
      const setClause = qFields.map((f, i) => `${f} = $${i + 3}`).join(', ');
      await pool.query(
        `UPDATE responses SET child_name = $1, child_age = $2, ${setClause}, updated_at = NOW() WHERE submission_id = $${qFields.length + 3} AND child_slot = $${qFields.length + 4}`,
        [child_name || '', child_age || null, ...qValues, submission_id, child_slot]
      );
    } else {
      // Insert
      const cols = ['submission_id', 'child_slot', 'child_name', 'child_age', ...qFields];
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      await pool.query(
        `INSERT INTO responses (${cols.join(', ')}) VALUES (${placeholders})`,
        [submission_id, child_slot, child_name || '', child_age || null, ...qValues]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// POST /api/submit - finalize submission
app.post('/api/submit', async (req, res) => {
  const { submission_id } = req.body;
  if (!submission_id) {
    return res.status(400).json({ error: '제출 ID가 없습니다.' });
  }
  try {
    await pool.query(
      'UPDATE submissions SET is_complete = TRUE, submitted_at = NOW() WHERE id = $1',
      [submission_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ====== Admin Routes ======

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'survey2024';
  if (password === adminPassword) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }
});

// Admin auth middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ error: '관리자 로그인이 필요합니다.' });
}

// GET /api/admin/list
app.get('/api/admin/list', requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, phone } = req.query;
    let query = `
      SELECT s.id, s.phone, s.class_name, s.created_at, s.submitted_at, s.is_complete,
             COUNT(r.id) as response_count
      FROM submissions s
      LEFT JOIN responses r ON r.submission_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (start_date) {
      query += ` AND s.created_at >= $${paramIdx++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND s.created_at <= $${paramIdx++}`;
      params.push(end_date + ' 23:59:59');
    }
    if (phone) {
      query += ` AND s.phone LIKE $${paramIdx++}`;
      params.push(`%${phone}%`);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/admin/detail/:id
app.get('/api/admin/detail/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const subResult = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);
    if (subResult.rows.length === 0) {
      return res.status(404).json({ error: '설문을 찾을 수 없습니다.' });
    }
    const responses = await pool.query(
      'SELECT * FROM responses WHERE submission_id = $1 ORDER BY child_slot',
      [id]
    );
    res.json({
      submission: subResult.rows[0],
      responses: responses.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/admin/export - CSV export
app.get('/api/admin/export', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id as submission_id, s.phone, s.class_name,
             s.created_at, s.submitted_at, s.is_complete,
             r.child_slot, r.child_name, r.child_age,
             r.q1, r.q2, r.q3, r.q4, r.q5,
             r.q6, r.q7, r.q8, r.q9, r.q10,
             r.q11, r.q12, r.q13, r.q14, r.q15,
             r.q16, r.q17, r.q18, r.q19, r.q20,
             r.q21, r.q22, r.q23, r.q24, r.q25, r.q26
      FROM submissions s
      LEFT JOIN responses r ON r.submission_id = s.id
      WHERE s.is_complete = TRUE
      ORDER BY s.id, r.child_slot
    `);

    const headers = [
      '제출ID', '교사전화번호', '반이름', '생성일시', '제출일시', '완료여부',
      '아동슬롯', '아동이름', '연령',
      'Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10',
      'Q11','Q12','Q13','Q14','Q15','Q16','Q17','Q18','Q19','Q20',
      'Q21','Q22','Q23','Q24','Q25','Q26'
    ];

    const rows = result.rows.map(r => [
      r.submission_id, r.phone, r.class_name,
      r.created_at ? new Date(r.created_at).toLocaleString('ko-KR') : '',
      r.submitted_at ? new Date(r.submitted_at).toLocaleString('ko-KR') : '',
      r.is_complete ? '완료' : '미완료',
      r.child_slot, r.child_name, r.child_age,
      r.q1, r.q2, r.q3, r.q4, r.q5,
      r.q6, r.q7, r.q8, r.q9, r.q10,
      r.q11, r.q12, r.q13, r.q14, r.q15,
      r.q16, r.q17, r.q18, r.q19, r.q20,
      r.q21, r.q22, r.q23, r.q24, r.q25, r.q26
    ]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="survey_export.csv"');

    stringify([headers, ...rows], { bom: true }, (err, output) => {
      if (err) {
        return res.status(500).json({ error: 'CSV 생성 오류' });
      }
      res.send(output);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// GET /api/admin/stats - average scores per question
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const qAvgs = [];
    for (let i = 1; i <= 26; i++) {
      qAvgs.push(`ROUND(AVG(q${i})::numeric, 2) as q${i}`);
    }
    const result = await pool.query(`SELECT ${qAvgs.join(', ')} FROM responses`);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// Page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/survey', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'survey.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
