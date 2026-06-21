// Game.js — исполнитель (executor)
// Рендер на канвасе из index.html (вызов `CubeSample` удалён)

import MapTiler from './MapTiler.js';
import MapGen from './MapGen.js';
import Camera from './Camera.js';

const canvas = window.__GAME_CANVAS || document.getElementById('game');
const ctx = window.__GAME_CTX || (canvas && canvas.getContext && canvas.getContext('2d'));
const dpr = window.devicePixelRatio || 1;

function ensureStart(){
  if(!canvas || !ctx){
    document.addEventListener('DOMContentLoaded', ensureStart, {once:true});
    return;
  }

  // Инициализация генератора и тайлера
  const tiler = new MapTiler(32);
  const gen = new MapGen(tiler);
  const map = gen.generateBasic(200, 120, 2);
  tiler.loadMap(map);

  const camera = new Camera(canvas, map, tiler.tileSize);

  let last = performance.now();
  let rafId = null;

  function frame(ts){
    const dt = ts - last;
    last = ts;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0,0,w,h);
    camera.update(dt);
    const entities = map.entities || [];
    for(const e of entities) e.update(dt, tiler, entities);
    tiler.draw(ctx, camera.getViewport());
    for(const e of entities) e.draw(ctx, camera.getViewport());
    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){ if(rafId) cancelAnimationFrame(rafId); rafId = null; }
    else{ last = performance.now(); if(!rafId) rafId = requestAnimationFrame(frame); }
  });
}

ensureStart();
