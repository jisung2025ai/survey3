// ===== Login =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('loginSection').style.display = 'none';
      document.getElementById('dashboardSection').style.display = 'block';
      loadList();
    } else {
      errorEl.textContent = data.error || '로그인에 실패했습니다.';
    }
  } catch (err) {
    errorEl.textContent = '서버 연결에 실패했습니다.';
  }
});

// ===== Logout =====
function logout() {
  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('loginSection').style.display = 'flex';
  document.getElementById('adminPassword').value = '';
}

// ===== Load List =====
async function loadList() {
  const startDate = document.getElementById('filterStart').value;
  const endDate = document.getElementById('filterEnd').value;
  const phone = document.getElementById('filterPhone').value.trim();

  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (phone) params.append('phone', phone);

  try {
    const res = await fetch(`/api/admin/list?${params.toString()}`);
    if (res.status === 401) {
      alert('로그인이 필요합니다.');
      return;
    }
    const data = await res.json();
    renderList(data);
    updateStats(data);
  } catch (err) {
    console.error('Failed to load list:', err);
  }
}

// ===== Render List =====
function renderList(submissions) {
  const tbody = document.getElementById('submissionsBody');
  const noData = document.getElementById('noData');
  const table = document.getElementById('submissionsTable');

  if (!submissions || submissions.length === 0) {
    tbody.innerHTML = '';
    noData.style.display = 'block';
    table.style.display = 'none';
    return;
  }

  noData.style.display = 'none';
  table.style.display = 'table';

  tbody.innerHTML = submissions.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${escapeHtml(s.phone || '')}</td>
      <td>${escapeHtml(s.class_name || '-')}</td>
      <td>${s.submitted_at ? formatDate(s.submitted_at) : '-'}</td>
      <td>
        <span class="${s.is_complete ? 'badge-complete' : 'badge-incomplete'}">
          ${s.is_complete ? '완료' : '미완료'}
        </span>
      </td>
      <td>${s.response_count || 0}/4</td>
      <td>
        <button class="btn-detail" onclick="openDetail(${s.id})">상세보기</button>
      </td>
    </tr>
  `).join('');
}

// ===== Update Stats =====
function updateStats(submissions) {
  const total = submissions.length;
  const complete = submissions.filter(s => s.is_complete).length;
  const incomplete = total - complete;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statComplete').textContent = complete;
  document.getElementById('statIncomplete').textContent = incomplete;
}

// ===== Open Detail Modal =====
async function openDetail(id) {
  try {
    const res = await fetch(`/api/admin/detail/${id}`);
    if (!res.ok) {
      alert('상세 정보를 불러올 수 없습니다.');
      return;
    }
    const data = await res.json();
    renderDetailModal(data);
    document.getElementById('detailModal').classList.add('show');
  } catch (err) {
    alert('서버 오류가 발생했습니다.');
  }
}

// ===== Render Detail Modal =====
function renderDetailModal(data) {
  const { submission, responses } = data;
  const titleEl = document.getElementById('modalTitle');
  const contentEl = document.getElementById('modalContent');

  titleEl.textContent = `설문 상세 - ${submission.phone} (${submission.class_name || ''})`;

  const slotLabels = {
    boy1: '남아 1', boy2: '남아 2', girl1: '여아 1', girl2: '여아 2'
  };

  let html = `
    <div class="modal-info-grid">
      <div class="info-item"><span class="info-label">ID:</span><span class="info-value">${submission.id}</span></div>
      <div class="info-item"><span class="info-label">전화번호:</span><span class="info-value">${escapeHtml(submission.phone)}</span></div>
      <div class="info-item"><span class="info-label">반 이름:</span><span class="info-value">${escapeHtml(submission.class_name || '-')}</span></div>
      <div class="info-item"><span class="info-label">생성일시:</span><span class="info-value">${formatDate(submission.created_at)}</span></div>
      <div class="info-item"><span class="info-label">제출일시:</span><span class="info-value">${submission.submitted_at ? formatDate(submission.submitted_at) : '-'}</span></div>
      <div class="info-item"><span class="info-label">완료여부:</span><span class="info-value">${submission.is_complete ? '완료' : '미완료'}</span></div>
    </div>
  `;

  if (responses && responses.length > 0) {
    responses.forEach(r => {
      const label = slotLabels[r.child_slot] || r.child_slot;
      html += `<div class="modal-sub-title">${label} - ${escapeHtml(r.child_name || '이름 미입력')} (만${r.child_age || '?'}세)</div>`;
      html += '<table><thead><tr>';
      for (let i = 1; i <= 26; i++) {
        html += `<th>Q${i}</th>`;
      }
      html += '</tr></thead><tbody><tr>';
      for (let i = 1; i <= 26; i++) {
        const val = r[`q${i}`];
        html += `<td style="text-align:center">${val !== null && val !== undefined ? val : '-'}</td>`;
      }
      html += '</tr></tbody></table>';
    });
  } else {
    html += '<p style="color:#9CA3AF;text-align:center;padding:16px;">응답 데이터가 없습니다.</p>';
  }

  contentEl.innerHTML = html;
}

// ===== Close Detail Modal =====
function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('show');
}

function closeModal(event) {
  if (event.target === document.getElementById('detailModal')) {
    closeDetailModal();
  }
}

// ===== Load Stats =====
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) return;
    const data = await res.json();
    renderStats(data);
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// ===== Render Stats =====
function renderStats(stats) {
  const container = document.getElementById('statsChart');
  if (!stats || Object.keys(stats).length === 0) {
    container.innerHTML = '<p style="color:#9CA3AF;text-align:center;padding:16px;">통계 데이터가 없습니다.</p>';
    return;
  }

  let html = '';
  for (let i = 1; i <= 26; i++) {
    const val = parseFloat(stats[`q${i}`]) || 0;
    const pct = (val / 5) * 100;
    html += `
      <div class="chart-row">
        <div class="chart-label">Q${i}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="width:${pct.toFixed(1)}%">
            ${val > 0.3 ? `<span class="chart-value">${val.toFixed(2)}</span>` : ''}
          </div>
        </div>
        ${val <= 0.3 ? `<span style="font-size:0.75rem;color:#6B7280;margin-left:4px;">${val.toFixed(2)}</span>` : ''}
      </div>
    `;
  }
  container.innerHTML = html;
}

// ===== Export CSV =====
function exportCSV() {
  window.location.href = '/api/admin/export';
}

// ===== Utilities =====
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}
