import * as PIXI from 'pixi.js';

const VERSION = 'v0.2.0';

// ---------- Helpers ----------
const clamp = (v:number, min:number, max:number) => Math.max(min, Math.min(max, v));
const dist2 = (a:{x:number,y:number}, b:{x:number,y:number}) => {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx*dx + dy*dy;
};

type SaveShape = {
  credits: number;
  cargoMax: number;
  hp: number;
  sector: string;
};

const SAVE_KEY = 'spacetrader_ts_v020';
const readSave = (): SaveShape | null => {
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) as SaveShape : null;
  }catch{ return null; }
};
const writeSave = (s: SaveShape) => {
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }catch{}
};

// ---------- HUD ----------
const hud = {
  v: document.getElementById('v')!,
  hp: document.getElementById('hp')!,
  cargo: document.getElementById('cargo')!,
  credits: document.getElementById('credits')!,
  target: document.getElementById('target')!,
  sector: document.getElementById('sector')!,
  autosave: document.getElementById('autosave')!,
  dock: document.getElementById('dock')! as HTMLDivElement,
  sell: document.getElementById('sell')! as HTMLButtonElement,
  cargoUp: document.getElementById('cargoUp')! as HTMLButtonElement,
  repair: document.getElementById('repair')! as HTMLButtonElement,
  undock: document.getElementById('undock')! as HTMLButtonElement,
  dockInfo: document.getElementById('dockInfo')!,
};

hud.v.textContent = VERSION;

// ---------- App ----------
const app = new PIXI.Application({
  resizeTo: window,
  background: '#050812',
  antialias: true,
});
document.body.appendChild(app.view as HTMLCanvasElement);

type Asteroid = PIXI.Graphics & { userData: { r:number; hp:number; ore:number } };
type ShipState = {
  x:number; y:number; vx:number; vy:number; angle:number;
  thrustLevel:1|2|3; hp:number; cargo:number; cargoMax:number; miningRate:number;
}
const state = {
  sectorName: 'Alpha',
  credits: 0,
  time: 0,
  docked: false,
  keys: {} as Record<string, boolean>,
  asteroids: [] as Asteroid[],
  station: null as PIXI.Graphics | null,
  player: {
    x: -100, y: 60, vx: 0, vy: 0, angle: 0,
    thrustLevel: 1, hp: 100, cargo: 0, cargoMax: 30, miningRate: 4
  } as ShipState,
};

// Try restore
const sv = readSave();
if (sv){
  state.credits = sv.credits ?? 0;
  state.player.cargoMax = sv.cargoMax ?? 30;
  state.player.hp = sv.hp ?? 100;
  state.sectorName = sv.sector ?? 'Alpha';
}

// ---------- Scene ----------
const world = new PIXI.Container();
app.stage.addChild(world);

// stars
const starLayer = new PIXI.Container();
world.addChild(starLayer);
for (let i=0; i<400; i++){
  const g = new PIXI.Graphics();
  const r = Math.random()*1.5 + 0.5;
  g.beginFill(0x89a3ff, Math.random()*0.8+0.2);
  g.drawCircle(0,0,r);
  g.endFill();
  g.x = (Math.random()*4000)-2000;
  g.y = (Math.random()*4000)-2000;
  starLayer.addChild(g);
}

// player
const ship = new PIXI.Graphics();
function drawShip(){
  ship.clear();
  ship.lineStyle(1, 0x7fb7ff, 1);
  ship.beginFill(0x1a8cff, 0.35);
  ship.moveTo(16,0);
  ship.lineTo(-12,10);
  ship.lineTo(-8,0);
  ship.lineTo(-12,-10);
  ship.closePath();
  ship.endFill();
}
drawShip();
world.addChild(ship);

// station
const station = new PIXI.Graphics();
station.beginFill(0x5b6b88,0.6);
station.lineStyle(2,0xaad1ff,1);
station.drawRoundedRect(-80,-50,160,100,14);
station.endFill();
world.addChild(station);
state.station = station;
station.x = 300;
station.y = -150;

// asteroids
function spawnAsteroid(x:number,y:number,size=1){
  const g = new PIXI.Graphics() as Asteroid;
  const col = 0x6f798a;
  g.beginFill(col, 0.9);
  g.lineStyle(1, 0x9fb0cc, 0.6);
  const r = size * (16 + Math.random()*18);
  const sides = 7 + Math.floor(Math.random()*4);
  g.moveTo(Math.cos(0)*r, Math.sin(0)*r);
  for (let i=1;i<=sides;i++){
    const a = i * (Math.PI*2 / sides);
    const rr = r * (0.7 + Math.random()*0.5);
    g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr);
  }
  g.endFill();
  g.x = x; g.y = y;
  g.rotation = Math.random()*Math.PI;
  g.userData = { r, hp: r*0.8, ore: Math.ceil(r/3) };
  world.addChild(g);
  state.asteroids.push(g);
}
for (let i=0;i<22;i++){
  spawnAsteroid((Math.random()*3000)-1500, (Math.random()*3000)-1500, (Math.random()*1.2)+0.6);
}

