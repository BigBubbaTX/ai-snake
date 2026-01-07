// ui.js (FULL REWRITE - avg100 + epsilon display guaranteed)

let episode = 0;
let best = 0;

let last100 = [];
let avg100 = 0;

// We display epsilon from this variable so Watch can force 0.00 on screen
let epsilonDisplay = 1.0;

resetGame();

// ---- UI ELEMENTS ----
const epfSlider = document.getElementById("epf");
const epfLabel  = document.getElementById("epfLabel");

const watchSlider = document.getElementById("watchSpeed");
const watchLabel  = document.getElementById("watchLabel");

const targetInput  = document.getElementById("targetEpisodes");
const progressBar  = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

// stats
const episodeEl = document.getElementById("episode");
const scoreEl   = document.getElementById("score");
const bestEl    = document.getElementById("best");
const avgEl     = document.getElementById("avg100");
const epsEl     = document.getElementById("epsilon");

// buttons
const playBtn  = document.getElementById("playHuman");
const trainBtn = document.getElementById("trainAI");
const watchBtn = document.getElementById("watchAI");
const resetBtn = document.getElementById("reset");

// fail loudly if something is missing
(function assertUI() {
  const need = ["epf","epfLabel","watchSpeed","watchLabel","targetEpisodes","progressBar","progressText",
                "episode","score","best","avg100","epsilon","playHuman","trainAI","watchAI","reset"];
  const missing = need.filter(id => !document.getElementById(id));
  if (missing.length) console.error("Missing UI ids:", missing.join(", "));
  else console.log("UI wired ✅ (avg/epsilon)");
})();

// ---- SETTINGS ----
let episodesPerFrame = Number(epfSlider.value);
let watchDelay = Number(watchSlider.value);

epfLabel.textContent = episodesPerFrame;
watchLabel.textContent = watchDelay;

function getTarget() {
  const t = Number(targetInput.value);
  return Number.isFinite(t) && t > 0 ? Math.floor(t) : 10000;
}

function updateProgress() {
  const target = getTarget();
  const pct = Math.min(100, (episode / target) * 100);
  progressBar.style.width = pct + "%";
  progressText.textContent = `${episode} / ${target}`;
}

function recomputeAvg100(latestScore) {
  last100.push(latestScore);
  if (last100.length > 100) last100.shift();
  const sum = last100.reduce((a, b) => a + b, 0);
  avg100 = last100.length ? (sum / last100.length) : 0;
}

// ---- SLIDERS ----
epfSlider.addEventListener("input", () => {
  episodesPerFrame = Number(epfSlider.value);
  epfLabel.textContent = episodesPerFrame;
});

watchSlider.addEventListener("input", () => {
  watchDelay = Number(watchSlider.value);
  watchLabel.textContent = watchDelay;
});

targetInput.addEventListener("input", () => updateProgress());

// ---- TRAINING CONTROL ----
let training = false;

function stopTraining() {
  training = false;
}

function startTraining() {
  mode = "train";
  training = true;

  // reheat exploration a bit so it doesn't freeze
  agent.epsilon = Math.max(agent.epsilon, 0.3);
  epsilonDisplay = agent.epsilon;

  const tick = () => {
    if (!training || mode !== "train") return;

    const target = getTarget();

    for (let i = 0; i < episodesPerFrame && episode < target; i++) {
      resetGame();
      episode++;

      while (alive) {
        const action = agent.chooseAction(getState());
        step(action);
      }

      // episode ended; record score
      recomputeAvg100(score);
      if (score > best) best = score;

      // keep epsilon display synced during training
      epsilonDisplay = agent.epsilon;
    }

    updateStats();

    if (episode < target) requestAnimationFrame(tick);
    else training = false;
  };

  requestAnimationFrame(tick);
}

// ---- BUTTONS ----
playBtn.addEventListener("click", () => {
  stopTraining();
  mode = "human";
  epsilonDisplay = agent.epsilon; // show whatever it currently is
  resetGame();
  updateStats();
});

trainBtn.addEventListener("click", () => {
  if (training && mode === "train") return; // prevent double start
  startTraining();
});

watchBtn.addEventListener("click", () => {
  stopTraining();
  mode = "watch";

  // Force deterministic demo behavior
  agent.epsilon = 0;
  epsilonDisplay = 0;

  resetGame();
  updateStats(); // update immediately so you SEE 0.00
});

resetBtn.addEventListener("click", () => {
  stopTraining();
  agent.reset();

  episode = 0;
  best = 0;
  last100 = [];
  avg100 = 0;

  epsilonDisplay = agent.epsilon;

  mode = "human";
  resetGame();
  updateStats();
});

// ---- HUMAN CONTROLS ----
document.addEventListener("keydown", (e) => {
  if (mode !== "human") return;

  // prevent instant reversal
  if (e.key === "ArrowUp" && !(dir.x === 0 && dir.y === 1)) dir = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && !(dir.x === 0 && dir.y === -1)) dir = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && !(dir.x === 1 && dir.y === 0)) dir = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && !(dir.x === -1 && dir.y === 0)) dir = { x: 1, y: 0 };
});

// ---- GAME LOOP ----
function gameLoop() {
  if (mode === "watch") {
    if (!alive) resetGame();
    const action = agent.chooseAction(getState()); // agent.epsilon is 0 in watch
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
  episodeEl.textContent = episode;
  scoreEl.textContent   = score;
  bestEl.textContent    = best;
  avgEl.textContent     = avg100.toFixed(2);
  epsEl.textContent     = Number(epsilonDisplay).toFixed(2);
  updateProgress();
}

// init
updateStats();
gameLoop();
