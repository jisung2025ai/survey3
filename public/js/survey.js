// ===== Questions Data =====
const QUESTIONS = [
  "유아는 디지털 기기와의 상호작용 속에서 새로운 놀이 방식이나 활동(예: AI 스피커로 이야기 만들기, 태블릿으로 친구와 규칙 정하기 등)을 만들어 내고 조율한다.",
  "유아는 디지털 기기와 상호작용하는 과정에서 디지털 기기의 다양한 반응을 탐색하며 새로운 사용 방식을 시도한다.",
  "유아는 디지털 기기를 활용하여 필요한 정보를 찾으려고 시도(예: 관심 있는 곤충 이미지 검색, 오늘의 날씨와 미세먼지 알아보기 등)한다.",
  "유아는 디지털 기기에서 얻은 정보를 친구나 기기와의 상호작용 속에서 놀이에 반영(예: 태블릿으로 본 공룡 사진을 보고 친구와 공룡의 특징에 대해 이야기하며, 블록으로 공룡 놀이 상을 만든다)하거나 확장한다.",
  "유아는 디지털 환경 속에서 자신이 알고 싶은 정보에 대해 친구나 기기에게 질문하며 탐색한다.",
  "유아는 디지털 콘텐츠의 내용이 사실인지 친구나 기기와 함께 의논하며 판단한다.",
  "유아는 디지털 콘텐츠에 대한 자신의 생각을 경험에 비추어 말하거나, 친구가 기기의 생각과 비교해 본다.",
  "유아는 디지털 도구의 반응이나 기능을 탐색하며, 문제를 독창적으로 해결·조율한다.",
  "유아는 디지털 놀이 중 새로운 놀이 방식을 제안하거나 놀이를 확장한다.",
  "유아는 디지털 도구와의 상호작용 속에서 발생한 문제를 탐색하고, 기술의 반응을 살펴보며 해결 방법을 구성한다.",
  "유아는 디지털 환경에서 기술과 함께 활동을 구성하고, 참여 과정을 주도하거나 확장한다.",
  "유아는 온·오프라인에서 자신의 의견이나 생각을 자신 있게 표현한다.",
  "유아는 디지털 도구(예: 그림 앱, 음성 녹음)를 사용하여 자신의 생각과 감정을 표현한다.",
  "유아는 디지털 환경에서 다양한 방식(예: 음성, 이미지, 영상 등으로)으로 소통한다.",
  "유아는 친구나 디지털 기기가 생성한 이미지나 소리의 의미를 이해하고, 이에 대해 말하거나 반응으로 표현한다.",
  "디지털 환경에서 개인정보가 다른 사람의 권리와 연결되어 있음을 인식한다.",
  "유아는 개인정보 보호와 관련된 상황에서 규칙을 지키려 하며, 교사나 친구와 그 이유에 대해 이야기한다.",
  "유아는 자신의 개인정보를 디지털 공간에서 함부로 타인과 공유하지 않는다.",
  "유아는 디지털 공간에서 정보와 사람과 연결된다는 점을 이해하며, 타인의 개인정보를 조심스럽게 다룬다.",
  "유아는 디지털 기기의 응답 속도나 흐름에 맞춰 자신의 속도나 반응을 조절하며 놀이를 유연하게 이어간다(예: 소리가 늦게 나와도 기다리며 놀이를 지속한다).",
  "유아는 디지털 놀이 중 사용 제한이나 종료 알림을 들으면, 약속을 지키려 하며, 감정을 조절해 스스로 놀이를 멈춘다(예: 타이머가 울리면 교사 도움 없이도 기기를 내려놓는다).",
  "유아는 디지털 공간에서 AI나 친구와 상호작용할 때 바르고 고운 말을 사용하려 한다(예: 인공지능 스피커에도 예의 있게 말하거나, 친구의 말투를 따라 하지 않고 자신의 방식으로 표현하려 한다).",
  "유아는 친구의 실수나, 디지털 기기의 오작동(예: AI가 엉뚱한 말을 하거나 친구가 그림을 잘못 저장한 경우)을 너그럽게 받아들이고, 상황에 따라 웃거나 함께 다시 시도하려 한다.",
  "유아는 디지털 놀이 시 친구와 서로 도와 가며 참여한다.",
  "유아는 디지털 놀이 시 다른 사람들(교사, 친구)의 의견을 경청하고 자신의 생각과 조율하려 한다.",
  "유아는 디지털 활동 중 친구 또는 기기의 반응을 주의 깊게 관찰하고, 공감이나 위로의 말을 건네거나 행동으로 표현한다."
];

