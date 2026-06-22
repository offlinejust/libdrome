// Game.js — исполнитель (executor)
// Рендер на канвасе из index.html (вызов `CubeSample` удалён)

import MapTiler from './MapTiler.js';
import MapGen from './MapGen.js';
import Camera from './Camera.js';
import EntitySlimePlayer from './EntitySlimePlayer.js';

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

  // helper for smooth camera centering
  let cameraLerp = null; // { startX, startY, targetX, targetY, elapsed, duration }
  const CAMERA_LERP_MAX = 1000; // ms max duration

  // spawn player in map center
  const entities = map.entities || [];
  const startTx = Math.floor(map.width / 2) - 1;
  const startTy = Math.floor(map.height / 2) - 1;
  const px = startTx * tiler.tileSize;
  const py = startTy * tiler.tileSize;
  const player = new EntitySlimePlayer({ x: px, y: py, tileSize: tiler.tileSize });
  player.mode = 'player';
  entities.push(player);
  map.entities = entities;
  // disable camera input while in player mode by default
  camera.setInputEnabled(false);

  // toggle modes with physical 'P' key (e.code === 'KeyP')
  function togglePlayerCameraMode(){
    if(player.mode === 'player'){
      player.mode = 'camera';
      camera.setInputEnabled(true);
      cameraLerp = null;
    }else{
      player.mode = 'player';
      camera.setInputEnabled(false);
      // start smooth centering to player (duration <= 1000 ms)
      const viewW = (canvas.width / dpr) / camera.scale;
      const viewH = (canvas.height / dpr) / camera.scale;
      const targetX = player.x + (player.widthTiles * tiler.tileSize) / 2 - viewW / 2;
      const targetY = player.y + (player.heightTiles * tiler.tileSize) / 2 - viewH / 2;
      cameraLerp = {
        startX: camera.x,
        startY: camera.y,
        targetX,
        targetY,
        elapsed: 0,
        duration: Math.min(CAMERA_LERP_MAX, 800)
      };
    }
  }
  window.addEventListener('keydown', (e)=>{ if(e.code === 'KeyP') togglePlayerCameraMode(); });

  // wheel: when in player mode, zoom towards player center instead of cursor
  canvas.addEventListener('wheel', (e)=>{
    if(player && player.mode === 'player'){
      e.preventDefault();
      const centerX = player.x + (player.widthTiles * tiler.tileSize) / 2;
      const centerY = player.y + (player.heightTiles * tiler.tileSize) / 2;
      camera.zoomAt(centerX, centerY, e.deltaY);
    }
  }, { passive: false });

  let last = performance.now();
  let rafId = null;

  function frame(ts){
    const dt = ts - last;
    last = ts;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0,0,w,h);

    // camera behavior depends on player mode
    if(player.mode === 'camera'){
      camera.update(dt);
    } else {
      // player mode: disable camera movement and center on player — smoothly if lerp is active
      const viewW = (canvas.width / dpr) / camera.scale;
      const viewH = (canvas.height / dpr) / camera.scale;
      const desiredX = player.x + (player.widthTiles * tiler.tileSize) / 2 - viewW / 2;
      const desiredY = player.y + (player.heightTiles * tiler.tileSize) / 2 - viewH / 2;
      if(cameraLerp){
        cameraLerp.elapsed += dt;
        const t = Math.min(1, cameraLerp.elapsed / cameraLerp.duration);
        const ease = 1 - (1 - t) * (1 - t); // easeOutQuad
        camera.x = cameraLerp.startX + (cameraLerp.targetX - cameraLerp.startX) * ease;
        camera.y = cameraLerp.startY + (cameraLerp.targetY - cameraLerp.startY) * ease;
        if(t >= 1) cameraLerp = null;
        camera._clamp();
      } else {
        camera.x = desiredX;
        camera.y = desiredY;
        camera._clamp();
      }
    }

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
