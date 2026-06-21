// EntitySlime.js — визуализация слайма, расширяет Entity
import Entity from './Entity.js';

export default class EntitySlime extends Entity {
  constructor(opts = {}){
    opts.widthTiles = opts.widthTiles || 2;
    opts.heightTiles = opts.heightTiles || 2;
    super(opts);
    this.color = opts.color || '#ff66aa';
    this.eyeColor = opts.eyeColor || '#000';
  }

  draw(ctx, viewport){
    const vpScale = viewport ? viewport.scale : 1;
    const sx = (this.x * vpScale) - (viewport ? viewport.x : 0);
    const sy = (this.y * vpScale) - (viewport ? viewport.y : 0);
    const w = this.widthTiles * this.tileSize * vpScale;
    const h = this.heightTiles * this.tileSize * vpScale;

    ctx.save();
    // body
    ctx.fillStyle = this.color;
    const cx = sx + w/2;
    const cy = sy + h/2;
    const radius = Math.min(w,h) * 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // eyes — simple two dots near top
    ctx.fillStyle = this.eyeColor;
    const eyeY = cy - radius * 0.3;
    const eyeOffset = radius * 0.5;
    const eyeR = Math.max(2, radius * 0.12);
    ctx.beginPath(); ctx.arc(cx - eyeOffset, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + eyeOffset, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}
