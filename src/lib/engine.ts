export const WIDTH = 800, HEIGHT = 560, PADDLE_W = 112, PADDLE_Y = 508, RADIUS = 8;
export const COLORS = ["#ff9ca5", "#ffd1a1", "#fff0a3", "#a8d6ff", "#b9edca", "#d4bcff"];
export type Brick = { x: number; y: number; color: number; alive: boolean };
export type World = { ball: { x: number; y: number; vx: number; vy: number }; paddle: number; paddleV: number; bricks: Brick[]; lives: number; reds: number; broken: number; elapsed: number; status: "playing" | "won" | "lost"; bounce: number };
export function formatTime(seconds: number) { const n = Math.max(0, Math.floor(seconds)); return `${Math.floor(n / 60).toString().padStart(2, "0")}:${(n % 60).toString().padStart(2, "0")}`; }
export function createWorld(random = Math.random): World {
  const colors = Array.from({ length: 40 }, (_, i) => i < 12 ? 0 : 1 + Math.floor(random() * 5));
  for (let i = colors.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [colors[i], colors[j]] = [colors[j], colors[i]]; }
  return { ball: { x: WIDTH / 2, y: PADDLE_Y - RADIUS - 2, vx: 145, vy: -315 }, paddle: WIDTH / 2, paddleV: 0, bricks: colors.map((color, i) => ({ x: 36 + i % 8 * 92, y: 62 + Math.floor(i / 8) * 37, color, alive: true })), lives: 3, reds: 0, broken: 0, elapsed: 0, status: "playing", bounce: 0 };
}
export function movePaddle(world: World, x: number) { world.paddle = Math.max(PADDLE_W / 2 + 8, Math.min(WIDTH - PADDLE_W / 2 - 8, x)); }
export function step(world: World, dt: number, axis: number) {
  if (world.status !== "playing") return;
  dt = Math.max(0, Math.min(dt, 1 / 120));
  world.elapsed += dt;
  const target = axis * 610;
  world.paddleV += (target - world.paddleV) * Math.min(1, dt * 20);
  movePaddle(world, world.paddle + world.paddleV * dt);
  const ball = world.ball, px = ball.x, py = ball.y;
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  if (ball.x < RADIUS + 8) { ball.x = RADIUS + 8; ball.vx = Math.abs(ball.vx); }
  if (ball.x > WIDTH - RADIUS - 8) { ball.x = WIDTH - RADIUS - 8; ball.vx = -Math.abs(ball.vx); }
  if (ball.y < RADIUS + 8) { ball.y = RADIUS + 8; ball.vy = Math.abs(ball.vy); }
  if (ball.vy > 0 && py + RADIUS <= PADDLE_Y && ball.y + RADIUS >= PADDLE_Y && ball.x + RADIUS >= world.paddle - PADDLE_W / 2 && ball.x - RADIUS <= world.paddle + PADDLE_W / 2) {
    const angle = Math.max(-1, Math.min(1, (ball.x - world.paddle) / (PADDLE_W / 2))) * Math.PI / 3;
    const speed = Math.min(460, Math.hypot(ball.vx, ball.vy) + 5);
    ball.vx = Math.sin(angle) * speed; ball.vy = -Math.cos(angle) * speed; ball.y = PADDLE_Y - RADIUS - .1;
  }
  for (const brick of world.bricks) {
    if (!brick.alive) continue;
    const nx = Math.max(brick.x, Math.min(brick.x + 84, ball.x));
    const ny = Math.max(brick.y, Math.min(brick.y + 27, ball.y));
    if ((ball.x - nx) ** 2 + (ball.y - ny) ** 2 > RADIUS ** 2) continue;
    brick.alive = false; world.broken++; world.bounce++;
    if (brick.color === 0) world.reds++;
    if (py + RADIUS <= brick.y || py - RADIUS >= brick.y + 27) ball.vy *= -1;
    else if (px + RADIUS <= brick.x || px - RADIUS >= brick.x + 84) ball.vx *= -1;
    else ball.vy *= -1;
    if (world.reds >= 3) world.status = "won";
    break;
  }
  if (ball.y - RADIUS > HEIGHT) {
    world.lives--;
    if (world.lives <= 0) world.status = "lost";
    else { ball.x = world.paddle; ball.y = PADDLE_Y - RADIUS - 2; ball.vx = world.lives % 2 ? 145 : -145; ball.vy = -315; }
  }
}
