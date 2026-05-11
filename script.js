const MODES = {
  work: { label: '工作', minutes: 25, color: '#e74c3c' },
  shortBreak: { label: '短休息', minutes: 5, color: '#2ecc71' },
  longBreak: { label: '长休息', minutes: 15, color: '#3498db' },
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.48

let currentMode = 'work';
let timeLeft = MODES.work.minutes * 60;
let totalTime = MODES.work.minutes * 60;
let timerInterval = null;
let isRunning = false;
let sessionCount = 0;
let totalFocusMinutes = 0;

const timeDisplay = document.getElementById('timeDisplay');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionCountEl = document.getElementById('sessionCount');
const totalFocusTimeEl = document.getElementById('totalFocusTime');
const ringProgress = document.querySelector('.ring-progress');
const modeBtns = document.querySelectorAll('.mode-btn');

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

function switchMode(mode) {
  currentMode = mode;
  timeLeft = MODES[mode].minutes * 60;
  totalTime = MODES[mode].minutes * 60;
  isRunning = false;
  clearInterval(timerInterval);

  updateDisplay();
  updateRing();
  // 立即更新圆环到满额，禁用过渡以避免从旧位置动画过来
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
      totalFocusMinutes += MODES.work.minutes;
      sessionCountEl.textContent = sessionCount;
      totalFocusTimeEl.textContent = `${totalFocusMinutes} 分钟`;
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
  timeLeft = MODES[currentMode].minutes * 60;
  totalTime = MODES[currentMode].minutes * 60;
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

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);

// 初始化
updateDisplay();
updateRing();
