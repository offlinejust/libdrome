// MapGen.js — простой генератор карт, использующий MapTiler
import EntitySpawner from './EntitySpawner.js';

export default class MapGen {
  constructor(tiler){
    this.tiler = tiler;
  }

  // Генерирует простую карту: базовый плоский слой (трава), вода и камни
  // Возвращает объект карты, совместимый с MapTiler.createEmptyMap
  generateBasic(width = 200, height = 120, layers = 2, opts = {}){
    const map = this.tiler.createEmptyMap(width, height, layers);

    // Опции
    const waterChance = opts.waterChance || 0.02; // вероятность начала водного пятна
    const stoneChance = opts.stoneChance || 0.03;
    const logChance = opts.logChance || 0.01;

    // Заполнить базовый слой травой
    for(let y=0;y<height;y++){
      for(let x=0;x<width;x++){
        map.data[0][y][x] = { type: 'flat', variant: 'grass' };
      }
    }

    // Добавить случайные водоёмы и камни на верхнем слое
    for(let y=0;y<height;y++){
      for(let x=0;x<width;x++){
        // вода
        if(Math.random() < waterChance){
          this._floodFill(map, x, y, 'water', Math.floor(3 + Math.random() * 6));
        }
        // камни
        if(Math.random() < stoneChance){
          const l = Math.floor(Math.random() * layers);
          map.data[l][y][x] = { type: 'full', variant: 'stone' };
        }
        // бревна
        if(Math.random() < logChance){
          const l = Math.floor(Math.random() * layers);
          map.data[l][y][x] = { type: 'full', variant: 'log' };
        }
      }
    }

    // entities array attached to map
    map.entities = [];

    // spawn entities via EntitySpawner (separated module)
    try{
      const spawner = new EntitySpawner(this.tiler);
      const slimeCount = opts.slimeCount || 10;
      const slimes = spawner.spawnSlimes(map, slimeCount);
      for(const s of slimes) map.entities.push(s);
    }catch(e){
      console.warn('EntitySpawner failed, skipping entity spawn', e);
    }

    return map;
  }

  // Небольшой flood-fill для создания пятен воды
  _floodFill(map, sx, sy, variant, size){
    const w = map.width, h = map.height, layers = map.layers;
    const q = [[sx,sy]];
    const visited = new Set();
    while(q.length && size-- > 0){
      const [x,y] = q.shift();
      const key = x+','+y;
      if(visited.has(key)) continue;
      visited.add(key);
      if(x < 0 || x >= w || y < 0 || y >= h) continue;
      // пишем на базовый слой (0)
      map.data[0][y][x] = { type: 'flat', variant };
      // добавляем соседей с небольшой вероятностью
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for(const d of dirs){
        if(Math.random() < 0.6) q.push([x + d[0], y + d[1]]);
      }
    }
  }
}
