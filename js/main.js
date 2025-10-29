// T2D — X4 Lite (Browser) v0.1.0
// Keine Installation: läuft via CDN. Upload auf GitHub Pages genügt.
// MVP: Flug, Mining an Asteroiden, Station andocken, Verkaufen, Upgrades, Autosave.
// Author: Juni (Lead Programmer/Designer) & Michi

const VERSION = "v0.1.0";

// ------------------ Helpers ------------------
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const dist2 = (a, b) => {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx*dx + dy*dy;
};
const aimAt = (from, to) => Math.atan2(to.y - from.y, to.x - from.x);

const saveKey = "t2d_x4_save_v010";

function loadSave() {
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function writeSave(state) {
  try {
    localStorage.setItem(saveKey, JSON.stringify({
      credits: state.credits,
      cargoMax: state.player.cargoMax,
      hp: state.player.hp,
      sector: state.sectorName,
    }));
  } catch (e) {}
}

// ------------------ Game State ------------------
const app = new PIXI.Application({
  resizeTo: window,
  background: "#050812",
  antialias: true,
});
document.body.appendChild(app.view);

const state = {
  sectorName: "Alpha",
  credits: 0,
  time: 0,
  mining: false,
  docked: false,
  keys: {},
  asteroids: [],
  bullets: [],
  station: null,
  player: {
    x: 0, y: 0,
    vx: 0, vy: 0,
    angle: 0,
    thrust: 0,
    thrustLevel: 1, // 1..3
    hp: 100,
    cargo: 0,
    cargoMax: 30,
    miningRate: 4, // Erz/s
  }
};

// Try restore
const sv = loadSave();
if (sv) {
  state.credits = sv.credits ?? 0;
  state.player.cargoMax = sv.cargoMax ?? 30;
  state.player.hp = sv.hp ?? 100;
  state.sectorName = sv.sector ?? "Alpha";
}

// ------------------ Scene ------------------
const world = new PIXI.Container();
app.stage.addChild(world);

// Background stars
const starLayer = new PIXI.Container();
world.addChild(starLayer);
for (let i=0;i<400;i++){
  const g = new PIXI.Graphics();
  const r = Math.random() * 1.5 + 0.5;
  g.beginFill(0x89a3ff, Math.random()*0.8+0.2);
  g.drawCircle(0,0,r);
  g.endFill();
  g.x = (Math.random()*4000)-2000;
  g.y = (Math.random()*4000)-2000;
  starLayer.addChild(g);
}

// Player ship
const ship = new PIXI.Graphics();
function drawShip() {
  ship.clear();
  ship.lineStyle(1, 0x7fb7ff, 1);
  ship.beginFill(0x1a8cff, 0.35);
  ship.moveTo(16, 0);
  ship.lineTo(-12, 10);
  ship.lineTo(-8, 0);
  ship.lineTo(-12, -10);
  ship.closePath();
  ship.endFill();
}
drawShip();
world.addChild(ship);

// Station
const station = new PIXI.Graphics();
station.beginFill(0x5b6b88,0.6);
station.lineStyle(2,0xaad1ff,1);
station.drawRoundedRect(-80,-50,160,100,14);
station.endFill();
world.addChild(station);
state.station = station;
station.x = 300;
station.y = -150;

// Asteroids
function spawnAsteroid(x,y,size=1) {
  const g = new PIXI.Graphics();
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

// ------------------ Camera ------------------
const camera = { x:0, y:0, zoom:1 };
function updateCamera() {
  camera.x = ship.x - app.renderer.width/2;
  camera.y = ship.y - app.renderer.height/2;
  world.x = -camera.x;
  world.y = -camera.y;
}

// ------------------ Input ------------------
window.addEventListener("keydown", (e)=>{
  state.keys[e.key.toLowerCase()] = true;
  if (e.key === " "){ state.mining = true; e.preventDefault(); }
  if (e.key.toLowerCase() === "m"){ document.getElementById("miniMap").classList.toggle("hidden"); }
  if (e.key === "1") state.player.thrustLevel = 1;
  if (e.key === "2") state.player.thrustLevel = 2;
  if (e.key === "3") state.player.thrustLevel = 3;
  if (e.key.toLowerCase() === "e"){
    if (!state.docked && canDock()){
      doDock();
    } else if (state.docked){
      doUndock();
    }
  }
});
window.addEventListener("keyup", (e)=>{
  state.keys[e.key.toLowerCase()] = false;
  if (e.key === " "){ state.mining = false; e.preventDefault(); }
});

// ------------------ UI ------------------
const ui = {
  version: document.getElementById("version"),
  hp: document.getElementById("hp"),
  cargo: document.getElementById("cargo"),
  credits: document.getElementById("credits"),
  target: document.getElementById("target"),
  sector: document.getElementById("sector"),
  autosave: document.getElementById("autosave"),
  dockPanel: document.getElementById("dockPanel"),
  sellBtn: document.getElementById("sellOre"),
  sellInfo: document.getElementById("sellInfo"),
  upgradeCargo: document.getElementById("upgradeCargo"),
  repairShip: document.getElementById("repairShip"),
  undock: document.getElementById("undock"),
  minimap: document.getElementById("miniMap"),
};

ui.version.textContent = VERSION;
ui.sector.textContent = state.sectorName;

ui.sellBtn.addEventListener("click", ()=>{
  const price = getOrePrice();
  const sold = state.player.cargo;
  const gain = sold * price;
  state.credits += gain;
  state.player.cargo = 0;
  ui.sellInfo.textContent = `Verkauft: ${sold} Erz für ${gain}₵ (Preis: ${price}₵/Stk)`;
  updateHUD();
  autoSave();
});

ui.upgradeCargo.addEventListener("click", ()=>{
  if (state.credits >= 1000){
    state.credits -= 1000;
    state.player.cargoMax += 10;
    updateHUD();
    autoSave();
  }
});

ui.repairShip.addEventListener("click", ()=>{
  if (state.credits >= 200){
    state.credits -= 200;
    state.player.hp = 100;
    updateHUD();
    autoSave();
  }
});

ui.undock.addEventListener("click", doUndock);

function showDockPanel(b){
  ui.dockPanel.classList.toggle("hidden", !b);
  ui.sellInfo.textContent = "";
}

// ------------------ Economy ------------------
function getOrePrice(){
  // einfache, dynamische Preisspanne (inspiriert durch Angebot/Nachfrage)
  const base = 20;
  const t = Math.sin(state.time * 0.0005) * 5;
  return Math.max(5, Math.round(base + t));
}

// ------------------ Docking ------------------
function canDock(){
  const d2 = dist2(ship, station);
  return d2 < 150*150;
}
function doDock(){
  state.docked = true;
  state.player.vx = state.player.vy = 0;
  showDockPanel(true);
}
function doUndock(){
  state.docked = false;
  showDockPanel(false);
}

// ------------------ Update Loop ------------------
function update(dt){
  state.time += dt;

  if (!state.docked){
    const spd = 100 + (state.player.thrustLevel-1)*70;
    const acc = (state.keys["w"]||state.keys["arrowup"]) ? 1 : 0;
    const dec = (state.keys["s"]||state.keys["arrowdown"]) ? 1 : 0;
    const turnL = (state.keys["a"]||state.keys["arrowleft"]) ? 1 : 0;
    const turnR = (state.keys["d"]||state.keys["arrowright"]) ? 1 : 0;

    // rotate
    state.player.angle += (turnR - turnL) * dt * 0.003 * (1 + state.player.thrustLevel*0.2);
    ship.rotation = state.player.angle;

    // thrust
    const thrust = (acc - dec) * spd * 0.0035;
    state.player.vx += Math.cos(state.player.angle) * thrust;
    state.player.vy += Math.sin(state.player.angle) * thrust;

    // damping
    state.player.vx *= 0.992;
    state.player.vy *= 0.992;

    // integrate
    state.player.x += state.player.vx * dt * 0.06;
    state.player.y += state.player.vy * dt * 0.06;

    ship.x = state.player.x;
    ship.y = state.player.y;

    // mining
    if (state.mining){
      let mined = 0;
      const range2 = 140*140;
      for (const a of state.asteroids){
        if (!a.userData || a.userData.hp<=0) continue;
        if (dist2(a, ship) < range2){
          const rate = state.player.miningRate * dt/1000; // per second
          a.userData.hp -= rate*3;
          mined += rate;
          // small visual spark
          if (Math.random()<0.25){
            a.alpha = 0.85 + Math.random()*0.15;
            setTimeout(()=>{ a.alpha=1; },50);
          }
          if (a.userData.hp <= 0){
            // break → small chunks (not implemented visually, but reward extra ore)
            state.player.cargo = Math.min(state.player.cargoMax, state.player.cargo + Math.ceil(a.userData.ore*0.5));
            a.userData.ore = 0;
            a.visible = false;
          }
        }
      }
      if (mined > 0){
        state.player.cargo = Math.min(state.player.cargoMax, state.player.cargo + mined);
      }
    }
  }

  // Station gentle spin
  station.rotation += dt*0.00005;

  // Update HUD
  updateHUD();
  updateCamera();
  updateMinimap();
}

function updateHUD(){
  ui.hp.textContent = Math.round(state.player.hp);
  ui.cargo.textContent = `${Math.floor(state.player.cargo)}/${state.player.cargoMax}`;
  ui.credits.textContent = Math.floor(state.credits);
  ui.target.textContent = state.docked ? "Station" : (canDock() ? "Station (E andocken)" : "—");
  ui.sector.textContent = state.sectorName;
}

function updateMinimap(){
  const el = ui.minimap;
  if (el.classList.contains("hidden")) return;
  const sx = Math.floor((state.player.x)/10);
  const sy = Math.floor((state.player.y)/10);
  const stx = Math.floor((station.x)/10);
  const sty = Math.floor((station.y)/10);
  el.innerHTML = `<strong>MiniMap</strong><br>
    Du: ${sx}, ${sy}<br>
    Station: ${stx}, ${sty}<br>
    Erz: ${state.asteroids.filter(a=>a.visible).length}`;
}

function autoSave(){
  writeSave(state);
  ui.autosave.textContent = "an ✓";
  setTimeout(()=>{ ui.autosave.textContent = "an"; }, 1200);
}

// ------------------ Ticker ------------------
let last = performance.now();
app.ticker.add(()=>{
  const now = performance.now();
  const dt = now - last; last = now;
  update(dt);
});

// ------------------ Init positions ------------------
state.player.x = -100;
state.player.y = 60;
ship.x = state.player.x;
ship.y = state.player.y;

// Initial HUD + save
updateHUD();
autoSave();

// ------------------ Accessibility notes ------------------
// Pause/blur handling
window.addEventListener("blur", ()=>{ state.mining=false; });
