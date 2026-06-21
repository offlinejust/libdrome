// EntitySlimeSample.js — простой случайный слайм, блуждает по карте
import EntitySlime from './EntitySlime.js';

export default class EntitySlimeSample extends EntitySlime {
  constructor(opts = {}){
    opts.color = opts.color || '#ff8fcf';
    opts.hasCollision = opts.hasCollision !== undefined ? opts.hasCollision : true;
    super(opts);
    this.vx = 0; this.vy = 0; // pixels per second
    this.changeTimer = 0;
    this.speed = opts.speed || 60; // base wandering speed (pixels/sec)
  }

  update(dt, tiler, entities){
    const t = dt / 1000;
    this.changeTimer -= t;
    if(this.changeTimer <= 0){
      // pick new direction
      const angle = Math.random() * Math.PI * 2;
      const sp = this.speed * (0.5 + Math.random());
      this.vx = Math.cos(angle) * sp;
      this.vy = Math.sin(angle) * sp;
      this.changeTimer = 0.5 + Math.random() * 2.0;
    }

    // attempt movement
    const dx = this.vx * t;
    const dy = this.vy * t;
    const moved = this.move(dx, dy, tiler, entities);
    if(!moved){
      // on collision, pick new direction next frame
      this.changeTimer = 0.1;
    }
  }
}
