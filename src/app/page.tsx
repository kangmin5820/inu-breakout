"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleHelp, Flame, Heart, Medal, Music2, Pause, Play, RotateCcw, Square, Trophy, Volume2, VolumeX } from "lucide-react";
import GameCanvas, { type Hud, type Phase } from "@/components/GameCanvas";
import { formatTime } from "@/lib/engine";
type Score = { name: string; seconds: number; time: string };
const defaultHud: Hud = { lives: 3, reds: 0, broken: 0, elapsed: 0 };
export default function Home() {
  const [player, setPlayer] = useState("");
  const [phase, setPhase] = useState<"lobby" | Phase>("lobby");
  const [round, setRound] = useState(0);
  const [count, setCount] = useState(3);
  const [hud, setHud] = useState(defaultHud);
  const [scores, setScores] = useState<Score[]>([]);
  const [rankError, setRankError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resultSeconds, setResultSeconds] = useState(0);
  const [help, setHelp] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const synth = useRef<AudioContext | null>(null);
  const beforePause = useRef<"playing" | "countdown">("playing");
  async function refreshScores(signal?: AbortSignal) {
    try { const response = await fetch("/api/scores", { cache: "no-store", signal }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setScores(data.scores); setRankError(""); }
    catch (e) { if (!signal?.aborted) setRankError(e instanceof Error ? e.message : "랭킹을 불러오지 못했어요."); }
  }
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/scores", { cache: "no-store", signal: abort.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then(data => { if (!abort.signal.aborted) { setScores(data.scores); setRankError(""); } })
      .catch(e => { if (!abort.signal.aborted) setRankError(e instanceof Error ? e.message : "랭킹을 불러오지 못했어요."); });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    if (phase !== "countdown") return;
    const timer = setInterval(() => setCount(value => value - 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => { if (phase === "countdown" && count <= 0) { const timer = setTimeout(() => setPhase("playing"), 0); return () => clearTimeout(timer); } }, [count, phase]);
  useEffect(() => {
    const music = audio.current;
    if (!music) return;
    music.muted = muted;
    if (["playing", "countdown"].includes(phase)) void music.play().catch(() => setError("음악 재생이 차단됐어요. 소리 버튼을 눌러 다시 켜주세요."));
    else music.pause();
  }, [phase, muted]);
  useEffect(() => () => { audio.current?.pause(); void synth.current?.close(); }, []);

  async function start(e: React.FormEvent) {
    e.preventDefault(); if (!player.trim() || busy) return;
    setBusy(true); setError("");
    if (!audio.current) { audio.current = new Audio("/Hyper_Speed_Run.mp3"); audio.current.loop = true; audio.current.volume = .18; }
    audio.current.currentTime = 0; audio.current.muted = muted; void audio.current.play().catch(() => {});
    if (!synth.current) synth.current = new AudioContext();
    void synth.current.resume();
    try { const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: player.trim() }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setPlayer(player.trim()); setRound(r => r + 1); setHud(defaultHud); setCount(3); setSaved(false); setResultSeconds(0); setPhase("countdown"); }
    catch(e) { audio.current.pause(); setError(e instanceof Error ? e.message : "게임을 시작하지 못했어요."); }
    finally { setBusy(false); }
  }
  async function saveScore(seconds: number) {
    setBusy(true); setError("");
    try { const response = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seconds }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSaved(true); setScores(data.scores); setRankError(""); }
    catch(e) { setError(e instanceof Error ? e.message : "기록 저장에 실패했어요."); }
    finally { setBusy(false); }
  }
  const finish = useCallback((won: boolean, seconds: number) => { setResultSeconds(seconds); setPhase(won ? "won" : "lost"); if (won) void saveScore(seconds); }, []);
  const bounce = useCallback(() => { const context = synth.current; if (!context || context.state !== "running" || audio.current?.muted) return; const osc = context.createOscillator(), gain = context.createGain(); osc.type = "sine"; osc.frequency.setValueAtTime(720, context.currentTime); osc.frequency.exponentialRampToValueAtTime(330, context.currentTime + .09); gain.gain.setValueAtTime(.07, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .1); osc.connect(gain); gain.connect(context.destination); osc.start(); osc.stop(context.currentTime + .11); }, []);
  const autoPause = useCallback(() => { setPhase(current => { if (current === "playing" || current === "countdown") { beforePause.current = current; return "paused"; } return current; }); }, []);
  function pause() { if (phase === "paused") setPhase(beforePause.current); else if (phase === "playing" || phase === "countdown") { beforePause.current = phase; setPhase("paused"); } }
  function restart() { setPhase("lobby"); setHud(defaultHud); setError(""); setSaved(false); }
  const active = phase !== "lobby";
  return <div className="app-shell">
    <header className="topbar"><Link className="wordmark" href="/" aria-label="INU 벽돌깨기 홈"><span className="mark"><Flame size={22}/></span>INU<span className="wordmark-light">ARCADE</span></Link><div className="top-actions"><span className="edition">2026 CAMPUS EDITION</span><button className="icon-button" aria-label={muted ? "음악 켜기" : "음악 끄기"} onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={19}/> : <Volume2 size={19}/>}</button><button className="icon-button" aria-label="게임 방법" onClick={() => setHelp(!help)}><CircleHelp size={19}/></button></div></header>
    <main className="main-layout"><div className="main-column"><div className="eyebrow"><span/> THE 3 RED BRICK CHALLENGE</div><div className="page-heading"><h1>INU <span>벽돌깨기</span><i>↗</i></h1><p>가볍게 시작하고, 가장 빠르게 클리어하세요.</p></div>
      {!active ? <section className="lobby-panel"><div className="lobby-copy"><span className="pill"><Flame size={13}/> TODAY’S MISSION</span><h2>딱 세 번의 레드.<br/>도전은 지금부터.</h2><p>40개의 벽돌 사이, <strong>빨간 벽돌 3개</strong>를 찾아 깨세요.<br/>당신의 가장 빠른 순간이 기록됩니다.</p><form onSubmit={start}><label htmlFor="player">플레이어 이름</label><div className="name-input"><input id="player" value={player} onChange={e => setPlayer(e.target.value)} maxLength={20} required placeholder="랭킹에 남길 이름을 입력하세요" autoComplete="nickname"/><span>{player.length}/20</span></div><button className="start-button" disabled={busy || !player.trim()}><Play size={17} fill="currentColor"/>{busy ? "준비하는 중…" : "게임 시작"}<ArrowUpRight size={20}/></button></form><div className="creator"><span className="creator-avatar">KM</span><div><small>DESIGNED & DEVELOPED BY</small><p>운동건강학부 · 202202056 · <strong>이강민</strong></p></div></div></div><div className="mascot-side"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="floating-brick brick-one"/><span className="floating-brick brick-two"/><span className="floating-brick brick-three"/><span className="sparkle s-one">✦</span><span className="sparkle s-two">✦</span><div className="mascot-disc"><Image src="/Mascot.jpg" alt="인천대학교 마스코트 횃불이" width={290} height={290} priority/></div><span className="mascot-caption">LET’S BREAK YOUR RECORD!</span></div></section> : <section className="play-panel"><div className="game-stats"><div><small>PLAYER</small><strong>{player}</strong></div><div><small>LIVES</small><span className="hearts">{[0,1,2].map(i => <Heart size={17} key={i} className={i < hud.lives ? "alive" : "spent"} fill="currentColor"/>)}</span></div><div><small>TIME</small><strong className="timer">{phase === "lost" || phase === "ended" ? "--:--" : formatTime(hud.elapsed)}</strong></div><div><small>RED TARGET</small><strong className="red-progress">{hud.reds}<em>/ 3</em></strong></div></div><div className="canvas-wrap"><GameCanvas round={round} phase={phase} onHud={setHud} onEnd={finish} onBounce={bounce} onAutoPause={autoPause}/>{phase === "countdown" && <div className="overlay countdown" aria-live="polite"><span>READY TO BREAK?</span><strong>{Math.max(1,count)}</strong><p>좌우 방향키 또는 스와이프로 준비하세요</p></div>}{phase === "paused" && <div className="overlay"><span className="overlay-icon"><Pause size={28}/></span><h2>잠깐, 숨 고르기</h2><p>게임과 기록 측정을 일시정지했어요.</p><button className="start-button" onClick={pause}><Play size={17}/>계속하기</button></div>}{["won", "lost", "ended"].includes(phase) && <div className={`overlay result ${phase === "won" ? "success" : ""}`}>{phase === "won" && <div className="confetti" aria-hidden="true">{Array.from({length:44},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDelay:`${i%9*.12}s`,background:["#ff9ca5","#ffd1a1","#a8d6ff","#b9edca","#d4bcff"][i%5],transform:`rotate(${i*29}deg)`}}/>)}</div>}<span className="overlay-icon">{phase === "won" ? <Trophy size={30}/> : <Square size={26}/>}</span><span className="eyebrow">{phase === "won" ? "MISSION COMPLETE" : phase === "lost" ? "MISSION FAILED" : "GAME ENDED"}</span><h2>{phase === "won" ? "멋진 클리어!" : phase === "lost" ? "게임 미션 실패" : "게임을 종료했어요"}</h2>{phase === "won" ? <><strong className="final-time">{formatTime(resultSeconds)}</strong><p>{saved ? <><Check size={15}/> Google Sheets에 기록을 저장했어요.</> : busy ? "기록을 저장하고 있어요…" : "기록 저장을 다시 시도할 수 있어요."}</p></> : <p>{phase === "lost" ? "생명을 모두 사용했어요. 다시 도전해볼까요?" : "이번 게임의 시간은 기록하지 않아요."}</p>}{error && <div className="error" role="alert">{error}</div>}{phase === "won" && !saved && !busy && <button className="retry-save" onClick={() => void saveScore(resultSeconds)}>기록 저장 재시도</button>}<button className="start-button" onClick={restart} disabled={busy}><RotateCcw size={16}/>처음 화면으로</button></div>}</div><div className="game-controls"><span className="control-hint"><kbd>←</kbd><kbd>→</kbd> MOVE <span className="touch-hint">/ 모바일: 좌우 스와이프</span></span><div><button onClick={pause} disabled={!["countdown","playing","paused"].includes(phase)}>{phase === "paused" ? <Play size={15}/> : <Pause size={15}/>} {phase === "paused" ? "계속하기" : "일시정지"}</button><button onClick={restart} disabled={busy}><RotateCcw size={15}/>다시 시작</button><button onClick={() => { setPhase("ended"); setError(""); }} disabled={!["countdown","playing","paused"].includes(phase)}><Square size={14}/>게임 종료</button></div></div></section>}
      {error && phase === "lobby" && <p className="error" role="alert">{error}</p>}
      <section className={`how-to ${help ? "highlight-help" : ""}`}><div className="section-label">HOW TO PLAY <span>처음이라면, 이것만 기억하세요.</span></div><div className="rule-grid"><div><span className="rule-icon"><ArrowLeft size={16}/><ArrowRight size={16}/></span><h3>좌우로, 부드럽게</h3><p>PC는 방향키, 모바일은 스와이프.<br/>패들로 공을 받아주세요.</p></div><div><span className="rule-icon red-rule"><span className="mini-brick"/></span><h3>빨간 벽돌 3개</h3><p>40개 중 12개가 빨간 벽돌.<br/>3개만 깨면 미션 성공!</p></div><div><span className="rule-icon"><Heart size={18}/></span><h3>세 번의 기회</h3><p>공을 놓치면 생명이 줄어요.<br/>실패한 게임은 기록하지 않아요.</p></div></div></section>
    </div><aside className="sidebar"><section className="ranking-panel"><div className="ranking-heading"><span className="trophy-box"><Trophy size={20}/></span><span><small>HALL OF FAME</small><h2>가장 빠른 TOP 3</h2></span><span className="live-indicator">LIVE</span></div><p className="ranking-desc">성공한 순간만, 가장 빠른 기록부터.</p><ol className="ranking-list">{[0,1,2].map(i => <li key={i} className={`rank-${i+1}`}><span className="rank-number">{i === 0 ? <Medal size={21}/> : String(i+1).padStart(2,"0")}</span><div><strong>{scores[i]?.name || "다음 주인공을 기다려요"}</strong><small>{scores[i] ? "MISSION CLEARED" : "YOUR NAME HERE"}</small></div><time>{scores[i]?.time || "--:--"}</time></li>)}</ol>{rankError && <p className="rank-error">{rankError} <button onClick={() => void refreshScores()}>재시도</button></p>}<div className="rank-footer"><span/><span>Google Sheets 실시간 기록</span><ChevronRight size={15}/></div></section><section className="mission-card"><span className="small-label">ONE SMALL CHALLENGE</span><h3>기록을 깨는 건,<br/>어쩌면 바로 당신.</h3><div className="target-bricks"><i/><i/><i/></div><p>빠른 손보다 중요한 건 집중력.<br/>횃불이와 함께 최고 기록에 도전하세요.</p></section><div className="sound-note"><Music2 size={15}/><span>Hyper Speed Run<span>음악과 함께 더 신나게!</span></span><span className="equalizer"><i/><i/><i/><i/></span></div></aside></main><footer><span><Flame size={14}/> INU ARCADE <i>·</i> 작은 도전, 새로운 기록.</span><small>© 2026 INU Breakout · Made by 이강민</small></footer>
  </div>;
}
