// MapTiler.js — базовый класс для отрисовки двухмерной многослойной карты
// Экспортирует класс `MapTiler`, который хранит карту в виде слоёв тайлов

const DEFAULT_VARIANTS = {
  grass: { type: 'flat', color: '#6bbf59' },
  water: { type: 'flat', color: '#4aa3d8' },
  stone: { type: 'full', color: '#9ea3a8' },
  log:   { type: 'full', color: '#8b5a2b' },
  sand:  { type: 'flat', color: '#e5d29f' }
};

export default class MapTiler {
  constructor(tileSize = 32, variants = DEFAULT_VARIANTS){
    this.tileSize = tileSize;
    this.variants = Object.assign({}, variants);
    this.map = null; // структура карты, см. createEmptyMap
  }

  // Создаёт пустую карту и возвращает объект карты
  // map = { width, height, layers, data: [layer0, layer1, ...] }
  // где layer = Array(height) -> Array(width) элемента (tile|null)
  createEmptyMap(width, height, layers = 2){
    const data = new Array(layers);
    for(let l=0;l<layers;l++){
      const layer = new Array(height);
      for(let y=0;y<height;y++){
        const row = new Array(width).fill(null);
        layer[y] = row;
      }
      data[l] = layer;
    }
    return { width, height, layers, data };
  }

  // Загружает карту в tiler
  loadMap(map){
    this.map = map;
  }

  // Возвращает tile-объект или null
  getTile(x, y, layer = 0){
    if(!this.map) return null;
    if(layer < 0 || layer >= this.map.layers) return null;
    if(x < 0 || x >= this.map.width) return null;
    if(y < 0 || y >= this.map.height) return null;
    return this.map.data[layer][y][x];
  }

  // Устанавливает тайл (tile может быть null)
  setTile(x, y, layer, tile){
    if(!this.map) return false;
    if(layer < 0 || layer >= this.map.layers) return false;
    if(x < 0 || x >= this.map.width) return false;
    if(y < 0 || y >= this.map.height) return false;
    this.map.data[layer][y][x] = tile;
    return true;
  }

  // Регистрация нового варианта тайла
  registerVariant(name, spec){
    this.variants[name] = Object.assign({}, spec);
  }

  // Простой рендер карты в переданном контексте
  // viewport = { x, y, width, height, scale }
  // координаты и размеры в пикселях канваса; по умолчанию рисует весь холст
  draw(ctx, viewport = null){
    if(!ctx || !this.map) return;
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;

    const vp = Object.assign({ x: 0, y: 0, width: cw, height: ch, scale: 1 }, viewport || {});

    const ts = this.tileSize * vp.scale;

    // determine visible tile range
    const startX = Math.floor(vp.x / ts);
    const startY = Math.floor(vp.y / ts);
    const endX = Math.ceil((vp.x + vp.width) / ts);
    const endY = Math.ceil((vp.y + vp.height) / ts);

    ctx.save();

    for(let l=0;l<this.map.layers;l++){
      for(let y=Math.max(0,startY); y<Math.min(this.map.height,endY); y++){
        for(let x=Math.max(0,startX); x<Math.min(this.map.width,endX); x++){
          const tile = this.getTile(x,y,l);
          if(!tile) continue;
          const px = x * ts - vp.x;
          const py = y * ts - vp.y;
          this._drawTile(ctx, tile, px, py, ts, l);
        }
      }
    }

    ctx.restore();
  }

  // Внутренний рисовальщик одного тайла
  _drawTile(ctx, tile, px, py, size, layer){
    const def = this.variants[tile.variant] || { type: tile.type || 'flat', color: '#ff00ff' };
    if(def.type === 'flat'){
      ctx.fillStyle = def.color;
      ctx.fillRect(px, py, size, size);
    } else {
      // full tile — нарисуем с небольшой 3D-подсказкой: основа + тень
      ctx.fillStyle = def.color;
      ctx.fillRect(px, py, size, size);
      // simple top highlight
      ctx.fillStyle = this._shade(def.color, 1.1);
      ctx.fillRect(px, py, size, Math.max(2, size * 0.15));
      // outline
      ctx.strokeStyle = this._shade(def.color, 0.8);
      ctx.lineWidth = Math.max(1, size * 0.03);
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
    }
  }

  // Простая функция затемнения/осветления hex-цвета
  _shade(hex, factor){
    // hex like #rrggbb
    const c = hex.replace('#','');
    const r = parseInt(c.substr(0,2),16);
    const g = parseInt(c.substr(2,2),16);
    const b = parseInt(c.substr(4,2),16);
    const nr = Math.min(255, Math.max(0, Math.floor(r * factor)));
    const ng = Math.min(255, Math.max(0, Math.floor(g * factor)));
    const nb = Math.min(255, Math.max(0, Math.floor(b * factor)));
    return '#' + nr.toString(16).padStart(2,'0') + ng.toString(16).padStart(2,'0') + nb.toString(16).padStart(2,'0');
  }
}
