// ui.js (FULL REWRITE)

let episode = 0;
let best = 0;
let last100 = [];
let avg100 = 0;

resetGame();

// --- Grab UI elements ---
const epfSlider = document.getElementById("epf");
const epfLabel  = document.getElementById("epfLabel");

const watchSlider = document.getElementById("watchSpeed");
const watchLabel  = document.getElementById("watchLabel");

const targetInput  = document.getElementById("targetEpisodes");
const progressBar  = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

// --- Fail loudly if anything is missing (so it never silently breaks again) ---
(function assertUI() {
  const ids = ["epf","epfLabel","watchSpeed","watchLabel","targetEpisodes","progressBar","progressText","episode","score","best","epsilon","playHuman","trainAI","watchAI","reset"];
  const missing = ids.filter(id => !document.getElementById(id));
  if (missing.length) {
    console.error("Missing UI ids in index.html:", missing.join(", "));
  } else {
    console.log("UI wired ✅");
  }
})();

// --- Runtime settings controlled by sliders ---
let episodesPerFrame = Number(epfSlider.value);
let watchDelay = Number(watchSlider.value);

// set initial labels
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

// --- Slider handlers (THIS is what was not working for you before) ---
epfSlider.addEventListener("input", () => {
  episodesPerFrame = Number(epfSlider.value);
  epfLabel.textContent = episodesPerFrame;
  // helps you verify it works
  // console.log("episodesPerFrame:", episodesPerFrame);
});

watchSlider.addEventListener("input", () => {
  watchDelay = Number(watchSlider.value);
  watchLabel.textContent = watchDelay;
});

targetInput.addEventListener("input", () => {
  updateProgress();
});

// --- Buttons ---
document.getElementById("playHuman").addEventListener("click", () => {
  mode = "human";
  resetGame();
});

document.getElementById("trainAI").addEventListener("click", () => {
  mode = "train";
  agent.epsilon = Math.max(agent.epsilon, 0.3); 
  trainLoop();
});

document.getElementById("watchAI").addEventListener("click", () => {
  mode = "watch";
  agent.epsilon = 0;
  resetGame();
});

document.getElementById("reset").addEventListener("click", () => {
  agent.reset();
  episode = 0;
  best = 0;

  last100 = [];
  avg100 = 0;

  resetGame();
  updateStats();
});


// --- Human controls (prevents instant reversal) ---
document.addEventListener("keydown", (e) => {
  if (mode !== "human") return;

  if (e.key === "ArrowUp" && !(dir.x === 0 && dir.y === 1)) dir = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && !(dir.x === 0 && dir.y === -1)) dir = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && !(dir.x === 1 && dir.y === 0)) dir = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && !(dir.x === -1 && dir.y === 0)) dir = { x: 1, y: 0 };
});

// --- Training loop ---
let training = false;

function trainLoop() {
  if (mode !== "train") { training = false; return; }
  if (training) return; // prevent double-start
  training = true;

  const tick = () => {
    if (mode !== "train") { training = false; return; }

    const target = getTarget();

    for (let i = 0; i < episodesPerFrame && episode < target; i++) {
      resetGame();
      episode++;

      while (alive) {
        const action = agent.chooseAction(getState());
        step(action);
      }
last100.push(score);
if (last100.length > 100) last100.shift();
avg100 = last100.reduce((a,b)=>a+b,0) / last100.length;

      if (score > best) best = score;
    }

    updateStats();

    if (episode < target) {
      requestAnimationFrame(tick);
    } else {
      training = false;
    }
  };

  requestAnimationFrame(tick);
}

// --- Game loop (human/watch rendering) ---
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

// --- Stats ---
function updateStats() {
  document.getElementById("episode").textContent = episode;
  document.getElementById("score").textContent = score;
  document.getElementById("best").textContent = best;
  document.getElementById("epsilon").textContent = agent.epsilon.toFixed(2);
  updateProgress();
}

// start
updateStats();
gameLoop();
