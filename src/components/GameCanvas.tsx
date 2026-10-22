"use client";
import { useEffect, useRef } from "react";
import { COLORS, HEIGHT, PADDLE_W, PADDLE_Y, RADIUS, WIDTH, createWorld, movePaddle, step, type World } from "@/lib/engine";
export type Hud = { lives: number; reds: number; broken: number; elapsed: number };
export type Phase = "countdown" | "playing" | "paused" | "won" | "lost" | "ended";
function draw(ctx: CanvasRenderingContext2D, w: World, phase: Phase) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#0d1932"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#a4c4ff10";
  for (let x = 24; x < WIDTH; x += 24) for (let y = 24; y < HEIGHT; y += 24) { ctx.beginPath(); ctx.arc(x, y, .8, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = "#5a7cae26"; ctx.strokeRect(8.5, 8.5, WIDTH - 17, HEIGHT - 17);
  for (const b of w.bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = COLORS[b.color]; ctx.shadowColor = b.color === 0 ? "#ff748550" : "transparent"; ctx.shadowBlur = b.color === 0 ? 15 : 0;
    ctx.beginPath(); ctx.roundRect(b.x, b.y, 84, 27, 5); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff45"; ctx.fillRect(b.x + 6, b.y + 4, 72, 2);
    if (b.color === 0) { ctx.fillStyle = "#9c344a"; ctx.beginPath(); ctx.arc(b.x + 42, b.y + 14, 3, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.fillStyle = "#6085ba50"; ctx.fillRect(24, HEIGHT - 31, WIDTH - 48, 1);
  ctx.fillStyle = "#ffbd6d"; ctx.shadowColor = "#ffbd6d"; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.roundRect(w.paddle - PADDLE_W / 2, PADDLE_Y, PADDLE_W, 13, 7); ctx.fill();
  ctx.fillStyle = "#fff5d9"; ctx.shadowColor = "#b6d9ff"; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(w.ball.x, w.ball.y, RADIUS, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  if (phase === "paused") { ctx.fillStyle = "#0b142b80"; ctx.fillRect(0,0,WIDTH,HEIGHT); }
}
export default function GameCanvas({ phase, round, onHud, onEnd, onBounce, onAutoPause }: { phase: Phase; round: number; onHud: (h: Hud) => void; onEnd: (won: boolean, seconds: number) => void; onBounce: () => void; onAutoPause: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world = useRef<World | null>(null);
  const phaseRef = useRef(phase);
  const handlers = useRef({ onHud, onEnd, onBounce, onAutoPause });
  const keys = useRef({ left: false, right: false });
  const pointer = useRef<{ id: number; x: number } | null>(null);
  useEffect(() => { phaseRef.current = phase; keys.current = { left: false, right: false }; }, [phase]);
  useEffect(() => { handlers.current = { onHud, onEnd, onBounce, onAutoPause }; }, [onHud, onEnd, onBounce, onAutoPause]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = WIDTH * dpr; canvas.height = HEIGHT * dpr; ctx.scale(dpr, dpr);
    world.current = createWorld();
    let frame = 0, last = 0, hudAt = 0, ended = false;
    const down = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); keys.current[e.key === "ArrowLeft" ? "left" : "right"] = true; } };
    const up = (e: KeyboardEvent) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); keys.current[e.key === "ArrowLeft" ? "left" : "right"] = false; } };
    const blur = () => { keys.current = { left: false, right: false }; if (phaseRef.current === "playing" || phaseRef.current === "countdown") handlers.current.onAutoPause(); };
    const hidden = () => { if (document.hidden) blur(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur); document.addEventListener("visibilitychange", hidden);
    function tick(now: number) {
      const w = world.current!;
      const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
      if (phaseRef.current === "playing" && w.status === "playing") {
        let remaining = dt;
        const before = w.bounce;
        while (remaining > .00001 && w.status === "playing") { const slice = Math.min(remaining, 1 / 120); step(w, slice, Number(keys.current.right) - Number(keys.current.left)); remaining -= slice; }
        if (w.bounce !== before) handlers.current.onBounce();
        if (w.status !== "playing" && !ended) { ended = true; handlers.current.onEnd(w.status === "won", w.elapsed); }
      }
      if (now - hudAt > 80) { handlers.current.onHud({ lives: w.lives, reds: w.reds, broken: w.broken, elapsed: w.elapsed }); hudAt = now; }
      draw(ctx!, w, phaseRef.current); frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", hidden); };
  }, [round]);
  return <canvas ref={canvasRef} className="game-canvas" aria-label="벽돌깨기 게임 화면. PC에서는 좌우 방향키, 모바일에서는 화면을 좌우로 스와이프하세요." onPointerDown={e => { if (e.pointerType === "mouse" || phaseRef.current !== "playing") return; pointer.current = { id: e.pointerId, x: e.clientX }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (!pointer.current || pointer.current.id !== e.pointerId || !world.current || phaseRef.current !== "playing") return; const dx = (e.clientX - pointer.current.x) * WIDTH / e.currentTarget.getBoundingClientRect().width; movePaddle(world.current, world.current.paddle + dx); pointer.current.x = e.clientX; }} onPointerUp={() => { pointer.current = null; }} onPointerCancel={() => { pointer.current = null; }} />;
}
