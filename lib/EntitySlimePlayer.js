// EntitySlimePlayer.js — игрок‑слайм с режимами: управление игроком / режим камеры (ИИ)
import EntitySlime from './EntitySlime.js';

export default class EntitySlimePlayer extends EntitySlime {
  constructor(opts = {}){
    opts.widthTiles = opts.widthTiles || 2;
    opts.heightTiles = opts.heightTiles || 2;
    opts.color = opts.color || '#ff3333';
    super(opts);
    this.mode = 'player'; // 'player' or 'camera'

    this.vx = 0; this.vy = 0;
    this.changeTimer = 0;
    this.speed = opts.speed || 100; // pixels/sec for player movement

    this._keys = new Set();
    this._boundKeyDown = (e)=>{
      // track movement keys (physical codes to be layout independent)
      if(e.code === 'KeyW' || e.code === 'ArrowUp') this._keys.add('up');
      if(e.code === 'KeyS' || e.code === 'ArrowDown') this._keys.add('down');
      if(e.code === 'KeyA' || e.code === 'ArrowLeft') this._keys.add('left');
      if(e.code === 'KeyD' || e.code === 'ArrowRight') this._keys.add('right');
    };
    this._boundKeyUp = (e)=>{
      if(e.code === 'KeyW' || e.code === 'ArrowUp') this._keys.delete('up');
      if(e.code === 'KeyS' || e.code === 'ArrowDown') this._keys.delete('down');
      if(e.code === 'KeyA' || e.code === 'ArrowLeft') this._keys.delete('left');
      if(e.code === 'KeyD' || e.code === 'ArrowRight') this._keys.delete('right');
    };
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
  }

  // mode: 'player' => controlled by user's WASD/arrow keys; camera input disabled by Game logic
  // mode: 'camera' => this entity runs simple wandering AI (similar to EntitySlimeSample)
  update(dt, tiler, entities){
    const t = dt / 1000;
    if(this.mode === 'player'){
      let dx = 0, dy = 0;
      if(this._keys.has('up')) dy -= 1;
      if(this._keys.has('down')) dy += 1;
      if(this._keys.has('left')) dx -= 1;
      if(this._keys.has('right')) dx += 1;
      if(dx !== 0 || dy !== 0){
        const len = Math.hypot(dx,dy) || 1;
        const mvx = (dx / len) * this.speed * t;
        const mvy = (dy / len) * this.speed * t;
        const moved = this.move(mvx, mvy, tiler, entities);
        if(moved){ this.vx = mvx / t; this.vy = mvy / t; }
      }
    }else{
      this.changeTimer -= t;
      if(this.changeTimer <= 0){
        const angle = Math.random() * Math.PI * 2;
        const sp = this.speed * (0.5 + Math.random());
        this.vx = Math.cos(angle) * sp;
        this.vy = Math.sin(angle) * sp;
        this.changeTimer = 0.5 + Math.random() * 2.0;
      }
      const dx = this.vx * t;
      const dy = this.vy * t;
      const moved = this.move(dx, dy, tiler, entities);
      if(!moved) this.changeTimer = 0.1;
    }
  }

  dispose(){
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
  }
}
