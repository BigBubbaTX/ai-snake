let episode = 0;
let best = 0;
const epfSlider = document.getElementById("epf");
const epfLabel = document.getElementById("epfLabel");

const watchSlider = document.getElementById("watchSpeed");
const watchLabel = document.getElementById("watchLabel");

const targetInput = document.getElementById("targetEpisodes");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

let episodesPerFrame = Number(epfSlider.value);
let watchDelay = Number(watchSlider.value);

epfLabel.textContent = episodesPerFrame;
watchLabel.textContent = watchDelay;

epfSlider.oninput = () => {
  episodesPerFrame = Number(epfSlider.value);
  epfLabel.textContent = episodesPerFrame;
};

watchSlider.oninput = () => {
  watchDelay = Number(watchSlider.value);
  watchLabel.textContent = watchDelay;
};

resetGame();

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
};

document.addEventListener("keydown", e => {
  if (mode !== "human") return;
  if (e.key === "ArrowUp") dir = { x: 0, y: -1 };
  if (e.key === "ArrowDown") dir = { x: 0, y: 1 };
  if (e.key === "ArrowLeft") dir = { x: -1, y: 0 };
  if (e.key === "ArrowRight") dir = { x: 1, y: 0 };
});

const EPISODES_PER_FRAME = 50; // try 50, 100, even 200 on a good PC

function trainLoop() {
  if (mode !== "train") return;

  const target = Math.max(1, Number(targetInput.value) || 10000);

  for (let i = 0; i < episodesPerFrame && episode < target; i++) {
    resetGame();
    episode++;

    while (alive) {
      const state = getState();
      const action = agent.chooseAction(state);
      step(action);
    }

    best = Math.max(best, score);
  }

  updateStats();
  updateProgress(target);

  if (episode < target) requestAnimationFrame(trainLoop);
}


function updateProgress(target) {
  const pct = Math.min(100, (episode / target) * 100);
  progressBar.style.width = pct + "%";
  progressText.textContent = `${episode} / ${target}`;
}

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

function updateStats() {
  document.getElementById("episode").textContent = episode;
  document.getElementById("score").textContent = score;
  document.getElementById("best").textContent = best;
  document.getElementById("epsilon").textContent = agent.epsilon.toFixed(2);

  const target = Math.max(1, Number(targetInput.value) || 10000);
  updateProgress(target);
}


gameLoop();

