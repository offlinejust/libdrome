// Game.js — исполнитель (executor)
// Инстанцирует `CubeSample` и запускает рендер на канвасе из index.html
import CubeSample from './CubeSample.js';

const canvas = window.__GAME_CANVAS || document.getElementById('game');
const ctx = window.__GAME_CTX || (canvas && canvas.getContext && canvas.getContext('2d'));
const dpr = window.devicePixelRatio || 1;

function ensureStart(){
  if(!canvas || !ctx){
    document.addEventListener('DOMContentLoaded', ensureStart, {once:true});
    return;
  }

  const cube = new CubeSample(Math.min(300, (canvas.width / dpr) * 0.25));
  let last = performance.now();
  let rafId = null;

  function frame(ts){
    const dt = ts - last; last = ts;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0,0,w,h);
    cube.update(dt);
    cube.draw(ctx);
    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){ if(rafId) cancelAnimationFrame(rafId); rafId = null; }
    else{ last = performance.now(); if(!rafId) rafId = requestAnimationFrame(frame); }
  });
}

ensureStart();
