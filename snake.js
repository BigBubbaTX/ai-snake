const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const size = 20;
const cells = 20;
let steps;
let lastDist;
const MAX_STEPS = 200; // increase as it gets better: 200 -> 300 -> 500

let snake, dir, food, score, alive;
let mode = "human";
let agent = new Agent();

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  dir = { x: 1, y: 0 };
  steps = 0;
  lastDist = distToFood();
  alive = true;
  spawnFood();
}
function distToFood() {
  const head = snake[0];
  return Math.abs(head.x - food.x) + Math.abs(head.y - food.y); // Manhattan distance
}

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * cells),
    y: Math.floor(Math.random() * cells)
  };
}

function getState() {
  const head = snake[0];

  function danger(dx, dy) {
    const nx = head.x + dx;
    const ny = head.y + dy;
    return nx < 0 || ny < 0 || nx >= cells || ny >= cells ||
      snake.some(s => s.x === nx && s.y === ny);
  }

  return [
    danger(dir.x, dir.y) ? 1 : 0,
    danger(-dir.y, dir.x) ? 1 : 0,
    danger(dir.y, -dir.x) ? 1 : 0,
    food.x < head.x ? 1 : 0,
    food.x > head.x ? 1 : 0,
    food.y < head.y ? 1 : 0,
    food.y > head.y ? 1 : 0
  ];
}

function turn(action) {
  if (action === 1) dir = { x: -dir.y, y: dir.x };
  if (action === 2) dir = { x: dir.y, y: -dir.x };
}

steps++;

let reward = -0.02; // small step penalty so it doesn't wander

// distance shaping
const d = distToFood();
if (d < lastDist) reward += 0.3;
else if (d > lastDist) reward -= 0.3;
lastDist = d;

if (head.x === food.x && head.y === food.y) {
  score++;
  reward = 15;          // stronger food reward
  steps = 0;            // reset stall counter when it succeeds
  spawnFood();
} else {
  snake.pop();
}

// stop infinite loops / stalling
if (steps >= MAX_STEPS) {
  alive = false;
  reward = -5;
}


function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "red";
  ctx.fillRect(food.x * size, food.y * size, size, size);

  ctx.fillStyle = "lime";
  snake.forEach(s => ctx.fillRect(s.x * size, s.y * size, size, size));
}

