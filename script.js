const animals = ["🦁","🐯","🐶","🐱","🐭","🐰","🐻","🐼","🦊","🐨"];
let gameData = {
  code: "",
  players: [],
  roles: {},
  started: false,
  currentStage: 0,
  codes: [],
  votes: [],
  spyIndex: 0
};
let myName = "", myEmoji = "", isHost = false;

function goToHost() {
  hideAll(); document.getElementById("hostMenu").classList.remove("hidden");
}
function goToJoin() {
  hideAll(); document.getElementById("joinMenu").classList.remove("hidden");
}

function createGameCode() {
  const count = parseInt(document.getElementById("playerCount").value);
  if (count < 3 || count > 10) return alert("تعداد بازیکنان باید بین ۳ تا ۱۰ باشد.");
  gameData.code = Math.random().toString(36).substr(2, 6).toUpperCase();
  gameData.players = [];
  gameData.roles = {};
  gameData.started = false;
  isHost = true;
  localStorage.setItem(gameData.code, JSON.stringify(gameData));
  document.getElementById("hostCodeBox").innerHTML = `کد بازی: <strong>${gameData.code}</strong>`;
  enterWaitingRoom(gameData.code);
}

function joinGame() {
  const code = document.getElementById("joinCode").value.toUpperCase();
  const data = localStorage.getItem(code);
  if (!data) return document.getElementById("joinStatus").textContent = "❌ کد معتبر نیست.";
  gameData = JSON.parse(data);
  if (gameData.started) return document.getElementById("joinStatus").textContent = "🚫 بازی آغاز شده.";
  if (gameData.players.length >= 10) return document.getElementById("joinStatus").textContent = "بازی پر شده.";
  myName = `بازیکن ${gameData.players.length + 1}`;
  myEmoji = animals[gameData.players.length];
  gameData.players.push({ name: myName, emoji: myEmoji });
  localStorage.setItem(code, JSON.stringify(gameData));
  enterWaitingRoom(code);
}

function enterWaitingRoom(code) {
  hideAll(); document.getElementById("waitingRoom").classList.remove("hidden");
  document.getElementById("waitingCode").textContent = code;
  updateWaitingRoom();
}

function updateWaitingRoom() {
  const data = localStorage.getItem(gameData.code);
  if (!data) return;
  gameData = JSON.parse(data);
  const list = document.getElementById("playerList");
  list.innerHTML = "";
  gameData.players.forEach(p => {
    const el = document.createElement("div");
    el.textContent = `${p.emoji} ${p.name}`;
    list.appendChild(el);
  });
  if (isHost && gameData.players.length >= 3) {
    document.getElementById("startGameBtn").classList.remove("hidden");
  }
  if (!gameData.started) setTimeout(updateWaitingRoom, 1500);
}

function startGame() {
  gameData.started = true;
  const spyIndex = Math.floor(Math.random() * gameData.players.length);
  gameData.spyIndex = spyIndex;
  gameData.players.forEach((p, i) => {
    gameData.roles[p.name] = (i === spyIndex) ? "جاسوس" : "شهروند";
  });
  localStorage.setItem(gameData.code, JSON.stringify(gameData));
  goToGameScreen();
}

function goToGameScreen() {
  hideAll(); document.getElementById("gameScreen").classList.remove("hidden");
  gameData = JSON.parse(localStorage.getItem(gameData.code));
  const me = gameData.players.find(p => p.name === myName);
  const role = gameData.roles[me.name];
  document.getElementById("roleBox").classList.remove("hidden");
  document.getElementById("roleBox").innerHTML = `<p>🔒 نقش شما: <strong>${role}</strong></p>`;
  setTimeout(() => {
    document.getElementById("codeInputBox").classList.remove("hidden");
    updateGameTable();
  }, 2000);
}

function submitPlayerCode() {
  const val = document.getElementById("codeInput").value.trim();
  if (!val) return;
  if (!gameData.codes) gameData.codes = [];
  gameData.codes.push({ name: myName, code: val });
  localStorage.setItem(gameData.code, JSON.stringify(gameData));
  document.getElementById("codeInputBox").classList.add("hidden");
  waitForAllCodes();
}

function waitForAllCodes() {
  const check = setInterval(() => {
    const data = JSON.parse(localStorage.getItem(gameData.code));
    if (data.codes.length >= data.players.length) {
      clearInterval(check);
      showCodesAndStartVote();
    }
  }, 1000);
}

function showCodesAndStartVote() {
  document.getElementById("gameStageTitle").textContent = "🔍 مشاهده کدها و رأی‌گیری";
  const table = document.getElementById("gameTable");
  table.innerHTML = "";
  gameData.codes.forEach((c, i) => {
    const p = gameData.players.find(p => p.name === c.name);
    const el = document.createElement("div");
    el.className = "player-token";
    el.textContent = `${p.emoji} ${c.code}`;
    table.appendChild(el);
  });
  startVoting();
}

function startVoting() {
  document.getElementById("votePanel").classList.remove("hidden");
  const btns = document.getElementById("voteButtons");
  btns.innerHTML = "";
  gameData.votes = new Array(gameData.players.length).fill(0);
  gameData.players.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${p.emoji} ${p.name}`;
    btn.className = "btn";
    btn.onclick = () => {
      gameData.votes[i]++;
      btns.innerHTML = "<p>✅ رأی شما ثبت شد</p>";
    };
    btns.appendChild(btn);
  });
  let t = 120;
  const timer = document.getElementById("voteTimer");
  const countdown = setInterval(() => {
    const m = Math.floor(t / 60), s = t % 60;
    timer.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    if (--t < 0) {
      clearInterval(countdown);
      showFinalResult();
    }
  }, 1000);
}

function showFinalResult() {
  const max = Math.max(...gameData.votes);
  const index = gameData.votes.indexOf(max);
  const suspect = gameData.players[index];
  const spy = gameData.players[gameData.spyIndex];
  const box = document.getElementById("finalResult");
  box.innerHTML = `
    <h3>نتیجه رأی‌گیری</h3>
    <p>مشکوک‌ترین فرد: ${suspect.emoji} ${suspect.name}</p>
    <p>🕵️ جاسوس: ${spy.emoji} ${spy.name}</p>
    <h2>${spy.name === suspect.name ? '🎉 شهروندان برنده شدند!' : '😈 جاسوس پیروز شد!'}</h2>
  `;
}

function updateGameTable() {
  const table = document.getElementById("gameTable");
  table.innerHTML = "";
  gameData.players.forEach(p => {
    const el = document.createElement("div");
    el.className = "player-token";
    el.textContent = `${p.emoji} ${p.name}`;
    table.appendChild(el);
  });
}

function hideAll() {
  document.querySelectorAll(".container").forEach(el => el.classList.add("hidden"));
}