const LIKERT_LABELS = ['전혀\n그렇지\n않다', '그렇지\n않다', '보통이다', '그렇다', '매우\n그렇다'];
const SLOTS = ['boy1', 'boy2', 'girl1', 'girl2'];
const SLOT_NAMES = { boy1: '남아 1', boy2: '남아 2', girl1: '여아 1', girl2: '여아 2' };

let currentTab = 'boy1';
let submissionId = null;

// ===== Init =====
window.addEventListener('DOMContentLoaded', async () => {
  submissionId = localStorage.getItem('submission_id');
  if (!submissionId) {
    window.location.href = '/';
    return;
  }

  // Display teacher info
  const phone = localStorage.getItem('teacher_phone') || '';
  const className = localStorage.getItem('class_name') || '';
  document.getElementById('teacherInfo').textContent =
    `${phone}${className ? ' · ' + className : ''}`;

  // Build question HTML for all tabs
  SLOTS.forEach(slot => {
    buildQuestions(slot);
  });

  // Load saved answers from server
  await loadFromServer();

  // Update tab indicators
  SLOTS.forEach(slot => updateTabIcon(slot));
  updateSubmitButton();
});

// ===== Build Questions =====
function buildQuestions(slot) {
  const container = document.getElementById(`questions-${slot}`);
  if (!container) return;

  let html = '';
  QUESTIONS.forEach((q, idx) => {
    const qNum = idx + 1;
    html += `
      <div class="question-item" id="q-item-${slot}-${qNum}">
        <div class="question-text">
          <span class="question-num">${qNum}</span>${q}
        </div>
        <div class="likert-scale">
          ${[1,2,3,4,5].map(val => `
            <label class="likert-option">
              <input type="radio" name="${slot}-q${qNum}" value="${val}"
                onchange="onAnswerChange('${slot}', ${qNum})" />
              <span class="likert-circle">${val}</span>
              <span class="likert-label">${LIKERT_LABELS[val-1].replace(/\n/g, '<br/>')}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ===== Load from Server =====
async function loadFromServer() {
  try {
    const res = await fetch(`/api/session/${submissionId}`);
    if (!res.ok) return;
    const data = await res.json();

    if (data.responses && data.responses.length > 0) {
      data.responses.forEach(r => {
        const slot = r.child_slot;
        // Set name
        const nameInput = document.getElementById(`name-${slot}`);
        if (nameInput && r.child_name) nameInput.value = r.child_name;
        // Set age
        if (r.child_age) {
          const ageRadio = document.querySelector(`input[name="age-${slot}"][value="${r.child_age}"]`);
          if (ageRadio) ageRadio.checked = true;
        }
        // Set answers
        for (let i = 1; i <= 26; i++) {
          const val = r[`q${i}`];
          if (val !== null && val !== undefined) {
            const radio = document.querySelector(`input[name="${slot}-q${i}"][value="${val}"]`);
            if (radio) {
              radio.checked = true;
              updateQuestionItem(slot, i);
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('Failed to load from server:', err);
  }
}

// ===== Tab Switching =====
function switchTab(slot) {
  // Auto-save current tab
  if (currentTab !== slot) {
    autoSaveTab(currentTab);
  }

  currentTab = slot;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.slot === slot);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  const targetTab = document.getElementById(`tab-${slot}`);
  if (targetTab) targetTab.classList.add('active');
}

// ===== Answer Change Handler =====
function onAnswerChange(slot, qNum) {
  updateQuestionItem(slot, qNum);
  updateTabIcon(slot);
  updateSubmitButton();
}

function updateQuestionItem(slot, qNum) {
  const item = document.getElementById(`q-item-${slot}-${qNum}`);
  if (!item) return;
  const answered = document.querySelector(`input[name="${slot}-q${qNum}"]:checked`);
  item.classList.toggle('answered', !!answered);
}

// ===== Tab Completion Status =====
function isTabComplete(slot) {
  for (let i = 1; i <= 26; i++) {
    const answered = document.querySelector(`input[name="${slot}-q${i}"]:checked`);
    if (!answered) return false;
  }
  return true;
}

function updateTabIcon(slot) {
  const icon = document.getElementById(`icon-${slot}`);
  if (icon) {
    icon.textContent = isTabComplete(slot) ? '✅' : '⬜';
  }
}

function updateSubmitButton() {
  const allComplete = SLOTS.every(slot => isTabComplete(slot));
  const btn = document.getElementById('btnSubmit');
  const notice = document.getElementById('submitNotice');
  if (btn) btn.disabled = !allComplete;
  if (notice) {
    if (allComplete) {
      notice.textContent = '모든 아동의 설문이 완료되었습니다. 제출해 주세요.';
      notice.style.color = '#10B981';
    } else {
      const incomplete = SLOTS.filter(s => !isTabComplete(s)).map(s => SLOT_NAMES[s]);
      notice.textContent = `미완료: ${incomplete.join(', ')}`;
      notice.style.color = '#9CA3AF';
    }
  }
}

// ===== Get Tab Data =====
function getTabData(slot) {
  const data = {
    submission_id: submissionId,
    child_slot: slot,
    child_name: (document.getElementById(`name-${slot}`) || {}).value || '',
    child_age: null
  };

  const ageRadio = document.querySelector(`input[name="age-${slot}"]:checked`);
  if (ageRadio) data.child_age = parseInt(ageRadio.value);

  for (let i = 1; i <= 26; i++) {
    const radio = document.querySelector(`input[name="${slot}-q${i}"]:checked`);
    data[`q${i}`] = radio ? parseInt(radio.value) : null;
  }

  return data;
}

// ===== Save Tab =====
async function saveTab(slot) {
  const data = getTabData(slot);
  const statusEl = document.getElementById(`save-status-${slot}`);

  try {
    const res = await fetch('/api/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      if (statusEl) {
        statusEl.textContent = '저장되었습니다 ✓';
        setTimeout(() => { statusEl.textContent = ''; }, 2500);
      }
    } else {
      if (statusEl) {
        statusEl.textContent = '저장 실패: ' + (result.error || '오류');
        statusEl.style.color = '#DC2626';
      }
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = '저장 실패 (네트워크 오류)';
      statusEl.style.color = '#DC2626';
    }
  }
}

// Silent auto-save (no status display)
async function autoSaveTab(slot) {
  const data = getTabData(slot);
  try {
    await fetch('/api/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (err) {
    // Silent fail
  }
}

// ===== Submit All =====
async function submitAll() {
  if (!SLOTS.every(slot => isTabComplete(slot))) {
    alert('모든 아동의 설문을 완료한 후 제출해주세요.');
    return;
  }

  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  btn.textContent = '제출 중...';

  try {
    // Save all tabs first
    for (const slot of SLOTS) {
      await saveTab(slot);
    }

    // Submit
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submissionId })
    });
    const result = await res.json();

    if (result.success) {
      localStorage.removeItem('submission_id');
      localStorage.removeItem('teacher_phone');
      localStorage.removeItem('class_name');

      const modal = document.getElementById('successModal');
      if (modal) modal.classList.add('show');
    } else {
      alert('제출 실패: ' + (result.error || '오류가 발생했습니다.'));
      btn.disabled = false;
      btn.textContent = '전체 제출하기';
    }
  } catch (err) {
    alert('서버 연결에 실패했습니다. 다시 시도해주세요.');
    btn.disabled = false;
    btn.textContent = '전체 제출하기';
  }
}
