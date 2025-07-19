// پشتیبانی از زبان فارسی و فونت
document.documentElement.lang = 'fa';

// ذخیره‌سازی داده‌ها
let gameCode = '';
let myRole = null;
let myName = '';
let isHost = false;
let playerCount = 0;
let players = [];
let votes = [];
let submittedCodes = [];
let currentStage = 0;
let hasVoted = false;
let timerInterval = null;

// ژنراتور ایموجی حیوانات
const animalEmojis = ['🐶', '🐱', '🦊', '🐼', '🐵', '🐷', '🐯', '🐸', '🐻', '🐨'];

function generateCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// ذخیره بازی در localStorage (برای داور)
function storeGame(game) {
  localStorage.setItem('spy-game-' + game.code, JSON.stringify(game));
}

// دریافت بازی از localStorage
function loadGame(code) {
  return JSON.parse(localStorage.getItem('spy-game-' + code));
}

// ورود داور
function hostGame(count) {
  gameCode = generateCode();
  isHost = true;
  playerCount = count;

  players = [];
  for (let i = 0; i < count; i++) {
    players.push({
      name: animalEmojis[i],
      role: null,
      codes: []
    });
  }

  // تعیین نقش‌ها
  const spyIndex = Math.floor(Math.random() * count);
  players[spyIndex].role = 'spy';
  for (let i = 0; i < count; i++) {
    if (i !== spyIndex) players[i].role = 'agent';
  }

  // ذخیره‌سازی اولیه
  const game = {
    code: gameCode,
    players: players,
    stage: 0,
    finished: false
  };

  storeGame(game);
  alert('کد بازی: ' + gameCode);
  window.location.href = 'game.html?code=' + gameCode + '&name=' + players[0].name;
}

// ورود بازیکن
function joinGame(inputCode, emoji) {
  const game = loadGame(inputCode);
  if (!game) return alert('کد بازی نامعتبر است.');

  if (game.players.some(p => p.name === emoji)) {
    return alert('این نام بازیکن قبلاً استفاده شده است.');
  }

  const emptySlot = game.players.find(p => !p.joined);
  if (!emptySlot) return alert('ظرفیت بازی تکمیل شده است.');

  emptySlot.joined = true;
  emptySlot.name = emoji;
  storeGame(game);

  window.location.href = 'game.html?code=' + inputCode + '&name=' + emoji;
}

// راه‌اندازی صفحه بازی
function initGamePage() {
  const urlParams = new URLSearchParams(window.location.search);
  gameCode = urlParams.get('code');
  myName = urlParams.get('name');

  const game = loadGame(gameCode);
  if (!game) {
    alert('کد بازی معتبر نیست.');
    return;
  }

  players = game.players;
  myRole = players.find(p => p.name === myName).role;
  updateCircle();

  document.getElementById('codeInputContainer').style.display = 'block';
}

// بروزرسانی میز بازیکنان
function updateCircle() {
  const table = document.getElementById('table');
  table.innerHTML = '';

  const count = players.length;
  players.forEach((p, i) => {
    const angle = (2 * Math.PI * i) / count;
    const x = 50 + 40 * Math.cos(angle);
    const y = 50 + 40 * Math.sin(angle);
    const el = document.createElement('div');
    el.className = 'player-seat';
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.innerHTML = `<strong>${p.name}</strong><br>${p.name === myName ? '👤 شما' : ''}`;
    table.appendChild(el);
  });
}

// ارسال کد مرحله
function submitCode() {
  const input = document.getElementById('codeInput');
  const value = input.value.trim();
  if (!value) return;

  submittedCodes.push({ name: myName, code: value, stage: currentStage });
  input.value = '';

  currentStage++;
  if (currentStage < 3) {
    document.getElementById('stageTitle').textContent = `مرحله ${currentStage + 1}: وارد کردن کد`;
  } else {
    document.getElementById('stagePanel').style.display = 'none';
    showAllCodes();
  }
}

// نمایش همه کدها
function showAllCodes() {
  const result = document.getElementById('result');
  const box = document.createElement('div');
  box.innerHTML = '<h3>📋 کدهای وارد شده:</h3>';

  players.forEach((p) => {
    const codes = submittedCodes.filter(c => c.name === p.name).map(c => c.code).join(', ');
    box.innerHTML += `<p><strong>${p.name}</strong>: ${codes || '⏳ در حال وارد کردن...'}</p>`;
  });

  result.appendChild(box);
  startVoting();
}

// شروع رأی‌گیری
function startVoting() {
  document.getElementById('votePanel').style.display = 'block';
  const voteButtons = document.getElementById('voteButtons');
  voteButtons.innerHTML = '';

  players.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.textContent = p.name;
    btn.className = 'vote-button';
    btn.onclick = () => castVote(i);
    voteButtons.appendChild(btn);
  });

  let time = 120;
  const timerElem = document.getElementById('timer');
  timerInterval = setInterval(() => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    timerElem.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    if (--time < 0 || hasVoted) {
      clearInterval(timerInterval);
      showResult();
    }
  }, 1000);
}

// ثبت رأی
function castVote(index) {
  if (hasVoted) return;
  votes[index] = (votes[index] || 0) + 1;
  hasVoted = true;

  document.getElementById('voteButtons').innerHTML = '<p>✅ رأی شما ثبت شد</p>';
}

// نمایش نتیجه نهایی
function showResult() {
  const max = Math.max(...votes);
  const suspectIndex = votes.indexOf(max);
  const suspect = players[suspectIndex];

  const result = document.getElementById('result');
  let html = `<h3>🎯 نتیجه رأی‌گیری</h3>`;

  players.forEach((p, i) => {
    html += `<p>${p.name}: ${votes[i] || 0} رأی ${p.role === 'spy' ? '🕵️‍♂️' : ''}</p>`;
  });

  html += `<h2>${suspect.role === 'spy' ? '🎉 بازیکنان پیروز شدند!' : '😈 جاسوس برنده شد!'}</h2>`;
  result.innerHTML += html;
}
