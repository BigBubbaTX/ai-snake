const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const size = 20;
const cells = 20;

let snake, dir, food, score, alive;
let mode = "human";
let agent = new Agent();

let stepsSinceFood = 0;
let lastDist = 0;

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * cells),
    y: Math.floor(Math.random() * cells),
  };
}

function distToFood() {
  const h = snake[0];
  return Math.abs(h.x - food.x) + Math.abs(h.y - food.y);
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  dir = { x: 1, y: 0 };
  score = 0;
  alive = true;

  spawnFood();

  stepsSinceFood = 0;
  lastDist = distToFood();
}

function getState() {
  const head = snake[0];

  function danger(dx, dy) {
    const nx = head.x + dx;
    const ny = head.y + dy;
    return (
      nx < 0 || ny < 0 || nx >= cells || ny >= cells ||
      snake.some(s => s.x === nx && s.y === ny)
    );
  }

  function danger2(dx, dy) {
    // check 1-step
    const ix = head.x + dx;
    const iy = head.y + dy;
    if (
      ix < 0 || iy < 0 || ix >= cells || iy >= cells ||
      snake.some(s => s.x === ix && s.y === iy)
    ) return true;

    // check 2-step
    const nx = head.x + dx * 2;
    const ny = head.y + dy * 2;
    if (
      nx < 0 || ny < 0 || nx >= cells || ny >= cells ||
      snake.some(s => s.x === nx && s.y === ny)
    ) return true;

    return false;
  }

  // relative directions based on current dir
  const straight = { x: dir.x, y: dir.y };
  const left     = { x: -dir.y, y: dir.x };
  const right    = { x: dir.y, y: -dir.x };

  // direction one-hot
  const dirUp    = (dir.x === 0 && dir.y === -1) ? 1 : 0;
  const dirRight = (dir.x === 1 && dir.y === 0) ? 1 : 0;
  const dirDown  = (dir.x === 0 && dir.y === 1) ? 1 : 0;
  const dirLeft  = (dir.x === -1 && dir.y === 0) ? 1 : 0;

  // food relative: forward/left/right
  const fx = food.x - head.x;
  const fy = food.y - head.y;

  const foodStraight = (fx * straight.x + fy * straight.y) > 0 ? 1 : 0;
  const foodLeft     = (fx * left.x + fy * left.y) > 0 ? 1 : 0;
  const foodRight    = (fx * right.x + fy * right.y) > 0 ? 1 : 0;

  return [
    // 1-step danger
    danger(straight.x, straight.y) ? 1 : 0,
    danger(left.x, left.y) ? 1 : 0,
    danger(right.x, right.y) ? 1 : 0,

    // 2-step danger
    danger2(straight.x, straight.y) ? 1 : 0,
    danger2(left.x, left.y) ? 1 : 0,
    danger2(right.x, right.y) ? 1 : 0,

    // heading
    dirUp, dirRight, dirDown, dirLeft,

    // food relative
    foodStraight, foodLeft, foodRight
  ];
}


function turn(action) {
  // 0 = straight, 1 = left, 2 = right
  if (action === 1) dir = { x: -dir.y, y: dir.x };
  if (action === 2) dir = { x: dir.y, y: -dir.x };
}

function step(action = null) {
  if (!alive) return;

  // ---- AI state before move ----
  const prevState = getState();

  if (action !== null) turn(action);

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // ---- collision = death ----
  if (
    head.x < 0 || head.y < 0 ||
    head.x >= cells || head.y >= cells ||
    snake.some(s => s.x === head.x && s.y === head.y)
  ) {
    alive = false;
    if (mode !== "human" && action !== null) {
      agent.learn(prevState, action, -25, getState());
    }
    return;
  }

  // move head
  snake.unshift(head);

  // ---- reward shaping (THIS IS WHERE YOUR "SECOND PASTE" GOES) ----
  stepsSinceFood++;

  let reward = -0.05; // small step penalty to avoid wandering forever

  // distance shaping
const d = distToFood();
if (d < lastDist) reward += 0.15;
else if (d > lastDist) reward -= 0.15;
lastDist = d;


  // eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    reward = 25;
    stepsSinceFood = 0;
    spawnFood();
  } else {
    // normal move: remove tail
    snake.pop();
  }

  // dynamic stall cap: longer snake gets more steps to find food
  const maxSteps = 400 + snake.length * 60;


  if (stepsSinceFood >= maxSteps) {
    alive = false;
    reward = -10;
  }

  // learn from transition
  if (mode !== "human" && action !== null) {
    agent.learn(prevState, action, reward, getState());
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // food
  ctx.fillStyle = "red";
  ctx.fillRect(food.x * size, food.y * size, size, size);

  // snake
  ctx.fillStyle = "lime";
  for (const s of snake) {
    ctx.fillRect(s.x * size, s.y * size, size, size);
  }
}
