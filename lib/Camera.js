// Camera.js — класс управления положением и зумом камеры
export default class Camera {
  constructor(canvas, map, tileSize = 32){
    this.canvas = canvas;
    this.map = map; // map object from MapTiler.createEmptyMap
    this.tileSize = tileSize;

    this.scale = 1.0; // zoom
    this.x = 0; // world pixel coordinate (unscaled) at top-left
    this.y = 0;

    this.minScale = 0.25;
    this.maxScale = 4.0;

    this.keys = new Set();

    // Increase baseSpeed: normal movement should equal previous shifted speed
    this.baseSpeed = 900; // pixels per second (was 300)
    this.fastMultiplier = 3.0; // shifted speed = base * fastMultiplier

    this.inputEnabled = true; // allow disabling camera input (used when player controls the viewport)
    this._bindHandlers();
  }

  _bindHandlers(){
    if(this.canvas){
      this.canvas.addEventListener('wheel', this._onWheel.bind(this), {passive:false});
    }
    window.addEventListener('keydown', (e)=>{ this.keys.add(e.code); });
    window.addEventListener('keyup', (e)=>{ this.keys.delete(e.code); });
  }

  _onWheel(e){
    if(!this.inputEnabled) return; // ignore wheel when input disabled
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left; // CSS pixels
    const sy = e.clientY - rect.top;

    const beforeWorldX = this.x + sx / this.scale;
    const beforeWorldY = this.y + sy / this.scale;

    // smooth zoom factor
    const zoomFactor = Math.exp(-e.deltaY * 0.0015);
    let newScale = this.scale * zoomFactor;
    newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));

    this.scale = newScale;

    // adjust camera.x/y so that the world point under cursor remains fixed
    this.x = beforeWorldX - sx / this.scale;
    this.y = beforeWorldY - sy / this.scale;

    this._clamp();
  }

  setInputEnabled(v){ this.inputEnabled = !!v; }

  // Zoom centered on a world coordinate (world pixels)
  zoomAt(worldX, worldY, deltaY){
    // deltaY similar to wheel event
    const beforeWorldX = worldX;
    const beforeWorldY = worldY;
    const zoomFactor = Math.exp(-deltaY * 0.0015);
    let newScale = this.scale * zoomFactor;
    newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
    this.scale = newScale;
    // adjust camera.x/y so that the world point remains fixed on screen
    // screen coords of point: sx = (beforeWorldX - this.x) * this.scale
    // after change: this.x = beforeWorldX - sx / this.scale
    // rearrange: preserve that beforeWorldX stays under same screen position -> compute offset based on center
    // We'll keep the world point at same location relative to viewport origin
    // So simply set x,y so that beforeWorldX is at same position: x = beforeWorldX - ( (beforeWorldX - this.x) * (this.scale / (this.scale)) ) => simplified by keeping center
    // Simpler approach: keep camera.x such that the world point remains at same pixel offset from viewport origin
    const sx = (beforeWorldX - this.x) * this.scale;
    const sy = (beforeWorldY - this.y) * this.scale;
    this.x = beforeWorldX - sx / this.scale;
    this.y = beforeWorldY - sy / this.scale;
    this._clamp();
  }

  // Clamp camera to world bounds
  _clamp(){
    if(!this.map) return;
    const worldW = this.map.width * this.tileSize;
    const worldH = this.map.height * this.tileSize;
    const viewW = (this.canvas.width / (window.devicePixelRatio || 1)) / this.scale;
    const viewH = (this.canvas.height / (window.devicePixelRatio || 1)) / this.scale;

    this.x = Math.max(0, Math.min(this.x, Math.max(0, worldW - viewW)));
    this.y = Math.max(0, Math.min(this.y, Math.max(0, worldH - viewH)));
  }

  // Возвращает viewport, подходящий для MapTiler.draw
  getViewport(){
    const dpr = window.devicePixelRatio || 1;
    const cw = this.canvas.width / dpr;
    const ch = this.canvas.height / dpr;
    return { x: this.x * this.scale, y: this.y * this.scale, width: cw, height: ch, scale: this.scale };
  }

  update(dt){
    // dt in milliseconds
    const t = dt / 1000;
    let speed = this.baseSpeed;
    if(this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) speed *= this.fastMultiplier;

    let dx = 0, dy = 0;
    if(this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy -= 1;
    if(this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy += 1;
    if(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx -= 1;
    if(this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx += 1;

    if(dx !== 0 || dy !== 0){
      const len = Math.hypot(dx,dy) || 1;
      dx = (dx / len) * speed * t;
      dy = (dy / len) * speed * t;
      // movement in world pixels (unscaled)
      this.x += dx;
      this.y += dy;
      this._clamp();
    }
  }
}
