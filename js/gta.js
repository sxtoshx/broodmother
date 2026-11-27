import * as THREE from './three.min.js';

const CELL = 50, ROAD = 14, N = 6, HALF = N * CELL / 2, EDGE = HALF + ROAD / 2, RIVER = EDGE + 10;
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(.5, .5, 1, 10), SPH = new THREE.SphereGeometry(.5, 8, 6);
const ICO = new THREE.IcosahedronGeometry(.5, 0), CONE = new THREE.ConeGeometry(.5, 1, 7), PYR = new THREE.ConeGeometry(.5, 1, 4);
const rand = (a, b) => a + Math.random() * (b - a), pick = l => l[Math.floor(Math.random() * l.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const line = i => -HALF + i * CELL, V = (x, y, z) => new THREE.Vector3(x, y, z), X = V(1, 0, 0);
const inBlock = v => { const o = (v + HALF) % CELL; return o > ROAD / 2 && o < CELL - ROAD / 2; };
const groundY = (x, z) => Math.abs(x) < HALF && Math.abs(z) < HALF && inBlock(x) && inBlock(z) ? .3 : 0;
const fwd = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), dummy = new THREE.Object3D();
const DEATHS = {
  cop: ['ТЕБЯ ДОБИЛ МВД ДОБРЯНКИ', 'Участковый доволен. Очнёшься в Добрянской ЦРБ, врачи возьмут 30% золота за бахилы'],
  wall: ['ВЪЕХАЛ В ХРУЩЁВКУ', 'Хрущёвка стоит, ты нет. В ЦРБ возьмут 30% золота за бахилы'],
  kama: ['УТОНУЛ В КАМЕ', 'Выловили рыбаки. 30% золота забрали себе за улов'],
  bust: ['ПРИНЯЛИ', 'Low priority: 5 игр. МВД конфискует 20% золота и шнурки. Аегис от ментов не спасает']
};
const STREAK = { 2: 'DOUBLE KILL', 3: 'TRIPLE KILL', 4: 'ULTRA KILL', 5: 'RAMPAGE' };
const WEATHER = [
  { icon: '🌇', name: 'Ясно', t: [8, 22], fog: [70, 320], light: 1, grip: 9 },
  { icon: '🌧️', name: 'Дождь', t: [3, 12], fog: [45, 230], light: .7, grip: 6, rain: 1 },
  { icon: '⛈️', name: 'Гроза', t: [6, 15], fog: [40, 200], light: .55, grip: 5.5, rain: 1.4, storm: true },
  { icon: '🌨️', name: 'Снег', t: [-14, -2], fog: [35, 190], light: .85, grip: 3.5, snow: true },
  { icon: '🌫️', name: 'Туман', t: [0, 8], fog: [12, 110], light: .8, grip: 8 }
];
const WANTED = [['photo_pudge', 'Pudge'], ['photo_invoker', 'Invoker'], ['photo_monkey', 'Monkey King'], ['photo_brew', 'Брюмастер'], ['photo_pango', 'Пангольер'], ['photo_qop', 'Квопа'], ['photo_bat', 'Батрайдер'], ['photo_cm', 'Crystal Maiden']];
const SHOPS = ['РАЗЛИВНОЕ', 'ЦВЕТЫ 24', 'СЕМЕЧКИ', 'ОПТИКА «ТРИАДА»', 'ВСЁ ПО 228', 'ПИВО 24'];
const GUNS = {
  pm: { name: 'Макаров', dmg: 34, rate: .32, range: 45, cone: .45, ammo: 24, price: 500, refill: 24 },
  sg: { name: 'Обрез', dmg: 70, rate: .85, range: 20, cone: .7, ammo: 10, price: 1200, refill: 10, spread: 4 },
  ak: { name: 'Калаш', dmg: 22, rate: .1, range: 55, cone: .35, ammo: 90, price: 2500, refill: 60 }
};
const GOAL = 13370;
const SHOPDEF = {
  shawarma: { sign: 'ШАУРМА 24', color: '#ff4fb8', icon: '🌯', title: 'Шаурма 24', sub: 'Мы не знаем, что внутри. И ты не узнаешь' },
  tire: { sign: 'ШИНОМОНТАЖ', color: '#3a6cf4', icon: '🔧', title: 'Шиномонтаж «У Палыча»', sub: 'Поставим движок от комбайна, без вопросов' },
  crypto: { sign: 'КАЗИНО «КРИПТА»', color: '#1f8a5a', icon: '🎰', title: 'Казино «Крипта обмен»', sub: 'Курс бирки к рублю 1 к 1337. Ставь всё, Триада одобряет' },
  pawn: { sign: 'ЛОМБАРД', color: '#d4a017', icon: '🚗', title: 'Ломбард', sub: 'Тачки с историей. Историю не рассказываем' },
  guns: { sign: 'ОХОТА И РЫБАЛКА', color: '#6b4f2a', icon: '🔫', title: 'Охота и рыбалка', sub: 'Лицензия? Какая лицензия. Ты же из Добрянки' },
  pharmacy: { sign: 'АПТЕКА', color: '#1f9a6a', icon: '💊', title: 'Аптека «Здоровье Добрянки»', sub: 'Фармацевт смотрит поверх очков и уже всё понял' },
  strip: { sign: 'СТРИПУХА «ПАУТИНА»', color: '#ff2fa8', icon: '💃', title: 'Стрипуха «Паутина»', sub: 'Бруда на шесте, Пудж на подтанцовке. Руками не трогать, только золото' },
  race: { color: '#ffffff', icon: '🏁', title: 'Гран-при Добрянки', sub: '10 экипажей МВД против тебя. Правила? Какие правила' },
  mvd: { color: '#2a6bff', icon: '🚔', title: 'МВД Добрянки', sub: 'Дежурный жуёт беляш и смотрит на тебя как на прописку' }
};

function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(sx, sy, sz));
}

