import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorld, step, movePaddle, WIDTH, HEIGHT, PADDLE_W, formatTime } from "../src/lib/engine.ts";
test("40 bricks and exactly 30 percent red", () => { for(let i=0;i<100;i++){const w=createWorld();assert.equal(w.bricks.length,40);assert.equal(w.bricks.filter(b=>b.color===0).length,12);assert.equal(w.lives,3);} });
test("third red ends mission and freezes elapsed time",()=>{const w=createWorld();for(let i=0;i<3;i++){const b=w.bricks.find(b=>b.alive&&b.color===0);w.ball={x:b.x+42,y:b.y+27+7.5,vx:0,vy:-315};step(w,1/120,0);}assert.equal(w.reds,3);assert.equal(w.status,"won");const t=w.elapsed;step(w,1/120,1);assert.equal(w.elapsed,t);});
test("three misses fail with no further timing",()=>{const w=createWorld();for(let i=0;i<3;i++){w.ball.y=HEIGHT+20;w.ball.vy=315;step(w,1/120,0);}assert.equal(w.lives,0);assert.equal(w.status,"lost");const t=w.elapsed;step(w,1/120,0);assert.equal(w.elapsed,t);});
test("paddle remains in bounds and top collision bounces",()=>{const w=createWorld();movePaddle(w,-10000);assert.ok(w.paddle>=PADDLE_W/2);movePaddle(w,10000);assert.ok(w.paddle<=WIDTH-PADDLE_W/2);w.ball={x:400,y:15,vx:0,vy:-315};step(w,1/120,0);assert.ok(w.ball.vy>0);});
test("timer matches reference mm:ss",()=>{assert.equal(formatTime(0),"00:00");assert.equal(formatTime(65.9),"01:05");});
