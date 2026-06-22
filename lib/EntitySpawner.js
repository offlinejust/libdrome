// EntitySpawner.js — модуль для спавна сущностей на карте
import EntitySlimeSample from './EntitySlimeSample.js';

export default class EntitySpawner {
  constructor(tiler){
    this.tiler = tiler;
  }

  // Спавнит до count слайм-сэмплов на карте. Возвращает массив созданных сущностей.
  // Условие спавна: тайловая область 3x3 на базовом слое должна быть полностью плоской (flat).
  spawnSlimes(map, count = 10){
    if(!map || !this.tiler) return [];
    const width = map.width;
    const height = map.height;
    const placed = [];
    const maxAttempts = count * 80;
    let attempts = 0;

    while(placed.length < count && attempts < maxAttempts){
      attempts++;
      const sx = Math.floor(Math.random() * (width - 2)); // top-left of 3x3
      const sy = Math.floor(Math.random() * (height - 2));

      if(!this._is3x3Flat(map, sx, sy)) continue;

      // choose a top-left position for 2x2 slime inside the 3x3 area
      const ox = (Math.random() < 0.5) ? 0 : 1; // either sx or sx+1
      const oy = (Math.random() < 0.5) ? 0 : 1;
      const tx = sx + ox;
      const ty = sy + oy;

      // final sanity: ensure 2x2 area still flat
      let ok = true;
      for(let yy = ty; yy <= ty+1; yy++){
        for(let xx = tx; xx <= tx+1; xx++){
          // base layer must be flat
          const base = map.data[0][yy][xx];
          if(!base){ ok = false; break; }
          const baseDef = this.tiler.variants[base.variant] || { type: base.type || 'flat' };
          if(baseDef.type !== 'flat'){ ok = false; break; }
          // ensure no 'full' tiles on any other layer at this position
          for(let l = 1; l < map.layers; l++){
            const t = this.tiler.getTile(xx, yy, l);
            if(!t) continue;
            const def = this.tiler.variants[t.variant] || { type: t.type || 'flat' };
            if(def.type === 'full'){ ok = false; break; }
          }
          if(!ok) break;
        }
        if(!ok) break;
      }
      if(!ok) continue;

      const px = tx * this.tiler.tileSize;
      const py = ty * this.tiler.tileSize;
      const slime = new EntitySlimeSample({ x: px, y: py, tileSize: this.tiler.tileSize });

      // Cheap spawn-time stuck check: if initial bbox collides, try small nudges
      const ts = this.tiler.tileSize;
      const nudges = [
        [0,0], [Math.floor(ts/4),0], [-Math.floor(ts/4),0], [0,Math.floor(ts/4)], [0,-Math.floor(ts/4)],
        [Math.floor(ts/2),0], [-Math.floor(ts/2),0], [0,Math.floor(ts/2)], [0,-Math.floor(ts/2)]
      ];
      const existing = Array.isArray(map.entities) ? map.entities.concat(placed) : placed.slice();
      let placedOk = false;
      for(const n of nudges){
        const nx = px + n[0];
        const ny = py + n[1];
        if(slime._canMoveTo(nx, ny, this.tiler, existing)){
          slime.x = nx; slime.y = ny;
          placed.push(slime);
          placedOk = true;
          break;
        }
      }
      if(!placedOk) {
        // give up on this spawn
        continue;
      }
    }

    return placed;
  }

  _is3x3Flat(map, sx, sy){
    // check bounds
    if(sx < 0 || sy < 0) return false;
    if(sx + 2 >= map.width || sy + 2 >= map.height) return false;
    for(let y = sy; y <= sy+2; y++){
      for(let x = sx; x <= sx+2; x++){
        // base layer must exist and be flat
        const base = map.data[0][y][x];
        if(!base) return false;
        const baseDef = this.tiler.variants[base.variant] || { type: base.type || 'flat' };
        if(baseDef.type !== 'flat') return false;
        // ensure no full tiles on any layer at this cell
        for(let l = 1; l < map.layers; l++){
          const t = this.tiler.getTile(x, y, l);
          if(!t) continue;
          const def = this.tiler.variants[t.variant] || { type: t.type || 'flat' };
          if(def.type === 'full') return false;
        }
      }
    }
    return true;
  }
}