class Batch {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; }
  add(geo, color, matrix) {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(matrix), a = g.attributes, c = new THREE.Color(color);
    for (let i = 0; i < a.position.count; i++) {
      this.p.push(a.position.getX(i), a.position.getY(i), a.position.getZ(i));
      this.n.push(a.normal.getX(i), a.normal.getY(i), a.normal.getZ(i));
      this.u.push(a.uv.getX(i), a.uv.getY(i));
      this.c.push(c.r, c.g, c.b);
    }
    return this;
  }
  limb(color, a, b, t) {
    const d = V(0, 0, 0).subVectors(b, a), len = d.length();
    return this.add(BOX, color, new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(X, d.normalize()), V(len, t, t)));
  }
  walls(x, z, w, d, h, y0, S) {
    const c = [[x - w / 2, z + d / 2], [x + w / 2, z + d / 2], [x + w / 2, z - d / 2], [x - w / 2, z - d / 2]];
    for (let k = 0; k < 4; k++) {
      const [x0, z0] = c[k], [x1, z1] = c[(k + 1) % 4], len = Math.hypot(x1 - x0, z1 - z0);
      const P = [[x0, y0, z0], [x1, y0, z1], [x1, y0 + h, z1], [x0, y0 + h, z0]], U = [[0, 0], [len / S, 0], [len / S, h / S], [0, h / S]];
      for (const i of [0, 1, 2, 0, 2, 3]) { this.p.push(...P[i]); this.n.push(-(z1 - z0) / len, 0, (x1 - x0) / len); this.u.push(...U[i]); this.c.push(1, 1, 1); }
    }
    return this;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return g;
  }
}

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texture(c, repeat) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function fitText(x, text, cx, cy, maxW, size, weight) {
  x.font = `${weight} ${size}px Georgia,serif`;
  const w = x.measureText(text).width;
  if (w > maxW) x.font = `${weight} ${size * maxW / w}px Georgia,serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, cx, cy);
}
function windows(wall) {
  const base = canvas(128, 128), glow = canvas(128, 128), b = base.getContext('2d'), g = glow.getContext('2d');
  b.fillStyle = wall; b.fillRect(0, 0, 128, 128); g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const lit = Math.random() < .32, x = i * 32 + 8, y = j * 32 + 7;
    b.fillStyle = lit ? '#ffd27a' : '#2b3350'; b.fillRect(x, y, 16, 18);
    b.fillStyle = 'rgba(0,0,0,.28)'; b.fillRect(x - 2, y + 18, 20, 3);
    if (lit) { g.fillStyle = '#ffb347'; g.fillRect(x, y, 16, 18); }
  }
  return new THREE.MeshLambertMaterial({ map: texture(base, true), emissive: '#ffffff', emissiveMap: texture(glow, true), emissiveIntensity: .9 });
}
function label(text, w, h, bg, fg) {
  const c = canvas(512, Math.round(512 * h / w)), x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  x.fillStyle = fg; fitText(x, text, c.width / 2, c.height / 2, c.width * .9, c.height * .62, 900);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture(c), transparent: !bg }));
}
function poster(file, name) {
  const c = canvas(256, 340), x = c.getContext('2d'), t = texture(c);
  const draw = img => {
    x.fillStyle = '#efe3c2'; x.fillRect(0, 0, 256, 340);
    x.fillStyle = '#2a1a10'; fitText(x, 'РАЗЫСКИВАЕТСЯ', 128, 32, 230, 30, 900);
    x.fillStyle = '#3b2a1e'; x.fillRect(26, 54, 204, 204);
    if (img) { const s = Math.min(img.width, img.height); x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 28, 56, 200, 200); }
    x.fillStyle = '#2a1a10'; fitText(x, name, 128, 285, 230, 26, 900);
    fitText(x, 'награда 1337 золота · МВД Добрянки', 128, 318, 230, 15, 700);
    t.needsUpdate = true;
  };
  draw();
  const img = new Image(); img.onload = () => draw(img); img.src = `img/${file}.webp`;
  return new THREE.Mesh(new THREE.PlaneGeometry(6, 8), new THREE.MeshBasicMaterial({ map: t }));
}
function carGeo(body, stripe) {
  const b = new Batch();
  b.add(BOX, body, M(0, .78, 0, 0, 0, 0, 2.1, .72, 4.4));
  b.add(BOX, '#1d1b2a', M(0, 1.4, -.25, 0, 0, 0, 1.86, .6, 2.2));
  b.add(BOX, body, M(0, 1.74, -.25, 0, 0, 0, 1.9, .1, 2.05));
  if (stripe) b.add(BOX, stripe, M(0, .86, 0, 0, 0, 0, 2.14, .24, 4.2));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) b.add(CYL, '#111', M(sx * 1.02, .42, sz * 1.38, 0, 0, Math.PI / 2, .84, .3, .84));
    b.add(BOX, '#fff6b0', M(sx * .68, .86, 2.21, 0, 0, 0, .46, .22, .06));
    b.add(BOX, '#ff2030', M(sx * .68, .86, -2.21, 0, 0, 0, .46, .2, .06));
  }
  return b.geometry();
}
function spiderGeo() {
  const b = new Batch();
  b.add(SPH, '#1a1020', M(0, .78, -.6, 0, 0, 0, 1.25, 1, 1.45));
  b.add(SPH, '#ff4fb8', M(0, 1.22, -.62, 0, 0, 0, .5, .22, .7));
  b.add(SPH, '#241428', M(0, .7, .35, 0, 0, 0, .75, .65, .75));
  for (const s of [-1, 1]) {
    b.add(SPH, '#ff2040', M(s * .14, .82, .68, 0, 0, 0, .13, .13, .13));
    for (let k = 0; k < 4; k++) {
      const fan = (1.5 - k) * .45, hip = V(s * .3, .72, .25 - k * .22);
      const knee = hip.clone().add(V(s * Math.cos(fan) * .9, .5, Math.sin(fan) * .9)), foot = knee.clone().add(V(s * Math.cos(fan) * .8, -1.22, Math.sin(fan) * .8));
      b.limb('#120a14', hip, knee, .1).limb('#120a14', knee, foot, .08);
    }
  }
  return b.geometry();
}
function limbMesh(mat, color, w, h, d) {
  return new THREE.Mesh(new Batch().add(BOX, color, M(0, -h / 2, 0, 0, 0, 0, w, h, d)).geometry(), mat);
}
function person(mat, c) {
  const body = new Batch(), mesh = new THREE.Group(), legs = [], arms = [];
  body.add(BOX, c.top, M(0, 1.35, 0, 0, 0, 0, .8, .9, .45));
  body.add(BOX, c.stripe, M(0, 1.35, .23, 0, 0, 0, .12, .9, .02));
  body.add(BOX, c.skin, M(0, 2.05, 0, 0, 0, 0, .45, .45, .45));
  body.add(BOX, c.hat, M(0, 2.33, .02, 0, 0, 0, .52, .14, .54));
  body.add(BOX, c.hat, M(0, 2.29, .34, 0, 0, 0, .46, .05, .22));
  mesh.add(new THREE.Mesh(body.geometry(), mat));
  for (const s of [-1, 1]) {
    const leg = limbMesh(mat, c.legs, .3, .9, .3), arm = limbMesh(mat, c.top, .22, .8, .22);
    leg.position.set(s * .2, .9, 0); arm.position.set(s * .52, 1.78, 0);
    mesh.add(leg, arm); legs.push(leg); arms.push(arm);
  }
  return { mesh, legs, arms };
}
function cartGeo() {
  const b = new Batch();
  b.add(BOX, '#7a4a26', M(0, 1, -.2, 0, 0, 0, 2, .3, 3.4));
  for (const s of [-1, 1]) {
    b.add(BOX, '#5e3819', M(s * .95, 1.45, -.2, 0, 0, 0, .12, .7, 3.4));
    b.add(CYL, '#3b2a1a', M(s * 1.15, .95, -.3, 0, 0, Math.PI / 2, 1.9, .22, 1.9));
    b.add(BOX, '#5e3819', M(s * .5, 1.05, 2.2, 0, 0, 0, .12, .12, 2.2));
  }
  b.add(BOX, '#5e3819', M(0, 1.45, -1.85, 0, 0, 0, 2, .7, .12));
  b.add(BOX, '#ff8a2a', M(0, 2.1, .6, 0, 0, 0, .5, .6, .5));
  b.add(BOX, '#ffd24a', M(0, 2.55, .6, 0, .7, 0, .3, .4, .3));
  return b.geometry();
}
function uazGeo() {
  const b = new Batch();
  b.add(BOX, '#cfc8ad', M(0, 1.4, 0, 0, 0, 0, 2.1, 1.9, 4.3));
  b.add(BOX, '#1d1b2a', M(0, 1.9, .2, 0, 0, 0, 2.14, .55, 3.6));
  b.add(BOX, '#1e4fa3', M(0, 1.05, 0, 0, 0, 0, 2.14, .25, 4.32));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) b.add(CYL, '#111', M(sx * 1.02, .45, sz * 1.4, 0, 0, Math.PI / 2, .9, .3, .9));
    b.add(BOX, '#fff6b0', M(sx * .7, 1, 2.16, 0, 0, 0, .4, .3, .06));
  }
  return b.geometry();
}
function gopnik(b, x, z, suit) {
  b.add(BOX, suit, M(x, 1.2, z + .05, -.25, 0, 0, .7, .8, .42));
  b.add(BOX, '#e3b08c', M(x, 1.78, z - .12, 0, 0, 0, .42, .42, .42));
  b.add(BOX, '#0d0d0d', M(x, 2.04, z - .12, 0, 0, 0, .48, .12, .5));
  b.add(BOX, '#0d0d0d', M(x, 2, z - .42, 0, 0, 0, .42, .05, .22));
  for (const s of [-1, 1]) {
    const hip = V(x + s * .18, .78, z), knee = V(x + s * .22, .98, z - .6), foot = V(x + s * .22, .14, z - .52);
    b.limb(suit, hip, knee, .3).limb(suit, knee, foot, .26).limb(suit, V(x + s * .42, 1.5, z), V(x + s * .3, 1.05, z - .62), .2);
    b.add(BOX, '#f2f2f2', M(x + s * .22, .1, z - .62, 0, 0, 0, .3, .16, .42));
  }
}
function statue(b, x, y, z, k) {
  const c = '#7d6a4a', P = (px, py, pz) => V(x + px * k, y + py * k, z + pz * k);
  b.add(BOX, c, M(x, y + 1.15 * k, z, 0, 0, 0, .9 * k, 1.1 * k, .5 * k));
  b.add(BOX, c, M(x, y + .55 * k, z, 0, 0, 0, .95 * k, .5 * k, .55 * k));
  b.add(BOX, c, M(x, y + 2 * k, z, 0, 0, 0, .5 * k, .55 * k, .5 * k));
  b.add(BOX, c, M(x, y + 2.32 * k, z + .05 * k, 0, 0, 0, .56 * k, .12 * k, .56 * k));
  b.add(BOX, c, M(x, y + 2.28 * k, z + .32 * k, 0, 0, 0, .5 * k, .05 * k, .25 * k));
  b.limb(c, P(-.22, .5, 0), P(-.25, 0, .05), .26 * k).limb(c, P(.22, .5, 0), P(.28, 0, -.05), .26 * k);
  b.limb(c, P(.5, 1.6, 0), P(.75, 2.3, .9), .2 * k).limb(c, P(-.5, 1.6, 0), P(-.55, 1.05, .35), .2 * k);
  b.add(BOX, '#5f4f37', M(x - .45 * k, y + k, z + .5 * k, -.3, 0, 0, .8 * k, .06 * k, .3 * k));
}
function pudgeGeo() {
  const b = new Batch(), skin = '#c98a8a';
  b.add(SPH, skin, M(0, 1.5, 0, 0, 0, 0, 2.2, 2.2, 1.9));
  b.add(SPH, skin, M(0, 2.75, .1, 0, 0, 0, .9, .8, .9));
  b.add(BOX, '#5a3a2a', M(0, 1, 0, 0, 0, 0, 2.1, .5, 1.8));
  for (const s of [-1, 1]) {
    b.add(BOX, '#5a3a2a', M(s * .5, .35, 0, 0, 0, 0, .5, .7, .5));
    b.limb(skin, V(s * 1, 2.1, 0), V(s * 1.5, 3.1, .2), .35);
  }
  b.add(BOX, '#7a7a80', M(1.5, 3.4, .2, 0, 0, .4, .12, .6, .12));
  return b.geometry();
}
function sportGeo(body, stripe) {
  const b = new Batch();
  b.add(BOX, body, M(0, .62, 0, 0, 0, 0, 2.3, .5, 4.7));
  b.add(BOX, body, M(0, .86, 1.3, -.12, 0, 0, 2.2, .22, 1.9));
  b.add(BOX, '#141420', M(0, 1.08, -.35, 0, 0, 0, 1.8, .46, 1.7));
  b.add(BOX, stripe, M(0, 1.33, -.35, 0, 0, 0, .45, .02, 1.7));
  b.add(BOX, stripe, M(0, .88, .3, 0, 0, 0, .45, .02, 4.3));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) b.add(CYL, '#111', M(sx * 1.12, .46, sz * 1.5, 0, 0, Math.PI / 2, .96, .38, .96));
    b.add(BOX, '#222', M(sx * .7, 1.2, -2.1, 0, 0, 0, .1, .5, .1));
    b.add(BOX, '#fff6b0', M(sx * .72, .74, 2.36, 0, 0, 0, .5, .14, .06));
    b.add(BOX, '#ff2030', M(sx * .72, .78, -2.36, 0, 0, 0, .5, .14, .06));
  }
  b.add(BOX, body, M(0, 1.48, -2.1, 0, 0, 0, 2.2, .08, .55));
  return b.geometry();
}
function courierGeo() {
  const b = new Batch();
  b.add(BOX, '#8a6a4a', M(0, 1.2, 0, 0, 0, 0, .9, .8, 1.7));
  b.add(BOX, '#8a6a4a', M(0, 1.72, .95, -.6, 0, 0, .42, .45, .8));
  b.add(BOX, '#6e5238', M(0, 1.98, 1.36, 0, 0, 0, .42, .4, .62));
  for (const s of [-1, 1]) {
    b.add(BOX, '#6e5238', M(s * .14, 2.38, 1.2, 0, 0, s * .25, .1, .45, .14));
    b.add(BOX, '#d4b24a', M(s * .6, 1.28, -.1, 0, 0, 0, .3, .6, .7));
    for (const z of [-.6, .6]) b.add(BOX, '#5a4330', M(s * .3, .45, z, 0, 0, 0, .2, .9, .2));
  }
  b.add(BOX, '#5a4330', M(0, 1.3, -.95, .6, 0, 0, .1, .6, .1));
  return b.geometry();
}

function city(scene) {
  const solid = new Batch(), boxes = [], smoke = [], doors = [], blocks = [];
  const styles = ['#a3a3ab', '#c8b08c', '#d78fb4', '#79b8b3', '#b9a0d6'].map(c => ({ batch: new Batch(), mat: windows(c) }));
  const mvd = { batch: new Batch(), mat: windows('#e6ebf2') };
  styles.push(mvd);
  const solidMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const box = (x0, x1, z0, z1, h = 999) => boxes.push({ x0, x1, z0, z1, h });
  const building = (x, z, w, d, h, style = pick(styles.slice(0, 5))) => {
    style.batch.walls(x, z, w, d, h, .3, 12);
    solid.add(BOX, '#4a4452', M(x, h + .45, z, 0, 0, 0, w + .3, .3, d + .3));
    box(x - w / 2, x + w / 2, z - d / 2, z + d / 2, h + .6);
  };
  const tree = (x, z, solidOne) => {
    const birch = Math.random() < .55;
    solid.add(CYL, birch ? '#e9e4d6' : '#5a3d2b', M(x, 2, z, 0, 0, 0, .35, 4, .35));
    if (birch) solid.add(ICO, pick(['#4f8a3a', '#6aa042', '#3f7a3a']), M(x, 5.2, z, 0, rand(0, 3), 0, 3.4, 3.8, 3.4));
    else solid.add(CONE, pick(['#2f5a35', '#264d2e']), M(x, 5.5, z, 0, rand(0, 3), 0, 3.6, 6.5, 3.6));
    if (solidOne) box(x - .4, x + .4, z - .4, z + .4, 3);
  };
  const add = (mesh, x, y, z, ry = 0) => { mesh.position.set(x, y, z); mesh.rotation.y = ry; scene.add(mesh); return mesh; };
  const parked = [];
  const posters = WANTED.slice().sort(() => Math.random() - .5).slice(0, 6);
  const special = { '0,0': 'gres', '3,2': 'mvd', '1,4': 'statue', '5,3': 'park', '1,1': 'shawarma', '4,4': 'tire', '2,5': 'crypto', '5,1': 'pawn', '3,0': 'guns', '4,2': 'pharmacy', '0,3': 'strip' };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const cx = line(i) + CELL / 2, cz = line(j) + CELL / 2, B = CELL - ROAD, type = special[i + ',' + j];
    solid.add(BOX, '#8e8898', M(cx, .15, cz, 0, 0, 0, B, .3, B));
    blocks.push({ cx, cz, type });
    if (SHOPDEF[type] && SHOPDEF[type].sign) {
      const def = SHOPDEF[type];
      building(cx, cz - 2, 14, 14, pick([27, 33]));
      building(cx - 11, cz + 11, 9, 7, 4);
      add(label(def.sign, 8, 1.5, def.color, '#fff'), cx - 11, 3.5, cz + 14.56);
      building(cx + 11, cz + 11, 9, 7, 4);
      add(label(pick(SHOPS), 8, 1.5, '#5a4a6e', '#fff'), cx + 11, 3.5, cz + 14.56);
      doors.push({ kind: type, x: cx - 11, z: cz + 16.4 });
    } else if (type === 'gres') {
      building(cx + 6, cz, 20, 30, 12, styles[0]);
      add(label('ДОБРЯНСКАЯ ГРЭС', 18, 2.6, '#c0392b', '#fff'), cx + 16.06, 9, cz, Math.PI / 2);
      for (const dz of [-10, 0, 10]) {
        for (let s = 0; s < 7; s++) { const r = 4.8 - s * .26; solid.add(CYL, s % 2 ? '#ececec' : '#c0392b', M(cx - 11, 5 + s * 10, cz + dz, 0, 0, 0, r, 10, r)); }
        box(cx - 13.4, cx - 8.6, cz + dz - 2.4, cz + dz + 2.4, 75);
        for (let k = 0; k < 4; k++) smoke.push({ x: cx - 11, z: cz + dz, phase: k / 4 });
      }
    } else if (type === 'mvd') {
      building(cx, cz - 3, 26, 14, 9, mvd);
      solid.add(BOX, '#1e4fa3', M(cx, 4.6, cz + 4.05, 0, 0, 0, 26.1, 1.2, .1));
      add(label('МВД ДОБРЯНКИ', 16, 2.4, '#1e4fa3', '#fff'), cx, 7.4, cz + 4.12);
      parked.push([cx - 6, cz + 11], [cx + 6, cz + 11]);
      doors.push({ kind: 'mvd', x: cx, z: cz + 7.5 });
    } else if (type === 'statue') {
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; tree(cx + Math.cos(a) * 14, cz + Math.sin(a) * 14, true); }
      solid.add(BOX, '#3a3540', M(cx, .75, cz, 0, 0, 0, 8, .9, 8));
      solid.add(BOX, '#4a4550', M(cx, 2.8, cz, 0, 0, 0, 6, 5, 6));
      statue(solid, cx, 5.3, cz, 3.2);
      add(label('СОЗДАТЕЛЮ ПРОМПТОВ', 5.6, .9, '#2a2530', '#e8d39a'), cx, 3.9, cz + 3.02);
      add(label('ЛЕХЕ ПОПОВУ (POPOV)', 5.6, .8, '#2a2530', '#e8d39a'), cx, 2.9, cz + 3.02);
      box(cx - 4, cx + 4, cz - 4, cz + 4, 32);
    } else if (type === 'park') {
      for (let k = 0; k < 14; k++) tree(cx + rand(-15, 15), cz + rand(-15, 15), true);
    } else {
      const r = Math.random();
      if (r < .4) {
        const along = Math.random() < .5, h = pick([15, 15, 27]);
        for (const o of [-9, 9]) along ? building(cx, cz + o, 30, 10, h) : building(cx + o, cz, 10, 30, h);
      } else if (r < .7) {
        building(cx, cz - 2, 14, 14, pick([27, 33]));
        for (const sx of [-1, 1]) {
          building(cx + sx * 11, cz + 11, 9, 7, 4);
          add(label(pick(SHOPS), 8, 1.5, pick(['#ff4fb8', '#1f8a5a', '#ffd24a', '#3a6cf4']), '#fff'), cx + sx * 11, 3.5, cz + 14.56);
        }
      } else {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const x = cx + sx * 8, z = cz + sz * 8;
          building(x, z, 8, 8, 3.5);
          solid.add(PYR, pick(['#7a2e2e', '#3e5a7a', '#5a7a3e', '#8a5a2e']), M(x, 3.8 + 1.6, z, 0, Math.PI / 4, 0, 12, 3.2, 12));
        }
        tree(cx, cz, true);
      }
      if (posters.length && Math.random() < .45) {
        const [file, name] = posters.pop(), px = cx + rand(-8, 8), pz = cz + 16.4;
        add(poster(file, name), px, 5.6, pz + .12);
        solid.add(BOX, '#2a2430', M(px, 5.6, pz, 0, 0, 0, 6.4, 8.4, .2));
        for (const sx of [-2.6, 2.6]) solid.add(BOX, '#3a3440', M(px + sx, 1, pz, 0, 0, 0, .25, 2, .25));
        box(px - 3.2, px + 3.2, pz - .3, pz + .3, 9.8);
      }
    }
  }
  for (let k = 0; k < 220; k++) {
    const side = Math.random(), far = rand(EDGE + 12, EDGE + 70), along = rand(-EDGE - 70, EDGE + 70);
    if (side < .4) tree(far, along); else if (side < .7) tree(clamp(along, -RIVER + 4, EDGE + 70), far); else tree(clamp(along, -RIVER + 4, EDGE + 70), -far);
  }
  const crews = [];
  for (const b of blocks.filter(b => !b.type).sort(() => Math.random() - .5).slice(0, 3)) {
    const x = b.cx + rand(-6, 6), z = b.cz - 16.3;
    for (const k of [-1, 0, 1]) gopnik(solid, x + k * 1.5, z, k ? '#1a1a24' : '#1e2f7a');
    solid.add(CYL, '#5a3a12', M(x + 2.4, .35, z - .3, 0, 0, 0, .18, .6, .18));
    box(x - 2.6, x + 2.6, z - .9, z + .5, 2.4);
    crews.push({ x, z: z - 1.6 });
  }
  solid.add(BOX, '#b9b2a2', M(-(EDGE + RIVER) / 2, .1, 0, 0, 0, 0, RIVER - EDGE, .2, EDGE * 2 + 160));
  solid.add(ICO, '#3c5a33', M(0, -8, EDGE + 95, 0, 0, 0, 190, 46, 70));
  box(EDGE, EDGE + 80, -EDGE - 80, EDGE + 80);
  box(-RIVER - 80, EDGE + 80, EDGE, EDGE + 80);
  box(-RIVER - 80, EDGE + 80, -EDGE - 80, -EDGE);
  const sign = add(label('ДОБРЯНКА', 90, 15, '', '#f6f1e7'), 0, 22, EDGE + 72, Math.PI);
  sign.material.fog = false;
  scene.add(new THREE.Mesh(solid.geometry(), solidMat));
  for (const s of styles) if (s.batch.p.length) scene.add(new THREE.Mesh(s.batch.geometry(), s.mat));
  const flat = (w, d, color, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat || new THREE.MeshLambertMaterial({ color })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; };
  flat(EDGE * 2, EDGE * 2, '#2f2b38', 0, 0, 0);
  flat(EDGE + 700 + RIVER, 1600, '#2e4728', (EDGE + 700 - RIVER) / 2, -.05, 0);
  flat(700, 1600, null, -RIVER - 350, -.5, 0, new THREE.MeshPhongMaterial({ color: '#35588f', specular: '#ffb070', shininess: 90 }));
  const dashes = [];
  for (let i = 0; i <= N; i++) for (let s = -EDGE; s < EDGE; s += 6) {
    const near = Math.abs(((s + HALF) % CELL + CELL) % CELL - CELL / 2) > CELL / 2 - 9;
    if (!near) dashes.push([line(i), s, 0], [s, line(i), Math.PI / 2]);
  }
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(.25, .02, 2.6), new THREE.MeshBasicMaterial({ color: '#d8d2b8' }), dashes.length);
  dashes.forEach(([x, z, ry], k) => { dummy.position.set(x, .03, z); dummy.rotation.set(0, ry, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); dash.setMatrixAt(k, dummy.matrix); });
  scene.add(dash);
  const puffMat = new THREE.MeshLambertMaterial({ color: '#d9cfe0', transparent: true, opacity: .4, depthWrite: false });
  for (const p of smoke) { p.mesh = new THREE.Mesh(ICO, puffMat); scene.add(p.mesh); }
  return { boxes, smoke, parked, doors, blocks, crews, solidMat };
}

let game;
export function open(site) { (game ||= create()).show(site); }

function create() {
  const renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio < 2, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  const dlg = document.createElement('dialog');
  dlg.id = 'gta'; dlg.tabIndex = -1; dlg.setAttribute('aria-label', 'GTA VI: Добрянка');
  dlg.innerHTML = `<div class="g-hud"><button type="button" class="g-x" aria-label="Выйти на сайт">✕</button><div class="g-stats"><div class="g-wanted" aria-label="Розыск">${'<span>🚨</span>'.repeat(5)}</div><div class="g-gold"></div><div class="g-hp"><i></i></div><div class="g-stam" hidden><i></i></div><div class="g-loot"></div><div class="g-race"></div><div class="g-job"></div><button type="button" class="g-gun" aria-label="Сменить ствол"></button><div class="g-weather"></div></div><div class="g-radio" hidden></div><canvas class="g-map" width="300" height="300" aria-hidden="true"></canvas><div class="g-ann" aria-live="polite"></div><div class="g-hint"></div></div><div class="g-pad"><div><button type="button" data-k="left" aria-label="Влево">◀</button><button type="button" data-k="right" aria-label="Вправо">▶</button></div><div><button type="button" data-k="down">ТОРМОЗ</button><button type="button" class="g-gas" data-k="up">ГАЗ</button></div><button type="button" class="g-act" data-act>ВЫЙТИ</button></div><div class="g-screen"><div></div></div>`;
  dlg.prepend(renderer.domElement);
  document.body.append(dlg);
  const $ = s => dlg.querySelector(s), annEl = $('.g-ann'), hintEl = $('.g-hint'), scr = $('.g-screen'), hud = $('.g-hud');
  const raceEl = $('.g-race'), gunEl = $('.g-gun'), weatherEl = $('.g-weather'), stamEl = $('.g-stam'), downEl = $('[data-k="down"]'), actEl = $('.g-act'), jobEl = $('.g-job'), radio = $('.g-radio'), wantedEl = $('.g-wanted'), stars = [...wantedEl.children], goldEl = $('.g-gold'), hpEl = $('.g-hp i'), lootEl = $('.g-loot');

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(62, 1, .5, 1000);
  scene.fog = new THREE.Fog('#c9527f', 70, 320);
  const hemi = new THREE.HemisphereLight('#ffc2e0', '#3b2244', 1.8);
  scene.add(hemi);
  const sunDir = V(-1, .16, -.35).normalize(), sunLight = new THREE.DirectionalLight('#ffb36b', 2.6);
  sunLight.position.copy(sunDir).multiplyScalar(100); scene.add(sunLight);
  const skyGeo = new THREE.SphereGeometry(800, 24, 48), sp = skyGeo.attributes.position, skyCols = [];
  const stops = [[-1, '#2a1238'], [0, '#ffa060'], [.06, '#f0607c'], [.22, '#8a2f86'], [.55, '#2a1050'], [1, '#0d0620']].map(([e, c]) => [e, new THREE.Color(c)]);
  for (let i = 0; i < sp.count; i++) {
    const e = sp.getY(i) / 800; let k = 1;
    while (k < stops.length - 1 && stops[k][0] < e) k++;
    const c = stops[k - 1][1].clone().lerp(stops[k][1], clamp((e - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0]), 0, 1));
    skyCols.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(skyCols, 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -2; scene.add(sky);
  const sunC = canvas(256, 256), sx = sunC.getContext('2d'), grad = sx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fff3a0'); grad.addColorStop(.6, '#ff8a5c'); grad.addColorStop(1, '#ff3d8a');
  sx.fillStyle = grad; sx.beginPath(); sx.arc(128, 128, 126, 0, 7); sx.fill();
  sx.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 6; k++) sx.fillRect(0, 150 + k * 18, 256, 3 + k * 1.6);
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), new THREE.MeshBasicMaterial({ map: texture(sunC), transparent: true, fog: false, depthWrite: false }));
  sun.renderOrder = -1; scene.add(sun);

  const world = city(scene), boxes = world.boxes, mat = world.solidMat;
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .35, depthWrite: false });
  const shadowGeo = new THREE.CircleGeometry(1.6, 16).rotateX(-Math.PI / 2).scale(1, 1, 1.6);
  const lightMats = [new THREE.MeshBasicMaterial({ color: '#ff2030' }), new THREE.MeshBasicMaterial({ color: '#2a6bff' })];
  const specs = {
    nine: { name: 'девятку', geo: carGeo('#8c1131'), top: 32, armor: 1 },
    cop: { name: 'тачку МВД', geo: carGeo('#f4f4f4', '#1e4fa3'), top: 34, armor: .8, cop: true },
    civ: ['#3a6cf4', '#e8e8e8', '#1f8a5a', '#d4b24a', '#5a2a6e'].map(c => ({ name: 'чужую тачку', geo: carGeo(c), top: 30, armor: 1 })),
    priora: { name: 'белую приору', geo: carGeo('#f2f2f2', '#c9c9c9'), top: 38, armor: 1.1 },
    sport: { name: 'спорткар «Бруда GT»', geo: sportGeo('#ff2fa8', '#ffffff'), top: 46, armor: 1, grip: 3 },
    sport2: { name: 'спорткар «Pis-мастер RS»', geo: sportGeo('#39d353', '#111111'), top: 44, armor: 1, grip: 3 },
    cart: { name: 'телегу Батрайдера', geo: cartGeo(), top: 30, armor: .5 },
    uaz: { name: 'УАЗ МВД', geo: uazGeo(), top: 30, armor: .7, chill: true }
  };
  const car = spec => {
    const mesh = new THREE.Mesh(spec.geo, mat), lights = [];
    mesh.add(new THREE.Mesh(shadowGeo, shadowMat)).children[0].position.y = .05;
    if (spec.cop) for (const k of [0, 1]) { const l = new THREE.Mesh(BOX, lightMats[k]); l.scale.set(.6, .22, .4); l.position.set(k ? .4 : -.4, 1.9, -.25); mesh.add(l); lights.push(l); }
    return { spec, mesh, lights, r: 1.9, m: 1, hp: 100, gunCD: rand(1, 2), pos: V(0, 0, 0), vel: V(0, 0, 0), heading: 0, speed: 0, y: 0, stuck: 0, reverse: 0, wi: -1, wj: -1, pi: -1, pj: -1 };
  };
  const cars = [], homes = [];
  const park = (spec, x, z, heading) => { const c = car(spec); c.home = [x, z, heading]; homes.push(c); scene.add(c.mesh); return c; };
  const myCar = park(specs.nine, 0, 0, 0);
  park(specs.sport2, line(1) + 4.6, line(4) + 10, 0);
  for (const [x, z] of world.parked) park(specs.cop, x, z, 0);
  for (let k = 0; k < 7; k++) { const side = pick([-1, 1]); park(pick(specs.civ), line(Math.floor(rand(0, N + 1))) + side * 4.6, line(Math.floor(rand(0, N))) + CELL / 2 + rand(-12, 12), side > 0 ? 0 : Math.PI); }
  const hero = Object.assign(person(mat, { top: '#ff4fb8', stripe: '#ffffff', skin: '#e8b894', hat: '#151515', legs: '#22222e' }), { spec: { name: 'ты', armor: 1 }, foot: true, r: .6, m: .15, t: 0, pos: V(0, 0, 0), vel: V(0, 0, 0), heading: 0, speed: 0, y: 0 });
  const doors = world.doors, crews = world.crews, ringGeo = new THREE.CylinderGeometry(1.7, 1.7, 1, 28, 1, true);
  const iconSprite = emoji => {
    const c = canvas(128, 128), x = c.getContext('2d');
    x.font = '96px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, 64, 70);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture(c), depthWrite: false }));
    sp.scale.set(2.4, 2.4, 1); scene.add(sp); return sp;
  };
  const ring = color => { const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false })); scene.add(r); return r; };
  for (const d of doors) { d.ring = ring(SHOPDEF[d.kind].color); d.icon = iconSprite(SHOPDEF[d.kind].icon); d.y = groundY(d.x, d.z); d.ring.position.set(d.x, d.y + .5, d.z); }
  for (const c of crews) { c.icon = iconSprite('🗣️'); c.y = .3; c.pos = V(c.x, .3, c.z); }
  const gres = world.blocks.find(b => b.type === 'gres'), drop = { x: gres.cx + 22, z: gres.cz, y: 0, ring: ring('#ffd24a'), icon: iconSprite('📦') };
  drop.ring.position.set(drop.x, .5, drop.z); drop.ring.scale.set(1.8, 1, 1.8);
  const beat = Object.assign(person(mat, { top: '#2b3f6b', stripe: '#c9a64a', skin: '#e3b08c', hat: '#1e2f5a', legs: '#1e2f5a' }), { foot: true, r: .55, m: .15, t: 0, pos: V(0, 0, 0), vel: V(0, 0, 0), heading: 0, speed: 0, y: 0, active: false, cd: 0, wi: -1, wj: -1, pi: -1, pj: -1 });
  beat.mesh.visible = false; scene.add(beat.mesh);
  const PN = 1400, drops = new Float32Array(PN * 3), rainPos = new Float32Array(PN * 6), snowPos = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { drops[i * 3] = rand(-35, 35); drops[i * 3 + 1] = rand(-10, 25); drops[i * 3 + 2] = rand(-35, 35); }
  const rainGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const snowGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const rainMesh = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#a9bfe0', transparent: true, opacity: .55, fog: false }));
  const snowMesh = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: '#ffffff', size: .3, transparent: true, opacity: .9 }));
  rainMesh.frustumCulled = snowMesh.frustumCulled = false; scene.add(rainMesh, snowMesh);
  let weather = WEATHER[0], temp = 15, flash = 0, boltAt = 0, grip = 9, stamina = 1;
  const wrapc = (v, c, h) => c + ((((v - c + h) % (2 * h)) + 2 * h) % (2 * h)) - h;
  function setWeather() {
    weather = pick(WEATHER); temp = Math.round(rand(weather.t[0], weather.t[1])); grip = weather.grip;
    scene.fog.near = weather.fog[0]; scene.fog.far = weather.fog[1];
    sky.material.color.setScalar(weather.light); sun.material.opacity = weather.light > .9 ? 1 : .3;
    boltAt = now + rand(3, 8);
  }
  function weatherStep(dt) {
    rainMesh.visible = !!weather.rain && zone === 'city'; snowMesh.visible = !!weather.snow && zone === 'city';
    if (zone === 'inside' && room) {
      for (const f of room.anim) f(dt);
      for (const r of room.rings) r.ring.material.opacity = .35 + Math.sin(now * 4) * .15;
      if (room.kind === 'strip' && ac && now > beatAt) { beatAt = now + .46; kick(); }
    }
    const c = camera.position, fall = weather.snow ? 2.2 : 36 * (weather.rain || 0);
    if (weather.rain || weather.snow) for (let i = 0; i < PN; i++) {
      const k = i * 3;
      drops[k + 1] -= fall * dt;
      if (drops[k + 1] < c.y - 12) drops[k + 1] += 36;
      if (drops[k + 1] > c.y + 24) drops[k + 1] -= 36;
      if (weather.snow) drops[k] += Math.sin(now + i) * .6 * dt;
      const x = drops[k] = wrapc(drops[k], c.x, 35), z = drops[k + 2] = wrapc(drops[k + 2], c.z, 35), y = drops[k + 1];
      if (weather.snow) { snowPos[k] = x; snowPos[k + 1] = y; snowPos[k + 2] = z; }
      else { const j = i * 6; rainPos[j] = x; rainPos[j + 1] = y; rainPos[j + 2] = z; rainPos[j + 3] = x + .12; rainPos[j + 4] = y + 1.1; rainPos[j + 5] = z + .08; }
    }
    if (weather.rain) rainGeo.attributes.position.needsUpdate = true;
    if (weather.snow) snowGeo.attributes.position.needsUpdate = true;
    if (weather.storm && now > boltAt) { boltAt = now + rand(5, 12); flash = 1; play('thunder', .8, rand(.85, 1.1)) || noise(1.6, 120, .6, 'lowpass'); }
    flash = Math.max(0, flash - dt * 3);
    hemi.intensity = 1.8 * weather.light + flash * 4; sunLight.intensity = 2.6 * weather.light;
  }
  const heroGun = new THREE.Mesh(new Batch().add(BOX, '#1a1a1a', M(0, -.75, .18, 0, 0, 0, .12, .2, .5)).geometry(), mat);
  heroGun.visible = false; hero.arms[0].add(heroGun);
  const tracers = [];
  for (let i = 0; i < 12; i++) {
    const line = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)), new THREE.LineBasicMaterial({ color: '#ffe9a0', fog: false }));
    line.frustumCulled = false; line.visible = false; scene.add(line); tracers.push({ line, t: 0 });
  }
  function tracer(a, b, color) {
    const tr = tracers.find(t => t.t <= 0) || tracers[0], p = tr.line.geometry.attributes.position;
    p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true;
    tr.line.material.color.set(color); tr.line.visible = true; tr.t = .07;
  }
  const heroShadow = new THREE.Mesh(new THREE.CircleGeometry(.7, 12).rotateX(-Math.PI / 2), shadowMat);
  heroShadow.position.y = .05; hero.mesh.add(heroShadow); hero.mesh.visible = false; scene.add(hero.mesh);
  let player = myCar;
  const crowdKinds = [{ kind: 'spider', count: 26, geo: spiderGeo(), walk: 2.4, run: 6.5, size: 1.35 }, { kind: 'courier', count: 2, geo: courierGeo(), walk: 3.5, run: 9.5, size: 1.2 }];
  const crowd = [];
  for (const k of crowdKinds) {
    k.mesh = new THREE.InstancedMesh(k.geo, mat, k.count); k.mesh.frustumCulled = false; scene.add(k.mesh);
    for (let i = 0; i < k.count; i++) crowd.push({ k, i, pos: V(0, 0, 0), vel: V(0, 0, 0), heading: rand(0, 6.3), t: rand(0, 9), seed: rand(0, 9), dead: false, respawn: 0 });
  }
  const rooms = {}, ROOM_KINDS = ['shawarma', 'tire', 'crypto', 'pawn', 'guns', 'pharmacy', 'mvd', 'strip'];
  const neonMat = color => new THREE.MeshBasicMaterial({ color });
  ROOM_KINDS.forEach((kind, k) => {
    const ox = 2000 + k * 60, oz = 2000, W = 12, D = 9, H = 6, b = new Batch(), def = SHOPDEF[kind], anim = [];
    const pal = { shawarma: ['#7a5a3a', '#e8c890'], tire: ['#3a3a3e', '#7a7a80'], crypto: ['#3a1030', '#5a1a4a'], pawn: ['#5a4a3a', '#8a7a60'], guns: ['#4a3a2a', '#5e4a32'], pharmacy: ['#c9d3ce', '#f2f5f3'], mvd: ['#6a6a5a', '#c8c8b0'], strip: ['#1a0a1a', '#2a0a2a'] }[kind];
    const bx = (x0, x1, z0, z1, h = 9) => boxes.push({ x0: ox + x0, x1: ox + x1, z0: oz + z0, z1: oz + z1, h });
    const at = (mesh, x, y, z, ry = 0) => { mesh.position.set(ox + x, y, oz + z); mesh.rotation.y = ry; scene.add(mesh); return mesh; };
    b.add(BOX, pal[0], M(ox, -.1, oz, 0, 0, 0, W * 2, .2, D * 2));
    b.add(BOX, pal[1], M(ox, H, oz, 0, 0, 0, W * 2, .2, D * 2));
    b.add(BOX, pal[1], M(ox - W, H / 2, oz, 0, 0, 0, .4, H, D * 2)); b.add(BOX, pal[1], M(ox + W, H / 2, oz, 0, 0, 0, .4, H, D * 2));
    b.add(BOX, pal[1], M(ox, H / 2, oz + D, 0, 0, 0, W * 2, H, .4)); b.add(BOX, pal[1], M(ox, H / 2, oz - D, 0, 0, 0, W * 2, H, .4));
    b.add(BOX, '#3a2a1a', M(ox, 1.4, oz - D + .25, 0, 0, 0, 2.2, 2.8, .1));
    bx(-W - 1, -W + .2, -D - 1, D + 1); bx(W - .2, W + 1, -D - 1, D + 1); bx(-W - 1, W + 1, D - .2, D + 1); bx(-W - 1, W + 1, -D - 1, -D + .2);
    const rings = [{ act: 'exit', x: ox, z: oz - 6.8, ring: ring('#8fd0ff') }];
    if (kind === 'strip') {
      b.add(CYL, '#3a0a3a', M(ox, .3, oz + 3, 0, 0, 0, 8, .6, 8));
      b.add(CYL, '#d0d0e0', M(ox, 3.3, oz + 3, 0, 0, 0, .3, 6, .3));
      b.add(BOX, '#3a1a2a', M(ox - 9, .55, oz - 2, 0, 0, 0, 1.2, 1.1, 8)); bx(-9.6, -8.4, -6, 2, 1.2);
      bx(-4, 4, -1, 7, 1.2);
      for (const [c, z] of [['#ff2fa8', D - .3], ['#2ff0ff', -D + .3]]) at(new THREE.Mesh(BOX, neonMat(c)), 0, 5.6, z).scale.set(W * 2 - 1, .12, .12);
      at(new THREE.Mesh(BOX, neonMat('#ff2fa8')), -W + .3, 5.6, 0).scale.set(.12, .12, D * 2 - 1);
      at(new THREE.Mesh(BOX, neonMat('#2ff0ff')), W - .3, 5.6, 0).scale.set(.12, .12, D * 2 - 1);
      const spider = at(new THREE.Mesh(crowdKinds[0].geo, mat), 0, .6, 3), pudge = at(new THREE.Mesh(pudgeGeo(), mat), 0, .6, 3);
      const beams = [0, 1, 2].map(i => { const m = at(new THREE.Mesh(CONE, new THREE.MeshBasicMaterial({ color: ['#ff2fa8', '#2ff0ff', '#ffd24a'][i], transparent: true, opacity: .14, depthWrite: false, blending: THREE.AdditiveBlending })), 0, 3, 3); m.scale.set(3, 6, 3); return m; });
      anim.push(dt => {
        const sp = now < stripHype ? 2.4 : .8, a = now * sp;
        spider.position.set(ox + Math.cos(a) * 1.6, .6 + Math.abs(Math.sin(now * 4)) * .5, oz + 3 + Math.sin(a) * 1.6); spider.rotation.y = -a; spider.scale.setScalar(1.3);
        pudge.position.set(ox + Math.cos(a + Math.PI) * 2.6, .6, oz + 3 + Math.sin(a + Math.PI) * 2.6); pudge.rotation.y = -a + Math.sin(now * 3) * .4; pudge.scale.y = .9 + Math.abs(Math.sin(now * 4)) * .15;
        beams.forEach((m, i) => { m.rotation.z = Math.sin(now * (1 + i * .4) + i) * .7; m.rotation.x = Math.cos(now * (.8 + i * .3)) * .5; });
      });
      rings.push({ act: 'counter', x: ox, z: oz - 2.2, ring: ring('#ff2fa8') });
    } else {
      b.add(BOX, '#6a4a2a', M(ox, .55, oz + 5, 0, 0, 0, 10, 1.1, 1.2)); bx(-5, 5, 4.4, 5.6, 1.2);
      const keeper = person(mat, kind === 'mvd' ? { top: '#2b3f6b', stripe: '#c9a64a', skin: '#e3b08c', hat: '#1e2f5a', legs: '#1e2f5a' } : { top: pick(['#3a6cf4', '#1f8a5a', '#d4a017', '#7a2e2e']), stripe: '#fff', skin: '#e3b08c', hat: '#222', legs: '#2a2a3a' });
      at(keeper.mesh, 0, 0, 6.6, Math.PI);
      at(label(def.title.toUpperCase(), 9, 1.2, def.color, '#fff'), 0, 4.4, D - .25, Math.PI);
      rings.push({ act: 'counter', x: ox, z: oz + 2.8, ring: ring(def.color) });
      if (kind === 'shawarma') { const spit = at(new THREE.Mesh(new Batch().add(CYL, '#8a5a2a', M(0, 0, 0, 0, 0, 0, 1, 2.2, 1)).geometry(), mat), 3.5, 2, 6.8); anim.push(dt => spit.rotation.y += dt * 2); b.add(BOX, '#555', M(ox + 3.5, 2, oz + 7.8, 0, 0, 0, 1.6, 3, .3)); }
      if (kind === 'tire') { for (let t = 0; t < 6; t++) for (let i = 0; i < 4; i++) b.add(CYL, '#151515', M(ox - 9 + (t % 3) * 2.2, .25 + i * .5, oz - 4 + Math.floor(t / 3) * 2.6, 0, 0, 0, 1.6, .45, 1.6)); bx(-10, -3.6, -5, -.6, 2.5); at(new THREE.Mesh(specs.civ[0].geo, mat), 7, 1.2, -1, .4); b.add(BOX, '#d4a017', M(ox + 7, .55, oz - 1, 0, .4, 0, 2.6, 1.1, 4.6)); bx(5.4, 8.6, -3.6, 1.6, 2.5); }
      if (kind === 'crypto') {
        for (const [x, z, r] of [[-10.6, -3, Math.PI / 2], [-10.6, 0, Math.PI / 2], [-10.6, 3, Math.PI / 2], [10.6, -3, -Math.PI / 2], [10.6, 0, -Math.PI / 2], [10.6, 3, -Math.PI / 2]]) {
          b.add(BOX, '#d4a017', M(ox + x, 1.2, oz + z, 0, r, 0, 1.4, 2.4, 1));
          at(new THREE.Mesh(new THREE.PlaneGeometry(1, .7), neonMat(pick(['#39ff6a', '#ff2fa8', '#2ff0ff']))), x + Math.sign(-x) * .52, 1.6, z, r);
        }
        bx(-11.4, -9.9, -4, 4, 2.6); bx(9.9, 11.4, -4, 4, 2.6);
        b.add(CYL, '#0f5a2a', M(ox + 3, .9, oz - 2, 0, 0, 0, 4, .2, 4)); b.add(CYL, '#4a2a1a', M(ox + 3, .45, oz - 2, 0, 0, 0, 1, .9, 1)); b.add(CYL, '#d4a017', M(ox + 3, 1.05, oz - 2, 0, 0, 0, 1.2, .1, 1.2)); bx(1, 5, -4, 0, 1.2);
        rings.push({ act: 'slots', x: ox - 8.6, z: oz - 1.5, ring: ring('#ffd24a') }, { act: 'slots', x: ox + 8.6, z: oz + 1.5, ring: ring('#ffd24a') });
      }
      if (kind === 'pawn') { at(new THREE.Mesh(specs.priora.geo, mat), -6, 0, -1, .6); bx(-8, -4, -3.5, 1.5, 2); for (let i = 0; i < 5; i++) b.add(BOX, pick(['#c0392b', '#d4a017', '#3a6cf4', '#888']), M(ox + 6 + rand(-2, 2), 1.4 + (i % 2), oz - 4 + i, 0, rand(0, 3), 0, .8, .6, .8)); b.add(BOX, '#5e3819', M(ox + 6, 1, oz - 2, 0, 0, 0, 1, 2, 6)); bx(5.4, 6.6, -5, 1, 2); }
      if (kind === 'guns') { for (let i = 0; i < 6; i++) b.add(BOX, '#1a1a1a', M(ox - 7.5 + i * 3, 3, oz + D - .4, 0, 0, .1 * (i % 2 ? 1 : -1), 2.2, .25, .2)); b.add(BOX, '#7a4a26', M(ox - 9, 4.2, oz - D + .5, 0, 0, 0, .7, .8, .9)); for (const s of [-1, 1]) b.limb('#d9c9a0', V(ox - 9 + s * .2, 4.6, oz - D + .6), V(ox - 9 + s * .8, 5.4, oz - D + .4), .1); at(new THREE.Mesh(new THREE.CircleGeometry(1, 20), neonMat('#ffffff')), 10, 2.5, -4, -Math.PI / 2); at(new THREE.Mesh(new THREE.CircleGeometry(.5, 20), neonMat('#c0392b')), 9.98, 2.5, -4, -Math.PI / 2); }
      if (kind === 'pharmacy') { for (const x of [-9, 9]) { b.add(BOX, '#ffffff', M(ox + x, 1.5, oz, 0, 0, 0, 1.2, 3, 8)); for (let i = 0; i < 12; i++) b.add(BOX, pick(['#c0392b', '#3a6cf4', '#1f9a6a', '#ffd24a']), M(ox + x - Math.sign(x) * .7, .6 + (i % 4) * .7, oz - 3 + Math.floor(i / 4) * 3, 0, 0, 0, .3, .4, .6)); } bx(-9.6, -8.4, -4, 4, 3); bx(8.4, 9.6, -4, 4, 3); for (const [w, h] of [[2, .6], [.6, 2]]) at(new THREE.Mesh(BOX, neonMat('#1fd17a')), 0, 5.2, D - .3).scale.set(w, h, .1); }
      if (kind === 'mvd') { for (const [c, y] of [['#ffffff', 5.3], ['#2a5fd0', 4.9], ['#c0392b', 4.5]]) b.add(BOX, c, M(ox - 9, y, oz + D - .3, 0, 0, 0, 2.4, .4, .1)); for (let i = 0; i < 9; i++) b.add(BOX, '#555', M(ox + 6.5 + i * .5, 2.5, oz - 4, 0, 0, 0, .08, 5, .08)); for (let i = 0; i < 9; i++) b.add(BOX, '#555', M(ox + 6.3, 2.5, oz - 4 + i * .5, 0, 0, 0, .08, 5, .08)); bx(6.2, 12, -4.2, 0, 6); const [file, name] = pick(WANTED); at(poster(file, name), -6, 2.8, D - .3, Math.PI).scale.setScalar(.6); }
    }
    for (const r of rings) r.ring.position.set(r.x, .5, r.z);
    scene.add(new THREE.Mesh(b.geometry(), mat));
    rooms[kind] = { kind, ox, oz, rings, anim, door: doors.find(d => d.kind === kind) };
  });
  const TR = { ox: 0, oz: 3000, halfW: 9, NS: 640, laps: 2 };
  const trackCurve = new THREE.CatmullRomCurve3([[0, -200], [180, -220], [270, -120], [220, 20], [300, 140], [200, 250], [40, 200], [-60, 270], [-230, 210], [-270, 40], [-180, -80], [-210, -200], [-90, -250]].map(([x, z]) => V(TR.ox + x, 0, TR.oz + z)), true, 'centripetal');
  const tp = trackCurve.getSpacedPoints(TR.NS).slice(0, TR.NS), tn = tp.map((p, i) => { const a = tp[(i + TR.NS - 1) % TR.NS], b = tp[(i + 1) % TR.NS], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); return V(dz / l, 0, -dx / l); });
  {
    const strip = (half, y, colorAt) => {
      const pos = [], col = [], idx = [];
      for (let i = 0; i <= TR.NS; i++) {
        const p = tp[i % TR.NS], n = tn[i % TR.NS], c = new THREE.Color(colorAt(i));
        pos.push(p.x + n.x * half, y, p.z + n.z * half, p.x - n.x * half, y, p.z - n.z * half);
        col.push(c.r, c.g, c.b, c.r, c.g, c.b);
        if (i < TR.NS) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    };
    strip(TR.halfW + 1.4, .02, i => Math.floor(i / 3) % 2 ? '#e8e8e8' : '#c0392b');
    strip(TR.halfW, .04, i => i < 3 ? (i % 2 ? '#fff' : '#111') : '#34303d');
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshLambertMaterial({ color: '#2e4728' }));
    grass.rotation.x = -Math.PI / 2; grass.position.set(TR.ox, -.02, TR.oz); scene.add(grass);
    const tb = new Batch(), h0 = Math.atan2(tp[1].x - tp[0].x, tp[1].z - tp[0].z);
    for (let k = -3; k <= 3; k++) { const i = (k * 14 + TR.NS) % TR.NS, p = tp[i], n = tn[i]; tb.add(BOX, pick(['#5a5a6a', '#6a5a7a']), M(p.x + n.x * 20, 2.5, p.z + n.z * 20, 0, Math.atan2(n.x, n.z), 0, 14, 5, 6)); }
    for (const s of [-1, 1]) tb.add(BOX, '#d0d0d0', M(tp[0].x + tn[0].x * s * (TR.halfW + 2), 4, tp[0].z + tn[0].z * s * (TR.halfW + 2), 0, 0, 0, .6, 8, .6));
    for (let k = 0; k < 160; k++) { const i = Math.floor(rand(0, TR.NS)), p = tp[i], n = tn[i], d = rand(22, 60) * pick([-1, 1]); tb.add(ICO, pick(['#4f8a3a', '#3f7a3a']), M(p.x + n.x * d, 4, p.z + n.z * d, 0, rand(0, 3), 0, 4, 6, 4)); }
    scene.add(new THREE.Mesh(tb.geometry(), mat));
    const banner = label('ГРАН-ПРИ ДОБРЯНКИ · МВД', 2 * TR.halfW + 4, 2.2, '#c0392b', '#fff');
    banner.material.side = THREE.DoubleSide; banner.position.set(tp[0].x, 7.5, tp[0].z); banner.rotation.y = h0; scene.add(banner);
  }
  const raceGate = { kind: 'race', x: line(N) - 3.5, z: 4, inside: false, ring: ring('#ffffff'), icon: iconSprite('🏁') };
  raceGate.ring.position.set(raceGate.x, .5, raceGate.z); raceGate.ring.scale.set(2.2, 1, 2.2); raceGate.icon.position.set(raceGate.x, 5, raceGate.z); raceGate.icon.scale.set(4, 4, 1);
  let race = null;
  function trackKeep(c, full) {
    let best = c.ti || 0, bd = Infinity;
    const span = full ? TR.NS : 14;
    for (let k = -span; k <= span; k++) { const i = ((full ? 0 : c.ti) + k + TR.NS * 2) % TR.NS, d = (tp[i].x - c.pos.x) ** 2 + (tp[i].z - c.pos.z) ** 2; if (d < bd) { bd = d; best = i; } }
    if (!full) {
      if (c.ti > TR.NS * .9 && best < TR.NS * .1 && c.half) { c.lap++; c.half = false; if (c.lap >= TR.laps && !race.finish.includes(c)) race.finish.push(c); }
      if (best > TR.NS * .45 && best < TR.NS * .55) c.half = true;
    }
    c.ti = best;
    const p = tp[best], n = tn[best], off = (c.pos.x - p.x) * n.x + (c.pos.z - p.z) * n.z, lim = TR.halfW - .4;
    if (Math.abs(off) > lim) {
      const push = off - Math.sign(off) * lim, vn = c.vel.x * n.x + c.vel.z * n.z;
      c.pos.x -= n.x * push; c.pos.z -= n.z * push;
      if (vn * Math.sign(off) > 0) { c.vel.x -= n.x * vn * 1.4; c.vel.z -= n.z * vn * 1.4; c.speed *= .96; }
    }
  }
  function startRace() {
    leaveShop();
    const rc = car(specs.sport), grid = [];
    for (let k = 0; k < 11; k++) grid.push(k);
    const myslot = 6;
    race = { cars: [], finish: [], goAt: run.time + 3.4, start: run.time + 3.4, prev: player, cd: 4, car: rc };
    grid.forEach(k => {
      const c = k === myslot ? rc : car(specs.cop), row = Math.floor(k / 2), i = (TR.NS - 6 - row * 4) % TR.NS, n = tn[i], side = k % 2 ? -3.4 : 3.4;
      c.pos.set(tp[i].x + n.x * side, 0, tp[i].z + n.z * side);
      c.heading = Math.atan2(tp[(i + 1) % TR.NS].x - tp[i].x, tp[(i + 1) % TR.NS].z - tp[i].z);
      c.speed = 0; c.vel.set(0, 0, 0); c.y = 0; c.lap = -1; c.half = true; c.ti = i; c.lane = rand(-4, 4); c.raceTop = rand(36, 43); c.ram = k % 4 === 1;
      if (c !== rc) scene.add(c.mesh); else scene.add(rc.mesh);
      race.cars.push(c); place(c, 1);
    });
    if (player.foot) hero.mesh.visible = false;
    player = rc; zone = 'race'; chase(0, true);
  }
  function endRace(rank) {
    const rc = race.car;
    for (const c of race.cars) if (c !== rc) scene.remove(c.mesh);
    zone = 'city';
    rc.pos.set(raceGate.x - 6, 0, raceGate.z); rc.heading = -Math.PI / 2; rc.speed = 0; rc.vel.set(0, 0, 0); rc.y = 0; rc.lap = 0;
    if (rank === 1) { cars.push(rc); player = rc; place(rc, 1); run.gold += 3000; ann('ПОБЕДА', 'gold'); hint('+3000 и спорткар «Бруда GT» твой', 3); }
    else {
      scene.remove(rc.mesh);
      hero.pos.set(raceGate.x - 6, 0, raceGate.z); hero.heading = -Math.PI / 2; hero.y = 0; hero.mesh.visible = true; player = hero; place(hero, 1);
      if (rank && rank <= 3) { run.gold += 1000; ann(`${rank} МЕСТО`, 'gold'); hint('+1000 за подиум. Спорткар МВД забрало обратно', 3); }
      else hint(rank ? `${rank} место из 11. Спорткар МВД забрало обратно` : 'Сдался. МВД забрало спорткар', 3);
    }
    raceGate.inside = true; race = null; chase(0, true);
  }
  function raceStep(dt) {
    const go = run.time >= race.goAt, left = Math.ceil(race.goAt - run.time);
    if (!go && left < race.cd) { race.cd = left; ann(left > 0 ? String(left) : 'GO', left > 0 ? '' : 'gold'); noise(.12, left > 0 ? 900 : 1800, .4, 'bandpass'); }
    if (go && race.cd > 0) { race.cd = 0; ann('GO', 'gold'); }
    for (const c of race.cars) {
      if (c !== player) {
        if (!go) { c.speed = 0; c.vel.set(0, 0, 0); }
        else {
          const ahead = tp[(c.ti + 12) % TR.NS], n = tn[(c.ti + 12) % TR.NS];
          let tx = ahead.x + n.x * c.lane, tz = ahead.z + n.z * c.lane;
          if (c.ram && c.pos.distanceTo(player.pos) < 16) { tx = player.pos.x; tz = player.pos.z; }
          const diff = wrap(Math.atan2(tx - c.pos.x, tz - c.pos.z) - c.heading);
          drive(c, Math.abs(diff) > .35 && c.speed > 24 ? -.4 : 1, clamp(diff * 2.6, -1, 1), false, dt, c.raceTop);
        }
      } else if (!go) { c.speed = 0; c.vel.set(0, 0, 0); }
      trackKeep(c);
    }
    for (let a = 0; a < race.cars.length; a++) for (let b = a + 1; b < race.cars.length; b++) bump(race.cars[a], race.cars[b]);
    const flash = now * 6 % 2 < 1;
    for (const c of race.cars) { if (c.lights.length) { c.lights[0].visible = flash; c.lights[1].visible = !flash; } if (c !== player) place(c, dt); }
    if (race.finish.includes(race.car)) endRace(race.finish.indexOf(race.car) + 1);
  }
  const racePlace = () => 1 + race.cars.filter(c => c !== race.car && c.lap * TR.NS + c.ti > race.car.lap * TR.NS + race.car.ti).length;
  let zone = 'city', room = null, stripHype = 0, beatAt = 0, spinning = false;
  function enterRoom(d) {
    room = rooms[d.kind]; zone = 'inside';
    hero.pos.set(room.ox, 0, room.oz - 5.2); hero.heading = 0; hero.vel.set(0, 0, 0); hero.speed = 0; hero.y = 0;
    for (const r of room.rings) r.inside = r.act === 'exit';
    for (const k in keys) keys[k] = false;
    mapC.hidden = true; place(hero, 1); chase(0, true);
    if (d.kind === 'strip') play(pick(['freshmeat', 'brood'])); else noise(.15, 2200, .25, 'bandpass');
  }
  function exitRoom() {
    if (zone !== 'inside') return;
    const d = room.door;
    zone = 'city'; room = null; mapC.hidden = false;
    hero.pos.set(d.x, 0, d.z + 3.2); hero.heading = 0; hero.vel.set(0, 0, 0); hero.y = groundY(d.x, d.z + 3.2);
    place(hero, 1); chase(0, true);
  }
  function roomStep() {
    for (const r of room.rings) {
      const inside = Math.hypot(player.pos.x - r.x, player.pos.z - r.z) < 1.6;
      if (inside && !r.inside) {
        r.inside = true;
        if (r.act === 'exit') { exitRoom(); return; }
        if (r.act === 'slots') { openSlots(); return; }
        openShop(room.door); return;
      }
      r.inside = inside;
    }
  }
  const gibMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(.32, .32, .32), new THREE.MeshLambertMaterial(), 140), gibs = [];
  gibMesh.frustumCulled = false; scene.add(gibMesh);
  for (let i = 0; i < 140; i++) { gibs.push({ pos: V(0, -9, 0), vel: V(0, 0, 0), life: 0, spin: 0 }); gibMesh.setColorAt(i, new THREE.Color('#000')); }
  const splatMats = { spider: new THREE.MeshBasicMaterial({ color: '#2f6a12', transparent: true, opacity: .85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }) };
  splatMats.courier = splatMats.spider.clone(); splatMats.courier.color.set('#5a2a10');
  const splatGeo = new THREE.CircleGeometry(1.5, 9).rotateX(-Math.PI / 2), splats = [];
  for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(splatGeo, splatMats.spider); m.visible = false; scene.add(m); splats.push(m); }
  let splatNext = 0;

  let site, state = 'title', opened = false, paused = [], last = 0, now = 0, hp = 100, heat = 0, bust = 0, invuln = 0, dyingT = 0, cause = '', shakeAmt = 0;
  let fireCD = 0, aimT = 0, radioAt = 0, lastHurt = 0, lastKill = -99, streak = 0, firstBlood = true, spawnCD = 0, hintUntil = 0, run = {}, doorNear = null, shopDoor = null, winT = 0;
  const cops = [], keys = {}, held = { up: new Set(), down: new Set(), left: new Set(), right: new Set(), fire: new Set() }, shown = {};
  const touch = matchMedia('(pointer:coarse)').matches;
  const on = k => keys[k] || (held[k] ? held[k].size > 0 : false);

  let ac, master, eng, engGain, sir, sirGain, noiseBuf;
  function audio() {
    if (ac) { ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = .6; master.connect(ac.destination);
    eng = ac.createOscillator(); eng.type = 'sawtooth'; engGain = ac.createGain(); engGain.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    eng.connect(lp).connect(engGain).connect(master); eng.start();
    sir = ac.createOscillator(); sir.type = 'triangle'; sirGain = ac.createGain(); sirGain.gain.value = 0;
    sir.connect(sirGain).connect(master); sir.start();
    loadSfx();
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function kick() {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + .18);
    g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .25);
    o.connect(g).connect(master); o.start(t); o.stop(t + .26);
    if (Math.random() < .7) noise(.05, 8000, .12, 'highpass');
  }
  const SFX = ['shot', 'shotgun', 'scream1', 'scream2', 'crash', 'boom', 'cash', 'slotspin', 'slotwin', 'splat', 'engine', 'siren', 'rain', 'firstblood', 'doublekill', 'triplekill', 'ultrakill', 'rampage', 'roshan', 'freshmeat', 'getoverhere', 'brood', 'courier', 'coins', 'aegis'];
  const bufs = {}, loops = {};
  const ANN_SFX = { 'FIRST BLOOD': 'firstblood', 'DOUBLE KILL': 'doublekill', 'TRIPLE KILL': 'triplekill', 'ULTRA KILL': 'ultrakill', 'RAMPAGE': 'rampage', 'КУРЬЕР УБИТ': 'courier', 'АЕГИС СРАБОТАЛ': 'aegis', 'УЧАСТКОВЫЙ В БОЛЬНИЦЕ': 'scream1', 'ПРОПИСКА ПОЛУЧЕНА': 'roshan', 'УГНАЛ ТАЧКУ МВД': 'getoverhere', 'THE BATTLE BEGINS': 'brood', 'ДЖЕКПОТ': 'slotwin', 'ПОБЕДА': 'rampage', 'МВД В ЯРОСТИ': 'boom', 'ТАЧКА ТВОЯ': 'cash' };
  function loadSfx() {
    for (const [k, url] of SFX.map(k => [k, `sfx/g/${k}.mp3`]).concat([['thunder', 'sfx/thunder1.mp3']])) {
      fetch(url).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(b => ac.decodeAudioData(b)).then(buf => {
        bufs[k] = buf;
        if (k === 'engine' || k === 'siren' || k === 'rain') {
          const src = ac.createBufferSource(), g = ac.createGain();
          src.buffer = buf; src.loop = true; src.loopStart = .05; src.loopEnd = buf.duration - .05; g.gain.value = 0;
          src.connect(g).connect(master); src.start(); loops[k] = { src, g };
        }
      }).catch(() => {});
    }
  }
  function play(k, vol = 1, rate = 1) {
    const b = bufs[k];
    if (!b || !ac) return false;
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol;
    s.connect(g).connect(master); s.start();
    return true;
  }
  function noise(dur, freq, vol, type) {
    if (!ac) return;
    const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t, Math.random() * .5); s.stop(t + dur);
  }
  function sound() {
    if (!ac) return;
    const t = ac.currentTime;
    let near = Infinity;
    for (const c of cops) near = Math.min(near, c.pos.distanceTo(player.pos));
    const driving = state === 'play' && !player.foot, sirenOn = cops.length && state !== 'title' && zone === 'city';
    eng.frequency.setTargetAtTime(38 + Math.abs(player.speed) * 3.2, t, .06);
    engGain.gain.setTargetAtTime(driving && !loops.engine ? .045 : 0, t, .15);
    if (loops.engine) { loops.engine.src.playbackRate.setTargetAtTime(.7 + Math.abs(player.speed) / 26, t, .08); loops.engine.g.gain.setTargetAtTime(driving ? .4 : 0, t, .15); }
    sir.frequency.setTargetAtTime(now % 1 < .5 ? 640 : 880, t, .03);
    sirGain.gain.setTargetAtTime(sirenOn && !loops.siren ? .05 * Math.min(1, 30 / near) : 0, t, .1);
    if (loops.siren) loops.siren.g.gain.setTargetAtTime(sirenOn ? .45 * Math.min(1, 30 / near) : 0, t, .1);
    if (loops.rain) loops.rain.g.gain.setTargetAtTime(weather.rain && zone === 'city' && state !== 'title' ? .3 * weather.rain : 0, t, .3);
  }

  function ann(text, cls = '') {
    if (ANN_SFX[text]) play(ANN_SFX[text]);
    annEl.textContent = text; annEl.className = 'g-ann ' + cls; void annEl.offsetWidth; annEl.classList.add('show');
  }
  function hint(text, sec) { hintEl.textContent = text; hintUntil = now + sec; }
  function floatText(text, pos) {
    tmp.set(pos.x, pos.y + 3, pos.z).project(camera);
    if (tmp.z > 1) return;
    const el = document.createElement('div');
    el.className = 'g-float'; el.textContent = text;
    el.style.left = (tmp.x * .5 + .5) * 100 + '%'; el.style.top = (-tmp.y * .5 + .5) * 100 + '%';
    hud.append(el); setTimeout(() => el.remove(), 900);
  }
  function spray(pos, colors, n, power) {
    for (let i = 0, c = new THREE.Color(); i < gibs.length && n > 0; i++) {
      const g = gibs[i];
      if (g.life > 0) continue;
      n--; g.life = rand(.8, 1.5); g.spin = rand(-12, 12);
      g.pos.set(pos.x, pos.y + 1, pos.z); g.vel.set(rand(-1, 1) * power, rand(.6, 1.4) * power, rand(-1, 1) * power);
      gibMesh.setColorAt(i, c.set(pick(colors)));
    }
    gibMesh.instanceColor.needsUpdate = true;
  }
  function splat(pos, kind) {
    const m = splats[splatNext++ % splats.length];
    m.material = splatMats[kind]; m.visible = true;
    m.position.set(pos.x, groundY(pos.x, pos.z) + .04, pos.z); m.rotation.y = rand(0, 6.3); m.scale.setScalar(rand(.8, 1.5));
  }

  function spot(minDist) {
    for (let k = 0; k < 40; k++) {
      const x = rand(-EDGE + 3, EDGE - 3), z = rand(-EDGE + 3, EDGE - 3);
      if (Math.hypot(x - player.pos.x, z - player.pos.z) < minDist) continue;
      if (boxes.some(b => x > b.x0 - 1.5 && x < b.x1 + 1.5 && z > b.z0 - 1.5 && z < b.z1 + 1.5)) continue;
      return V(x, 0, z);
    }
    return V(line(Math.floor(rand(0, N + 1))), 0, line(Math.floor(rand(0, N + 1))));
  }
  function collide(e, r) {
    let worst = 0; e.touch = false;
    for (const b of boxes) {
      const cx = clamp(e.pos.x, b.x0, b.x1), cz = clamp(e.pos.z, b.z0, b.z1);
      let dx = e.pos.x - cx, dz = e.pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      e.touch = true;
      if (d2 < 1e-8) {
        const pen = [e.pos.x - b.x0, b.x1 - e.pos.x, e.pos.z - b.z0, b.z1 - e.pos.z], m = Math.min(...pen), k = pen.indexOf(m);
        dx = k === 0 ? -1 : k === 1 ? 1 : 0; dz = k === 2 ? -1 : k === 3 ? 1 : 0;
        if (dx) e.pos.x = dx < 0 ? b.x0 - r : b.x1 + r; else e.pos.z = dz < 0 ? b.z0 - r : b.z1 + r;
      } else {
        const d = Math.sqrt(d2); dx /= d; dz /= d;
        e.pos.x += dx * (r - d); e.pos.z += dz * (r - d);
      }
      const vn = e.vel.x * dx + e.vel.z * dz;
      if (vn < 0) { e.vel.x -= 1.3 * vn * dx; e.vel.z -= 1.3 * vn * dz; worst = Math.max(worst, -vn); }
    }
    return worst;
  }
  function bump(a, b) {
    const R = a.r + b.r, dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, d = Math.hypot(dx, dz);
    if (d > R || d < 1e-4) return 0;
    const nx = dx / d, nz = dz / d, wa = b.m / (a.m + b.m), wb = a.m / (a.m + b.m);
    a.pos.x += nx * (R - d) * wa; a.pos.z += nz * (R - d) * wa; b.pos.x -= nx * (R - d) * wb; b.pos.z -= nz * (R - d) * wb;
    const rel = (a.vel.x - b.vel.x) * nx + (a.vel.z - b.vel.z) * nz;
    if (rel >= 0) return 0;
    const j = -1.3 * rel;
    a.vel.x += nx * j * wa; a.vel.z += nz * j * wa; b.vel.x -= nx * j * wb; b.vel.z -= nz * j * wb;
    for (const c of [a, b]) if (!c.foot) c.speed = c.vel.dot(fwd.set(Math.sin(c.heading), 0, Math.cos(c.heading)));
    return -rel;
  }
  function walk(h, gas, steer, dt, top = 7) {
    h.heading += steer * 3 * dt;
    h.speed = gas > 0 ? top : gas < 0 ? -3 : 0;
    fwd.set(Math.sin(h.heading), 0, Math.cos(h.heading));
    h.vel.copy(fwd).multiplyScalar(h.speed);
    h.pos.addScaledVector(h.vel, dt);
    collide(h, h.r);
    h.t += dt * Math.abs(h.speed);
    const swing = Math.sin(h.t * 1.6) * Math.min(1, Math.abs(h.speed) / 4) * .8;
    h.legs[0].rotation.x = swing; h.legs[1].rotation.x = -swing; h.arms[0].rotation.x = -swing; h.arms[1].rotation.x = swing;
  }
  function nearestCar() {
    let best = null, bd = 4.4;
    for (const c of cars.concat(cops)) { const d = c.pos.distanceTo(hero.pos); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  const nearCrew = () => player.foot ? crews.find(c => Math.hypot(c.x - player.pos.x, c.z - player.pos.z) < 4.5) : null;
  function talk(crew) {
    if (run.job) { hint('Триада ждёт: 🎯 время тикает', 1.5); return; }
    if (!run.seeds && run.gold >= 228 && Math.random() < .35) { run.gold -= 228; floatText('−228', crew.pos); hint('Триада стрельнула 228 на семки. Купи семки — будешь свой', 2.5); return; }
    const kill = Math.random() < .5;
    run.job = kill ? { kill: true, base: run.spiders + run.couriers, need: 5, until: run.time + 60, crew } : { kill: false, until: run.time + 50, crew };
    hint(kill ? '🎯 Раздави 5 пауков за минуту — 1337' : '🎯 Передачка: жёлтое кольцо 📦 у ГРЭС за 50 секунд — 1337', 3);
  }
  function jobStep() {
    const j = run.job;
    if (!j) return;
    const done = j.kill ? run.spiders + run.couriers - j.base >= j.need : Math.hypot(player.pos.x - drop.x, player.pos.z - drop.z) < 4.5;
    if (done) { run.gold += 1337; run.jobs++; ann('ТРИАДА ДОВОЛЬНА', 'gold'); hint('+1337 от Триады', 2.5); run.job = null; }
    else if (run.time > j.until) { ann('ТРИАДА РАЗОЧАРОВАНА'); hint('Не успел. Триада запомнила', 2.5); run.job = null; }
  }
  function beatStep(dt) {
    beat.cd -= dt;
    if (!beat.active) {
      if (heat > 0 && player.foot && beat.cd <= 0) {
        const opts = [];
        for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const d = Math.hypot(line(i) - player.pos.x, line(j) - player.pos.z); if (d > 18 && d < 45) opts.push([i, j]); }
        if (opts.length) {
          const [i, j] = pick(opts);
          beat.pos.set(line(i), 0, line(j)); beat.wi = i; beat.wj = j; beat.pi = beat.pj = -1;
          beat.active = true; beat.mesh.visible = true; place(beat, 1);
        }
      }
      return;
    }
    const dx = player.pos.x - beat.pos.x, dz = player.pos.z - beat.pos.z, d = Math.hypot(dx, dz);
    if (heat <= 0 || d > 70) { beat.active = false; beat.mesh.visible = false; beat.cd = 6; return; }
    if (!player.foot && d < 2.6 && Math.abs(player.speed) > 6) { beatDown(); return; }
    let tx = player.pos.x, tz = player.pos.z;
    if (clear(beat.pos, player.pos)) beat.wi = -1;
    else {
      if (beat.wi < 0 || Math.hypot(line(beat.wi) - beat.pos.x, line(beat.wj) - beat.pos.z) < 2.5) route(beat);
      tx = line(beat.wi); tz = line(beat.wj);
    }
    walk(beat, player.foot || d > 6 ? 1 : 0, clamp(wrap(Math.atan2(tx - beat.pos.x, tz - beat.pos.z) - beat.heading) * 3, -1, 1), dt, player.foot ? 5.6 : 2.5);
    const grabbed = player.foot && d < 1.5 && invuln <= 0;
    if (grabbed) hint('Участковый вцепился! Беги!', .3);
    return grabbed;
  }
  function act() {
    if (state !== 'play') return;
    if (zone === 'race') { endRace(0); return; }
    const crew = nearCrew();
    if (crew) { talk(crew); return; }
    if (!player.foot) {
      const c = player;
      hero.pos.set(c.pos.x + Math.cos(c.heading) * 2.5, 0, c.pos.z - Math.sin(c.heading) * 2.5);
      hero.heading = c.heading; hero.y = c.y; hero.vel.set(0, 0, 0); hero.speed = 0;
      collide(hero, hero.r);
      c.speed *= .3; c.mesh.visible = true; c.mesh.rotation.z = 0;
      hero.mesh.visible = true; player = hero; place(hero, 1);
      return;
    }
    const c = nearestCar();
    if (!c) { hint('Рядом нет тачки', 1.5); return; }
    const k = cops.indexOf(c);
    if (k >= 0) cops.splice(k, 1);
    if (!cars.includes(c)) cars.push(c);
    if (c.spec.cop && !c.stolen) { heat = Math.min(5, heat + 1); lastKill = now; ann('УГНАЛ ТАЧКУ МВД'); }
    else if (c !== myCar && !c.stolen) hint('Угнал ' + c.spec.name + '. Хозяин в ахуе', 2);
    c.stolen = c !== myCar; c.speed = 0; c.vel.set(0, 0, 0); c.mesh.visible = true;
    hero.mesh.visible = false; player = c;
  }
  function drive(c, gas, steer, hand, dt, top) {
    if (gas > 0) c.speed += (c.speed < 0 ? 40 : 20) * gas * dt;
    else if (gas < 0) c.speed -= (c.speed > 0 ? 40 : 14) * -gas * dt;
    else c.speed -= c.speed * Math.min(1, 1.1 * dt);
    if (hand) c.speed -= c.speed * Math.min(1, 1.4 * dt);
    c.speed = clamp(c.speed, -top * .35, top);
    const grip = Math.min(1, Math.abs(c.speed) / 6) * Math.sign(c.speed);
    c.heading += steer * (hand ? 3.3 : 2.3) * grip * (1 - .3 * Math.abs(c.speed) / top) * dt;
    fwd.set(Math.sin(c.heading), 0, Math.cos(c.heading));
    c.vel.lerp(tmp.copy(fwd).multiplyScalar(c.speed), 1 - Math.exp(-(hand ? 2.2 : grip + (c.spec.grip || 0)) * dt));
    c.pos.addScaledVector(c.vel, dt);
    const r = 1.8, imp = collide(c, r);
    if (c.touch) c.speed = c.vel.dot(fwd);
    return imp;
  }
  function place(c, dt) {
    c.y += (groundY(c.pos.x, c.pos.z) - c.y) * Math.min(1, dt * 15);
    c.mesh.position.set(c.pos.x, c.y, c.pos.z); c.mesh.rotation.y = c.heading;
  }
  function hitT(a, b, y0, y1) {
    const ix = 1 / (b.x - a.x), iz = 1 / (b.z - a.z);
    let best = 1;
    for (const k of boxes) {
      const tx0 = (k.x0 - a.x) * ix, tx1 = (k.x1 - a.x) * ix, tz0 = (k.z0 - a.z) * iz, tz1 = (k.z1 - a.z) * iz;
      const lo = Math.max(Math.min(tx0, tx1), Math.min(tz0, tz1), 0), hi = Math.min(Math.max(tx0, tx1), Math.max(tz0, tz1), 1);
      if (lo <= hi && lo < best && y0 + (y1 - y0) * lo < k.h) best = lo;
    }
    return best;
  }
  const clear = (a, b) => hitT(a, b, 0, 0) >= 1;
  function route(c) {
    if (c.wi < 0) { c.wi = clamp(Math.round((c.pos.x + HALF) / CELL), 0, N); c.wj = clamp(Math.round((c.pos.z + HALF) / CELL), 0, N); return; }
    const opts = [[c.wi + 1, c.wj], [c.wi - 1, c.wj], [c.wi, c.wj + 1], [c.wi, c.wj - 1]].filter(([i, j]) => i >= 0 && j >= 0 && i <= N && j <= N && !(i === c.pi && j === c.pj));
    let best = opts[0], bestD = Infinity;
    for (const o of opts) { const d = Math.hypot(line(o[0]) - player.pos.x, line(o[1]) - player.pos.z) + rand(0, 12); if (d < bestD) { bestD = d; best = o; } }
    c.pi = c.wi; c.pj = c.wj; [c.wi, c.wj] = best;
  }
  function copThink(c, dt) {
    const d = c.pos.distanceTo(player.pos), top = 22 + Math.ceil(heat) * 3;
    let tx, tz;
    if (d < 70 && clear(c.pos, player.pos)) { tx = player.pos.x + player.vel.x * .5; tz = player.pos.z + player.vel.z * .5; c.wi = -1; }
    else {
      if (c.wi < 0 || Math.hypot(line(c.wi) - c.pos.x, line(c.wj) - c.pos.z) < 7) route(c);
      tx = line(c.wi); tz = line(c.wj);
    }
    const diff = wrap(Math.atan2(tx - c.pos.x, tz - c.pos.z) - c.heading);
    let gas = Math.abs(diff) > 1.3 && c.speed > 15 ? -.5 : 1, steer = clamp(diff * 2.2, -1, 1);
    const arrest = d < 16 && (player.foot || Math.abs(player.speed) < 4);
    if (arrest) { gas = d > 8 ? (c.speed > 6 ? -1 : .4) : (c.speed > 1 ? -1 : 0); c.stuck = 0; }
    else if (c.reverse > 0) { c.reverse -= dt; gas = -1; steer = -steer; }
    else if (Math.abs(c.speed) < 2 && (c.stuck += dt) > 1) { c.reverse = .9; c.stuck = 0; }
    else if (Math.abs(c.speed) >= 2) c.stuck = 0;
    drive(c, gas, steer, Math.abs(diff) > 1.8 && c.speed > 8, dt, top);
  }
  function spawnCop() {
    const opts = [];
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { const d = Math.hypot(line(i) - player.pos.x, line(j) - player.pos.z); if (d > 60 && d < 140) opts.push([i, j]); }
    if (!opts.length) return;
    const [i, j] = pick(opts), c = car(specs.cop);
    c.pos.set(line(i), 0, line(j)); c.heading = Math.atan2(player.pos.x - c.pos.x, player.pos.z - c.pos.z); c.wi = i; c.wj = j;
    cops.push(c); scene.add(c.mesh); place(c, 1);
  }
  function dropCop(k) { scene.remove(cops[k].mesh); cops.splice(k, 1); }

  function hurt(n, why) {
    if (state !== 'play' || invuln > 0) return;
    hp -= n * player.spec.armor * (run.armor && !player.foot ? .6 : 1); cause = why; lastHurt = now; shakeAmt = Math.min(1.6, shakeAmt + n * .05);
    if (hp < 30 && hp > 0 && site.loot.cheese > 0) { site.loot.cheese--; site.saveLoot(); hp = 100; ann('СЫР!', 'gold'); hint('Сожрал сыр с Рошана, здоровье полное', 2.5); }
    if (hp <= 0) { hp = 0; die(why); }
  }
  function die(why) {
    if (state !== 'play') return;
    cause = why; dlg.classList.add('dying'); if (why === 'bust' || !play(pick(['scream1', 'scream2']))) noise(.6, 300, .7, 'lowpass');
    if (why !== 'bust' && site.loot.aegis > 0) {
      site.loot.aegis--; site.saveLoot(); state = 'dying'; dyingT = 1.8; ann('АЕГИС СРАБОТАЛ', 'gold');
      return;
    }
    state = 'over';
    const record = run.gold > best.get();
    if (record) best.set(run.gold);
    setTimeout(() => { if (state === 'over' && opened) screen(overHtml(record)); }, 1300);
  }
  function respawn() {
    zone = 'city'; room = null; mapC.hidden = false;
    const lost = Math.floor(run.gold * (cause === 'bust' ? .2 : run.bahily ? .15 : .3)), m = doors.find(d => d.kind === 'mvd');
    run.gold -= lost; run.deaths++; if (cause !== 'bust') run.bahily = false;
    state = 'play'; screen(''); dlg.classList.remove('dying'); dlg.focus();
    hp = 100; heat = 0; bust = 0; invuln = 2.5; lastHurt = now;
    while (cops.length) dropCop(0);
    beat.active = false; beat.mesh.visible = false; beat.cd = 8;
    if (cause === 'bust') player.pos.set(m.x, 0, m.z + (player.foot ? 3 : 12)); else player.pos.set(0, 0, 0);
    player.heading = 0; player.speed = 0; player.vel.set(0, 0, 0); player.y = groundY(player.pos.x, player.pos.z); player.mesh.visible = true; place(player, 1);
    chase(0, true);
    hint(lost ? `−${lost} золота. Осталось ${run.gold}` : 'Золота и так не было', 3);
  }
  function revive() {
    state = 'play'; dlg.classList.remove('dying'); hp = 100; invuln = 2.5; bust = 0;
    if (cause === 'kama') { player.pos.set(-EDGE + 3, 0, clamp(player.pos.z, -EDGE + 6, EDGE - 6)); player.heading = Math.PI / 2; player.y = 0; }
    player.speed = 0; player.vel.set(0, 0, 0);
    for (let k = cops.length - 1; k >= 0; k--) if (cops[k].pos.distanceTo(player.pos) < 30) dropCop(k);
    spray(player.pos, ['#ffd24a', '#fff3a0', '#ff4fb8'], 30, 10);
    hint('Аегис потрачен. Менты разбежались', 2.5);
  }
  function blowCop(c) {
    const k = cops.indexOf(c);
    if (k < 0) return;
    spray(c.pos, ['#ff8a2a', '#ffd24a', '#333', '#fff'], 40, 13); play('scream2', .6) || noise(1.2, 140, .9, 'lowpass');
    dropCop(k); heat = Math.min(5, heat + 1); lastKill = now; shakeAmt = 1.2; ann('МВД В ЯРОСТИ');
  }
  function beatDown() {
    beat.active = false; beat.mesh.visible = false; beat.cd = 25;
    spray(beat.pos, ['#2b3f6b', '#1e2f5a', '#c9a64a'], 16, 8); floatText('+322', beat.pos);
    run.gold += 322; heat = Math.min(5, heat + 1); lastKill = now; ann('УЧАСТКОВЫЙ В БОЛЬНИЦЕ');
  }
  function fire() {
    const g = GUNS[run.gun];
    fireCD = g.rate;
    if (!run.guns[run.gun]) { hint('Патроны кончились — Охота и рыбалка 🔫', 1.5); noise(.05, 3000, .2, 'highpass'); return; }
    run.guns[run.gun]--; aimT = .35;
    const h = player, from = V(h.pos.x + Math.sin(h.heading) * .9 - Math.cos(h.heading) * .5, h.y + 1.55, h.pos.z + Math.cos(h.heading) * .9 + Math.sin(h.heading) * .5), found = [];
    const look = (e, kind) => {
      const dx = e.pos.x - h.pos.x, dz = e.pos.z - h.pos.z, d = Math.hypot(dx, dz), a = Math.abs(wrap(Math.atan2(dx, dz) - h.heading));
      if (d < g.range && a < g.cone && clear(h.pos, e.pos)) found.push({ e, kind, score: d + a * 40 });
    };
    for (const c of crowd) if (!c.dead) look(c, 'crowd');
    for (const c of cops) look(c, 'cop');
    if (beat.active) look(beat, 'beat');
    found.sort((a, b) => a.score - b.score);
    const hits = found.slice(0, g.spread || 1);
    if (!hits.length) tracer(from, tmp.set(h.pos.x + Math.sin(h.heading) * g.range, from.y, h.pos.z + Math.cos(h.heading) * g.range), '#ffe9a0');
    for (const { e, kind } of hits) {
      tracer(from, tmp.set(e.pos.x, (e.y || 0) + 1, e.pos.z), '#ffe9a0');
      if (kind === 'crowd') squash(e);
      else if (kind === 'beat') beatDown();
      else { e.hp -= g.dmg; spray(e.pos, ['#ffb347', '#fff3a0'], 5, 5); if (e.hp <= 0) blowCop(e); }
    }
    play(run.gun === 'sg' ? 'shotgun' : 'shot', run.gun === 'ak' ? .55 : .9, run.gun === 'ak' ? 1.2 : rand(.95, 1.05)) || noise(run.gun === 'sg' ? .35 : .14, run.gun === 'sg' ? 900 : 1600, run.gun === 'sg' ? .9 : .6, 'bandpass');
    if (heat < .6) { heat = .6; lastKill = now; }
  }
  function squash(s) {
    const courier = s.k.kind === 'courier', gold = courier ? 1337 : pick([228, 322, 69, 420, 1337, 228]);
    s.dead = true; s.respawn = rand(5, 9);
    run.gold += gold; courier ? run.couriers++ : run.spiders++;
    streak = now - lastKill < 3 ? streak + 1 : 1; lastKill = now;
    heat = Math.min(5, heat + (courier ? 1 : .35));
    splat(s.pos, s.k.kind); spray(s.pos, courier ? ['#8a6a4a', '#d4b24a', '#5a4330'] : ['#160c18', '#3fbf2a', '#ff4fb8'], 14, 7);
    floatText('+' + gold, s.pos);
    if (!play('splat', 1, rand(.8, 1.2))) { noise(.2, 900, .5, 'bandpass'); noise(.14, 180, .5, 'lowpass'); }
    play('coins', .35);
    if (firstBlood) { firstBlood = false; ann('FIRST BLOOD'); }
    else if (STREAK[Math.min(streak, 5)]) ann(STREAK[Math.min(streak, 5)]);
    else if (courier) ann('КУРЬЕР УБИТ', 'gold');
  }

  function reset() {
    while (cops.length) dropCop(0);
    for (const c of cars.splice(0)) if (!homes.includes(c)) scene.remove(c.mesh);
    for (const c of homes) {
      const [x, z, h] = c.home;
      c.pos.set(x, 0, z); c.heading = h; c.speed = 0; c.vel.set(0, 0, 0); c.y = groundY(x, z); c.stolen = false; c.mesh.visible = true; c.mesh.rotation.z = 0;
      cars.push(c); place(c, 1);
    }
    if (race) { for (const c of race.cars) scene.remove(c.mesh); race = null; }
    player = myCar; hero.mesh.visible = false; zone = 'city'; room = null; mapC.hidden = false; raceGate.inside = false;
    beat.active = false; beat.mesh.visible = false; beat.cd = 0;
    hp = 100; heat = 0; bust = 0; invuln = 0; streak = 0; lastKill = -99; firstBlood = true; spawnCD = 0; shakeAmt = 0;
    run = { gold: 0, spiders: 0, couriers: 0, stars: 0, time: 0, engine: 0, armor: false, seeds: 0, job: null, jobs: 0, deaths: 0, guns: {}, gun: null, drunk: 0, energy: 0, bahily: false };
    heroGun.visible = false;
    stamina = 1; setWeather();
    for (const d of doors) d.inside = false;
    for (const s of crowd) { s.pos.copy(spot(25)); s.dead = false; }
    for (const g of gibs) g.life = 0;
    for (const m of splats) m.visible = false;
    dlg.classList.remove('dying'); hintEl.textContent = ''; annEl.className = 'g-ann';
    place(player, 1);
  }
  function update(dt) {
    run.time += dt; invuln = Math.max(0, invuln - dt);
    if (now - lastHurt > 6 && hp < 100) hp = Math.min(100, hp + 4 * dt);
    run.drunk = Math.max(0, run.drunk - dt); run.energy = Math.max(0, run.energy - dt);
    const steer = clamp((on('left') ? 1 : 0) - (on('right') ? 1 : 0) + (run.drunk ? Math.sin(now * 2.1) * .45 : 0), -1, 1);
    if (player.foot) {
      const sprint = (on('sprint') || (touch && on('down'))) && stamina > .03;
      stamina = clamp(stamina + (sprint && !run.energy ? -.22 : .16) * dt, 0, 1);
      walk(player, on('up') || sprint ? 1 : !touch && on('down') ? -1 : 0, steer, dt, sprint ? (run.energy ? 13 : 11) : 7);
      fireCD -= dt; aimT -= dt;
      heroGun.visible = !!run.gun;
      if (run.gun && (on('hand') || on('fire') || on('mouse')) && fireCD <= 0) fire();
      if (aimT > 0) hero.arms[0].rotation.x = -1.5;
    } else {
      const gas = (on('up') ? 1 : 0) - (on('down') ? 1 : 0), before = Math.abs(player.speed), imp = drive(player, gas, steer, on('hand') || on('sprint'), dt, player.spec.top + run.engine * 4);
      if (imp > 6) { play('crash', Math.min(1, imp / 18)) || noise(.35, 500, Math.min(.8, imp / 20), 'lowpass'); spray(tmp.copy(player.pos).addScaledVector(fwd, 2), ['#ffb347', '#fff3a0'], 6, 5); }
      if (imp > 14 && before > 14) hurt((imp - 14) * 1.2, 'wall');
      player.mesh.rotation.z = -steer * Math.min(1, Math.abs(player.speed) / 20) * .06;
    }
    player.mesh.visible = invuln <= 0 || now * 10 % 2 < 1.4;
    if (zone === 'inside') { roomStep(); return; }
    if (zone === 'race') { raceStep(dt); return; }
    if (player.pos.x < -RIVER) { die('kama'); return; }
    const atGate = Math.hypot(player.pos.x - raceGate.x, player.pos.z - raceGate.z) < 4;
    if (atGate && !raceGate.inside) { raceGate.inside = true; openShop(raceGate); return; }
    raceGate.inside = atGate;
    doorNear = null;
    for (const d of doors) {
      const dist = Math.hypot(player.pos.x - d.x, player.pos.z - d.z), inside = player.foot && dist < 1.9;
      if (inside && !d.inside) { d.inside = true; enterRoom(d); return; }
      d.inside = inside;
      if (!player.foot && dist < 6) doorNear = d;
    }
    for (const c of cars) {
      if (c === player) continue;
      if (c.speed || c.vel.lengthSq() > .0025) { drive(c, 0, 0, true, dt, c.spec.top); if (Math.abs(c.speed) < .05 && c.vel.lengthSq() < .0025) { c.speed = 0; c.vel.set(0, 0, 0); } }
      bump(player, c);
      for (const p of cops) bump(p, c);
    }
    const want = Math.ceil(heat - 1e-6);
    run.stars = Math.max(run.stars, want);
    if (cops.length < want && (spawnCD -= dt) <= 0) { spawnCop(); spawnCD = 1.5; }
    let near = Infinity;
    for (let k = cops.length - 1; k >= 0; k--) {
      const c = cops[k], d = c.pos.distanceTo(player.pos);
      if ((want === 0 && d > 30) || (cops.length > want && d > 70)) { dropCop(k); continue; }
      copThink(c, dt); near = Math.min(near, d);
      const hit = bump(player, c);
      if (hit > 5) { hurt((hit - 5) * 1.1 + 2, 'cop'); play('crash', Math.min(1, hit / 15)) || noise(.3, 600, Math.min(.8, hit / 15), 'lowpass'); }
    }
    for (let a = 0; a < cops.length; a++) for (let b = a + 1; b < cops.length; b++) bump(cops[a], cops[b]);
    if (heat >= 3) for (const c of cops) {
      if ((c.gunCD -= dt) > 0) continue;
      c.gunCD = rand(1, 1.6);
      if (c.pos.distanceTo(player.pos) > 40 || !clear(c.pos, player.pos)) continue;
      const hit = Math.random() < .35;
      tracer(tmp2.set(c.pos.x, c.y + 1.6, c.pos.z), tmp.set(player.pos.x + (hit ? 0 : rand(-2, 2)), player.y + 1.2, player.pos.z + (hit ? 0 : rand(-2, 2))), '#ff5a3a');
      play('shot', .3, .85) || noise(.12, 1400, .35, 'bandpass');
      if (hit) { hurt(player.foot ? 9 : 6, 'cop'); if (player.foot && Math.random() < .4) play(pick(['scream1', 'scream2']), .7); }
    }
    const grabbed = beatStep(dt); jobStep();
    if (now - lastKill > 8 && near > 35) heat = Math.max(0, heat - (player.spec.chill ? .6 : .3) * dt);
    if (grabbed || (Math.abs(player.speed) < 2.5 && near < 10 && invuln <= 0)) bust += dt * (grabbed ? 1.4 : 1); else bust = Math.max(0, bust - dt * 2);
    if (bust > 2.2) die('bust');
  }
  function crowdStep(dt) {
    for (const s of crowd) {
      const k = s.k, idx = s.i;
      if (s.dead) {
        if ((s.respawn -= dt) <= 0) { s.dead = false; s.pos.copy(spot(40)); }
      } else {
        s.t += dt;
        const dx = s.pos.x - player.pos.x, dz = s.pos.z - player.pos.z, d = Math.hypot(dx, dz);
        const scared = state === 'play' && !player.foot && d < 14 && Math.abs(player.speed) > 6;
        if (scared) s.heading = Math.atan2(dx, dz) + Math.sin(s.t * 3) * .6; else s.heading += Math.sin(s.t * 1.7 + s.seed) * dt * 1.6;
        const v = scared ? k.run : k.walk;
        s.vel.set(Math.sin(s.heading) * v, 0, Math.cos(s.heading) * v);
        s.pos.addScaledVector(s.vel, dt);
        if (collide(s, .9) > 0) s.heading += Math.PI * rand(.6, 1.4);
        if (Math.abs(s.pos.x) > EDGE - 2 || Math.abs(s.pos.z) > EDGE - 2) s.heading = Math.atan2(-s.pos.x, -s.pos.z);
        if (state === 'play' && (player.foot ? d < 1.8 && player.speed > 1 : d < 2.7 && Math.abs(player.speed) > 4)) squash(s);
      }
      dummy.position.set(s.pos.x, groundY(s.pos.x, s.pos.z) + Math.abs(Math.sin(s.t * 14)) * .15, s.pos.z);
      dummy.rotation.set(0, s.heading + Math.sin(s.t * 20) * .15, 0);
      dummy.scale.setScalar(s.dead ? 0 : k.size); dummy.updateMatrix();
      k.mesh.setMatrixAt(idx, dummy.matrix);
    }
    for (const k of crowdKinds) k.mesh.instanceMatrix.needsUpdate = true;
  }
  function effects(dt) {
    for (let i = 0; i < gibs.length; i++) {
      const g = gibs[i];
      if (g.life > 0) {
        g.life -= dt; g.vel.y -= 22 * dt; g.pos.addScaledVector(g.vel, dt);
        if (g.pos.y < .2) { g.pos.y = .2; g.vel.multiplyScalar(.5); g.vel.y *= -.4; }
      }
      dummy.position.copy(g.pos); dummy.rotation.set(g.life * g.spin, g.life * g.spin * .7, 0); dummy.scale.setScalar(g.life > 0 ? Math.min(1, g.life * 2) : 0); dummy.updateMatrix();
      gibMesh.setMatrixAt(i, dummy.matrix);
    }
    gibMesh.instanceMatrix.needsUpdate = true;
    for (const d of doors) {
      d.ring.scale.set(1 + Math.sin(now * 4) * .06, 1, 1 + Math.sin(now * 4) * .06);
      d.ring.material.opacity = .35 + Math.sin(now * 4) * .15;
      d.icon.position.set(d.x, d.y + 3.6 + Math.sin(now * 2.5) * .3, d.z);
    }
    if (state === 'win' && (winT += dt) > .3) {
      winT = 0;
      const m = doors.find(d => d.kind === 'mvd');
      spray(tmp2.set(m.x + rand(-14, 14), rand(18, 30), m.z + rand(-16, 4)), ['#ff4fb8', '#ffd24a', '#39ff6a', '#2a6bff', '#fff'], 22, 9);
      noise(.5, 160, .35, 'lowpass');
    }
    for (const c of crews) c.icon.position.set(c.x, 3.4 + Math.sin(now * 2 + c.x) * .25, c.z + 1.4);
    const delivering = run.job && !run.job.kill;
    drop.ring.visible = drop.icon.visible = !!delivering;
    if (delivering) { drop.ring.material.opacity = .4 + Math.sin(now * 6) * .2; drop.icon.position.set(drop.x, 4 + Math.sin(now * 3) * .4, drop.z); }
    if (beat.active) place(beat, dt);
    for (const p of world.smoke) {
      p.phase = (p.phase + dt * .05) % 1;
      p.mesh.position.set(p.x + p.phase * 18, 72 + p.phase * 40, p.z + p.phase * 6);
      p.mesh.scale.setScalar(5 + p.phase * 16);
    }
    const flash = now * 6 % 2 < 1;
    for (const tr of tracers) if (tr.t > 0 && (tr.t -= dt) <= 0) tr.line.visible = false;
    for (const c of cops.concat(cars)) {
      if (c.lights.length) { c.lights[0].visible = flash; c.lights[1].visible = !flash; }
      if (c !== player) place(c, dt);
    }
    if (cause === 'kama' && (state === 'dying' || state === 'over')) { player.y = Math.max(player.y - dt * 1.2, -3); player.mesh.position.y = player.y; }
    else if (state !== 'title') place(player, dt);
  }
  function chase(dt, snap) {
    const portrait = camera.aspect < .9, v = Math.abs(player.speed), foot = player.foot;
    const inRoom = zone === 'inside', back = inRoom ? (portrait ? 6 : 5) : foot ? (portrait ? 8 : 6) : (portrait ? 14 : 10) + v * .12, up = inRoom ? 3 : foot ? (portrait ? 5 : 3.2) : (portrait ? 8.5 : 4.8) + v * .05;
    fwd.set(Math.sin(player.heading), 0, Math.cos(player.heading));
    tmp.copy(player.pos).addScaledVector(fwd, -back); tmp.y = player.y + up;
    const t = hitT(player.pos, tmp, player.y + 1.5, tmp.y);
    if (t < 1) tmp.lerpVectors(tmp2.set(player.pos.x, player.y + 1.5, player.pos.z), tmp, Math.max(.12, t - .06));
    camera.position.lerp(tmp, snap ? 1 : 1 - Math.exp(-(t < 1 ? 18 : 5) * dt));
    if (shakeAmt > .01) { camera.position.x += rand(-1, 1) * shakeAmt; camera.position.y += rand(-1, 1) * shakeAmt * .5; shakeAmt *= Math.exp(-7 * dt); }
    tmp2.copy(player.pos).addScaledVector(fwd, foot ? 3 : 6); tmp2.y = player.y + (foot ? 1.6 : 1.2);
    camera.lookAt(tmp2);
    if (run.drunk) { camera.rotation.z += Math.sin(now * 1.3) * .09; camera.position.y += Math.sin(now * 1.7) * .25; }
  }
  function show(text, key, el) { if (shown[key] !== text) { shown[key] = text; el.textContent = text; } }
  function drawHud() {
    const want = Math.ceil(heat - 1e-6);
    if (shown.stars !== want) { shown.stars = want; stars.forEach((s, k) => s.classList.toggle('on', k < want)); }
    wantedEl.classList.toggle('cool', want > 0 && now - lastKill > 8);
    show(`💰 ${run.gold || 0} / ${GOAL}`, 'gold', goldEl);
    show(`🛡 ${site.loot.aegis} · 🧀 ${site.loot.cheese}${run.drunk ? ' · 🥴' : ''}${run.energy ? ' · ⚡' : ''}`, 'loot', lootEl);
    show(run.gun ? `🔫 ${GUNS[run.gun].name} · ${run.guns[run.gun]}${Object.keys(run.guns).length > 1 ? ' ⇄' : ''}` : '', 'gun', gunEl);
    const w = Math.round(hp) + '%';
    if (shown.hp !== w) { shown.hp = w; hpEl.style.width = w; }
    const near = state === 'play' && player.foot ? nearestCar() : null;
    const crew = state === 'play' ? nearCrew() : null;
    show(crew ? 'БАЗАР' : player.foot ? (near ? 'СЕСТЬ' : run.gun ? 'ОГОНЬ' : '—') : 'ВЫЙТИ', 'act', actEl);
    const j = run.job;
 show(race ? `🏁 Круг ${clamp(race.car.lap + 1, 1, TR.laps)}/${TR.laps} · место ${racePlace()}/11 · ${clockStr(Math.max(0, run.time - race.start))}` : '', 'race', raceEl);
    show(j ? `🎯 ${j.kill ? `Пауки ${Math.min(j.need, run.spiders + run.couriers - j.base)}/${j.need}` : 'Передачка на ГРЭС'} · ${clockStr(Math.max(0, j.until - run.time))}` : '', 'job', jobEl);
    radio.hidden = !(state === 'play' && !player.foot);
    if (!radio.hidden && now > radioAt) { radioAt = now + 7; radio.textContent = '📻 Добрянка FM · ' + pick(RADIO)(); radio.classList.remove('on'); void radio.offsetWidth; radio.classList.add('on'); }
    show(`${weather.icon} ${temp > 0 ? '+' : ''}${temp}° Добрянка`, 'weather', weatherEl);
    show(player.foot ? 'БЕГ' : 'ТОРМОЗ', 'down', downEl);
    stamEl.hidden = !player.foot || state !== 'play';
    const sw = Math.round(stamina * 100) + '%';
    if (shown.stam !== sw) { shown.stam = sw; stamEl.firstChild.style.width = sw; }
    if (state === 'play' && bust > .3) show(player.foot ? 'МВД принимает… беги!' : 'МВД принимает… газуй!', 'hint', hintEl);
    else if (now <= hintUntil) shown.hint = hintEl.textContent;
    else if (doorNear && state === 'play') show(`Вылези из тачки (${touch ? 'кнопка сверху' : 'F'}) и зайди в кольцо: ${SHOPDEF[doorNear.kind].title}`, 'hint', hintEl);
    else show(crew && !touch ? 'F — побазарить с Триадой' : near && !touch ? `F — ${near === myCar ? 'сесть в свою девятку' : 'угнать ' + near.spec.name}` : '', 'hint', hintEl);
    drawMap();
  }
  function frame(t) {
    const dt = Math.min(.05, (t - last) / 1000 || 0);
    last = t; now += dt;
    const w = dlg.clientWidth, h = dlg.clientHeight;
    if (w !== shown.w || h !== shown.h) {
      shown.w = w; shown.h = h; renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.fov = camera.aspect < .9 ? 80 : 62; camera.updateProjectionMatrix();
    }
    if (state === 'play') update(dt);
    else if (state === 'dying' && (dyingT -= dt) <= 0) revive();
    crowdStep(dt); effects(dt); weatherStep(dt);
    if (state === 'title') { const a = now * .06; camera.position.set(Math.sin(a) * 175, 80, Math.cos(a) * 175); camera.lookAt(0, 6, 0); }
    else if (state === 'win') { const m = doors.find(d => d.kind === 'mvd'), a = now * .2; camera.position.lerp(tmp.set(m.x + Math.sin(a) * 38, 16, m.z + Math.cos(a) * 38), 1 - Math.exp(-1.5 * dt)); camera.lookAt(m.x, 10, m.z - 4); }
    else if (state === 'over') { const a = now * .25; camera.position.lerp(tmp.set(player.pos.x + Math.sin(a) * 16, player.y + 9, player.pos.z + Math.cos(a) * 16), 1 - Math.exp(-2 * dt)); camera.lookAt(player.pos.x, player.y + 1, player.pos.z); }
    else chase(dt);
    sky.position.copy(camera.position);
    sun.position.copy(camera.position).addScaledVector(sunDir, 600); sun.lookAt(camera.position);
    sound(); drawHud();
    renderer.render(scene, camera);
  }

  const best = {
    get() { try { return +localStorage.getItem('gtaBest') || 0; } catch (e) { return 0; } },
    set(v) { try { localStorage.setItem('gtaBest', v); } catch (e) {} }
  };
  const RADIO = [
    () => `Сводка МВД: разыскивается ${player.spec.name === 'девятку' ? 'вишнёвая девятка' : player.spec.name}, водитель — конченый. Граждане, не выходите из подъездов`,
    () => `Сегодня в Добрянке раздавлено пауков: ${run.spiders}. Брудмама в ахуе, Азалина в депрессии`,
    () => `Погода: ${weather.name.toLowerCase()}, ${temp > 0 ? '+' : ''}${temp}. Над ГРЭС дым идёт на Пермь, Пермь, держитесь`,
    () => 'Новости культуры: в парке открыли памятник создателю промптов. Голуби уже в курсе',
    () => 'Реклама. Шаурма 24: мы не знаем, что внутри, и ты не узнаешь',
    () => 'Реклама. Казино «Крипта обмен»: ставь всё, Триада одобряет. Иди по 🎰 на карте',
    () => 'Шиномонтаж «У Палыча»: поставим движок от комбайна, без вопросов и без гарантии',
    () => 'Кама сегодня +4. Купаться можно только с Аегисом',
    () => 'Новости спорта: Pis`master снова слил Рошана и винит курьера',
    () => 'Участковый просит вернуть ему фуражку. Сука, верни фуражку',
    () => `Прописка в Добрянке по-прежнему ${GOAL}. МВД работает без выходных и без совести`,
    () => 'Хит недели: «Бруда — паучья любовь». Ставим в третий раз, пока не выучишь',
    () => 'Курьер опять сдох. Кто-то заказал варды прямо в Каму',
    () => 'Триада на районе напоминает: семки — это валюта',
    () => heat > 0 ? `Внимание! Розыск ${'🚨'.repeat(Math.ceil(heat))}. Все экипажи МВД выехали, участковый бежит пешком` : 'На дорогах Добрянки спокойно. Подозрительно спокойно'
  ];
  const bestTime = {
    get() { try { return +localStorage.getItem('gtaBestTime') || 0; } catch (e) { return 0; } },
    set(v) { try { localStorage.setItem('gtaBestTime', v); } catch (e) {} }
  };
  const clockStr = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function shopItems(kind) {
    const stars = Math.ceil(heat - 1e-6);
    if (kind === 'shawarma') return [
      { name: 'Шаурма', note: 'полное здоровье, но 1 из 10 — отравление', price: 228, buy: () => { if (Math.random() < .1) { hp = Math.max(1, hp - 30); return 'Отравился. Кошка была несвежая, −30 здоровья'; } hp = 100; return 'Сожрал. Здоровье полное'; } },
      { name: 'Сыр с Рошана', note: '+1 сыр навсегда: сам лечит, когда здоровья мало', price: 1337, buy: () => { site.loot.cheese++; site.saveLoot(); return 'Сыр в кармане. Пахнет Рошаном'; } },
      { name: 'Семки', note: 'ничего не дают, но на районе ты свой', price: 69, buy: () => { run.seeds++; return 'Лузгаешь семки. Триада уважает'; } }
    ];
    if (kind === 'tire') return [
      { name: 'Ремонт', note: 'тачка как новая, ты тоже', price: 150, buy: () => { hp = 100; return 'Палыч постучал молотком. Как новая'; } },
      { name: `Движок от комбайна ${Math.min(run.engine + 1, 3)}/3`, note: '+4 к скорости на любой тачке до конца заезда', price: 500 * (run.engine + 1), off: run.engine >= 3, buy: () => { run.engine++; return 'Движок встал. Почти'; } },
      { name: 'Броня из гаражных ворот', note: 'в тачке получаешь на 40% меньше', price: 700, off: run.armor, buy: () => { run.armor = true; return 'Приварили ворота от гаража соседа'; } }
    ];
    if (kind === 'crypto') return [228, 1337, run.gold].map((bet, k) => ({
      name: k === 2 ? 'Вложить всё' : `Поставить ${bet}`, note: 'х2 или в ноль, иногда биржу накрывают', price: bet, off: !bet,
      buy: () => {
        const r = Math.random();
        if (r < .1) { heat = Math.min(5, heat + 1); lastKill = now; return 'Биржу накрыли МВД Добрянки. Минус ставка и +1 розыск'; }
        if (r < .55) return `Бирка упала. Минус ${bet}`;
        run.gold += bet * 2; return `Бирка выросла! +${bet}`;
      }
    }));
    if (kind === 'strip') return [
      { name: 'Кинуть 228', note: 'Бруда делает лишний круг', price: 228, buy: () => { tipDancers(4); return pick(['Бруда довольна', 'Пудж подмигнул', 'Плюс уважение на районе']); } },
      { name: 'Кинуть 1337', note: 'денежный дождь, здоровье полное от счастья', price: 1337, buy: () => { tipDancers(10); hp = 100; return 'ДЕНЕЖНЫЙ ДОЖДЬ. Бруда в ахуе'; } },
      { name: 'Приват с Пуджем', note: 'что было в подсобке — остаётся в подсобке', price: 5000, buy: () => { tipDancers(15); site.loot.aegis++; site.saveLoot(); return 'Пудж выдал тебе Аегис. Не спрашивай откуда'; } }
    ];
    if (kind === 'guns') return [
      ...Object.entries(GUNS).map(([key, g]) => ({ name: g.name, note: run.guns[key] !== undefined ? `уже есть, патронов ${run.guns[key]}` : `${key === 'sg' ? 'косит пачку пауков разом' : key === 'ak' ? 'очередями, как в девяностые' : 'классика участкового'}, ${g.ammo} патронов`, price: g.price, off: run.guns[key] !== undefined, buy: () => { run.guns[key] = g.ammo; run.gun = key; hint(touch ? 'Пешком: круглая кнопка — огонь, тап по стволу — сменить' : 'Пробел или клик — огонь, Q — сменить ствол', 3); return `${g.name} твой. Не свети на районе`; } })),
      { name: 'Патроны', note: run.gun ? `к стволу «${GUNS[run.gun].name}»` : 'сначала купи ствол', price: 150, off: !run.gun, buy: () => { run.guns[run.gun] += GUNS[run.gun].refill; return 'Насыпали в пакет из Пятёры'; } },
      { name: 'Удочка', note: 'в Каме ничего не ловится, но выглядишь солидно', price: 228, buy: () => 'Удочка в багажнике. Рыба в Каме смеётся' }
    ];
    if (kind === 'pharmacy') return [
      { name: 'Аптечка', note: 'полное здоровье, без кошек', price: 300, buy: () => { hp = 100; return 'Забинтовали. Как новый'; } },
      { name: 'Боярышник', note: '30 секунд всё плывёт, зато смелый', price: 69, buy: () => { run.drunk = 30; return 'Местный классик. Земля качается'; } },
      { name: 'Энергетик «Триада»', note: 'минуту бегаешь без устали и быстрее', price: 150, buy: () => { run.energy = 60; stamina = 1; return 'Сердце стучит как саб в девятке'; } },
      { name: 'Активированный уголь', note: 'лечит от боярышника. От МВД не лечит', price: 50, buy: () => { run.drunk = 0; return 'Протрезвел. Обидно'; } },
      { name: 'Бахилы', note: 'в ЦРБ после смерти заберут вдвое меньше', price: 15, off: run.bahily, buy: () => { run.bahily = true; return 'Бахилы надеты. ЦРБ уважает'; } }
    ];
    if (kind === 'race') return [{ name: `Погнали: ${TR.laps} круга против 10 экипажей`, note: 'победа — 3000 и спорткар «Бруда GT», подиум — 1000. F — сдаться', price: 0, buy: () => { startRace(); } }];
    if (kind === 'pawn') return [['sport', 'Спорткар «Бруда GT»', 6000, 'скорость 46, держит дорогу как клей'], ['priora', 'Белая приора', 1500, 'скорость 38, гнётся от взгляда'], ['cart', 'Телега Батрайдера', 2280, 'медленная, но урон в 2 раза меньше'], ['uaz', 'Списанный УАЗ МВД', 3220, 'менты думают, что свой: розыск спадает в 2 раза быстрее']].map(([key, name, price, note]) => ({
      name, note, price, buy: () => {
        leaveShop(); exitRoom();
        const c = car(specs[key]);
        c.pos.set(shopDoor.x, 0, shopDoor.z + 6); c.heading = Math.PI / 2; c.stolen = true; scene.add(c.mesh); cars.push(c); place(c, 1);
        hero.mesh.visible = false; player = c; ann('ТАЧКА ТВОЯ', 'gold');
      }
    }));
    return [
      { name: 'Взятка участковому', note: stars ? 'розыск снимут, менты отстанут' : 'розыска нет, иди с богом', price: 300 * Math.max(1, stars), off: !stars, buy: () => { heat = 0; while (cops.length) dropCop(0); return 'Участковый взял и отвернулся. Розыск снят'; } },
      { name: 'Прописка в Добрянке', note: 'финал: Триада примет тебя как своего', price: GOAL, buy: () => { win(); } }
    ];
  }
  function tipDancers(n) {
    stripHype = now + n;
    for (let i = 0; i < n; i++) spray(tmp2.set(room.ox + rand(-3, 3), 4.5, room.oz + 3 + rand(-3, 3)), ['#3fbf2a', '#7ad65a', '#ffd24a'], 6, 3);
    play('coins', .8) || noise(.3, 2500, .3, 'bandpass');
  }
  const SYMS = [['🍒', 30], ['🕷️', 25], ['🧀', 18], ['🛡️', 12], ['💰', 10], ['7️⃣', 5]], PAY = { '🍒': 4, '🕷️': 5, '🧀': 6, '🛡️': 8, '💰': 10, '7️⃣': 20 };
  const sym = () => { let r = rand(0, 100); for (const [s, w] of SYMS) if ((r -= w) < 0) return s; return '🍒'; };
  const reelHtml = list => `<div class="g-reel"><div>${list.map(s => `<span>${s}</span>`).join('')}</div></div>`;
  const slotsHtml = (msg, faces) => `<p class="g-kicker">🎰 Однорукий бандит «Триада»</p><p class="g-inv">💰 ${run.gold}</p><div class="g-reels">${(faces || [sym(), sym(), sym()]).map(f => reelHtml([f])).join('')}</div><p class="g-msg">${msg || 'Три одинаковых — выигрыш до ×20. 🛡️🛡️🛡️ — настоящий Аегис, 🧀🧀🧀 — сыр'}</p><div class="g-btns">${[100, 500, 1337].map(b => `<button type="button" data-spin="${b}"${run.gold < b ? ' disabled' : ''}>${b} 💰</button>`).join('')}<button type="button" class="g-out" data-go="leave">УЙТИ</button></div>`;
  function openSlots() {
    shopDoor = { kind: 'slots' }; state = 'shop';
    for (const k in keys) keys[k] = false;
    screen(slotsHtml(), '[data-spin]:not(:disabled)');
  }
  function spin(bet) {
    if (spinning || run.gold < bet || state !== 'shop') return;
    spinning = true; run.gold -= bet;
    const res = [sym(), sym(), sym()];
    scr.querySelectorAll('[data-spin],[data-go]').forEach(b => b.disabled = true);
    scr.querySelector('.g-inv').textContent = '💰 ' + run.gold;
    scr.querySelector('.g-msg').textContent = 'Крутится…';
    scr.querySelectorAll('.g-reel').forEach((reel, i) => {
      const list = Array.from({ length: 24 + i * 6 }, sym).concat(res[i]);
      reel.outerHTML = reelHtml(list);
    });
    const strips = [...scr.querySelectorAll('.g-reel div')];
    requestAnimationFrame(() => strips.forEach((st, i) => { st.style.transition = `transform ${1 + i * .45}s cubic-bezier(.12,.7,.18,1)`; st.style.transform = `translateY(calc(-100% + var(--cell)))`; }));
    let ticks = 0;
    const ratchet = play('slotspin', .7) ? 0 : setInterval(() => { noise(.03, 2600, .15, 'bandpass'); if (++ticks > 34) clearInterval(ratchet); }, 60);
    setTimeout(() => {
      clearInterval(ratchet); spinning = false;
      const [a, b, c] = res;
      let win = 0, msg;
      if (a === b && b === c) {
        win = bet * PAY[a];
        if (a === '🛡️') { site.loot.aegis++; site.saveLoot(); }
        if (a === '🧀') { site.loot.cheese++; site.saveLoot(); }
        msg = `ДЖЕКПОТ ${a}${a}${a}! +${win}${a === '🛡️' ? ' и Аегис' : a === '🧀' ? ' и сыр' : ''}`;
        ann('ДЖЕКПОТ', 'gold');
      } else if (a === b || b === c || a === c) {
        const pair = a === b || a === c ? a : b;
        win = Math.round(bet * (pair === '🍒' ? 2 : 1.4));
        msg = `Пара ${pair}${pair} — +${win}`;
      } else msg = pick(['Мимо. Казино всегда в плюсе', 'Пусто. Триада благодарит за вклад', 'Ничего. Ещё разок?']);
      run.gold += win;
      if (state !== 'shop' || shopDoor.kind !== 'slots') { if (win) hint(msg, 2.5); return; }
      (win && play(a === b && b === c ? 'slotwin' : 'coins')) || noise(win ? .4 : .15, win ? 3000 : 400, .35, win ? 'bandpass' : 'lowpass');
      screen(slotsHtml(msg, res), `[data-spin="${bet}"]:not(:disabled)`);
    }, 2100);
  }
  function shopHtml(msg) {
    const def = SHOPDEF[shopDoor.kind];
    return `<p class="g-kicker">${def.icon} ${def.title}</p><p>${def.sub}</p><p class="g-inv">💰 ${run.gold} · ❤️ ${Math.round(hp)}</p>${msg ? `<p class="g-msg">${msg}</p>` : ''}<div class="g-shop">${shopItems(shopDoor.kind).map((it, k) => `<button type="button" data-buy="${k}"${it.off || run.gold < it.price ? ' disabled' : ''}><b>${it.name}</b><span>${it.note}</span><i>${it.price ? it.price + ' 💰' : ''}</i></button>`).join('')}</div><div class="g-btns"><button type="button" class="g-out" data-go="leave">УЙТИ</button></div>`;
  }
  function openShop(d) {
    shopDoor = d; state = 'shop';
    for (const k in keys) keys[k] = false;
    screen(shopHtml(''), '[data-buy]:not(:disabled)');
    noise(.15, 2200, .25, 'bandpass');
  }
  function leaveShop() { if (state !== 'shop') return; state = 'play'; screen(''); dlg.focus(); }
  function buy(k) {
    const it = shopItems(shopDoor.kind)[k];
    if (!it || it.off || run.gold < it.price) return;
    run.gold -= it.price;
    play('cash') || noise(.12, 3000, .3, 'bandpass');
    const msg = it.buy();
    if (state === 'shop') screen(shopHtml(msg), `[data-buy="${k}"]:not(:disabled)`);
  }
  function win() {
    leaveShop(); exitRoom(); state = 'win'; winT = 0;
    while (cops.length) dropCop(0);
    ann('ПРОПИСКА ПОЛУЧЕНА', 'gold');
    const prev = bestTime.get(), record = !prev || run.time < prev;
    if (record) bestTime.set(run.time);
    setTimeout(() => { if (state === 'win' && opened) screen(winHtml(record, prev)); }, 3800);
  }
  const winHtml = (record, prev) => `<p class="g-kicker">Прописка получена</p><h2 class="g-dead g-win">ТРИАДА ПРИНИМАЕТ ТЕБЯ</h2><p>Теперь ты официально житель Добрянки. Участковый жмёт руку, Pis\`master наливает, Азалина подписалась.</p><ul class="g-recap"><li>Время: <b>${clockStr(run.time)}</b>${record ? ' — рекорд!' : ` · рекорд ${clockStr(prev)}`}</li><li>Пауков раздавлено: <b>${run.spiders}</b></li><li>Курьеров: <b>${run.couriers}</b></li><li>Золота осталось: <b>${run.gold}</b></li><li>Смертей по дороге: <b>${run.deaths}</b></li></ul><div class="g-btns"><button type="button" data-go="play">ЕЩЁ РАЗ</button><button type="button" class="g-out" data-go="out">НА САЙТ</button></div>`;
  const mapC = $('.g-map'), mx = mapC.getContext('2d'), MS = mapC.width, MR = RIVER + 8, msc = MS / (2 * MR);
  const toMap = (x, z) => [(MR - x) * msc, (MR - z) * msc];
  const mapBase = canvas(MS, MS), mb = mapBase.getContext('2d');
  mb.fillStyle = '#24361f'; mb.fillRect(0, 0, MS, MS);
  mb.fillStyle = '#6b665a'; mb.fillRect(toMap(-EDGE, 0)[0], 0, MS, MS);
  mb.fillStyle = '#2d5a8f'; mb.fillRect(toMap(-RIVER, 0)[0], 0, MS, MS);
  { const [x0, y0] = toMap(EDGE, EDGE), [x1, y1] = toMap(-EDGE, -EDGE); mb.fillStyle = '#3a3444'; mb.fillRect(x0, y0, x1 - x0, y1 - y0); }
  for (const b of world.blocks) {
    const half = (CELL - ROAD) / 2, [x0, y0] = toMap(b.cx + half, b.cz + half);
    mb.fillStyle = b.type === 'mvd' ? '#2a5fd0' : b.type === 'gres' ? '#b8432f' : b.type === 'park' || b.type === 'statue' ? '#3f7a3a' : '#7a7088';
    mb.fillRect(x0, y0, half * 2 * msc, half * 2 * msc);
  }
  mb.font = `${Math.round(MS / 11)}px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif`; mb.textAlign = 'center'; mb.textBaseline = 'middle';
  for (const d of doors) { const [x, y] = toMap(d.x, d.z); mb.fillText(SHOPDEF[d.kind].icon, x, y); }
  for (const c of crews) { const [x, y] = toMap(c.x, c.z); mb.fillText('🗣️', x, y); }
  for (const b of world.blocks) if (b.type === 'statue') { const [x, y] = toMap(b.cx, b.cz); mb.fillText('🗿', x, y); }
  const TMR = 320, tsc = MS / (2 * TMR), toTrack = (x, z) => [(TMR - (x - TR.ox)) * tsc, (TMR - (z - TR.oz)) * tsc];
  const trackBase = canvas(MS, MS), tb2 = trackBase.getContext('2d');
  tb2.fillStyle = '#24361f'; tb2.fillRect(0, 0, MS, MS); tb2.strokeStyle = '#3a3444'; tb2.lineWidth = TR.halfW * 2 * tsc + 2; tb2.lineJoin = 'round';
  tb2.beginPath(); tp.forEach((p, i) => { const [x, y] = toTrack(p.x, p.z); i ? tb2.lineTo(x, y) : tb2.moveTo(x, y); }); tb2.closePath(); tb2.stroke();
  { const [x, y] = toTrack(tp[0].x, tp[0].z); tb2.font = `${Math.round(MS / 11)}px system-ui,"Apple Color Emoji",sans-serif`; tb2.textAlign = 'center'; tb2.textBaseline = 'middle'; tb2.fillText('🏁', x, y); }
  mb.fillText('🏁', ...toMap(raceGate.x, raceGate.z));
  function drawMap() {
    if (zone === 'race') {
      mx.drawImage(trackBase, 0, 0);
      for (const c of race.cars) if (c !== player) { const [x, y] = toTrack(c.pos.x, c.pos.z); mx.fillStyle = '#2a6bff'; mx.beginPath(); mx.arc(x, y, MS / 50, 0, 7); mx.fill(); }
      const [x, y] = toTrack(player.pos.x, player.pos.z); mx.fillStyle = '#ff2fa8'; mx.beginPath(); mx.arc(x, y, MS / 32, 0, 7); mx.fill(); mx.strokeStyle = '#fff'; mx.lineWidth = MS / 100; mx.stroke();
      return;
    }
    mx.drawImage(mapBase, 0, 0);
    const blink = now * 4 % 2 < 1;
    for (const c of cops) { const [x, y] = toMap(c.pos.x, c.pos.z); mx.fillStyle = blink ? '#ff2030' : '#2a6bff'; mx.beginPath(); mx.arc(x, y, MS / 45, 0, 7); mx.fill(); }
    if (run.job && !run.job.kill && blink) { const [x, y] = toMap(drop.x, drop.z); mx.fillStyle = '#ffd24a'; mx.beginPath(); mx.arc(x, y, MS / 22, 0, 7); mx.fill(); }
    if (beat.active) { const [x, y] = toMap(beat.pos.x, beat.pos.z); mx.fillStyle = '#8fd0ff'; mx.fillRect(x - MS / 60, y - MS / 60, MS / 30, MS / 30); }
    const [px, py] = toMap(player.pos.x, player.pos.z), a = Math.atan2(-Math.cos(player.heading), -Math.sin(player.heading)), r = MS / 22;
    mx.save(); mx.translate(px, py); mx.rotate(a);
    mx.fillStyle = '#fff'; mx.strokeStyle = '#000'; mx.lineWidth = MS / 100;
    mx.beginPath(); mx.moveTo(r * 1.4, 0); mx.lineTo(-r, r * .9); mx.lineTo(-r * .4, 0); mx.lineTo(-r, -r * .9); mx.closePath(); mx.fill(); mx.stroke();
    mx.restore();
  }
  const tip = () => site.loot.aegis ? '' : '<p class="g-tip">Аегис = вторая жизнь. Падает с Рошана: таймер слева внизу на сайте, дождись и бей.</p>';
  const titleHtml = () => `<p class="g-kicker">Триада Games представляет</p><h2 class="g-title">GTA VI<span>Добрянка</span></h2><p>Перенесли семь раз. Вышла только в Добрянке.</p><p>${touch ? 'Слева руль, справа газ и тормоз (пешком — бег), круглая кнопка сверху — выйти из тачки или угнать чужую.' : 'WASD или стрелки, пробел — ручник, Shift — бег, F — выйти из тачки или угнать чужую, Esc — на сайт.'} Дави пауков и курьеров, от МВД уходи, в Каму не падай.</p><p class="g-goal">Цель: накопи ${GOAL} золота и купи прописку в МВД 🚔. Ларьки 🌯 🔧 🚗 💊 🔫, казино 🎰 и стрипуха 💃 на карте — заходи пешком внутрь. Триада 🗣️ даёт работу, на 🏁 — гонка с МВД.</p><p class="g-inv">🛡 Аегис: ${site.loot.aegis} · 🧀 Сыр: ${site.loot.cheese}${bestTime.get() ? ` · рекорд прописки ${clockStr(bestTime.get())}` : ''}</p>${tip()}<div class="g-btns"><button type="button" data-go="play">ПОЕХАЛИ</button></div>`;
  const overHtml = record => {
    const [title, sub] = DEATHS[cause] || DEATHS.cop, m = Math.floor(run.time / 60), s = Math.floor(run.time % 60);
    return `<h2 class="g-dead">${title}</h2><p>${sub}</p><ul class="g-recap"><li>Золото: <b>${run.gold}</b> / ${GOAL}${record && run.gold ? ' — рекорд!' : ''}</li><li>Пауков раздавлено: <b>${run.spiders}</b></li><li>Курьеров: <b>${run.couriers}</b></li><li>Розыск: ${'🚨'.repeat(run.stars) || 'не было'}</li><li>В игре: ${m}:${String(s).padStart(2, '0')}</li></ul>${tip()}<div class="g-btns"><button type="button" data-go="respawn">ВОСКРЕСНУТЬ</button><button type="button" class="g-out" data-go="play">ЗАНОВО</button><button type="button" class="g-out" data-go="out">НА САЙТ</button></div>`;
  };
  function screen(html, focus) {
    scr.hidden = !html;
    scr.classList.toggle('g-shopping', state === 'shop');
    scr.classList.toggle('g-strip', state === 'shop' && shopDoor && shopDoor.kind === 'strip');
    if (!html) return;
    scr.firstElementChild.innerHTML = html;
    (focus && scr.querySelector(focus) || scr.querySelector('[data-go]')).focus();
  }
  function start() {
    audio(); reset(); state = 'play'; screen(''); dlg.focus(); chase(0, true); ann('THE BATTLE BEGINS');
  }
  function hide() {
    if (!opened) return;
    opened = false; state = 'title';
    renderer.setAnimationLoop(null);
    if (ac) ac.suspend();
    document.body.classList.remove('gta');
    paused.forEach(v => v.play().catch(() => {})); paused = [];
    for (const k in keys) keys[k] = false;
    if (dlg.open) dlg.close();
  }

  scr.addEventListener('click', e => {
    const b = e.target.closest('[data-go],[data-buy],[data-spin]');
    if (!b) return;
    if (b.dataset.buy) buy(+b.dataset.buy);
    else if (b.dataset.go === 'play') start();
    else if (b.dataset.spin) spin(+b.dataset.spin);
    else if (b.dataset.go === 'leave') leaveShop();
    else if (b.dataset.go === 'respawn') respawn();
    else hide();
  });
  dlg.addEventListener('cancel', e => { if (state === 'shop') { e.preventDefault(); leaveShop(); } });
  $('.g-x').addEventListener('click', hide);
  dlg.addEventListener('close', hide);
  for (const t of ['click', 'pointerdown', 'pointermove', 'pointerup', 'mousemove']) dlg.addEventListener(t, e => e.stopPropagation());
  const pad = $('.g-pad');
  pad.addEventListener('pointerdown', e => {
    const b = e.target.closest('button');
    if (!b) return;
    e.preventDefault();
    if (b.hasAttribute('data-act')) {
      if (state === 'play' && player.foot && run.gun && !nearestCar() && !nearCrew()) { held.fire.add(e.pointerId); b.classList.add('held'); } else act();
      return;
    }
    held[b.dataset.k].add(e.pointerId); b.classList.add('held');
  });
  const release = e => { for (const k in held) held[k].delete(e.pointerId); pad.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('held', held[b.dataset.k].size > 0)); actEl.classList.toggle('held', held.fire.size > 0); };
  const switchGun = () => { const own = Object.keys(run.guns); if (own.length) run.gun = own[(own.indexOf(run.gun) + 1) % own.length]; };
  gunEl.addEventListener('click', switchGun);
  dlg.firstElementChild.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) keys.mouse = true; });
  dlg.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') keys.mouse = false; });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(t, release);
  pad.addEventListener('contextmenu', e => e.preventDefault());
  const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'hand', ShiftLeft: 'sprint', ShiftRight: 'sprint' };
  const driving = () => opened && (state === 'play' || state === 'dying');
  addEventListener('keydown', e => {
    if ((e.code === 'KeyF' || e.code === 'KeyE') && driving()) { e.preventDefault(); if (!e.repeat) act(); return; }
    if (e.code === 'KeyQ' && driving()) { e.preventDefault(); if (!e.repeat) switchGun(); return; }
    const k = KEYS[e.code];
    if (k && driving()) { keys[k] = true; e.preventDefault(); }
  });
  addEventListener('keyup', e => { const k = KEYS[e.code]; if (k) { keys[k] = false; if (driving()) e.preventDefault(); } });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  document.addEventListener('visibilitychange', () => { if (ac && opened) document.hidden ? ac.suspend() : ac.resume(); });

  return {
    show(s) {
      if (opened) return;
      site = s; opened = true; state = 'title';
      paused = [...document.querySelectorAll('video')].filter(v => !v.paused);
      paused.forEach(v => v.pause());
      document.body.classList.add('gta');
      dlg.showModal(); reset(); screen(titleHtml());
      last = performance.now(); renderer.setAnimationLoop(frame);
    }
  };
}

