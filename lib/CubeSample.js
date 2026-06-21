// CubeSample.js — модуль, экспортирующий класс для 3D-куба
// Модуль не выполняет код автоматически — это класс, соответствующий правилам модулей.
export default class CubeSample {
  constructor(size = 150, color = 'rgba(0,150,255,0.9)'){
    this.size = size;
    this.color = color;
    this.angleX = 0;
    this.angleY = 0;
    this.angleZ = 0;
    this.speed = 0.6; // оборотов в секунду

    const s = size / 2;
    this.vertices = [
      [-s, -s, -s], [ s, -s, -s], [-s,  s, -s], [ s,  s, -s],
      [-s, -s,  s], [ s, -s,  s], [-s,  s,  s], [ s,  s,  s]
    ];
    this.edges = [
      [0,1],[1,3],[3,2],[2,0], // back
      [4,5],[5,7],[7,6],[6,4], // front
      [0,4],[1,5],[2,6],[3,7]  // connections
    ];
  }

  // Угол в радианах
  _rotate(v, ax, ay, az){
    let [x,y,z] = v;
    // rotate X
    let cos = Math.cos(ax), sin = Math.sin(ax);
    let y1 = y * cos - z * sin;
    let z1 = y * sin + z * cos;
    y = y1; z = z1;
    // rotate Y
    cos = Math.cos(ay); sin = Math.sin(ay);
    let x1 = x * cos + z * sin;
    z1 = -x * sin + z * cos;
    x = x1; z = z1;
    // rotate Z
    cos = Math.cos(az); sin = Math.sin(az);
    x1 = x * cos - y * sin;
    y1 = x * sin + y * cos;
    x = x1; y = y1;
    return [x,y,z];
  }

  update(dt){
    // dt в миллисекундах
    const t = dt / 1000;
    const twoPi = Math.PI * 2;
    const rot = this.speed * twoPi * t;
    this.angleX += rot * 0.3;
    this.angleY += rot * 0.6;
    this.angleZ += rot * 0.4;
  }

  // Возвращает массив проекций вершин: [{x,y,z,visible}]
  _projectAll(cx, cy){
    const fov = 600;
    const dist = 400;
    const pts = [];
    for(const v of this.vertices){
      const [x,y,z] = this._rotate(v, this.angleX, this.angleY, this.angleZ);
      const z2 = z + dist;
      const k = fov / (fov + z2);
      pts.push({x: cx + x * k, y: cy + y * k, z: z2});
    }
    return pts;
  }

  draw(ctx){
    if(!ctx) return;
    const canvas = ctx.canvas;
    const cx = canvas.width / (2 * (window.devicePixelRatio||1));
    const cy = canvas.height / (2 * (window.devicePixelRatio||1));
    const pts = this._projectAll(cx, cy);

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.fillStyle = this.color;

    // Draw faces (simple painter's algorithm by average z)
    const faces = [
      [0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]
    ];
    const faceList = faces.map(f=>({idx:f, z: (pts[f[0]].z+pts[f[1]].z+pts[f[2]].z+pts[f[3]].z)/4}));
    faceList.sort((a,b)=>b.z - a.z);
    for(const face of faceList){
      ctx.beginPath();
      const f = face.idx;
      ctx.moveTo(pts[f[0]].x, pts[f[0]].y);
      for(let i=1;i<f.length;i++) ctx.lineTo(pts[f[i]].x, pts[f[i]].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw edges
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    for(const e of this.edges){
      const a = pts[e[0]], b = pts[e[1]];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}
