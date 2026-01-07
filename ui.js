let episode = 0;
let best = 0;

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

function trainLoop() {
  if (mode !== "train") return;

  resetGame();
  episode++;

  while (alive) {
    const state = getState();
    const action = agent.chooseAction(state);
    step(action);
  }

  best = Math.max(best, score);
  updateStats();

  requestAnimationFrame(trainLoop);
}

function gameLoop() {
  if (mode === "watch") {
    const action = agent.chooseAction(getState());
    step(action);
  } else if (mode === "human") {
    step();
  }

  draw();
  updateStats();
  setTimeout(gameLoop, 80);
}

function updateStats() {
  document.getElementById("episode").textContent = episode;
  document.getElementById("score").textContent = score;
  document.getElementById("best").textContent = best;
  document.getElementById("epsilon").textContent = agent.epsilon.toFixed(2);
}

gameLoop();