const CSS = `
body.gta{overflow:hidden}
#gta{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#120826;color:#fff;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font:600 16px/1.35 system-ui,-apple-system,sans-serif;outline:0}
#gta::backdrop{background:#000}
#gta [hidden]{display:none!important}
#gta>canvas{position:absolute;inset:0;width:100%;height:100%;display:block;transition:filter .4s}
#gta.dying>canvas{filter:grayscale(1) brightness(.7)}
.g-hud{position:absolute;inset:0;pointer-events:none}
.g-x{pointer-events:auto;position:absolute;left:12px;top:calc(10px + env(safe-area-inset-top,0px));width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.45);color:#fff;font:700 20px system-ui;cursor:pointer}
.g-stats{position:absolute;right:12px;top:calc(10px + env(safe-area-inset-top,0px));display:grid;justify-items:end;gap:5px;text-shadow:0 2px 0 #000,0 0 8px #000}
.g-wanted span{font-size:20px;opacity:.18;filter:grayscale(1)}
.g-wanted span.on{opacity:1;filter:none}
.g-wanted.cool span.on{animation:gBlink .5s steps(2) infinite}
.g-gold{color:#ffd24a;font:900 24px Georgia,serif}
.g-hp{width:150px;height:12px;border:1px solid #000;background:#3b0d0d;box-shadow:0 0 0 1px rgba(255,255,255,.3)}
.g-hp i{display:block;height:100%;width:100%;background:repeating-linear-gradient(90deg,#3fd14a 0 14px,#1d6b23 14px 15px);transition:width .15s}
.g-loot{font-size:15px}
.g-job{font-size:15px;font-weight:800;color:#ffd24a}
.g-job:empty{display:none}
.g-race{font:900 17px system-ui;color:#fff;background:rgba(0,0,0,.5);padding:4px 10px;border-radius:10px}
.g-race:empty{display:none}
.g-radio{position:absolute;left:50%;translate:-50% 0;bottom:calc(186px + env(safe-area-inset-bottom,0px));max-width:min(640px,calc(100% - 24px));padding:6px 12px;border-radius:999px;background:rgba(10,5,20,.7);border:1px solid rgba(255,255,255,.18);font-size:13px;font-weight:700;color:#f4e9ff;text-align:center}
.g-radio.on{animation:gRadio .5s ease-out}
.g-stam{width:150px;height:5px;background:rgba(0,0,0,.5)}
.g-stam i{display:block;height:100%;background:#8fd0ff}
.g-weather{font-size:14px;font-weight:800}
.g-gun{pointer-events:auto;padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.45);color:#fff;font:800 14px system-ui;cursor:pointer}
.g-gun:empty{display:none}
@media (hover:hover) and (pointer:fine){.g-radio{bottom:14px}.g-hint{bottom:56px}}
@keyframes gRadio{from{opacity:0;translate:-50% 8px}}
.g-ann{position:absolute;left:12px;right:12px;top:24%;text-align:center;font:900 clamp(1.8rem,7.5vw,4.5rem)/1 Georgia,serif;color:var(--pink,#ff4fb8);text-shadow:0 0 30px var(--pink,#ff4fb8),0 4px 0 #000;opacity:0}
.g-ann.show{animation:gAnn 1.7s ease-out}
.g-ann.gold{color:#ffd24a;text-shadow:0 0 30px #ffb000,0 4px 0 #000}
.g-hint{position:absolute;left:12px;right:12px;bottom:calc(222px + env(safe-area-inset-bottom,0px));text-align:center;font-weight:800;color:#8fd0ff;text-shadow:0 2px 0 #000,0 0 10px #000}
.g-float{position:absolute;translate:-50% -50%;font:900 22px Georgia,serif;color:#ffd24a;text-shadow:0 2px 0 #000;animation:gFloat .9s ease-out forwards}
.g-pad{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:flex-end;padding:12px 12px calc(14px + env(safe-area-inset-bottom,0px))}
.g-pad div{display:flex;gap:10px;align-items:flex-end}
.g-pad button{width:70px;height:70px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.35);color:#fff;font:800 12px system-ui;touch-action:none;-webkit-tap-highlight-color:transparent}
.g-pad button.held{background:rgba(255,79,184,.6)}
.g-pad .g-gas{width:86px;height:86px;background:rgba(57,255,106,.25)}
.g-pad .g-act{position:absolute;right:24px;bottom:calc(112px + env(safe-area-inset-bottom,0px));width:62px;height:62px;background:rgba(255,210,74,.3);font-size:11px}
@media (hover:hover) and (pointer:fine){.g-pad{display:none}}
.g-screen{position:absolute;inset:0;display:flex;padding:calc(24px + env(safe-area-inset-top,0px)) 16px calc(24px + env(safe-area-inset-bottom,0px));background:radial-gradient(ellipse at center,rgba(18,8,38,.45),rgba(18,8,38,.88));text-align:center;overflow:auto}
.g-screen>div{margin:auto;max-width:520px;display:grid;gap:12px;justify-items:center}
.g-screen p{margin:0;color:#f4e9ff;max-width:44ch}
.g-kicker.g-kicker{letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#ffd24a}
.g-title{margin:0;font:900 clamp(3.2rem,17vw,6.5rem)/.9 Georgia,serif;color:#fff;text-shadow:0 0 30px var(--pink,#ff4fb8),0 6px 0 #000}
.g-title span{display:block;margin-top:6px;font-size:.36em;letter-spacing:.14em;text-transform:uppercase;color:var(--pink,#ff4fb8)}
.g-inv.g-inv{color:#ffd24a;font-weight:800}
.g-tip.g-tip{color:#8fd0ff;font-size:14px}
.g-dead{margin:0;font:900 clamp(2rem,9vw,4rem)/1 Georgia,serif;color:#ff3b3b;text-shadow:0 0 24px #ff3b3b,0 4px 0 #000}
.g-recap{width:min(100%,380px);box-sizing:border-box;list-style:none;margin:0;padding:12px 18px;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(0,0,0,.4);display:grid;gap:4px;text-align:left}
.g-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:4px}
.g-btns button{padding:14px 28px;border-radius:999px;border:0;font:900 17px system-ui;cursor:pointer;background:linear-gradient(135deg,var(--violet,#7a2cff),var(--pink,#ff4fb8));color:#fff;box-shadow:0 0 24px rgba(255,79,184,.5)}
.g-btns .g-out{background:rgba(255,255,255,.1);box-shadow:none;border:1px solid rgba(255,255,255,.35)}
.g-btns button:focus-visible,.g-x:focus-visible{outline:3px solid #fff;outline-offset:3px}
.g-map{position:absolute;left:12px;top:calc(62px + env(safe-area-inset-top,0px));width:150px;height:150px;border-radius:12px;border:1px solid rgba(255,255,255,.3);box-shadow:0 4px 16px rgba(0,0,0,.5)}
.g-screen{touch-action:pan-y}
.g-screen.g-shopping{background:rgba(18,8,38,.82)}
.g-screen.g-strip{background:linear-gradient(to top,rgba(18,8,38,.92) 35%,transparent 75%)}
.g-screen.g-strip>div{margin:auto auto 0}
.g-reels{--cell:72px;display:flex;gap:10px;padding:12px;border-radius:16px;background:linear-gradient(#ffd24a,#8a6a10);box-shadow:0 0 30px rgba(255,210,74,.5)}
.g-reel{width:var(--cell);height:var(--cell);overflow:hidden;border-radius:10px;background:#fff8e0;box-shadow:inset 0 6px 10px rgba(0,0,0,.4)}
.g-reel div{display:flex;flex-direction:column}
.g-reel span{height:var(--cell);flex:none;display:grid;place-items:center;font-size:44px;line-height:1}
.g-btns button:disabled{opacity:.45;cursor:not-allowed}
.g-shop{display:grid;gap:8px;width:min(100%,440px)}
.g-shop button{display:grid;grid-template-columns:1fr auto;gap:2px 12px;text-align:left;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.45);color:#fff;font:inherit;cursor:pointer}
.g-shop b{font-weight:900}
.g-shop span{grid-column:1;font-size:13px;font-weight:500;color:#d6c4ea}
.g-shop i{grid-row:1/span 2;grid-column:2;align-self:center;font-style:normal;font-weight:900;color:#ffd24a;white-space:nowrap}
.g-shop button:disabled{opacity:.42;cursor:not-allowed}
.g-shop button:not(:disabled):hover{border-color:var(--pink,#ff4fb8)}
.g-shop button:focus-visible{outline:3px solid #fff;outline-offset:2px}
.g-msg.g-msg{color:#ffd24a;font-weight:800}
.g-goal.g-goal{color:#fff;font-weight:700}
.g-win{color:#ffd24a;text-shadow:0 0 24px #ffb000,0 4px 0 #000}
@keyframes gAnn{0%{opacity:0;scale:2}12%{opacity:1;scale:1}75%{opacity:1}100%{opacity:0;scale:.95}}
@keyframes gFloat{to{translate:-50% -170%;opacity:0}}
@keyframes gBlink{50%{opacity:.2}}
@media (max-height:520px){.g-screen>div{gap:8px}.g-title{font-size:3rem}.g-dead{font-size:2rem}.g-recap{grid-template-columns:1fr 1fr;column-gap:18px}}
`;
