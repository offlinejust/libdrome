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
    // rotate towards facing; entity.facing is radians (0 = right)
    const cx = sx + w/2;
    const cy = sy + h/2;
    const baseRadius = Math.min(w,h) * 0.45;
    // stroke width proportional but small
    const strokeW = Math.max(1, baseRadius * 0.06);
    const drawR = baseRadius - strokeW/2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((this.facing || 0) + Math.PI/2); // rotate so 'front' (eyes) face movement

    // body fill
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, drawR, 0, Math.PI * 2);
    ctx.fill();

    // outline (slightly darker)
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = shadeColor(this.color, 0.8);
    ctx.stroke();

    // eyes — white sclera + pupil
    const eyeY = -drawR * 0.3; // original code had eyes near top; after rotation top->front
    const eyeOffset = drawR * 0.5;
    const scleraR = Math.max(2, drawR * 0.16);
    const pupilR = Math.max(1, drawR * 0.08);

    // left eye (sclera)
    ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(-eyeOffset, eyeY, scleraR, 0, Math.PI*2); ctx.fill();
    // left pupil — shifted slightly "forward" (towards negative Y in rotated space)
    const pupilOffset = Math.min(drawR * 0.22, scleraR * 0.6);
    const lpX = -eyeOffset;
    const lpY = eyeY - pupilOffset;
    ctx.beginPath(); ctx.fillStyle = this.eyeColor || '#000'; ctx.arc(lpX, lpY, pupilR, 0, Math.PI*2); ctx.fill();
    // tiny highlight on pupil
    ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.arc(lpX - pupilR*0.35, lpY - pupilR*0.35, Math.max(1, pupilR*0.35), 0, Math.PI*2); ctx.fill();

    // right eye (sclera)
    ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(eyeOffset, eyeY, scleraR, 0, Math.PI*2); ctx.fill();
    // right pupil
    const rpX = eyeOffset;
    const rpY = eyeY - pupilOffset;
    ctx.beginPath(); ctx.fillStyle = this.eyeColor || '#000'; ctx.arc(rpX, rpY, pupilR, 0, Math.PI*2); ctx.fill();
    // tiny highlight on pupil
    ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.arc(rpX - pupilR*0.35, rpY - pupilR*0.35, Math.max(1, pupilR*0.35), 0, Math.PI*2); ctx.fill();

    ctx.restore();
  }

}

function shadeColor(hex, factor){
  try{
    if(typeof hex !== 'string' || !hex.startsWith('#')) return 'rgba(0,0,0,0.15)';
    const c = hex.replace('#','');
    const r = parseInt(c.substr(0,2),16);
    const g = parseInt(c.substr(2,2),16);
    const b = parseInt(c.substr(4,2),16);
    const nr = Math.min(255, Math.max(0, Math.floor(r * factor)));
    const ng = Math.min(255, Math.max(0, Math.floor(g * factor)));
    const nb = Math.min(255, Math.max(0, Math.floor(b * factor)));
    return '#' + nr.toString(16).padStart(2,'0') + ng.toString(16).padStart(2,'0') + nb.toString(16).padStart(2,'0');
  }catch(e){ return 'rgba(0,0,0,0.15)'; }
}

