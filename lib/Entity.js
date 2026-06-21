// Entity.js — базовый класс для подвижных объектов вне сетки тайлов

export default class Entity {
  constructor(opts = {}){
    // position in world pixels (top-left)
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    // size in tiles
    this.widthTiles = opts.widthTiles || 1;
    this.heightTiles = opts.heightTiles || 1;
    this.tileSize = opts.tileSize || 32;
    this.hasCollision = opts.hasCollision !== undefined ? opts.hasCollision : true;
    this.id = opts.id || null;
  }

  // bounding box in world pixels
  getBounds(){
    return { x: this.x, y: this.y, w: this.widthTiles * this.tileSize, h: this.heightTiles * this.tileSize };
  }

  // попробуем переместиться на dx,dy (в пикселях), учитывая тайлер и массив других энтити
  // tiler: instance of MapTiler
  // entities: array of other entities (including self)
  move(dx, dy, tiler, entities = []){
    if(dx === 0 && dy === 0) return true;

    // Try axis-separated movement to allow sliding along obstacles.
    // First try full move.
    if(this._canMoveTo(this.x + dx, this.y + dy, tiler, entities)){
      this.x += dx; this.y += dy; return true;
    }

    // Try X then Y
    if(dx !== 0 && this._canMoveTo(this.x + dx, this.y, tiler, entities)){
      this.x += dx;
      if(dy !== 0 && this._canMoveTo(this.x, this.y + dy, tiler, entities)){
        this.y += dy; return true;
      }
      return true;
    }

    // Try Y then X
    if(dy !== 0 && this._canMoveTo(this.x, this.y + dy, tiler, entities)){
      this.y += dy;
      if(dx !== 0 && this._canMoveTo(this.x + dx, this.y, tiler, entities)){
        this.x += dx; return true;
      }
      return true;
    }

    // As a last resort, try small stepped movement to nudge around corners
    const steps = 4;
    let moved = false;
    for(let i=1;i<=steps;i++){
      const sx = dx * (i/steps);
      const sy = dy * (i/steps);
      if(this._canMoveTo(this.x + sx, this.y + sy, tiler, entities)){
        this.x += sx; this.y += sy; moved = true; // apply first small step that fits
        break;
      }
    }
    return moved;
  }

  _canMoveTo(nx, ny, tiler, entities){
    if(!this.hasCollision) return true;
    const nb = { x: nx, y: ny, w: this.widthTiles * this.tileSize, h: this.heightTiles * this.tileSize };
    // tile collision
    if(tiler && tiler.map){
      // Prevent leaving map bounds
      const ts = this.tileSize;
      const mapPxW = tiler.map.width * ts;
      const mapPxH = tiler.map.height * ts;
      if(nb.x < 0 || nb.y < 0 || (nb.x + nb.w) > mapPxW || (nb.y + nb.h) > mapPxH){
        return false;
      }
      const startX = Math.floor(nb.x / ts);
      const startY = Math.floor(nb.y / ts);
      const endX = Math.floor((nb.x + nb.w - 1) / ts);
      const endY = Math.floor((nb.y + nb.h - 1) / ts);
      for(let y = startY; y <= endY; y++){
        for(let x = startX; x <= endX; x++){
          for(let l = 0; l < tiler.map.layers; l++){
            const tile = tiler.getTile(x,y,l);
            if(!tile) continue;
            const def = tiler.variants && tiler.variants[tile.variant] ? tiler.variants[tile.variant] : { type: tile.type || 'flat' };
            if(def.type === 'full'){
              return false;
            }
          }
        }
      }
    }

    // entity collision
    if(entities && entities.length){
      for(const e of entities){
        if(e === this) continue;
        if(!e.hasCollision) continue;
        const eb = e.getBounds();
        if(rectsIntersect(nb, eb)) return false;
      }
    }
    return true;
  }

  update(dt, tiler, entities){
    // base entity does nothing
  }

  draw(ctx, viewport){
    // base entity draws a magenta rectangle for debug
    const vpScale = viewport ? viewport.scale : 1;
    const screenX = (this.x * vpScale) - (viewport ? viewport.x : 0);
    const screenY = (this.y * vpScale) - (viewport ? viewport.y : 0);
    const w = this.widthTiles * this.tileSize * vpScale;
    const h = this.heightTiles * this.tileSize * vpScale;
    ctx.save();
    ctx.strokeStyle = 'magenta';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 0.5, screenY + 0.5, w, h);
    ctx.restore();
  }
}

function rectsIntersect(a,b){
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}
