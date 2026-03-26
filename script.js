const modes = {
  focus: { label: '专注时间到！去活动一下吧 🍅', inputId: 'focusInput', mood: '软萌冲刺中' },
  shortBreak: { label: '短休息结束啦，回来继续发光 ✨', inputId: 'shortBreakInput', mood: '小猫伸懒腰中' },
  longBreak: { label: '长休息结束，准备重新出发 🌈', inputId: 'longBreakInput', mood: '彩虹回血中' }
};

const timeEl = document.getElementById('time');
const statusEl = document.getElementById('status');
const startPauseBtn = document.getElementById('startPause');
const resetBtn = document.getElementById('reset');
const completedCountEl = document.getElementById('completedCount');
const moodTextEl = document.getElementById('moodText');
const progressEl = document.querySelector('.ring-progress');
const modeButtons = [...document.querySelectorAll('.mode')];

let currentMode = 'focus';
let timer = null;
let isRunning = false;
let totalSeconds = getModeMinutes(currentMode) * 60;
let remainingSeconds = totalSeconds;
let completedFocusCount = Number(localStorage.getItem('cutePomodoroCompleted') || 0);
completedCountEl.textContent = completedFocusCount;

function getModeMinutes(mode) {
  return Math.max(1, Number(document.getElementById(modes[mode].inputId).value || 1));
}

function saveCompletedCount() {
  localStorage.setItem('cutePomodoroCompleted', String(completedFocusCount));
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateDisplay() {
  timeEl.textContent = formatTime(remainingSeconds);
  const circumference = 2 * Math.PI * 96;
  const progress = 1 - remainingSeconds / totalSeconds;
  progressEl.style.strokeDasharray = `${circumference}`;
  progressEl.style.strokeDashoffset = `${circumference * (1 - progress)}`;
  moodTextEl.textContent = modes[currentMode].mood;
  document.title = `${formatTime(remainingSeconds)} · 叻番茄钟`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function applyMode(mode) {
  currentMode = mode;
  totalSeconds = getModeMinutes(mode) * 60;
  remainingSeconds = totalSeconds;
  isRunning = false;
  clearInterval(timer);
  timer = null;
  startPauseBtn.textContent = '开始';
  modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  setStatus(mode === 'focus' ? '准备开始喽 ✨' : '休息一下也很重要 ～');
  updateDisplay();
}

function playDing() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const now = ctx.currentTime;
  [659.25, 783.99, 1046.5].forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22 + index * 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + index * 0.12);
    osc.stop(now + 0.24 + index * 0.12);
  });
}

function completeSession() {
  clearInterval(timer);
  timer = null;
  isRunning = false;
  startPauseBtn.textContent = '开始';
  if (currentMode === 'focus') {
    completedFocusCount += 1;
    completedCountEl.textContent = completedFocusCount;
    saveCompletedCount();
  }
  setStatus(modes[currentMode].label);
  playDing();
}

function tick() {
  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
    updateDisplay();
    return;
  }
  completeSession();
}

function toggleTimer() {
  if (!isRunning) {
    isRunning = true;
    startPauseBtn.textContent = '暂停';
    setStatus(currentMode === 'focus' ? '认真一点，你超棒的 ✨' : '休息模式启动～');
    timer = setInterval(tick, 1000);
  } else {
    isRunning = false;
    clearInterval(timer);
    timer = null;
    startPauseBtn.textContent = '继续';
    setStatus('已暂停，别发呆太久喔 💤');
  }
}

modeButtons.forEach(btn => btn.addEventListener('click', () => applyMode(btn.dataset.mode)));
startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', () => applyMode(currentMode));

['focusInput', 'shortBreakInput', 'longBreakInput'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => applyMode(currentMode));
});

updateDisplay();