// ---------- Input ----------
window.addEventListener('keydown', (e)=>{
  state.keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') e.preventDefault();
  if (e.key.toLowerCase() === 'e'){
    if (!state.docked && canDock()) doDock();
    else if (state.docked) doUndock();
  }
});
window.addEventListener('keyup', (e)=>{
  state.keys[e.key.toLowerCase()] = false;
  if (e.key === ' ') e.preventDefault();
  if (e.key === '1') state.player.thrustLevel = 1;
  if (e.key === '2') state.player.thrustLevel = 2;
  if (e.key === '3') state.player.thrustLevel = 3;
});

// ---------- Economy ----------
function orePrice(){
  const base = 20;
  const t = Math.sin(state.time * 0.0005) * 5;
  return Math.max(5, Math.round(base + t));
}

// ---------- Docking ----------
function canDock(){
  if (!state.station) return false;
  return dist2(ship, state.station) < 150*150;
}
function doDock(){
  state.docked = true;
  state.player.vx = state.player.vy = 0;
  (hud.dock as HTMLDivElement).style.display = 'block';

  hud.sell.onclick = () => {
    const sold = Math.floor(state.player.cargo);
    const price = orePrice();
    const gain = sold * price;
    state.credits += gain;
    state.player.cargo = 0;
    hud.dockInfo.textContent = `Verkauft: ${sold} Erz für ${gain}₵ (Preis ${price}₵/Stk)`;
    updateHUD(); autoSave();
  };
  hud.cargoUp.onclick = () => {
    if (state.credits >= 1000){
      state.credits -= 1000;
      state.player.cargoMax += 10;
      updateHUD(); autoSave();
    }
  };
  hud.repair.onclick = () => {
    if (state.credits >= 200){
      state.credits -= 200;
      state.player.hp = 100;
      updateHUD(); autoSave();
    }
  };
  hud.undock.onclick = () => doUndock();
}
function doUndock(){
  state.docked = false;
  (hud.dock as HTMLDivElement).style.display = 'none';
}

// ---------- Update ----------
function update(dt:number){
  state.time += dt;

  if (!state.docked){
    const spd = 100 + (state.player.thrustLevel-1)*70;
    const acc = (state.keys['w']||state.keys['arrowup']) ? 1 : 0;
    const dec = (state.keys['s']||state.keys['arrowdown']) ? 1 : 0;
    const turnL = (state.keys['a']||state.keys['arrowleft']) ? 1 : 0;
    const turnR = (state.keys['d']||state.keys['arrowright']) ? 1 : 0;

    state.player.angle += (turnR - turnL) * dt * 0.003 * (1 + state.player.thrustLevel*0.2);
    const rot = state.player.angle;
    ship.rotation = rot;

    const thrust = (acc - dec) * spd * 0.0035;
    state.player.vx += Math.cos(rot) * thrust;
    state.player.vy += Math.sin(rot) * thrust;
    state.player.vx *= 0.992;
    state.player.vy *= 0.992;
    state.player.x += state.player.vx * dt * 0.06;
    state.player.y += state.player.vy * dt * 0.06;
    ship.x = state.player.x;
    ship.y = state.player.y;

    // mining
    if (state.keys[' ']){
      let mined = 0;
      const range2 = 140*140;
      for (const a of state.asteroids){
        if (!a.userData || a.userData.hp<=0) continue;
        if (dist2(a, ship) < range2){
          const rate = state.player.miningRate * dt/1000;
          a.userData.hp -= rate*3;
          mined += rate;
          if (a.userData.hp <= 0){
            state.player.cargo = Math.min(state.player.cargoMax, state.player.cargo + Math.ceil(a.userData.ore*0.5));
            a.userData.ore = 0;
            a.visible = false;
          }
        }
      }
      if (mined>0){
        state.player.cargo = Math.min(state.player.cargoMax, state.player.cargo + mined);
      }
    }
  }

  station.rotation += dt*0.00005;
  updateHUD();
}

function updateHUD(){
  hud.hp.textContent = String(Math.round(state.player.hp));
  hud.cargo.textContent = `${Math.floor(state.player.cargo)}/${state.player.cargoMax}`;
  hud.credits.textContent = String(Math.floor(state.credits));
  hud.target.textContent = state.docked ? 'Station' : (canDock() ? 'Station (E andocken)' : '—');
  hud.sector.textContent = state.sectorName;
}

function autoSave(){
  writeSave({
    credits: state.credits,
    cargoMax: state.player.cargoMax,
    hp: state.player.hp,
    sector: state.sectorName,
  });
  hud.autosave.textContent = 'an ✓';
  setTimeout(()=> hud.autosave.textContent = 'an', 1200);
}

let last = performance.now();
app.ticker.add(()=>{
  const now = performance.now();
  const dt = now - last; last = now;
  update(dt);
});

// init
updateHUD();
autoSave();
