let episode = 0;
let best = 0;
console.log("ui.js loaded ✅", new Date().toLocaleTimeString());
console.log("ui.js loaded ✅");

console.log("initial epf value =", epfSlider?.value);
console.log("initial target =", targetInput?.value);

resetGame();

// ---- UI ELEMENTS (must exist in index.html) ----
const epfSlider = document.getElementById("epf");
const epfLabel = document.getElementById("epfLabel");

const watchSlider = document.getElementById("watchSpeed");
const watchLabel = document.getElementById("watchLabel");

const targetInput = document.getElementById("targetEpisodes");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

// fallback if any element missing (helps debug)
function assertUI() {
  const missing = [];
  if (!epfSlider) missing.push("epf");
  if (!epfLabel) missing.push("epfLabel");
  if (!watchSlider) missing.push("watchSpeed");
  if (!watchLabel) missing.push("watchLabel");
  if (!targetInput) missing.push("targetEpisodes");
  if (!progressBar) missing.push("progressBar");
  if (!progressText) missing.push("progressText");
  if (missing.length) {
    console.error("Missing UI elements in index.html:", missing.join(", "));
  }
}
assertUI();

// ---- STATE ----
let episodesPerFrame = Number(epfSlider?.value || 50);
let watchDelay = Number(watchSlider?.value || 80);

if (epfLabel) epfLabel.textContent = episodesPerFrame;
if (watchLabel) watchLabel.textContent = watchDelay;

// ---- BUTTONS ----
document.getElementById("playHuman").onclick = () => {
  mode = "human";
  resetGame();
};

document.getElementById("trainAI").onclick = () => {
  mode = "train";
  trainLoop();
};

document.getElementById("watchAI").onclick = () => {
  mode = "watch";
  resetGame();
};

document.getElementById("reset").onclick = () => {
  agent.reset();
  episode = 0;
  best = 0;
  resetGame();
  updateStats();
};

// ---- SLIDERS ----
if (epfSlider) {
  epfSlider.oninput = () => {
    episodesPerFrame = Number(epfSlider.value);
    epfLabel.textContent = episodesPerFrame;
     console.log("episodesPerFrame =", episodesPerFrame);
  };
}

if (watchSlider) {
  watchSlider.oninput = () => {
    watchDelay = Number(watchSlider.value);
    watchLabel.textContent = watchDelay;
  };
}

// ---- HUMAN CONTROLS ----
document.addEventListener("keydown", e => {
  if (mode !== "human") return;

  // prevent reversing into yourself instantly
  if (e.key === "ArrowUp" && !(dir.x === 0 && dir.y === 1)) dir = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && !(dir.x === 0 && dir.y === -1)) dir = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && !(dir.x === 1 && dir.y === 0)) dir = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && !(dir.x === -1 && dir.y === 0)) dir = { x: 1, y: 0 };
});

// ---- PROGRESS ----
function getTarget() {
  const t = Number(targetInput?.value || 10000);
  return Math.max(1, t);
}

function updateProgress() {
  const target = getTarget();
  const pct = Math.min(100, (episode / target) * 100);
  if (progressBar) progressBar.style.width = pct + "%";
  if (progressText) progressText.textContent = `${episode} / ${target}`;
}

// ---- TRAINING LOOP ----
function trainLoop() {
  if (mode !== "train") return;

  const target = getTarget();

  // run many episodes quickly
  for (let i = 0; i < episodesPerFrame && episode < target; i++) {
    resetGame();
    episode++;

    while (alive) {
      const action = agent.chooseAction(getState());
      step(action);
    }

    best = Math.max(best, score);
  }

  updateStats();

  if (episode < target) requestAnimationFrame(trainLoop);
}

// ---- GAME LOOP (render + watch/human stepping) ----
function gameLoop() {
  if (mode === "watch") {
    if (!alive) resetGame();
    const action = agent.chooseAction(getState());
    step(action);
  } else if (mode === "human") {
    step();
  }

  draw();
  updateStats();
  setTimeout(gameLoop, watchDelay);
}

// ---- STATS ----
function updateStats() {
  document.getElementById("episode").textContent = episode;
  document.getElementById("score").textContent = score;
  document.getElementById("best").textContent = best;
  document.getElementById("epsilon").textContent = agent.epsilon.toFixed(2);
  updateProgress();
}

updateStats();
gameLoop();
