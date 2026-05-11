const MODES = {
  work: { label: '工作', minutes: 25, color: '#e74c3c' },
  shortBreak: { label: '短休息', minutes: 5, color: '#2ecc71' },
  longBreak: { label: '长休息', minutes: 15, color: '#3498db' },
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.48

let currentMode = 'work';
let timeLeft = 25 * 60;
let totalTime = 25 * 60;
let timerInterval = null;
let isRunning = false;
let sessionCount = 0;
let totalFocusMinutes = 0;

const timeDisplay = document.getElementById('timeDisplay');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const totalFocusTimeEl = document.getElementById('totalFocusTime');
const tomatoRow = document.getElementById('tomatoRow');
const ringProgress = document.querySelector('.ring-progress');
const modeBtns = document.querySelectorAll('.mode-btn');
const workMinutesInput = document.getElementById('workMinutes');
const decrBtn = document.getElementById('decrBtn');
const incrBtn = document.getElementById('incrBtn');

function playAlarm() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [880, 1100, 1320];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
    osc.start(ctx.currentTime + i * 0.15);
    osc.stop(ctx.currentTime + i * 0.15 + 0.3);
  });
}

function updateDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timeDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.title = `${timeDisplay.textContent} - 番茄钟`;
}

function updateRing() {
  const progress = timeLeft / totalTime;
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  ringProgress.style.strokeDashoffset = offset;
  ringProgress.style.stroke = MODES[currentMode].color;
}

function getWorkMinutes() {
  const val = parseInt(workMinutesInput.value, 10);
  return Math.max(1, Math.min(120, val || 25));
}

function switchMode(mode) {
  currentMode = mode;
  const minutes = mode === 'work' ? getWorkMinutes() : MODES[mode].minutes;
  timeLeft = minutes * 60;
  totalTime = minutes * 60;
  isRunning = false;
  clearInterval(timerInterval);

  updateDisplay();
  updateRing();
  ringProgress.style.transition = 'none';
  ringProgress.style.strokeDashoffset = 0;
  requestAnimationFrame(() => {
    ringProgress.style.transition = 'stroke-dashoffset 1s linear';
  });

  startPauseBtn.textContent = '开始';
  startPauseBtn.classList.remove('running');

  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function renderTomatoes() {
  tomatoRow.innerHTML = '';
  for (let i = 0; i < sessionCount; i++) {
    const tomato = document.createElement('span');
    tomato.className = 'tomato-icon';
    tomato.textContent = '🍅';
    tomatoRow.appendChild(tomato);
  }
}

function tick() {
  timeLeft--;
  updateDisplay();
  updateRing();

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = '开始';
    startPauseBtn.classList.remove('running');
    playAlarm();

    if (currentMode === 'work') {
      sessionCount++;
      totalFocusMinutes += getWorkMinutes();
      totalFocusTimeEl.textContent = `${totalFocusMinutes} 分钟`;
      renderTomatoes();
      switchMode('shortBreak');
    } else {
      switchMode('work');
    }
  }
}

function toggleTimer() {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    startPauseBtn.textContent = '继续';
    startPauseBtn.classList.remove('running');
  } else {
    timerInterval = setInterval(tick, 1000);
    isRunning = true;
    startPauseBtn.textContent = '暂停';
    startPauseBtn.classList.add('running');
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  const minutes = currentMode === 'work' ? getWorkMinutes() : MODES[currentMode].minutes;
  timeLeft = minutes * 60;
  totalTime = minutes * 60;
  updateDisplay();
  updateRing();
  ringProgress.style.transition = 'none';
  ringProgress.style.strokeDashoffset = 0;
  requestAnimationFrame(() => {
    ringProgress.style.transition = 'stroke-dashoffset 1s linear';
  });
  startPauseBtn.textContent = '开始';
  startPauseBtn.classList.remove('running');
}

function updateWorkMinutes(value) {
  workMinutesInput.value = value;
  // 如果当前处于停止状态的工作模式，更新时间显示
  if (currentMode === 'work' && !isRunning) {
    timeLeft = value * 60;
    totalTime = value * 60;
    updateDisplay();
    ringProgress.style.transition = 'none';
    ringProgress.style.strokeDashoffset = 0;
    requestAnimationFrame(() => {
      ringProgress.style.transition = 'stroke-dashoffset 1s linear';
    });
  }
}

decrBtn.addEventListener('click', () => {
  const current = getWorkMinutes();
  if (current > 1) updateWorkMinutes(current - 1);
});

incrBtn.addEventListener('click', () => {
  const current = getWorkMinutes();
  if (current < 120) updateWorkMinutes(current + 1);
});

workMinutesInput.addEventListener('change', () => {
  updateWorkMinutes(getWorkMinutes());
});

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);

// 初始化
timeLeft = getWorkMinutes() * 60;
totalTime = getWorkMinutes() * 60;
updateDisplay();
updateRing();
renderTomatoes();
