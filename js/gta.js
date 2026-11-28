import * as THREE from './three.min.js';

const BUILD = new URL(import.meta.url).searchParams.get('v') || 'dev', asset = path => `${path}?v=${BUILD}`;
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(.5, .5, 1, 10), SPH = new THREE.SphereGeometry(.5, 8, 6);
const ICO = new THREE.IcosahedronGeometry(.5, 0), CONE = new THREE.ConeGeometry(.5, 1, 7), PYR = new THREE.ConeGeometry(.5, 1, 4);
const rand = (a, b) => a + Math.random() * (b - a), pick = l => l[Math.floor(Math.random() * l.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const V = (x, y, z) => new THREE.Vector3(x, y, z), X = V(1, 0, 0);
const PRISM = new THREE.CylinderGeometry(.5, .5, 1, 3).rotateX(-Math.PI / 2).translate(0, .25, 0).scale(1 / .866, 1 / .75, 1);
let T = null;
function groundY(x, z) {
  if (!T) return 0;
  const fx = (x - T.x0) / T.step, fz = (z - T.z0) / T.step;
  if (!(fx >= 0 && fz >= 0 && fx < T.nx - 1 && fz < T.nz - 1)) return 0;
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, n = T.nx, k = j * n + i, h = T.h;
  return u + v <= 1 ? h[k] + (h[k + 1] - h[k]) * u + (h[k + n] - h[k]) * v : h[k + n + 1] + (h[k + n] - h[k + n + 1]) * (1 - u) + (h[k + 1] - h[k + n + 1]) * (1 - v);
}
const fwd = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), dummy = new THREE.Object3D();
const DEATHS = {
  cop: ['ТЕБЯ ДОБИЛ МВД ДОБРЯНКИ', 'Участковый доволен. Очнёшься в Добрянской ЦРБ, врачи возьмут 30% золота за бахилы'],
  wall: ['ВЪЕХАЛ В ХРУЩЁВКУ', 'Хрущёвка стоит, ты нет. В ЦРБ возьмут 30% золота за бахилы'],
  block: ['ВЪЕХАЛ В ШЛАГБАУМ', 'Шлагбаум МВД стоит, ты нет. Сержант даже не встал со стула. В ЦРБ возьмут 30% золота'],
  kama: ['УТОНУЛ В КАМЕ', 'Выловили рыбаки. 30% золота забрали себе за улов'],
  triada: ['ТРИАДА ТЕБЯ НАШЛА', 'Пизда. Триада не прощает, Аегис не помог. В ЦРБ заберут 60% золота и почку'],
  bust: ['ПРИНЯЛИ', 'Low priority: 5 игр. МВД конфискует 20% золота и шнурки. Аегис от ментов не спасает']
};
const ICONS = 'gold,heart,aegis,cheese,gun,cross,pharmacy,bus,car,skull,apple,statue,bed,book,passport,scroll,chest,flag,spider,seven,crown,trophy,hourglass,target,gear,cards,strip,bottle,star,sun,rain,storm,snow,fog,moon,radio,tire,race,mvd,pin,sunset,barrier,license,meteor,bolt,shawarma,gres,ozon,wb,amber,kb,uschool'.split(',');
const STREAK = { 2: 'DOUBLE KILL', 3: 'TRIPLE KILL', 4: 'ULTRA KILL', 5: 'RAMPAGE' };
const WEATHER = [
  { icon: 'sun', name: 'Ясно', t: [8, 22], fog: [70, 320], light: 1, grip: 9 },
  { icon: 'rain', name: 'Дождь', t: [3, 12], fog: [45, 230], light: .7, grip: 6, rain: 1 },
  { icon: 'storm', name: 'Гроза', t: [6, 15], fog: [40, 200], light: .55, grip: 5.5, rain: 1.4, storm: true },
  { icon: 'snow', name: 'Снег', t: [-14, -2], fog: [35, 190], light: .85, grip: 3.5, snow: true },
  { icon: 'fog', name: 'Туман', t: [0, 8], fog: [12, 110], light: .8, grip: 8 }
];
const WANTED = [['photo_pudge', 'Pudge'], ['photo_invoker', 'Invoker'], ['photo_monkey', 'Monkey King'], ['photo_brew', 'Брюмастер'], ['photo_pango', 'Пангольер'], ['photo_qop', 'Квопа'], ['photo_bat', 'Батрайдер'], ['photo_cm', 'Crystal Maiden']];
const SHOPS = ['РАЗЛИВНОЕ', 'ЦВЕТЫ 24', 'СЕМЕЧКИ', 'ОПТИКА «ТРИАДА»', 'ВСЁ ПО 228', 'ПИВО 24'];
const GUNS = {
  pm: { name: 'Макаров', dmg: 34, rate: .32, range: 45, cone: .45, ammo: 24, price: 500, refill: 24 },
  sg: { name: 'Обрез', dmg: 70, rate: .85, range: 20, cone: .7, ammo: 10, price: 1200, refill: 10, spread: 4 },
  ak: { name: 'Калаш', dmg: 22, rate: .1, range: 55, cone: .35, ammo: 90, price: 2500, refill: 60 }
};
const BRIBE = 3000, NO_DOCS = 13370, METEOR = 100000;
const SHOPDEF = {
  shawarma: { sign: 'ШАУРМА 24', color: '#ff4fb8', icon: 'shawarma', title: 'Шаурма 24', sub: 'Мы не знаем, что внутри. И ты не узнаешь' },
  tire: { sign: 'ШИНОМОНТАЖ', color: '#3a6cf4', icon: 'tire', title: 'Шиномонтаж «У Палыча»', sub: 'Поставим движок от комбайна, без вопросов' },
  crypto: { sign: 'КАЗИНО «КРИПТА»', color: '#1f8a5a', icon: 'cards', title: 'Казино «Крипта обмен»', sub: 'Курс бирки к рублю 1 к 1337. Ставь всё, Триада одобряет' },
  pawn: { sign: 'ЛОМБАРД', color: '#d4a017', icon: 'car', title: 'Ломбард', sub: 'Тачки с историей. Историю не рассказываем' },
  guns: { sign: 'ОХОТА И РЫБАЛКА', color: '#6b4f2a', icon: 'gun', title: 'Охота и рыбалка', sub: 'Лицензия? Какая лицензия. Ты же из Добрянки' },
  pharmacy: { sign: 'АПТЕКА «АПРЕЛЬ»', color: '#1f9a6a', icon: 'pharmacy', title: 'Аптека «Апрель»', sub: 'Фармацевт смотрит поверх очков и уже всё понял' },
  strip: { sign: 'СТРИПУХА «ПАУТИНА»', color: '#ff2fa8', icon: 'strip', title: 'Стрипуха «Паутина»', sub: 'Бруда на шесте, Пудж на подтанцовке. Руками не трогать, только золото' },
  race: { color: '#ffffff', icon: 'race', title: 'Гран-при Добрянки', sub: '10 экипажей МВД против тебя. Правила? Какие правила' },
  mvd: { color: '#2a6bff', icon: 'mvd', title: 'МВД Добрянки', sub: 'Дежурный жуёт беляш и смотрит на тебя как на нарушение' },
  hospital: { sign: 'ЦРБ', color: '#c0392b', icon: 'cross', title: 'Добрянская ЦРБ', sub: 'Очередь с шести утра. Терапевт один, и тот в отпуске' },
  autoschool: { sign: 'АВТОШКОЛА АЗИЗА', color: '#e0302a', icon: 'uschool', title: 'Автошкола Азиза', sub: 'Азиз учит на Поло и Гранте. Права — по любви или по таксе' },
  yantar: { sign: 'ЯНТАРЬ 24/7', color: '#d48a10', icon: 'amber', title: 'Магазин «Янтарь» 24/7', sub: 'У входа всегда стоят пацаны. И всегда спрашивают сотку' },
  kb: { sign: 'КБ', color: '#c0302a', icon: 'kb', title: 'КБ', sub: 'Красное, белое и всё, что между ними' },
  hotel: { sign: 'ГОСТИНИЦА «ДРУЖБА»', color: '#3a6cf4', icon: 'bed', title: 'Гостиница «Дружба»', sub: 'Номера с видом на ГРЭС. Тараканы входят в стоимость' },
  ozon: { sign: 'OZON', color: '#2f6fff', icon: 'ozon', title: 'ПВЗ Ozon', sub: 'Срок хранения — вечность. Примерочная — штора' },
  wb: { sign: 'WILDBERRIES', color: '#b03ad0', icon: 'wb', title: 'ПВЗ Wildberries', sub: 'Очередь из бабушек и одного курьера Доты' },
  block: { color: '#e0302a', icon: 'barrier', title: 'Блокпост МВД на мосту', sub: 'Сержант лениво поднимает жезл: «Документики, гражданин»' }
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
  ring(p, y0, h, S, color = '#ffffff', vb = y0) {
    const c = new THREE.Color(color);
    for (let i = 0; i < p.length; i += 2) {
      const x0 = p[i], z0 = p[i + 1], x1 = p[(i + 2) % p.length], z1 = p[(i + 3) % p.length], len = Math.hypot(x1 - x0, z1 - z0);
      if (len < .01) continue;
      const v0 = (y0 - vb) / S, v1 = (y0 + h - vb) / S, P = [[x0, y0, z0], [x1, y0, z1], [x1, y0 + h, z1], [x0, y0 + h, z0]], U = [[0, v0], [len / S, v0], [len / S, v1], [0, v1]];
      for (const k of [0, 1, 2, 0, 2, 3]) { this.p.push(...P[k]); this.n.push(-(z1 - z0) / len, 0, (x1 - x0) / len); this.u.push(...U[k]); this.c.push(c.r, c.g, c.b); }
    }
    return this;
  }
  cap(p, y, color) {
    const c = new THREE.Color(color), pts = [];
    for (let i = 0; i < p.length; i += 2) pts.push(new THREE.Vector2(p[i], p[i + 1]));
    for (const t of THREE.ShapeUtils.triangulateShape(pts, [])) {
      const [a, b, d] = t, up = (pts[b].y - pts[a].y) * (pts[d].x - pts[a].x) - (pts[b].x - pts[a].x) * (pts[d].y - pts[a].y) > 0;
      for (const k of up ? [a, b, d] : [a, d, b]) { this.p.push(pts[k].x, y, pts[k].y); this.n.push(0, 1, 0); this.u.push(0, 0); this.c.push(c.r, c.g, c.b); }
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
  x.font = `700 ${size}px GCraft,monospace`;
  const w = x.measureText(text).width;
  if (w > maxW) x.font = `700 ${size * maxW / w}px GCraft,monospace`;
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
function cottage(wall, lit) {
  const base = canvas(64, 64), glow = canvas(64, 64), b = base.getContext('2d'), g = glow.getContext('2d');
  b.fillStyle = wall; b.fillRect(0, 0, 64, 64); g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64);
  b.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 3; y < 64; y += 6) b.fillRect(0, y, 64, 1);
  b.fillStyle = '#f2eee2'; b.fillRect(19, 22, 26, 26);
  b.fillStyle = lit ? '#ffd27a' : '#2b3350'; b.fillRect(22, 25, 20, 20);
  b.fillStyle = '#f2eee2'; b.fillRect(31, 25, 2, 20); b.fillRect(22, 33, 20, 2);
  if (lit) { g.fillStyle = '#ffb347'; g.fillRect(22, 25, 20, 20); }
  return new THREE.MeshLambertMaterial({ map: texture(base, true), emissive: '#ffffff', emissiveMap: texture(glow, true), emissiveIntensity: .9 });
}
const GLOW = [];
function glow(mat, lamp = false) { mat.userData.base = mat.color.clone(); mat.userData.lamp = lamp; GLOW.push(mat); return mat; }
function label(text, w, h, bg, fg) {
  const c = canvas(512, Math.round(512 * h / w)), x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
  x.fillStyle = fg; fitText(x, text, c.width / 2, c.height / 2, c.width * .9, c.height * .62, 900);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), glow(new THREE.MeshBasicMaterial({ map: texture(c), transparent: !bg })));
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

const PLACE_SIGNS = { school: ['book', 'Школа №1', '#3a6cf4'], gres: ['gres', 'Добрянская ГРЭС', '#c0392b'], market: ['apple', 'Рынок', '#d4a017'], bus: ['bus', 'Автовокзал', '#3a6cf4'], statue: ['statue', 'Памятник Лехе'] };
const area2 = p => { let a = 0; for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) a += p[j] * p[i + 1] - p[i] * p[j + 1]; return a; };
const outward = p => { if (area2(p) <= 0) return p; const q = []; for (let i = p.length - 2; i >= 0; i -= 2) q.push(p[i], p[i + 1]); return q; };
const inPoly = (p, x, z) => { let c = false; for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) if ((p[j + 1] > z) !== (p[i + 1] > z) && x < p[j] + (p[i] - p[j]) * (z - p[j + 1]) / (p[i + 1] - p[j + 1])) c = !c; return c; };
const ckey = (i, j) => (i + 4096) * 8192 + j + 4096;

function city(scene, D) {
  const H = D.height, bytes = atob(H.b64), hv = new Float32Array(bytes.length), nx = H.nx, nz = H.nz, ST = H.step;
  for (let i = 0; i < bytes.length; i++) hv[i] = bytes.charCodeAt(i) * H.q + H.base;
  T = { x0: H.x0, z0: H.z0, step: ST, nx, nz, h: hv };
  const X0 = H.x0, Z0 = H.z0, X1 = X0 + (nx - 1) * ST, Z1 = Z0 + (nz - 1) * ST;
  const solidMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const WALLS = { a: ['#a3a3ab', '#c8b08c', '#d9c9a8', '#9fb0b8'], r: ['#d78fb4', '#79b8b3', '#b9a0d6'], s: ['#c07a5a'], i: ['#8a8a92'], c: ['#f0ece0'] }, mats = {};
  for (const k in WALLS) mats[k] = WALLS[k].map(windows);
  mats.h = ['#8a6a4a', '#7a5a3a', '#6d8aa5', '#7f9a62', '#c2a86e', '#a85a4a'].map((c, k) => cottage(c, k % 2 === 0));

  const solids = [], cells = new Map(), GC = 32, hit = { d2: 0, cx: 0, cz: 0, inside: false };
  let seen = new Uint32Array(0), stamp = 0;
  function solid(p, top) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); z0 = Math.min(z0, p[i + 1]); z1 = Math.max(z1, p[i + 1]); }
    const k = solids.push({ p, top, x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, gone: false }) - 1;
    for (let i = Math.floor(x0 / GC); i <= Math.floor(x1 / GC); i++) for (let j = Math.floor(z0 / GC); j <= Math.floor(z1 / GC); j++) { const c = ckey(i, j); (cells.get(c) || cells.set(c, []).get(c)).push(k); }
    return solids[k];
  }
  const box = (x0, x1, z0, z1, top) => solid([x0, z1, x1, z1, x1, z0, x0, z0], top);
  function near(x0, x1, z0, z1, fn) {
    if (seen.length < solids.length) seen = new Uint32Array(solids.length * 2);
    stamp++;
    for (let i = Math.floor(x0 / GC); i <= Math.floor(x1 / GC); i++) for (let j = Math.floor(z0 / GC); j <= Math.floor(z1 / GC); j++) {
      const list = cells.get(ckey(i, j));
      if (list) for (const k of list) if (seen[k] !== stamp) { seen[k] = stamp; if (!solids[k].gone) fn(solids[k]); }
    }
  }
  function closest(s, x, z) {
    const p = s.p;
    hit.d2 = Infinity; hit.inside = false;
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      const ax = p[j], az = p[j + 1], ex = p[i] - ax, ez = p[i + 1] - az;
      if ((az > z) !== (p[i + 1] > z) && x < ax + ex * (z - az) / ez) hit.inside = !hit.inside;
      const t = clamp(((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1), 0, 1), qx = ax + ex * t, qz = az + ez * t, d2 = (x - qx) ** 2 + (z - qz) ** 2;
      if (d2 < hit.d2) { hit.d2 = d2; hit.cx = qx; hit.cz = qz; }
    }
    return hit;
  }
  function collide(e, r) {
    let worst = 0;
    e.touch = false;
    near(e.pos.x - r, e.pos.x + r, e.pos.z - r, e.pos.z + r, s => {
      const px = e.pos.x, pz = e.pos.z;
      if (px < s.x0 - r || px > s.x1 + r || pz < s.z0 - r || pz > s.z1 + r) return;
      const q = closest(s, px, pz);
      if (!q.inside && q.d2 >= r * r) return;
      e.touch = true;
      const d = Math.sqrt(q.d2);
      let nx, nz;
      if (d < 1e-4) { nx = px - s.cx; nz = pz - s.cz; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; }
      else { nx = (px - q.cx) / d; nz = (pz - q.cz) / d; if (q.inside) { nx = -nx; nz = -nz; } }
      const push = q.inside ? r + d : r - d;
      e.pos.x += nx * push; e.pos.z += nz * push;
      const vn = e.vel.x * nx + e.vel.z * nz;
      if (vn < 0) { e.vel.x -= 1.3 * vn * nx; e.vel.z -= 1.3 * vn * nz; worst = Math.max(worst, -vn); }
    });
    return worst;
  }
  function hitT(a, b, y0, y1) {
    let best = 1;
    const rx = b.x - a.x, rz = b.z - a.z, lx = Math.min(a.x, b.x), hx = Math.max(a.x, b.x), lz = Math.min(a.z, b.z), hz = Math.max(a.z, b.z);
    near(lx, hx, lz, hz, s => {
      if (hx < s.x0 || lx > s.x1 || hz < s.z0 || lz > s.z1) return;
      const p = s.p;
      for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
        const qx = p[j], qz = p[j + 1], sx = p[i] - qx, sz = p[i + 1] - qz, den = rx * sz - rz * sx;
        if (Math.abs(den) < 1e-9) continue;
        const wx = qx - a.x, wz = qz - a.z, t = (wx * sz - wz * sx) / den, u = (wx * rz - wz * rx) / den;
        if (t >= 0 && t < best && u >= 0 && u <= 1 && y0 + (y1 - y0) * t < s.top) best = t;
      }
    });
    return best;
  }
  function blocked(x, z, r) {
    let found = false;
    near(x - r, x + r, z - r, z + r, s => {
      if (found || x < s.x0 - r || x > s.x1 + r || z < s.z0 - r || z > s.z1 + r) return;
      const q = closest(s, x, z);
      found = q.inside || q.d2 < r * r;
    });
    return found;
  }

  const NN = D.nodes.length / 2, NX = new Float32Array(NN), NZ = new Float32Array(NN), adj = Array.from({ length: NN }, () => []), edges = [], NG = 50;
  for (let i = 0; i < NN; i++) { NX[i] = D.nodes[2 * i]; NZ[i] = D.nodes[2 * i + 1]; }
  for (let k = 0; k < D.edges.length; k += 3) {
    const u = D.edges[k], v = D.edges[k + 1], w = D.edges[k + 2], len = Math.hypot(NX[v] - NX[u], NZ[v] - NZ[u]);
    if (len < .5) continue;
    adj[u].push({ to: v, w, len }); adj[v].push({ to: u, w, len }); edges.push({ u, v, w, len });
  }
  const ncells = new Map(), ecells = new Map(), put = (m, c, k) => (m.get(c) || m.set(c, []).get(c)).push(k);
  for (let i = 0; i < NN; i++) put(ncells, ckey(Math.floor(NX[i] / NG), Math.floor(NZ[i] / NG)), i);
  edges.forEach((e, k) => {
    for (let i = Math.floor((Math.min(NX[e.u], NX[e.v]) - 10) / NG); i <= Math.floor((Math.max(NX[e.u], NX[e.v]) + 10) / NG); i++)
      for (let j = Math.floor((Math.min(NZ[e.u], NZ[e.v]) - 10) / NG); j <= Math.floor((Math.max(NZ[e.u], NZ[e.v]) + 10) / NG); j++) put(ecells, ckey(i, j), k);
  });
  function nearestNode(x, z) {
    const ci = Math.floor(x / NG), cj = Math.floor(z / NG);
    let best = 0, bd = Infinity;
    for (let r = 1; r <= 6; r++) {
      for (let i = ci - r; i <= ci + r; i++) for (let j = cj - r; j <= cj + r; j++) {
        const list = ncells.get(ckey(i, j));
        if (list) for (const n of list) { const d = (NX[n] - x) ** 2 + (NZ[n] - z) ** 2; if (d < bd) { bd = d; best = n; } }
      }
      if (bd <= (r * NG) ** 2) return best;
    }
    for (let n = 0; n < NN; n++) { const d = (NX[n] - x) ** 2 + (NZ[n] - z) ** 2; if (d < bd) { bd = d; best = n; } }
    return best;
  }
  function onRoad(x, z, pad) {
    const list = ecells.get(ckey(Math.floor(x / NG), Math.floor(z / NG)));
    if (list) for (const k of list) {
      const e = edges[k], ax = NX[e.u], az = NZ[e.u], ex = NX[e.v] - ax, ez = NZ[e.v] - az, t = clamp(((x - ax) * ex + (z - az) * ez) / (e.len * e.len), 0, 1);
      if ((x - ax - ex * t) ** 2 + (z - az - ez * t) ** 2 < (e.w / 2 + pad) ** 2) return true;
    }
    return false;
  }
  function field(src) {
    const dist = new Float64Array(NN).fill(Infinity), hn = [], hd = [];
    const push = (n, v) => {
      let i = hn.length; hn.push(n); hd.push(v);
      while (i) { const p = (i - 1) >> 1; if (hd[p] <= v) break; hn[i] = hn[p]; hd[i] = hd[p]; i = p; }
      hn[i] = n; hd[i] = v;
    };
    const pop = () => {
      const top = hn[0], ln = hn.pop(), lv = hd.pop();
      if (hn.length) {
        let i = 0;
        for (;;) { let c = 2 * i + 1; if (c >= hn.length) break; if (c + 1 < hn.length && hd[c + 1] < hd[c]) c++; if (hd[c] >= lv) break; hn[i] = hn[c]; hd[i] = hd[c]; i = c; }
        hn[i] = ln; hd[i] = lv;
      }
      return top;
    };
    dist[src] = 0; push(src, 0);
    while (hn.length) {
      const v = hd[0], n = pop();
      if (v > dist[n]) continue;
      for (const e of adj[n]) { const d = v + e.len; if (d < dist[e.to]) { dist[e.to] = d; push(e.to, d); } }
    }
    return dist;
  }
  const estamp = new Uint32Array(edges.length);
  let ecount = 0;
  function edgesIn(x0, z0, x1, z1, fn) {
    ecount++;
    for (let i = Math.floor(x0 / NG); i <= Math.floor(x1 / NG); i++) for (let j = Math.floor(z0 / NG); j <= Math.floor(z1 / NG); j++) {
      const list = ecells.get(ckey(i, j));
      if (list) for (const k of list) if (estamp[k] !== ecount) { estamp[k] = ecount; const e = edges[k]; fn(NX[e.u], NZ[e.u], NX[e.v], NZ[e.v], e.w); }
    }
  }
  const downhill = (f, n) => { let best = n; for (const e of adj[n]) if (f[e.to] < f[best]) best = e.to; return best; };

  const B = [];
  for (const b of D.buildings) {
    if (b[0] === 'h') {
      const [, h, cx, cz, w, d, ang] = b, ax = Math.sin(ang) * d / 2, az = Math.cos(ang) * d / 2, bx = Math.cos(ang) * w / 2, bz = -Math.sin(ang) * w / 2;
      B.push({ code: 'h', H: h, cx, cz, w, d, ang, p: outward([cx + ax + bx, cz + az + bz, cx + ax - bx, cz + az - bz, cx - ax - bx, cz - az - bz, cx - ax + bx, cz - az + bz]) });
    } else {
      const p = outward(b.slice(2));
      let cx = 0, cz = 0;
      for (let i = 0; i < p.length; i += 2) { cx += p[i]; cz += p[i + 1]; }
      B.push({ code: b[0], H: b[1], cx: cx / (p.length / 2), cz: cz / (p.length / 2), p });
    }
  }
  const byW = new Map();
  for (const e of edges) put(byW, e.w, e);
  const path = (x, p, s) => { x.beginPath(); for (let i = 0; i < p.length; i += 2) x[i ? 'lineTo' : 'moveTo']((p[i] - X0) * s, (p[i + 1] - Z0) * s); x.closePath(); };
  function paint(c, s, look) {
    const small = canvas(nx, nz), sx = small.getContext('2d'), img = sx.createImageData(nx, nz), x = c.getContext('2d');
    for (let k = 0; k < nx * nz; k++) {
      const h = hv[k], o = k * 4, n = (Math.random() - .5) * look.noise, t = clamp(h / 60, 0, 1);
      const shore = h >= 0 && h < 1.2 && (hv[k - 1] < 0 || hv[k + 1] < 0 || hv[k - nx] < 0 || hv[k + nx] < 0);
      const col = h < 0 ? look.water : shore ? look.sand : [look.land[0] + t * 40 + n, look.land[1] + t * 28 + n, look.land[2] + t * 10 + n * .5];
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    sx.putImageData(img, 0, 0);
    const k = ST * s;
    x.imageSmoothingEnabled = true; x.drawImage(small, -k / 2, -k / 2, nx * k, nz * k);
    for (const g of D.green) { x.fillStyle = look.green[g[0]]; path(x, g.slice(1), s); x.fill(); }
    x.lineCap = x.lineJoin = 'round';
    if (look.yard) { x.fillStyle = x.strokeStyle = look.yard; x.lineWidth = 10 * s; for (const b of B) if (b.code !== 'h' && b.code !== 'g') { path(x, b.p, s); x.fill(); x.stroke(); } }
    x.strokeStyle = look.foot; x.lineWidth = Math.max(1, 2.5 * s); x.beginPath();
    for (const f of D.foot) for (let i = 0; i < f.length; i += 2) x[i ? 'lineTo' : 'moveTo']((f[i] - X0) * s, (f[i + 1] - Z0) * s);
    x.stroke();
    x.strokeStyle = look.road[1];
    for (const [w, list] of byW) {
      x.lineWidth = Math.max(look.road[2], (w + look.road[0]) * s); x.beginPath();
      for (const e of list) { x.moveTo((NX[e.u] - X0) * s, (NZ[e.u] - Z0) * s); x.lineTo((NX[e.v] - X0) * s, (NZ[e.v] - Z0) * s); }
      x.stroke();
    }
    if (look.house) for (const b of B) { x.fillStyle = b.code === 'h' || b.code === 'g' ? look.house : look.block; path(x, b.p, s); x.fill(); }
    if (look.edge) {
      const f = 160 * s, W = c.width, Hh = c.height, edge = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, look.edge); g.addColorStop(1, 'rgba(45,90,143,0)'); x.fillStyle = g; x.fillRect(rx, ry, rw, rh); };
      edge(0, 0, f, 0, 0, 0, f, Hh); edge(W, 0, W - f, 0, W - f, 0, f, Hh); edge(0, 0, 0, f, 0, 0, W, f); edge(0, Hh, 0, Hh - f, 0, Hh - f, W, f);
    }
    return c;
  }

  const TS = 4 / ST, groundTex = texture(paint(canvas((nx - 1) * 4, (nz - 1) * 4), TS, { noise: 14, water: [150, 140, 105], sand: [176, 162, 118], land: [78, 112, 52], green: { p: '#4a7a35', f: '#33592a' }, yard: '#6d6a60', foot: '#a49a80', road: [6, '#77736a', 1] }));
  const MAPS = .4, mapCanvas = paint(canvas(Math.ceil((X1 - X0) * MAPS), Math.ceil((Z1 - Z0) * MAPS)), MAPS, { noise: 0, water: [45, 90, 143], sand: [120, 130, 96], land: [58, 85, 46], green: { p: '#2f6a2a', f: '#24561f' }, foot: 'rgba(255,255,255,.14)', road: [0, '#e8e0cc', 2], house: '#8a6a5a', block: '#6e667c', edge: '#2d5a8f' });

  {
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), all = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      pos[k * 3] = X0 + i * ST; pos[k * 3 + 1] = hv[k]; pos[k * 3 + 2] = Z0 + j * ST;
      uv[k * 2] = i / (nx - 1); uv[k * 2 + 1] = 1 - j / (nz - 1);
    }
    const tri = (out, i, j) => { const k = j * nx + i; out.push(k, k + nx, k + 1, k + 1, k + nx, k + nx + 1); };
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) tri(all, i, j);
    const pa = new THREE.BufferAttribute(pos, 3), ua = new THREE.BufferAttribute(uv, 2), full = new THREE.BufferGeometry();
    full.setAttribute('position', pa); full.setIndex(all); full.computeVertexNormals();
    const na = full.getAttribute('normal'), groundMat = new THREE.MeshLambertMaterial({ map: groundTex }), CH = 32;
    for (let cj = 0; cj < nz - 1; cj += CH) for (let ci = 0; ci < nx - 1; ci += CH) {
      const idx = [];
      for (let j = cj; j < Math.min(cj + CH, nz - 1); j++) for (let i = ci; i < Math.min(ci + CH, nx - 1); i++) tri(idx, i, j);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', pa); g.setAttribute('normal', na); g.setAttribute('uv', ua); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(V(X0 + (ci + CH / 2) * ST, 30, Z0 + (cj + CH / 2) * ST), CH * ST * .75 + 40);
      scene.add(new THREE.Mesh(g, groundMat));
    }
    const water = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 + 6000, Z1 - Z0 + 6000), new THREE.MeshPhongMaterial({ color: '#35588f', specular: '#ffb070', shininess: 90, transparent: true, opacity: .86 }));
    water.rotation.x = -Math.PI / 2; water.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2); scene.add(water);
  }

  {
    const rp = [], ri = [], vtx = (x, z, lift) => (rp.push(x, groundY(x, z) + lift, z), rp.length / 3 - 1);
    for (const e of edges) {
      const ax = NX[e.u], az = NZ[e.u], bx = NX[e.v], bz = NZ[e.v], n = Math.max(1, Math.ceil(e.len / 5)), px = -(bz - az) / e.len * e.w / 2, pz = (bx - ax) / e.len * e.w / 2;
      let a = vtx(ax + px, az + pz, .07), b = vtx(ax - px, az - pz, .07);
      for (let s = 1; s <= n; s++) {
        const t = s / n, cx = ax + (bx - ax) * t, cz = az + (bz - az) * t, a1 = vtx(cx + px, cz + pz, .07), b1 = vtx(cx - px, cz - pz, .07);
        ri.push(a, a1, b, b, a1, b1); a = a1; b = b1;
      }
    }
    for (let i = 0; i < NN; i++) {
      let r = 0;
      for (const e of adj[i]) r = Math.max(r, e.w / 2);
      const c = vtx(NX[i], NZ[i], .065), first = rp.length / 3;
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; vtx(NX[i] + Math.cos(a) * r, NZ[i] + Math.sin(a) * r, .065); }
      for (let k = 0; k < 12; k++) ri.push(c, first + (k + 1) % 12, first + k);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); g.setIndex(ri); g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: '#3a3542', polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })));
    const marks = [], o = new THREE.Object3D();
    o.rotation.order = 'YXZ';
    for (const e of edges) if (e.w >= 11 && e.len > 18) {
      const dx = (NX[e.v] - NX[e.u]) / e.len, dz = (NZ[e.v] - NZ[e.u]) / e.len;
      for (let s = 8; s < e.len - 8; s += 7) marks.push([NX[e.u] + dx * s, NZ[e.u] + dz * s, dx, dz]);
    }
    const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(.25, .03, 2.6), new THREE.MeshBasicMaterial({ color: '#d8d2b8' }), marks.length);
    marks.forEach(([x, z, dx, dz], k) => {
      o.position.set(x, groundY(x, z) + .1, z);
      o.rotation.set(-Math.atan2(groundY(x + dx, z + dz) - groundY(x - dx, z - dz), 2), Math.atan2(dx, dz), 0);
      o.updateMatrix(); dash.setMatrixAt(k, o.matrix);
    });
    scene.add(dash);
  }

  const tiles = new Map(), TILE = 512;
  const tile = (x, z) => { const k = ckey(Math.floor(x / TILE), Math.floor(z / TILE)); let t = tiles.get(k); if (!t) tiles.set(k, t = { b: new Map(), trees: [[], []] }); return t; };
  const batch = (x, z, mat) => { const t = tile(x, z); let b = t.b.get(mat); if (!b) t.b.set(mat, b = new Batch()); return b; };
  const ROOF = ['#7a2e2e', '#3e5a7a', '#5a7a3e', '#8a5a2e', '#5a5560'];
  for (const b of B) {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < b.p.length; i += 2) { const g = groundY(b.p[i], b.p[i + 1]); lo = Math.min(lo, g); hi = Math.max(hi, g); }
    const base = lo - 1.5, top = hi + b.H;
    b.top = top;
    if (b.code === 'h') {
      batch(b.cx, b.cz, pick(mats.h)).ring(b.p, base, top - base, 4, '#ffffff', lo);
      batch(b.cx, b.cz, solidMat).add(PRISM, pick(ROOF), M(b.cx, top, b.cz, 0, b.ang, 0, b.w + .6, Math.min(3.2, b.w * .45), b.d + .6));
      solid(b.p, top + 2);
    } else if (b.code === 'g') {
      batch(b.cx, b.cz, solidMat).ring(b.p, base, top - base, 1, '#8a8690').cap(b.p, top, '#5a5560');
      solid(b.p, top);
    } else {
      batch(b.cx, b.cz, pick(mats[b.code] || mats.a)).ring(b.p, base, top - base, 12);
      const sb = batch(b.cx, b.cz, solidMat).cap(b.p, top, '#4a4452');
      if (b.code === 'c') sb.add(CONE, '#d4a017', M(b.cx, top + 3, b.cz, 0, 0, 0, 4, 6, 4));
      solid(b.p, top);
    }
  }
  const P = {};
  for (const k in D.places) {
    const [x, z, ang, px, pz] = D.places[k], rx = Math.sin(ang), rz = Math.cos(ang);
    let k2 = 0;
    while (k2 < 3.4 && blocked(x + rx * k2, z + rz * k2, 2)) k2 += .4;
    P[k] = { key: k, x: x + rx * k2, z: z + rz * k2, ang, px, pz, rx, rz };
  }
  const rings = Object.values(P);
  function tree(x, z) {
    const g = groundY(x, z);
    if (g < .6 || onRoad(x, z, 2.5) || blocked(x, z, 1.4) || rings.some(p => Math.abs(p.x - x) < 7 && Math.abs(p.z - z) < 7)) return false;
    tile(x, z).trees[Math.random() < .55 ? 0 : 1].push(x, g, z);
    box(x - .3, x + .3, z - .3, z + .3, g + 5);
    return true;
  }
  let budget = 4200;
  for (const g of D.green) {
    const p = g.slice(1), want = Math.min(budget, Math.round(Math.abs(area2(p)) / 2 / (g[0] === 'f' ? 260 : 520)));
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, got = 0;
    for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); z0 = Math.min(z0, p[i + 1]); z1 = Math.max(z1, p[i + 1]); }
    for (let k = 0; k < want * 3 && got < want; k++) { const x = rand(x0, x1), z = rand(z0, z1); if (inPoly(p, x, z) && tree(x, z)) got++; }
    budget -= got;
  }
  for (const b of B) if (b.code === 'h' && Math.random() < .35) { const a = rand(0, 6.283), r = rand(6, 9); tree(b.cx + Math.sin(a) * r, b.cz + Math.cos(a) * r); }
  const TREE = [
    new Batch().add(BOX, '#e9e4d6', M(0, 2, 0, 0, 0, 0, .35, 4, .35)).add(ICO, '#5d9440', M(0, 5.2, 0, 0, 0, 0, 3.4, 3.8, 3.4)).geometry(),
    new Batch().add(BOX, '#5a3d2b', M(0, 1.5, 0, 0, 0, 0, .4, 3, .4)).add(CONE, '#2f5a35', M(0, 5, 0, 0, 0, 0, 3.6, 6.5, 3.6)).geometry()
  ];

  function pylon(p, text, color, wide = 7) {
    const x = p.x - p.rx * 2.6, z = p.z - p.rz * 2.6, g = groundY(x, z), bx = Math.cos(p.ang), bz = -Math.sin(p.ang), sb = batch(x, z, solidMat);
    for (const s of [-1, 1]) sb.add(BOX, '#3a3440', M(x + bx * s * (wide / 2 - .3), g + 2.4, z + bz * s * (wide / 2 - .3), 0, 0, 0, .25, 4.8, .25));
    sb.add(BOX, '#2a2430', M(x, g + 4.6, z, 0, p.ang, 0, wide + .3, 1.9, .2));
    const l = label(text, wide, 1.6, color, '#fff');
    l.position.set(x + p.rx * .12, g + 4.6, z + p.rz * .12); l.rotation.y = p.ang; scene.add(l);
  }
  const doors = [], parked = [], cops = [];
  for (const kind in SHOPDEF) {
    const p = P[kind];
    if (!p || kind === 'race') continue;
    doors.push({ kind, x: p.x, z: p.z, ang: p.ang });
    pylon(p, (SHOPDEF[kind].sign || SHOPDEF[kind].title).toUpperCase(), SHOPDEF[kind].color);
  }
  for (const k in PLACE_SIGNS) if (P[k] && PLACE_SIGNS[k][2]) pylon(P[k], PLACE_SIGNS[k][1].toUpperCase(), PLACE_SIGNS[k][2], k === 'gres' ? 10 : 7);
  if (P.mvd) for (const s of [-1, 1]) cops.push([P.mvd.x + Math.cos(P.mvd.ang) * s * 7 + P.mvd.rx * 2, P.mvd.z - Math.sin(P.mvd.ang) * s * 7 + P.mvd.rz * 2, P.mvd.ang + Math.PI / 2]);
  const smoke = [];
  if (P.gres) {
    const p = P.gres, bx = Math.cos(p.ang), bz = -Math.sin(p.ang), spots = back => [-12, 0, 12].map(o => [p.x - p.rx * back + bx * o, p.z - p.rz * back + bz * o]);
    let back = 16;
    while (back < 64 && spots(back).some(([x, z]) => onRoad(x, z, 4.5))) back += 4;
    for (const [x, z] of spots(back)) {
      const g = groundY(x, z), sb = batch(x, z, solidMat);
      for (let s = 0; s < 7; s++) { const r = 4.8 - s * .26; sb.add(CYL, s % 2 ? '#ececec' : '#c0392b', M(x, g + 5 + s * 10, z, 0, 0, 0, r, 10, r)); }
      box(x - 2.4, x + 2.4, z - 2.4, z + 2.4, g + 75);
      for (let k = 0; k < 4; k++) smoke.push({ x, z, y: g + 72, phase: k / 4 });
    }
  }
  if (P.statue) {
    const p = P.statue, x = p.px, z = p.pz, g = groundY(x, z), sb = new Batch();
    sb.add(BOX, '#3a3540', M(0, .75, 0, 0, 0, 0, 8, .9, 8)).add(BOX, '#4a4550', M(0, 2.8, 0, 0, 0, 0, 6, 5, 6));
    statue(sb, 0, 5.3, 0, 3.2);
    const m = new THREE.Mesh(sb.geometry(), solidMat);
    m.position.set(x, g - .3, z); m.rotation.y = p.ang; scene.add(m);
    const l1 = label('СОЗДАТЕЛЮ ПРОМПТОВ', 5.6, .9, '#2a2530', '#e8d39a'), l2 = label('ЛЕХЕ ПОПОВУ (POPOV)', 5.6, .8, '#2a2530', '#e8d39a');
    l1.position.set(0, 3.9, 3.02); l2.position.set(0, 2.9, 3.02); m.add(l1, l2);
    box(x - 4.5, x + 4.5, z - 4.5, z + 4.5, g + 32);
  }
  const crews = [];
  for (const key of ['triada1', 'triada2', 'triada3']) {
    const p = P[key];
    if (!p) continue;
    const x = p.x - p.rx * 1.2, z = p.z - p.rz * 1.2, cb = new Batch();
    for (const k of [-1, 0, 1]) gopnik(cb, k * 1.5, 0, k ? '#1a1a24' : '#1e2f7a');
    cb.add(CYL, '#5a3a12', M(2.4, .35, -.3, 0, 0, 0, .18, .6, .18));
    const mesh = new THREE.Mesh(cb.geometry(), solidMat);
    mesh.position.set(x, groundY(x, z), z); mesh.rotation.y = p.ang + Math.PI; scene.add(mesh);
    crews.push({ x: p.x, z: p.z, cx: x, cz: z, mesh, alive: true });
  }
  const sideOf = (e, t, side, off) => {
    const dx = (NX[e.v] - NX[e.u]) / e.len, dz = (NZ[e.v] - NZ[e.u]) / e.len, nxv = -dz * side, nzv = dx * side;
    return { x: NX[e.u] + dx * e.len * t + nxv * off, z: NZ[e.u] + dz * e.len * t + nzv * off, dx, dz, nx: nxv, nz: nzv };
  };
  const big = edges.filter(e => e.w >= 9 && e.len > 30);
  for (const [file, name] of WANTED.slice().sort(() => Math.random() - .5).slice(0, 6)) {
    for (let tries = 0; tries < 30; tries++) {
      const e = pick(big), q = sideOf(e, rand(.3, .7), pick([-1, 1]), e.w / 2 + 3);
      if (blocked(q.x, q.z, 3.6) || onRoad(q.x, q.z, 1) || rings.some(p => Math.hypot(p.x - q.x, p.z - q.z) < 10)) continue;
      const g = groundY(q.x, q.z), ang = Math.atan2(-q.nx, -q.nz), sb = batch(q.x, q.z, solidMat), ax = q.dx * 3.2, az = q.dz * 3.2;
      const pm = poster(file, name);
      pm.position.set(q.x - q.nx * .12, g + 5.6, q.z - q.nz * .12); pm.rotation.y = ang; scene.add(pm);
      sb.add(BOX, '#2a2430', M(q.x, g + 5.6, q.z, 0, ang, 0, 6.4, 8.4, .2));
      for (const s of [-.8, .8]) sb.add(BOX, '#3a3440', M(q.x + q.dx * s * 3.2, g + 1, q.z + q.dz * s * 3.2, 0, 0, 0, .25, 2, .25));
      solid(outward([q.x + ax + q.nx * .3, q.z + az + q.nz * .3, q.x - ax + q.nx * .3, q.z - az + q.nz * .3, q.x - ax - q.nx * .3, q.z - az - q.nz * .3, q.x + ax - q.nx * .3, q.z + az - q.nz * .3]), g + 9.8);
      break;
    }
  }
  let signs = 0;
  for (const b of B.filter(b => b.code === 'r').sort(() => Math.random() - .5)) {
    if (signs >= 14) break;
    let best = 0, bi = 0;
    for (let i = 0; i < b.p.length; i += 2) { const l = Math.hypot(b.p[(i + 2) % b.p.length] - b.p[i], b.p[(i + 3) % b.p.length] - b.p[i + 1]); if (l > best) { best = l; bi = i; } }
    if (best < 7) continue;
    const x0 = b.p[bi], z0 = b.p[bi + 1], x1 = b.p[(bi + 2) % b.p.length], z1 = b.p[(bi + 3) % b.p.length], nxv = -(z1 - z0) / best, nzv = (x1 - x0) / best, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    const l = label(pick(SHOPS), Math.min(8, best - 1), 1.5, pick(['#ff4fb8', '#1f8a5a', '#d4a017', '#3a6cf4', '#5a4a6e']), '#fff');
    l.position.set(mx + nxv * .08, groundY(mx, mz) + 3.5, mz + nzv * .08); l.rotation.y = Math.atan2(nxv, nzv); scene.add(l);
    signs++;
  }
  for (let tries = 0; parked.length < 24 && tries < 400; tries++) {
    const e = pick(edges);
    if (e.w < 7 || e.len < 14) continue;
    const side = pick([-1, 1]), q = sideOf(e, rand(.25, .75), side, e.w / 2 - 1.3);
    if (blocked(q.x, q.z, 2.3) || parked.some(([x, z]) => Math.hypot(x - q.x, z - q.z) < 8) || rings.some(p => Math.hypot(p.x - q.x, p.z - q.z) < 14)) continue;
    parked.push([q.x, q.z, Math.atan2(q.dx * side, q.dz * side)]);
  }
  if (D.bridge) {
    const [ax, az, bx, bz] = D.bridge, len = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / len, dz = (bz - az) / len, ang = Math.atan2(dx, dz);
    for (const s of [-1, 1]) {
      const ox = -dz * s * 7.2, oz = dx * s * 7.2, g = Math.max(groundY(ax + ox, az + oz), groundY(bx + ox, bz + oz), .4), sb = batch(ax, az, solidMat);
      sb.add(BOX, '#c8c8c8', M((ax + bx) / 2 + ox, g + .9, (az + bz) / 2 + oz, 0, ang, 0, .3, .2, len + 6));
      for (let t = -3; t <= len + 3; t += 3) sb.add(BOX, '#9a9aa0', M(ax + dx * t + ox, g + .45, az + dz * t + oz, 0, 0, 0, .18, .9, .18));
      const ex = dx * (len / 2 + 3), ez = dz * (len / 2 + 3), mx = (ax + bx) / 2 + ox, mz = (az + bz) / 2 + oz, wx = -dz * s * .25, wz = dx * s * .25;
      solid(outward([mx - ex - wx, mz - ez - wz, mx + ex - wx, mz + ez - wz, mx + ex + wx, mz + ez + wz, mx - ex + wx, mz - ez + wz]), g + 1.1);
    }
  }
  let blockade = null;
  if (D.bridge) {
    const [ax, az, bx, bz] = D.bridge, fe = field(nearestNode(D.exit[0], D.exit[1]));
    const [tx, tz, ox, oz] = fe[nearestNode(ax, az)] > fe[nearestNode(bx, bz)] ? [ax, az, bx, bz] : [bx, bz, ax, az];
    const len = Math.hypot(ox - tx, oz - tz), dx = (ox - tx) / len, dz = (oz - tz) / len, px = -dz, pz = dx, x = tx + dx * 3, z = tz + dz * 3, g = Math.max(groundY(x, z), .4), ang = Math.atan2(dx, dz);
    const sb = batch(x, z, solidMat), slab = (a, b, s, t) => outward([x + px * s * a - dx * t, z + pz * s * a - dz * t, x + px * s * b - dx * t, z + pz * s * b - dz * t, x + px * s * b + dx * t, z + pz * s * b + dz * t, x + px * s * a + dx * t, z + pz * s * a + dz * t]);
    for (const s of [-1, 1]) {
      for (let k = 8.4; k < 46; k += 2.4) { const cx = x + px * s * k, cz = z + pz * s * k; sb.add(BOX, k % 4.8 < 2.4 ? '#a8a8b0' : '#e0302a', M(cx, Math.max(groundY(cx, cz), -.8) + .55, cz, 0, ang, 0, 2.3, 1.3, .9)); }
      solid(slab(7.3, 46, s, 2), g + 1.3);
      sb.add(BOX, '#2a2a36', M(x + px * s * 7.6, g + .75, z + pz * s * 7.6, 0, 0, 0, .35, 1.5, .35));
    }
    const bb = new Batch();
    for (let k = 0; k < 7; k++) bb.add(BOX, k % 2 ? '#ffffff' : '#e0302a', M(k * 2.1 + 1.05, 0, 0, 0, 0, 0, 2.1, .26, .26));
    const boom = new THREE.Mesh(bb.geometry(), solidMat);
    boom.rotation.order = 'YXZ'; boom.position.set(x - px * 7.4, g + 1.1, z - pz * 7.4); boom.rotation.y = Math.atan2(-pz, px); scene.add(boom);
    const stop = label('СТОП · МВД', 3.4, 1.1, '#e0302a', '#fff');
    stop.position.set(x - px * 7.6 - dx * .3, g + 2.1, z - pz * 7.6 - dz * .3); stop.rotation.y = ang + Math.PI; scene.add(stop);
    blockade = { x: x - dx * 9, z: z - dz * 9, ang: ang + Math.PI, bx: x, bz: z, dx, dz, boom, solid: solid(slab(-7.3, 7.3, 1, 3), g + 1.3), cars: [[x - dx * 11 + px * 5.6, z - dz * 11 + pz * 5.6, ang + Math.PI], [x - dx * 16 - px * 5.6, z - dz * 16 - pz * 5.6, ang]] };
    const c = canvas(512, 160), cx2 = c.getContext('2d');
    cx2.fillStyle = '#fff'; cx2.fillRect(0, 0, 512, 160); cx2.strokeStyle = '#111'; cx2.lineWidth = 10; cx2.strokeRect(8, 8, 496, 144);
    cx2.fillStyle = '#111'; fitText(cx2, 'ДОБРЯНКА', 256, 84, 420, 84, 900);
    cx2.strokeStyle = '#d0202a'; cx2.lineWidth = 14; cx2.beginPath(); cx2.moveTo(24, 136); cx2.lineTo(488, 24); cx2.stroke();
    const end = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.3), new THREE.MeshBasicMaterial({ map: texture(c) })), sx = ox + dx * 8 + px * 9, sz = oz + dz * 8 + pz * 9, sg = groundY(sx, sz);
    end.position.set(sx, sg + 2.6, sz); end.rotation.y = ang + Math.PI; scene.add(end);
    batch(sx, sz, solidMat).add(BOX, '#c8c8d0', M(sx + dx * .08, sg + 1.3, sz + dz * .08, 0, 0, 0, .14, 2.6, .14));
  }
  const along = (p, side, k, back) => [p.x + Math.cos(p.ang) * side * k + p.rx * back, p.z - Math.sin(p.ang) * side * k + p.rz * back];
  const aziz = P.autoschool ? [-1, 1].map(s => [...along(P.autoschool, s, 7, 2.5), P.autoschool.ang + Math.PI / 2]) : [];
  const loiter = P.yantar ? [-4.2, -3, -1.6, 2.4, 3.6].map((k, i) => along(P.yantar, 1, k, i % 2 ? -1.6 : -.6)) : [];
  const lampMat = glow(new THREE.MeshBasicMaterial({ color: '#ffd890' }), true), pools = [];
  for (const e of edges) {
    if (e.w < 9 || e.len < 20 || pools.length > 900) continue;
    const dx = (NX[e.v] - NX[e.u]) / e.len, dz = (NZ[e.v] - NZ[e.u]) / e.len;
    for (let t = 10, side = 1; t < e.len - 5; t += 42, side = -side) {
      const off = e.w / 2 + 1.2, x = NX[e.u] + dx * t - dz * off * side, z = NZ[e.u] + dz * t + dx * off * side, ax = dz * side, az = -dx * side;
      if (blocked(x, z, .7) || groundY(x, z) < .5) continue;
      const g = groundY(x, z), ry = Math.atan2(ax, az);
      batch(x, z, solidMat).add(BOX, '#3a3a44', M(x, g + 3, z, 0, 0, 0, .16, 6, .16)).add(BOX, '#3a3a44', M(x + ax * .9, g + 5.95, z + az * .9, 0, ry, 0, .12, .12, 1.8));
      batch(x, z, lampMat).add(BOX, '#ffffff', M(x + ax * 1.7, g + 5.85, z + az * 1.7, 0, ry, 0, .55, .14, .8));
      pools.push(x + ax * 1.7, z + az * 1.7);
    }
  }
  const poolC = canvas(64, 64), pg = poolC.getContext('2d'), grad = pg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.45, 'rgba(255,255,255,.45)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  pg.fillStyle = grad; pg.fillRect(0, 0, 64, 64);
  const poolMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texture(poolC), color: '#ffcf80', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 }), pools.length / 2);
  for (let i = 0; i < pools.length; i += 2) {
    const x = pools[i], z = pools[i + 1], up = V(groundY(x - 1, z) - groundY(x + 1, z), 2, groundY(x, z - 1) - groundY(x, z + 1)).normalize();
    dummy.position.set(x, groundY(x, z) + .12, z); dummy.quaternion.setFromUnitVectors(V(0, 1, 0), up); dummy.scale.setScalar(1); dummy.updateMatrix(); poolMesh.setMatrixAt(i / 2, dummy.matrix);
  }
  poolMesh.renderOrder = 1; scene.add(poolMesh);
  const m = 20;
  box(X0 - 60, X0 + m, Z0 - 60, Z1 + 60, 999); box(X1 - m, X1 + 60, Z0 - 60, Z1 + 60, 999);
  box(X0 - 60, X1 + 60, Z0 - 60, Z0 + m, 999); box(X0 - 60, X1 + 60, Z1 - m, Z1 + 60, 999);

  for (const t of tiles.values()) {
    for (const [mat, b] of t.b) if (b.p.length) scene.add(new THREE.Mesh(b.geometry(), mat));
    t.trees.forEach((list, k) => {
      if (!list.length) return;
      const im = new THREE.InstancedMesh(TREE[k], solidMat, list.length / 3);
      for (let i = 0; i < list.length; i += 3) { dummy.position.set(list[i], list[i + 1] - .2, list[i + 2]); dummy.rotation.set(0, rand(0, 6.28), 0); dummy.scale.setScalar(rand(.8, 1.25)); dummy.updateMatrix(); im.setMatrixAt(i / 3, dummy.matrix); }
      im.computeBoundingSphere(); scene.add(im);
    });
  }
  const puffMat = new THREE.MeshLambertMaterial({ color: '#d9cfe0', transparent: true, opacity: .4, depthWrite: false });
  for (const p of smoke) { p.mesh = new THREE.Mesh(ICO, puffMat); scene.add(p.mesh); }
  let sn = 0, sd = Infinity;
  for (let i = 0; i < NN; i++) { const d = Math.hypot(NX[i] - P.market.x, NZ[i] - P.market.z); if (d < sd && adj[i].some(e => e.w >= 11 && e.len > 25)) { sd = d; sn = i; } }
  const e0 = adj[sn].reduce((a, e) => e.w * e.len > a.w * a.len ? e : a);
  const centre = P.market || { px: 0, pz: 0 };
  return {
    collide, hitT, blocked, solid, box, onRoad, edgesIn, vec: { B }, pools: poolMesh, doors, crews, smoke, parked, cops, P, solidMat, blockade, aziz, loiter,
    winMats: Object.values(mats).flat(),
    nav: { NN, NX, NZ, adj, nearest: nearestNode, field, downhill },
    map: { canvas: mapCanvas, s: MAPS, x0: X0, z0: Z0 },
    game: D.game, bounds: [X0, Z0, X1, Z1], bridge: D.bridge, exit: D.exit,
    spawn: { x: NX[sn], z: NZ[sn], heading: Math.atan2(NX[e0.to] - NX[sn], NZ[e0.to] - NZ[sn]) },
    centre: { x: centre.px, z: centre.pz }
  };
}

let game;
let styled;
let mapData;
let atlas;
const ico = k => `<i class="gi gi-${k}"></i>`;
function drawIcon(x, key, cx, cy, size) {
  const i = ICONS.indexOf(key);
  if (i < 0 || !atlas) return;
  x.imageSmoothingEnabled = false;
  x.drawImage(atlas, i * 18, 0, 18, 18, Math.round(cx - size / 2), Math.round(cy - size / 2), size, size);
}
function outline(img) {
  const n = ICONS.length, src = canvas(img.width, 16), sx = src.getContext('2d'), out = canvas(n * 18, 18), ox = out.getContext('2d');
  sx.drawImage(img, 0, 0);
  const d = sx.getImageData(0, 0, img.width, 16).data, o = ox.createImageData(n * 18, 18), q = o.data;
  const alpha = (i, x, y) => x >= 0 && x < 16 && y >= 0 && y < 16 ? d[(y * img.width + i * 16 + x) * 4 + 3] : 0;
  for (let i = 0; i < n; i++) for (let y = -1; y <= 16; y++) for (let x = -1; x <= 16; x++) {
    const k = ((y + 1) * n * 18 + i * 18 + x + 1) * 4;
    if (alpha(i, x, y)) { const s = (y * img.width + i * 16 + x) * 4; q[k] = d[s]; q[k + 1] = d[s + 1]; q[k + 2] = d[s + 2]; q[k + 3] = 255; }
    else if (alpha(i, x - 1, y) || alpha(i, x + 1, y) || alpha(i, x, y - 1) || alpha(i, x, y + 1)) q[k + 3] = 255;
  }
  ox.putImageData(o, 0, 0);
  return out;
}
export async function open(site) {
  if (!styled) {
    styled = document.createElement('style');
    styled.textContent = CSS;
    document.head.append(styled);
    await Promise.all(['700 32px GCraft', '400 16px GCraft'].map(f => document.fonts.load(f, 'АБВабв ABCabc 0123'))).catch(() => {});
  }
  mapData ||= await fetch(asset('js/dobryanka.json')).then(r => r.json());
  atlas ||= await new Promise(done => { const im = new Image(); im.onload = () => done(outline(im)); im.onerror = () => done(null); im.src = asset('img/gta-icons.png'); });
  (game ||= create(mapData)).show(site);
}

function create(data) {
  const renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio < 2, powerPreference: 'high-performance' });
  const vp = document.querySelector('meta[name="viewport"]'), vpBase = vp ? vp.content : '';
  const prefs = Object.assign({ vol: .8, sfx: 1, weather: .45, car: .7, fm: false, questOpen: true, fov: 62, speedFov: true, quality: 'mid', sens: .0022, post: true }, (() => { try { return JSON.parse(localStorage.getItem('gtaPrefs')) || {}; } catch (e) { return {}; } })());
  const QUALITY = { low: .6, mid: 1, high: 1.5 };
  renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY[prefs.quality] || 1));
  const dlg = document.createElement('dialog');
  dlg.id = 'gta'; dlg.tabIndex = -1; dlg.setAttribute('aria-label', 'GTA VI: Добрянка');
  dlg.innerHTML = `<div class="g-hurt"></div><div class="g-flash"></div><div class="g-hud"><button type="button" class="g-x" aria-label="Выйти на сайт">X</button><button type="button" class="g-gear" aria-label="Настройки">${ico('gear')}</button><div class="g-quest" role="button" aria-label="Цель и маршрут"></div><div class="g-aim" hidden></div><div class="g-stats"><div class="g-wanted" aria-label="Розыск">${`<span>${ico('star')}</span>`.repeat(5)}</div><div class="g-gold"></div><div class="g-hprow">${ico('heart')}<div class="g-hp"><i></i></div></div><div class="g-stam" hidden><i></i></div><div class="g-loot"></div><div class="g-race"></div><div class="g-job"></div><button type="button" class="g-gun" aria-label="Сменить ствол"></button></div><div class="g-radio" hidden></div><div class="g-mapbox"><div class="g-weather"></div><canvas class="g-map" width="400" height="400" role="button" aria-label="Карта и навигация"></canvas></div><div class="g-speed" hidden><b>0</b><small>КМ/Ч</small></div><div class="g-ann" aria-live="polite"></div><div class="g-hint"></div></div><div class="g-pad"><div class="g-joy"></div><div class="g-stick"><i></i></div><button type="button" class="g-act" data-act>ВЫЙТИ</button><button type="button" class="g-jump" data-k="hand">ПРЫЖОК</button></div><div class="g-full" hidden><canvas></canvas><div class="g-ftip" hidden></div><div class="g-fz"><button type="button" data-z="in" aria-label="Приблизить">+</button><button type="button" data-z="out" aria-label="Отдалить">−</button><button type="button" data-z="me" aria-label="К себе">${ico('pin')}</button></div><button type="button" class="g-fx" aria-label="Закрыть карту">X</button></div><div class="g-screen"><div></div></div>`;
  dlg.prepend(renderer.domElement);
  document.body.append(dlg);
  const $ = s => dlg.querySelector(s), annEl = $('.g-ann'), hintEl = $('.g-hint'), scr = $('.g-screen'), hud = $('.g-hud');
  const aimEl = $('.g-aim'), jumpEl = $('.g-jump'), speedEl = $('.g-speed'), raceEl = $('.g-race'), gunEl = $('.g-gun'), weatherEl = $('.g-weather'), stamEl = $('.g-stam'), actEl = $('.g-act'), jobEl = $('.g-job'), radio = $('.g-radio'), wantedEl = $('.g-wanted'), stars = [...wantedEl.children], goldEl = $('.g-gold'), questEl = $('.g-quest'), hurtEl = $('.g-hurt'), flashEl = $('.g-flash'), hpEl = $('.g-hp i'), lootEl = $('.g-loot');

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(62, 1, .5, 1000);
  scene.fog = new THREE.Fog('#c9527f', 70, 320);
  const hemi = new THREE.HemisphereLight('#ffc2e0', '#3b2244', 1.8);
  scene.add(hemi);
  const sunDir = V(-1, .16, -.35).normalize(), sunLight = new THREE.DirectionalLight('#ffb36b', 2.6);
  sunLight.position.copy(sunDir).multiplyScalar(100); scene.add(sunLight);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { zen: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, gnd: { value: new THREE.Color('#120a1c') }, sunD: { value: V(0, 1, 0) }, glow: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vDir;\nvoid main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 zen, hor, gnd, sunD, glow;\nvarying vec3 vDir;\nvoid main() {\n vec3 d = normalize(vDir);\n vec3 c = d.y > 0.0 ? mix(hor, zen, pow(d.y, 0.55)) : mix(hor, gnd, pow(-d.y, 0.45));\n float s = max(dot(d, sunD), 0.0);\n c += glow * (pow(s, 6.0) * 0.5 + pow(s, 90.0) * 1.2);\n gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}'
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 24), skyMat);
  sky.renderOrder = -2; scene.add(sky);
  const moonC = canvas(128, 128), mxc = moonC.getContext('2d');
  mxc.fillStyle = '#e4ecff'; mxc.beginPath(); mxc.arc(64, 64, 60, 0, 7); mxc.fill();
  mxc.fillStyle = '#b9c4e0'; for (const [x, y, r] of [[44, 50, 12], [80, 76, 9], [70, 38, 6], [50, 86, 7]]) { mxc.beginPath(); mxc.arc(x, y, r, 0, 7); mxc.fill(); }
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 8.5), new THREE.MeshBasicMaterial({ map: texture(moonC), alphaTest: .5, fog: false, depthWrite: false }));
  moon.renderOrder = -1; scene.add(moon);
  const headLight = new THREE.SpotLight('#ffe9b0', 0, 80, .55, .6, 1);
  scene.add(headLight, headLight.target);
  const PAL = {
    night: { zen: '#04050d', hor: '#18223f', glow: '#2a3050', fog: '#0e1226', hs: '#4b5f9a', hg: '#0b0b16', hi: .55, sc: '#a8b8ff', si: .5 },
    dusk: { zen: '#2a1050', hor: '#ff8a5c', glow: '#ffb070', fog: '#c9527f', hs: '#ffc2e0', hg: '#3b2244', hi: 1.8, sc: '#ffb36b', si: 2.6 },
    day: { zen: '#2d6fd1', hor: '#cfe4ff', glow: '#fff1c8', fog: '#b7c9de', hs: '#eef5ff', hg: '#4d4638', hi: 1.6, sc: '#fff3dd', si: 2.8 }
  };
  for (const ph of Object.values(PAL)) for (const k in ph) if (typeof ph[k] === 'string') ph[k] = new THREE.Color(ph[k]);
  const grey = new THREE.Color('#7d7d8c');
  const blend = (out, key, wn, wd, wy) => out.setRGB(PAL.night[key].r * wn + PAL.dusk[key].r * wd + PAL.day[key].r * wy, PAL.night[key].g * wn + PAL.dusk[key].g * wd + PAL.day[key].g * wy, PAL.night[key].b * wn + PAL.dusk[key].b * wd + PAL.day[key].b * wy);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const sunC = canvas(256, 256), sx = sunC.getContext('2d'), grad = sx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fff3a0'); grad.addColorStop(.6, '#ff8a5c'); grad.addColorStop(1, '#ff3d8a');
  sx.fillStyle = grad; sx.beginPath(); sx.arc(128, 128, 126, 0, 7); sx.fill();
  sx.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 6; k++) sx.fillRect(0, 150 + k * 18, 256, 3 + k * 1.6);
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ map: texture(sunC), alphaTest: .5, fog: false, depthWrite: false }));
  sun.renderOrder = -1; scene.add(sun);

  const world = city(scene, data), mat = world.solidMat, nav = world.nav, P = world.P;
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
    uaz: { name: 'УАЗ МВД', geo: uazGeo(), top: 30, armor: .7, chill: true },
    polo: { name: 'Поло Азиза', geo: carGeo('#d8dade'), top: 33, armor: 1, school: true },
    granta: { name: 'Гранту Азиза', geo: carGeo('#4a2a5a'), top: 31, armor: 1.05, school: true }
  };
  const uMat = (() => { const c = canvas(72, 72), t = texture(c); drawIcon(c.getContext('2d'), 'uschool', 36, 36, 72); t.magFilter = THREE.NearestFilter; return new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }); })();
  const car = spec => {
    const mesh = new THREE.Mesh(spec.geo, mat), lights = [];
    mesh.rotation.order = 'YXZ';
    if (spec.school) { const u = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), uMat); u.position.set(0, 2.25, -.25); mesh.add(u); }
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = .05; mesh.add(shadow);
    if (spec.cop) for (const k of [0, 1]) { const l = new THREE.Mesh(BOX, lightMats[k]); l.scale.set(.6, .22, .4); l.position.set(k ? .4 : -.4, 1.9, -.25); mesh.add(l); lights.push(l); }
    return { spec, mesh, lights, r: 1.9, m: 1, hp: 100, gunCD: rand(1, 2), pos: V(0, 0, 0), vel: V(0, 0, 0), heading: 0, speed: 0, y: 0, lean: 0, stuck: 0, reverse: 0, wn: -1 };
  };
  const cars = [], homes = [];
  const park = (spec, x, z, heading) => { const c = car(spec); c.home = [x, z, heading]; homes.push(c); scene.add(c.mesh); return c; };
  const myCar = park(specs.nine, world.spawn.x, world.spawn.z, world.spawn.heading);
  for (const [x, z, h] of world.cops) park(specs.cop, x, z, h);
  world.parked.forEach(([x, z, h], k) => park(k ? pick(specs.civ) : specs.sport2, x, z, h));
  world.aziz.forEach(([x, z, h], k) => park(k ? specs.granta : specs.polo, x, z, h));
  if (world.blockade) for (const [x, z, h] of world.blockade.cars) park(specs.uaz, x, z, h);
  const hero = Object.assign(person(mat, { top: '#ff4fb8', stripe: '#ffffff', skin: '#e8b894', hat: '#151515', legs: '#22222e' }), { spec: { name: 'ты', armor: 1 }, foot: true, r: .6, m: .15, t: 0, pos: V(0, 0, 0), vel: V(0, 0, 0), heading: 0, speed: 0, y: 0 });
  const doors = world.doors, crews = world.crews, ringGeo = new THREE.CylinderGeometry(1.7, 1.7, 1, 28, 1, true);
  const iconSprite = key => {
    const c = canvas(72, 72), t = texture(c);
    drawIcon(c.getContext('2d'), key, 36, 36, 72);
    t.magFilter = THREE.NearestFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
    sp.scale.set(2.4, 2.4, 1); scene.add(sp); return sp;
  };
  const ring = color => { const r = new THREE.Mesh(ringGeo, glow(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false }))); scene.add(r); return r; };
  for (const d of doors) { d.ring = ring(SHOPDEF[d.kind].color); d.icon = iconSprite(SHOPDEF[d.kind].icon); d.y = groundY(d.x, d.z); d.ring.position.set(d.x, d.y + .5, d.z); }
  for (const c of crews) { c.icon = iconSprite('skull'); c.y = groundY(c.cx, c.cz); c.pos = V(c.cx, 0, c.cz); }
  const drop = { x: P.gres.x, z: P.gres.z, y: groundY(P.gres.x, P.gres.z), ring: ring('#ffd24a'), icon: iconSprite('chest') };
  drop.ring.position.set(drop.x, drop.y + .5, drop.z); drop.ring.scale.set(1.8, 1, 1.8);
  const beat = Object.assign(person(mat, { top: '#2b3f6b', stripe: '#c9a64a', skin: '#e3b08c', hat: '#1e2f5a', legs: '#1e2f5a' }), { foot: true, r: .55, m: .15, t: 0, pos: V(0, 0, 0), vel: V(0, 0, 0), heading: 0, speed: 0, y: 0, active: false, cd: 0, wn: -1 });
  beat.mesh.visible = false; scene.add(beat.mesh);
  const dotC = canvas(32, 32), dotX = dotC.getContext('2d'), dotG = dotX.createRadialGradient(16, 16, 0, 16, 16, 16);
  dotG.addColorStop(0, 'rgba(255,255,255,1)'); dotG.addColorStop(.5, 'rgba(255,255,255,.6)'); dotG.addColorStop(1, 'rgba(255,255,255,0)');
  dotX.fillStyle = dotG; dotX.fillRect(0, 0, 32, 32);
  const dotTex = texture(dotC);
  const PN = 1400, drops = new Float32Array(PN * 3), rainPos = new Float32Array(PN * 6), snowPos = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) { drops[i * 3] = rand(-35, 35); drops[i * 3 + 1] = rand(-10, 25); drops[i * 3 + 2] = rand(-35, 35); }
  const rainGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const snowGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const rainMesh = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#a9bfe0', transparent: true, opacity: .55, fog: false }));
  const snowMesh = new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: dotTex, color: '#ffffff', size: .3, transparent: true, opacity: .9, depthWrite: false }));
  rainMesh.frustumCulled = snowMesh.frustumCulled = false; scene.add(rainMesh, snowMesh);
  let weather = WEATHER[0], temp = 15, flash = 0, boltAt = 0, grip = 9, stamina = 1, hour = 18.8, weatherAt = 0, dayW = { n: 0, d: 1, y: 0 };
  const wcur = { rain: 0, snow: 0, f0: 70, f1: 320, light: 1, grip: 9 };
  const wrapc = (v, c, h) => c + ((((v - c + h) % (2 * h)) + 2 * h) % (2 * h)) - h;
  function setWeather(next) {
    weather = next || pick(WEATHER); temp = Math.round(rand(weather.t[0], weather.t[1]));
    weatherAt = now + rand(70, 150); boltAt = now + rand(3, 8);
    if (!next) Object.assign(wcur, { rain: weather.rain || 0, snow: weather.snow ? 1 : 0, f0: weather.fog[0], f1: weather.fog[1], light: weather.light, grip: weather.grip });
  }
  function atmosphere(dt) {
    hour = (hour + dt / 40) % 24;
    if (state === 'play' && now > weatherAt) { let n = weather; while (n === weather) n = pick(WEATHER); setWeather(n); hint(`Погода меняется: ${ico(n.icon)} ${n.name.toLowerCase()}`, 2.5); }
    const k = Math.min(1, dt / 5), W = weather;
    wcur.rain += ((W.rain || 0) - wcur.rain) * k; wcur.snow += ((W.snow ? 1 : 0) - wcur.snow) * k;
    wcur.f0 += (W.fog[0] - wcur.f0) * k; wcur.f1 += (W.fog[1] - wcur.f1) * k; wcur.light += (W.light - wcur.light) * k; wcur.grip += (W.grip - wcur.grip) * k;
    grip = wcur.grip;
    const ang = (hour - 7.5) / 12 * Math.PI, elev = Math.sin(ang) * .96, az = Math.PI / 2 - ang, e = Math.sin(elev);
    sunDir.set(Math.cos(elev) * Math.sin(az), e, Math.cos(elev) * Math.cos(az));
    const wy = smooth(.05, .45, e), wn = smooth(.04, -.22, e), wd = Math.max(0, 1 - wy - wn), L = wcur.light, sunUp = smooth(-.08, .12, e);
    dayW = { n: wn, d: wd, y: wy };
    const u = skyMat.uniforms;
    blend(u.zen.value, 'zen', wn, wd, wy).multiplyScalar(.45 + .55 * L);
    blend(u.hor.value, 'hor', wn, wd, wy).lerp(grey, (1 - L) * .7 * (1 - wn));
    blend(u.glow.value, 'glow', wn, wd, wy).multiplyScalar(L * (wd + wy * .5 + wn * .3));
    u.sunD.value.copy(sunUp > .02 ? sunDir : tmp2.copy(sunDir).negate());
    blend(scene.fog.color, 'fog', wn, wd, wy).lerp(grey, (1 - L) * .6 * (1 - wn));
    scene.fog.near = wcur.f0; scene.fog.far = wcur.f1 * (1 - wn * .25);
    blend(hemi.color, 'hs', wn, wd, wy); blend(hemi.groundColor, 'hg', wn, wd, wy);
    hemi.intensity = (PAL.night.hi * wn + PAL.dusk.hi * wd + PAL.day.hi * wy) * (.45 + .55 * L) + flash * 4;
    if (sunUp > .5) { sunLight.position.copy(sunDir).multiplyScalar(100); blend(sunLight.color, 'sc', 0, wd, wy); sunLight.intensity = (PAL.dusk.si * wd + PAL.day.si * wy) / Math.max(wd + wy, .01) * sunUp * L; }
    else { sunLight.position.copy(sunDir).multiplyScalar(-100); sunLight.color.copy(PAL.night.sc); sunLight.intensity = PAL.night.si * (1 - sunUp) * L; }
    sun.visible = e > -.1; sun.material.color.setScalar(L > .9 ? 1 : .45);
    moon.visible = e < .1;
    for (const m of world.winMats) m.emissiveIntensity = .2 + 1.6 * wn + .7 * wd;
    const gk = 1 + 1.5 * wn, lk = .3 + 2.8 * wn;
    for (const m of GLOW) m.color.copy(m.userData.base).multiplyScalar(m.userData.lamp ? lk : gk);
    world.pools.material.opacity = .3 * wn; world.pools.visible = wn > .02;
    const lights = !player.foot && zone !== 'inside' && state !== 'title' && (wn > .3 || L < .7);
    headLight.intensity = lights ? 160 * Math.max(wn, 1 - L) : 0;
    if (lights) { const h = player.heading; headLight.position.set(player.pos.x + Math.sin(h) * 2.2, player.y + 1, player.pos.z + Math.cos(h) * 2.2); headLight.target.position.set(player.pos.x + Math.sin(h) * 22, player.y, player.pos.z + Math.cos(h) * 22); }
  }
  function weatherStep(dt) {
    atmosphere(dt);
    rainMesh.visible = wcur.rain > .02 && zone === 'city'; snowMesh.visible = wcur.snow > .02 && zone === 'city';
    rainMesh.material.color.set('#a9bfe0').multiplyScalar(1 - .55 * dayW.n); snowMesh.material.color.setScalar(1 - .5 * dayW.n);
    rainGeo.setDrawRange(0, Math.floor(PN * Math.min(1, wcur.rain)) * 2); snowGeo.setDrawRange(0, Math.floor(PN * wcur.snow));
    if (zone === 'inside' && room) {
      for (const f of room.anim) f(dt);
      for (const r of room.rings) r.ring.material.opacity = .35 + Math.sin(now * 4) * .15;
      if (room.kind === 'strip' && ac && now > beatAt) { beatAt = now + .46; kick(); }
    }
    const c = camera.position, snowing = wcur.snow > wcur.rain, fall = snowing ? 2.2 : 36;
    if (rainMesh.visible || snowMesh.visible) {
      for (let i = 0; i < PN; i++) {
        const k = i * 3;
        drops[k + 1] -= fall * dt;
        if (drops[k + 1] < c.y - 12) drops[k + 1] += 36;
        if (drops[k + 1] > c.y + 24) drops[k + 1] -= 36;
        if (snowing) drops[k] += Math.sin(now + i) * .6 * dt;
        if (Math.abs(drops[k] - c.x) < 2.5 && Math.abs(drops[k + 2] - c.z) < 2.5) drops[k] += 5;
        const x = drops[k] = wrapc(drops[k], c.x, 35), z = drops[k + 2] = wrapc(drops[k + 2], c.z, 35), y = drops[k + 1], j = i * 6;
        snowPos[k] = x; snowPos[k + 1] = y; snowPos[k + 2] = z;
        rainPos[j] = x; rainPos[j + 1] = y; rainPos[j + 2] = z; rainPos[j + 3] = x + .12; rainPos[j + 4] = y + 1.1; rainPos[j + 5] = z + .08;
      }
      rainGeo.attributes.position.needsUpdate = true; snowGeo.attributes.position.needsUpdate = true;
    }
    if (weather.storm && wcur.rain > .6 && now > boltAt) { boltAt = now + rand(5, 12); flash = 1; play('thunder', .55, rand(.85, 1.1)) || noise(1.6, 120, .6, 'lowpass'); }
    flash = Math.max(0, flash - dt * 3);
  }
  const drunks = [];
  for (let i = 0; i < 7; i++) {
    const d = Object.assign(person(mat, { top: pick(['#3a3a2a', '#2a3a4a', '#4a2a2a', '#2e2e2e']), stripe: '#555555', skin: '#d9907a', hat: '#5a4a3a', legs: '#22222a' }), { foot: true, r: .5, m: .2, t: rand(0, 9), seed: rand(0, 9), pos: V(0, 0, 0), vel: V(0, 0, 0), heading: rand(0, 6.3), speed: 0, y: 0, active: false, down: 0 });
    d.mesh.visible = false; scene.add(d.mesh); drunks.push(d);
  }
  function drunkStep(dt) {
    const night = hour >= 21 || hour < 5;
    for (const d of drunks) {
      if (!night || zone !== 'city') { if (d.active) { d.active = false; d.mesh.visible = false; } continue; }
      if (!d.active || Math.hypot(d.pos.x - player.pos.x, d.pos.z - player.pos.z) > 200) { d.pos.copy(spot(20)); d.active = true; d.mesh.visible = true; d.down = 0; d.mesh.rotation.x = 0; }
      d.t += dt;
      if (d.down > 0) { d.down -= dt; d.mesh.rotation.x = d.down > 0 ? -1.45 : 0; continue; }
      d.heading += Math.sin(d.t * 1.3 + d.seed) * dt * 1.4;
      if (groundY(d.pos.x + Math.sin(d.heading) * 1.5, d.pos.z + Math.cos(d.heading) * 1.5) < .4) d.heading += Math.PI;
      walk(d, 1, 0, dt, 1.2);
      place(d, dt);
      d.mesh.rotation.z = Math.sin(d.t * 2.2 + d.seed) * .22;
      if (live() && !player.foot && Math.abs(player.speed) > 5 && Math.hypot(player.pos.x - d.pos.x, player.pos.z - d.pos.z) < 2.6) {
        d.down = 6; spray(d.pos, ['#3a3a2a', '#7a0f1a'], 8, 6); play('scream1', .6);
        hint(pick(['Мужик даже не проснулся', 'Встанет, он из Добрянки', 'Это был Батя из «Пенного»', 'Он так каждую пятницу']), 2);
        heat = Math.min(5, heat + .2); lastKill = now;
      }
    }
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
  heroShadow.position.y = .05; hero.shadow = heroShadow; hero.mesh.add(heroShadow); hero.mesh.visible = false; scene.add(hero.mesh);
  let player = myCar;
  const crowdKinds = [{ kind: 'spider', count: 26, geo: spiderGeo(), walk: 2.4, run: 6.5, size: 1.35 }, { kind: 'courier', count: 2, geo: courierGeo(), walk: 3.5, run: 9.5, size: 1.2 }];
  const crowd = [];
  for (const k of crowdKinds) {
    k.mesh = new THREE.InstancedMesh(k.geo, mat, k.count); k.mesh.frustumCulled = false; scene.add(k.mesh);
    for (let i = 0; i < k.count; i++) crowd.push({ k, i, pos: V(0, 0, 0), vel: V(0, 0, 0), heading: rand(0, 6.3), t: rand(0, 9), seed: rand(0, 9), dead: false, respawn: 0 });
  }
  const rooms = {}, ROOM_KINDS = ['shawarma', 'tire', 'crypto', 'pawn', 'guns', 'pharmacy', 'mvd', 'strip', 'hospital', 'autoschool', 'yantar', 'kb', 'hotel', 'ozon', 'wb'];
  const neonMat = color => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.4) });
  ROOM_KINDS.forEach((kind, k) => {
    const ox = 8000 + k * 60, oz = 8000, W = 12, D = 9, H = 6, b = new Batch(), def = SHOPDEF[kind], anim = [];
    const pal = { shawarma: ['#7a5a3a', '#e8c890'], tire: ['#3a3a3e', '#7a7a80'], crypto: ['#3a1030', '#5a1a4a'], pawn: ['#5a4a3a', '#8a7a60'], guns: ['#4a3a2a', '#5e4a32'], pharmacy: ['#c9d3ce', '#f2f5f3'], mvd: ['#6a6a5a', '#c8c8b0'], strip: ['#1a0a1a', '#2a0a2a'], hospital: ['#b8c4c0', '#e8eeec'], autoschool: ['#3a3a44', '#d8d0c0'], yantar: ['#5a4a3a', '#c8a070'], kb: ['#4a1a1a', '#f0e8e0'], hotel: ['#5a3a2a', '#d8c8a8'], ozon: ['#2a3a6a', '#dde6ff'], wb: ['#3a1a4a', '#f0e0f8'] }[kind];
    const SHELF = { pharmacy: ['#c0392b', '#3a6cf4', '#1f9a6a', '#ffd24a'], yantar: ['#6a4a1a', '#2f7a3a', '#c8a070', '#d4a017'], kb: ['#c0302a', '#f2f2f2', '#6a1a1a', '#d4a017'] }[kind];
    const bx = (x0, x1, z0, z1, h = 9) => world.box(ox + x0, ox + x1, oz + z0, oz + z1, h);
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
      if (SHELF) { for (const x of [-9, 9]) { b.add(BOX, '#ffffff', M(ox + x, 1.5, oz, 0, 0, 0, 1.2, 3, 8)); for (let i = 0; i < 12; i++) b.add(BOX, pick(SHELF), M(ox + x - Math.sign(x) * .7, .6 + (i % 4) * .7, oz - 3 + Math.floor(i / 4) * 3, 0, 0, 0, .3, .4, .6)); } bx(-9.6, -8.4, -4, 4, 3); bx(8.4, 9.6, -4, 4, 3); }
      if (kind === 'pharmacy' || kind === 'hospital') for (const [w, h] of [[2, .6], [.6, 2]]) at(new THREE.Mesh(BOX, neonMat(kind === 'pharmacy' ? '#1fd17a' : '#ff2030')), 0, 5.2, D - .3).scale.set(w, h, .1);
      if (kind === 'hospital' || kind === 'hotel') for (const x of [-8, 8]) { b.add(BOX, '#f2f2f2', M(ox + x, .55, oz - 2, 0, 0, 0, 2.2, .6, 4.2)); b.add(BOX, kind === 'hotel' ? '#7a2e4a' : '#9ab0c8', M(ox + x, .9, oz - 3.4, 0, 0, 0, 2.1, .2, 1.2)); bx(x - 1.2, x + 1.2, -4.2, .2, 1); }
      if (kind === 'ozon' || kind === 'wb') for (let i = 0; i < 14; i++) { const x = (i % 2 ? 1 : -1) * rand(6, 10), z = rand(-5, 2); b.add(BOX, kind === 'ozon' ? pick(['#2f6fff', '#5a8aff', '#c8a070']) : pick(['#b03ad0', '#d070f0', '#c8a070']), M(ox + x, .5 + (i % 3) * .9, oz + z, 0, rand(0, 1), 0, 1.4, .9, 1.1)); }
      if (kind === 'autoschool') { at(new THREE.Mesh(specs.polo.geo, mat), -6.5, 0, -1, .5); bx(-8.6, -4.4, -3.6, 1.6, 2); for (let i = 0; i < 5; i++) b.add(CONE, '#ff8a2a', M(ox + 3 + i * 1.6, .45, oz - 2, 0, 0, 0, .6, .9, .6)); }
      if (kind === 'mvd') { for (const [c, y] of [['#ffffff', 5.3], ['#2a5fd0', 4.9], ['#c0392b', 4.5]]) b.add(BOX, c, M(ox - 9, y, oz + D - .3, 0, 0, 0, 2.4, .4, .1)); for (let i = 0; i < 9; i++) b.add(BOX, '#555', M(ox + 6.5 + i * .5, 2.5, oz - 4, 0, 0, 0, .08, 5, .08)); for (let i = 0; i < 9; i++) b.add(BOX, '#555', M(ox + 6.3, 2.5, oz - 4 + i * .5, 0, 0, 0, .08, 5, .08)); bx(6.2, 12, -4.2, 0, 6); const [file, name] = pick(WANTED); at(poster(file, name), -6, 2.8, D - .3, Math.PI).scale.setScalar(.6); }
    }
    for (const r of rings) r.ring.position.set(r.x, .5, r.z);
    scene.add(new THREE.Mesh(b.geometry(), mat));
    rooms[kind] = { kind, ox, oz, rings, anim, door: doors.find(d => d.kind === kind) };
  });
  const TR = { ox: 0, oz: 9000, halfW: 9, NS: 640, laps: 2 };
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
    banner.material.side = THREE.DoubleSide; banner.position.set(tp[0].x, 7.5, tp[0].z); banner.rotation.y = h0 + Math.PI; scene.add(banner);
  }
  const raceGate = { kind: 'race', x: P.race.x, z: P.race.z, ang: P.race.ang, inside: false, ring: ring('#ffffff'), icon: iconSprite('race') };
  const gateY = groundY(raceGate.x, raceGate.z), roadside = (p, k) => [p.x + Math.sin(p.ang) * k, p.z + Math.cos(p.ang) * k];
  raceGate.ring.position.set(raceGate.x, gateY + .5, raceGate.z); raceGate.ring.scale.set(2.2, 1, 2.2); raceGate.icon.position.set(raceGate.x, gateY + 5, raceGate.z); raceGate.icon.scale.set(4, 4, 1);
  let race = null;
  const block = world.blockade, blockDoor = block && { kind: 'block', x: block.x, z: block.z, ang: block.ang }, EX = world.exit, exitY = groundY(EX[0], EX[1]);
  const exitRing = ring('#ffd24a'), exitIcon = iconSprite('sunset');
  exitRing.position.set(EX[0], exitY + .5, EX[1]); exitRing.scale.set(3.4, 1, 3.4); exitIcon.position.set(EX[0], exitY + 6, EX[1]); exitIcon.scale.set(4, 4, 1);
  let exam = null, rock = null, schoolAt = 0, exitHintAt = 0, barkAt = 0, winAt = 0;
  const examRing = ring('#5ff2ff'), examIcon = iconSprite('flag');
  examRing.scale.set(2.6, 1, 2.6); examRing.visible = examIcon.visible = false;
  function startExam() {
    leaveShop(); exitRoom();
    const [sx, sz] = roadside(P.autoschool, 9), start = nav.nearest(sx, sz), cps = [];
    for (let k = 0, cur = start; k < 5; k++) {
      const f = nav.field(cur), opts = [];
      for (let n = 0; n < nav.NN; n++) if (f[n] > 90 && f[n] < 170 && !cps.includes(n) && groundY(nav.NX[n], nav.NZ[n]) > .5) opts.push(n);
      if (opts.length) cps.push(cur = pick(opts));
    }
    const c = car(specs.granta), e = nav.adj[start][0];
    c.pos.set(nav.NX[start], 0, nav.NZ[start]); c.heading = Math.atan2(nav.NX[e.to] - nav.NX[start], nav.NZ[e.to] - nav.NZ[start]); c.stolen = true;
    scene.add(c.mesh); cars.push(c); place(c);
    hero.mesh.visible = false; player = c; chase(0, true);
    exam = { cps, i: 0, until: run.time + 80, car: c, prev: gps };
    ann('ЭКЗАМЕН', 'gold'); hint('Азиз: «Пять флажков, восемьдесят секунд, пауков не дави, брат»', 3.5);
    examNext();
  }
  function examNext() { const n = exam.cps[exam.i]; setGps(nav.NX[n], nav.NZ[n], 'flag', `Экзамен ${exam.i + 1}/${exam.cps.length}`); }
  function examEnd(ok, why) {
    examRing.visible = examIcon.visible = false; gps = exam.prev; exam = null;
    if (ok) { run.license = true; ann('ПРАВА ПОЛУЧЕНЫ', 'gold'); hint('Азиз: «Молодец, брат. Гранту оставь себе до вечера»', 3); }
    else { ann('ЭКЗАМЕН ПРОВАЛЕН'); hint(why, 3); }
  }
  function examStep() {
    if (!exam) return;
    if (player !== exam.car) { examEnd(false, 'Азиз: «Ты зачем из машины вышел? Приходи завтра»'); return; }
    if (run.time > exam.until) { examEnd(false, 'Азиз: «Медленно, брат. Как Гранта в гору»'); return; }
    const n = exam.cps[exam.i], x = nav.NX[n], z = nav.NZ[n], y = groundY(x, z);
    examRing.visible = examIcon.visible = true; examRing.position.set(x, y + .5, z); examIcon.position.set(x, y + 5 + Math.sin(now * 3) * .3, z); examIcon.scale.set(3.2, 3.2, 1);
    if (Math.hypot(player.pos.x - x, player.pos.z - z) < 7) { exam.i++; play('coins', .6); if (exam.i >= exam.cps.length) examEnd(true); else examNext(); }
  }
  function openBlock(how) {
    leaveShop(); run.blockOpen = how; block.solid.gone = true; block.boom.rotation.z = 1.35;
    ann('ПРОЕЗЖАЙ', 'gold'); hint(`Шлагбаум поднят. ${ico('sunset')} Выезд из Добрянки — по навигатору`, 3);
    setGps(EX[0], EX[1], 'sunset', 'Выезд из Добрянки');
  }
  function breakBlock() {
    run.blockOpen = 'ram'; block.solid.gone = true; block.boom.visible = false;
    spray(tmp2.set(block.bx, groundY(block.bx, block.bz), block.bz), ['#e0302a', '#ffffff', '#ffd24a'], 40, 12); play('crash', 1) || noise(.5, 300, .9, 'lowpass');
    heat = 5; lastKill = now; shakeAmt = 1.4; ann('ПРОРЫВ'); hint(`Блокпост снесён! Гони к выезду ${ico('sunset')}, менты на хвосте`, 3);
    setGps(EX[0], EX[1], 'sunset', 'Выезд из Добрянки');
  }
  function parcel() {
    const r = Math.random();
    if (r < .4) return 'Внутри: ' + pick(['чехол на айфон 6', 'носки с Пуджем', 'коврик для мыши 3×4 метра', 'пустая коробка от другой коробки', 'брелок «Добрянка — сердце Прикамья»', 'Аегис из Китая. Сломался по дороге']);
    if (r < .6) { const g = pick([100, 150, 228, 322]); run.gold += g; return `Внутри конверт: +${g}. Кто-то перепутал адрес`; }
    if (r < .75) { const k = pick(Object.keys(GUNS)); run.guns[k] = (run.guns[k] || 0) + GUNS[k].refill; run.gun = k; return `Внутри ${GUNS[k].name}. В описании было «игрушка»`; }
    if (r < .8) { site.loot.cheese++; site.saveLoot(); return 'Внутри сыр. Пахнет Рошаном'; }
    const at = room ? room.door : { x: player.pos.x, z: player.pos.z };
    for (const c of crowd.filter(c => c.k.kind === 'spider').slice(0, 4)) { c.dead = false; c.pos.set(at.x + rand(-4, 4), 0, at.z + rand(-4, 4)); }
    play('scream1', .8);
    return 'Внутри пауки. Живые. Ждут у входа';
  }
  const rockMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 1), new THREE.MeshLambertMaterial({ color: '#9fe0ff', emissive: '#4ab8ff', emissiveIntensity: .8, flatShading: true }));
  rockMesh.visible = false; scene.add(rockMesh);
  function meteor() {
    leaveShop(); exitRoom();
    const a = rand(0, 6.283), x = player.pos.x + Math.sin(a) * 45, z = player.pos.z + Math.cos(a) * 45;
    rock = { x, z, y: groundY(x, z), t: 0 }; rockMesh.visible = true;
    ann('БЕПИС ЖМЁТ УЛЬТУ', 'gold'); hint('Бепис заказал метеорит. Смотри в небо', 3);
  }
  function rockStep(dt) {
    if (!rock || !live()) return;
    rock.t += dt;
    const k = Math.min(1, rock.t / 3);
    rockMesh.position.set(rock.x + 260 * (1 - k), rock.y + 320 * (1 - k), rock.z - 120 * (1 - k)); rockMesh.rotation.x += dt * 3; rockMesh.rotation.y += dt * 2;
    if (Math.random() < .5) spray(rockMesh.position, ['#e8f6ff', '#9fe0ff'], 2, 3);
    if (k < 1) return;
    rockMesh.visible = false; shakeAmt = 2.5; flash = 1;
    play('boom', 1) || noise(1.6, 90, 1, 'lowpass');
    spray(tmp2.set(rock.x, rock.y, rock.z), ['#e8f6ff', '#9fe0ff', '#ffffff', '#4ab8ff'], 90, 22);
    for (const c of crowd) if (!c.dead && Math.hypot(c.pos.x - rock.x, c.pos.z - rock.z) < 70) squash(c);
    while (cops.length) blowCop(cops[0]);
    heat = 0; beat.active = false; beat.mesh.visible = false; rock = null;
    setWeather(WEATHER[3]); Object.assign(wcur, { rain: 0, snow: 1 });
    ann('FREEZING FIELD', 'gold'); hint('Бепис доволен. Добрянка заморожена, МВД во льду', 3.5);
  }
  const loiterers = world.loiter.map(([x, z]) => {
    const l = Object.assign(person(mat, { top: pick(['#1a1a24', '#2a2a3a', '#3a2a1a', '#1e2f7a']), stripe: '#f2f2f2', skin: '#e3b08c', hat: '#111', legs: '#1a1a24' }), { x, z, down: 0, seed: rand(0, 9), pos: V(x, 0, z) });
    l.mesh.position.set(x, groundY(x, z), z); l.mesh.rotation.y = P.yantar.ang + rand(-.8, .8); scene.add(l.mesh);
    return l;
  });
  function loiterStep(dt) {
    for (const l of loiterers) {
      if (l.down > 0) { l.down -= dt; l.mesh.rotation.x = l.down > 0 ? -1.45 : 0; continue; }
      l.mesh.rotation.z = Math.sin(now * 1.3 + l.seed) * .06; l.arms[0].rotation.x = -1.1 + Math.sin(now * 2 + l.seed) * .25;
      if (!live() || zone !== 'city') continue;
      const d = Math.hypot(player.pos.x - l.x, player.pos.z - l.z);
      if (!player.foot && Math.abs(player.speed) > 5 && d < 2.4) {
        l.down = 8; spray(l.pos, ['#1a1a24', '#7a0f1a'], 8, 6); play('scream1', .6); heat = Math.min(5, heat + .3); lastKill = now;
        hint(pick(['Пацаны у «Янтаря» запомнили номер', 'Встанет. Он и не такое видел', 'Это был Колян. Колян вернётся']), 2);
      }
      if (player.foot && d < 6 && now > barkAt && !run.respect) { barkAt = now + 5; hint(pick(['«Э, братан, есть сотка?»', '«Ты с какого района?»', '«Сига есть?»', '«Дай позвонить, мне только мамке»', '«Слышь, а чё такой нарядный?»']), 2.5); }
    }
  }
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
      c.speed = 0; c.vel.set(0, 0, 0); c.y = 0; c.lap = -1; c.half = true; c.ti = i; c.lane = rand(-4, 4); c.raceTop = rand(40, 46);
      if (c !== rc) scene.add(c.mesh); else scene.add(rc.mesh);
      race.cars.push(c); place(c, 1);
    });
    if (player.foot) hero.mesh.visible = false;
    player = rc; zone = 'race'; chase(0, true);
  }
  function endRace(rank) {
    const rc = race.car, took = clockStr(Math.max(0, run.time - race.start));
    for (const c of race.cars) if (c !== rc) scene.remove(c.mesh);
    zone = 'city';
    const [ox, oz] = roadside(raceGate, 8);
    rc.pos.set(ox, 0, oz); rc.heading = raceGate.ang + Math.PI / 2; rc.speed = 0; rc.vel.set(0, 0, 0); rc.lap = 0;
    if (rank === 1) { cars.push(rc); player = rc; place(rc, 1); run.gold += 2000; ann('ПОБЕДА', 'gold'); hint(`Время ${took}. +2000 и спорткар «Бруда GT» твой`, 4); }
    else {
      scene.remove(rc.mesh);
      const [hx, hz] = roadside(raceGate, 3);
      hero.pos.set(hx, 0, hz); hero.heading = raceGate.ang; hero.mesh.visible = true; player = hero; place(hero, 1);
      if (rank && rank <= 3) { run.gold += 700; ann(`${rank} МЕСТО`, 'gold'); hint(`Время ${took}. +700 за подиум. Спорткар МВД забрало обратно`, 4); }
      else hint(rank ? `${rank} место из 11, время ${took}. Спорткар МВД забрало обратно` : 'Сдался. МВД забрало спорткар', 4);
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
          const ahead = tp[(c.ti + 12) % TR.NS], n = tn[(c.ti + 12) % TR.NS], dx = player.pos.x - c.pos.x, dz = player.pos.z - c.pos.z;
          let lane = c.lane;
          if (Math.hypot(dx, dz) < 12 && dx * Math.sin(c.heading) + dz * Math.cos(c.heading) > 0) lane = (player.pos.x - ahead.x) * n.x + (player.pos.z - ahead.z) * n.z > 0 ? -5.5 : 5.5;
          const tx = ahead.x + n.x * lane, tz = ahead.z + n.z * lane;
          const diff = wrap(Math.atan2(tx - c.pos.x, tz - c.pos.z) - c.heading);
          drive(c, Math.abs(diff) > .5 && c.speed > 26 ? -.4 : 1, clamp(diff * 2.6, -1, 1), false, dt, c.raceTop);
        }
      } else if (!go) { c.speed = 0; c.vel.set(0, 0, 0); }
      else {
        const a = tp[c.ti], b = tp[(c.ti + 1) % TR.NS];
        if (Math.abs(wrap(Math.atan2(b.x - a.x, b.z - a.z) - c.heading)) > 2.2 && Math.abs(c.speed) > 3) hint('НЕ ТУДА! РАЗВЕРНИСЬ', .3);
      }
      trackKeep(c);
    }
    for (let a = 0; a < race.cars.length; a++) for (let b = a + 1; b < race.cars.length; b++) bump(race.cars[a], race.cars[b]);
    const flash = now * 6 % 2 < 1;
    for (const c of race.cars) { if (c.lights.length) { c.lights[0].visible = flash; c.lights[1].visible = !flash; } if (c !== player) place(c, dt); }
    if (race.finish.includes(race.car)) endRace(race.finish.indexOf(race.car) + 1);
  }
  const trackLen = trackCurve.getLength(), segLen = trackLen / TR.NS, raceProg = c => c.lap * TR.NS + c.ti;
  const dist = m => m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' км' : Math.round(m / 10) * 10 + ' м';
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
    const [ox, oz] = roadside(d, 3.2);
    hero.pos.set(ox, 0, oz); hero.heading = d.ang; hero.vel.set(0, 0, 0);
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
  const cops = [], keys = {}, held = { up: new Set(), down: new Set(), left: new Set(), right: new Set(), fire: new Set(), hand: new Set() }, shown = {};
  const touch = matchMedia('(pointer:coarse)').matches;
  const on = k => keys[k] || (held[k] ? held[k].size > 0 : false);
  let camYaw = 0, camPitch = 0, lastLook = -9, locked = false, selfUnlock = false, hurtFx = 0, flashFx = 0;
  const rd = V(0, 0, 1), canLock = !touch && !!renderer.domElement.requestPointerLock;
  const free = () => locked && zone !== 'inside';
  const orbit = () => (locked || touch) && zone !== 'inside';
  const joy = { id: null, x: 0, y: 0, ox: 0, oy: 0 }, camTouch = { id: null, x: 0, y: 0 };

  let ac, master, eng, engGain, sir, sirGain, noiseBuf;
  const bus = {};
  function savePrefs() { try { localStorage.setItem('gtaPrefs', JSON.stringify(prefs)); } catch (e) {} }
  function applyPrefs() {
    if (ac) { master.gain.value = prefs.vol * .6; bus.sfx.gain.value = prefs.sfx; bus.weather.gain.value = prefs.weather; bus.car.gain.value = prefs.car; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY[prefs.quality] || 1)); shown.w = 0;
    try { localStorage.setItem('gtaPrefs', JSON.stringify(prefs)); } catch (e) {}
  }
  function audio() {
    if (ac) { ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -12; limiter.knee.value = 6; limiter.ratio.value = 12; limiter.attack.value = .003; limiter.release.value = .2;
    master = ac.createGain(); master.connect(limiter).connect(ac.destination);
    for (const k of ['sfx', 'weather', 'car']) { bus[k] = ac.createGain(); bus[k].connect(master); }
    applyPrefs();
    eng = ac.createOscillator(); eng.type = 'sawtooth'; engGain = ac.createGain(); engGain.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    eng.connect(lp).connect(engGain).connect(bus.car); eng.start();
    sir = ac.createOscillator(); sir.type = 'triangle'; sirGain = ac.createGain(); sirGain.gain.value = 0;
    sir.connect(sirGain).connect(bus.car); sir.start();
    loadSfx();
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function kick() {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + .18);
    g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .25);
    o.connect(g).connect(bus.sfx); o.start(t); o.stop(t + .26);
    if (Math.random() < .7) noise(.05, 8000, .12, 'highpass');
  }
  const SFX = ['shot', 'shotgun', 'scream1', 'scream2', 'crash', 'boom', 'cash', 'slotspin', 'slotwin', 'splat', 'engine', 'siren', 'rain', 'firstblood', 'doublekill', 'triplekill', 'ultrakill', 'rampage', 'roshan', 'freshmeat', 'getoverhere', 'brood', 'courier', 'coins', 'aegis'];
  const bufs = {}, loops = {};
  const ANN_SFX = { 'FIRST BLOOD': 'firstblood', 'DOUBLE KILL': 'doublekill', 'TRIPLE KILL': 'triplekill', 'ULTRA KILL': 'ultrakill', 'RAMPAGE': 'rampage', 'КУРЬЕР УБИТ': 'courier', 'АЕГИС СРАБОТАЛ': 'aegis', 'УЧАСТКОВЫЙ В БОЛЬНИЦЕ': 'scream1', 'УЕХАЛ В ЗАКАТ': 'roshan', 'ПРАВА ПОЛУЧЕНЫ': 'cash', 'ПРОРЫВ': 'boom', 'FREEZING FIELD': 'roshan', 'ПРОЕЗЖАЙ': 'cash', 'УГНАЛ ТАЧКУ МВД': 'getoverhere', 'THE BATTLE BEGINS': 'brood', 'ДЖЕКПОТ': 'slotwin', 'ПОБЕДА': 'rampage', 'МВД В ЯРОСТИ': 'boom', 'ТАЧКА ТВОЯ': 'cash' };
  function seamless(buf) {
    const sr = buf.sampleRate, pad = Math.floor(.06 * sr), n = buf.length - 2 * pad, f = Math.floor(Math.min(.12, n / sr / 4) * sr);
    const src = buf.getChannelData(0).subarray(pad, pad + n), out = ac.createBuffer(1, n - f, sr), o = out.getChannelData(0);
    o.set(src.subarray(0, n - f));
    for (let i = 0; i < f; i++) { const t = i / f; o[i] = src[i] * Math.sqrt(t) + src[n - f + i] * Math.sqrt(1 - t); }
    return out;
  }
  function loadSfx() {
    for (const [k, url] of SFX.map(k => [k, asset(`sfx/g/${k}.mp3`)]).concat([['thunder', asset('sfx/thunder1.mp3')]])) {
      fetch(url).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(b => ac.decodeAudioData(b)).then(buf => {
        bufs[k] = buf;
        if (k === 'engine' || k === 'siren' || k === 'rain') {
          const src = ac.createBufferSource(), g = ac.createGain();
          src.buffer = seamless(buf); src.loop = true; g.gain.value = 0;
          src.connect(g).connect(k === 'rain' ? bus.weather : bus.car); src.start(); loops[k] = { src, g };
        }
      }).catch(() => {});
    }
  }
  function play(k, vol = 1, rate = 1) {
    const b = bufs[k];
    if (!b || !ac) return false;
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol;
    s.connect(g).connect(k === 'thunder' ? bus.weather : bus.sfx); s.start();
    return true;
  }
  function noise(dur, freq, vol, type) {
    if (!ac) return;
    const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(bus.sfx); s.start(t, Math.random() * .5); s.stop(t + dur);
  }
  function sound() {
    if (!ac) return;
    const t = ac.currentTime;
    let near = Infinity;
    for (const c of cops) near = Math.min(near, c.pos.distanceTo(player.pos));
    const driving = state === 'play' && !player.foot, sirenOn = cops.length && state !== 'title' && zone === 'city';
    eng.frequency.setTargetAtTime(38 + Math.abs(player.speed) * 3.2, t, .06);
    engGain.gain.setTargetAtTime(driving && !loops.engine ? .045 : 0, t, .15);
    if (loops.engine) { loops.engine.src.playbackRate.setTargetAtTime(.75 + Math.min(1, Math.abs(player.speed) / 46) * 1.05, t, .12); loops.engine.g.gain.setTargetAtTime(driving ? .22 + Math.min(1, Math.abs(player.speed) / 46) * .12 : 0, t, .2); }
    sir.frequency.setTargetAtTime(now % 1 < .5 ? 640 : 880, t, .03);
    sirGain.gain.setTargetAtTime(sirenOn && !loops.siren ? .05 * Math.min(1, 30 / near) : 0, t, .1);
    if (loops.siren) loops.siren.g.gain.setTargetAtTime(sirenOn ? .45 * Math.min(1, 30 / near) : 0, t, .1);
    if (loops.rain) loops.rain.g.gain.setTargetAtTime(zone === 'city' && state !== 'title' ? .16 * wcur.rain : 0, t, .3);
  }

  function ann(text, cls = '') {
    if (ANN_SFX[text]) play(ANN_SFX[text]);
    annEl.textContent = text; annEl.className = 'g-ann ' + cls; void annEl.offsetWidth; annEl.classList.add('show');
  }
  function hint(text, sec) { hintEl.innerHTML = text; hintUntil = now + sec; }
  function floatText(text, pos) {
    tmp.set(pos.x, Math.max(pos.y, groundY(pos.x, pos.z)) + 3, pos.z).project(camera);
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
      g.pos.set(pos.x, Math.max(pos.y, groundY(pos.x, pos.z)) + 1, pos.z); g.vel.set(rand(-1, 1) * power, rand(.6, 1.4) * power, rand(-1, 1) * power);
      gibMesh.setColorAt(i, c.set(pick(colors)));
    }
    gibMesh.instanceColor.needsUpdate = true;
  }
  function splat(pos, kind) {
    const m = splats[splatNext++ % splats.length];
    m.material = splatMats[kind]; m.visible = true;
    m.position.set(pos.x, groundY(pos.x, pos.z) + .04, pos.z); m.rotation.y = rand(0, 6.3); m.scale.setScalar(rand(.8, 1.5));
  }

  function spot(minDist, maxDist = minDist + 120) {
    for (let k = 0; k < 40; k++) {
      const a = rand(0, 6.283), r = rand(minDist, maxDist), n = nav.nearest(player.pos.x + Math.sin(a) * r, player.pos.z + Math.cos(a) * r), e = pick(nav.adj[n]);
      const t = rand(0, 1), dx = (nav.NX[e.to] - nav.NX[n]) / e.len, dz = (nav.NZ[e.to] - nav.NZ[n]) / e.len, side = pick([-1, 1]) * (e.w / 2 + rand(.5, 3));
      const x = nav.NX[n] + dx * e.len * t - dz * side, z = nav.NZ[n] + dz * e.len * t + dx * side;
      if (Math.hypot(x - player.pos.x, z - player.pos.z) < minDist || groundY(x, z) < .5 || world.blocked(x, z, 1.2)) continue;
      return V(x, 0, z);
    }
    const n = nav.nearest(player.pos.x, player.pos.z);
    return V(nav.NX[n], 0, nav.NZ[n]);
  }
  const collide = (e, r) => world.collide(e, r);
  function bump(a, b) {
    const R = a.r + b.r, dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, d = Math.hypot(dx, dz);
    if (d > R || d < 1e-4) return 0;
    const nx = dx / d, nz = dz / d, wa = b.m / (a.m + b.m), wb = a.m / (a.m + b.m);
    a.pos.x += nx * (R - d) * wa; a.pos.z += nz * (R - d) * wa; b.pos.x -= nx * (R - d) * wb; b.pos.z -= nz * (R - d) * wb;
    const rel = (a.vel.x - b.vel.x) * nx + (a.vel.z - b.vel.z) * nz;
    if (rel >= 0) return 0;
    const j = -1.3 * rel;
    a.vel.x += nx * j * wa; a.vel.z += nz * j * wa; b.vel.x -= nx * j * wb; b.vel.z -= nz * j * wb;
    for (const c of [a, b]) if (!c.foot) c.speed = clamp(c.vel.dot(fwd.set(Math.sin(c.heading), 0, Math.cos(c.heading))), -20, 50);
    return -rel;
  }
  function walk(h, gas, steer, dt, top = 7, dir = h.heading) {
    h.heading += steer * 3 * dt;
    h.speed = gas > 0 ? top : gas < 0 ? -3 : 0;
    fwd.set(Math.sin(dir), 0, Math.cos(dir));
    h.vel.copy(fwd).multiplyScalar(h.speed);
    h.pos.addScaledVector(h.vel, dt);
    collide(h, h.r);
    h.t += dt * Math.abs(h.speed);
    const swing = Math.sin(h.t * 1.6) * Math.min(1, Math.abs(h.speed) / 4) * .8;
    h.legs[0].rotation.x = swing; h.legs[1].rotation.x = -swing; h.arms[0].rotation.x = -swing; h.arms[1].rotation.x = swing;
    if (h.shadow) { h.shadow.position.y = .05 - (h.jy || 0); h.shadow.scale.setScalar(Math.max(.45, 1 - (h.jy || 0) * .35)); }
    if (h.vy || h.jy > 0) {
      h.jy = Math.max(0, (h.jy || 0) + h.vy * dt); h.vy -= 24 * dt;
      h.legs[0].rotation.x = .8; h.legs[1].rotation.x = -.5; h.arms[0].rotation.x = h.arms[1].rotation.x = -2.6;
      if (h.jy === 0 && h.vy < 0) {
        h.vy = 0; shakeAmt = Math.max(shakeAmt, .25); noise(.08, 300, .3, 'lowpass');
        for (const s of crowd) if (!s.dead && Math.hypot(s.pos.x - h.pos.x, s.pos.z - h.pos.z) < 2.6) { squash(s); ann('С ПРЫЖКА!', 'gold'); }
      }
    }
  }
  function jump() {
    if (state !== 'play' || !player.foot || hero.jy > 0 || hero.vy) return;
    hero.vy = 8.5; noise(.12, 1800, .2, 'highpass');
  }
  function nearestCar() {
    let best = null, bd = 4.4;
    for (const c of cars.concat(cops)) { const d = c.pos.distanceTo(hero.pos); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  const nearCrew = () => player.foot ? crews.find(c => c.alive && Math.hypot(c.x - player.pos.x, c.z - player.pos.z) < 4.5) : null;
  let triadaDoom = 0;
  function killTriada(crew) {
    if (!crew.alive) return;
    crew.alive = false; crew.mesh.visible = false; crew.icon.visible = false;
    spray(crew.pos, ['#1a1a24', '#7a0f1a', '#f2f2f2'], 30, 9); play('scream2') || noise(.4, 500, .6, 'bandpass');
    run.job = null; triadaDoom = now + 3.5; heat = 5; lastKill = now;
    ann('ТЫ ЗАВАЛИЛ ТРИАДУ'); hint('Зря. Триада уже едет…', 3.5);
  }
  function reviveTriada() { triadaDoom = 0; for (const c of crews) { c.alive = true; c.mesh.visible = true; c.icon.visible = true; } }
  function talk(crew) {
    if (run.job) { hint(`Триада ждёт: ${ico('target')} время тикает`, 1.5); return; }
    if (!run.seeds && run.gold >= 228 && Math.random() < .35) { run.gold -= 228; floatText('−228', crew.pos); hint('Триада стрельнула 228 на семки. Купи семки — будешь свой', 2.5); return; }
    const kill = Math.random() < .5;
    run.job = kill ? { kill: true, base: run.spiders + run.couriers, need: 5, until: run.time + 60, crew } : { kill: false, until: run.time + 90, crew };
    hint(kill ? `${ico('target')} Раздави 5 пауков за минуту — 1337` : `${ico('target')} Передачка: жёлтое кольцо ${ico('chest')} у ГРЭС за 90 секунд — 1337, маршрут на карте`, 3);
    if (!kill) setGps(drop.x, drop.z, 'chest', 'Передачка');
  }
  function jobStep() {
    const j = run.job;
    if (!j && gps && gps.icon === 'chest') gps = null;
    if (!j) return;
    const done = j.kill ? run.spiders + run.couriers - j.base >= j.need : Math.hypot(player.pos.x - drop.x, player.pos.z - drop.z) < 4.5;
    if (done) { run.gold += 1337; run.jobs++; ann('ТРИАДА ДОВОЛЬНА', 'gold'); hint('+1337 от Триады', 2.5); run.job = null; }
    else if (run.time > j.until) { ann('ТРИАДА РАЗОЧАРОВАНА'); hint('Не успел. Триада запомнила', 2.5); run.job = null; }
  }
  function beatStep(dt) {
    beat.cd -= dt;
    if (!beat.active) {
      if (heat > 0 && player.foot && beat.cd <= 0) {
        const n = nodeAround(18, 45);
        if (n >= 0) { beat.pos.set(nav.NX[n], 0, nav.NZ[n]); beat.wn = n; beat.active = true; beat.mesh.visible = true; place(beat, 1); }
      }
      return;
    }
    const dx = player.pos.x - beat.pos.x, dz = player.pos.z - beat.pos.z, d = Math.hypot(dx, dz);
    if (heat <= 0 || d > 70) { beat.active = false; beat.mesh.visible = false; beat.cd = 6; return; }
    if (!player.foot && d < 2.6 && Math.abs(player.speed) > 6) { beatDown(); return; }
    let tx = player.pos.x, tz = player.pos.z;
    if (clear(beat.pos, player.pos)) beat.wn = -1;
    else {
      if (beat.wn < 0 || nodeDist(beat) < 2.5) route(beat);
      tx = nav.NX[beat.wn]; tz = nav.NZ[beat.wn];
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
      c.speed *= .3; c.mesh.visible = true; c.lean = 0;
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
    const sn = Math.sin(c.heading), cs = Math.cos(c.heading), slope = (groundY(c.pos.x + sn * 1.6, c.pos.z + cs * 1.6) - groundY(c.pos.x - sn * 1.6, c.pos.z - cs * 1.6)) / 3.2;
    if (gas || Math.abs(c.speed) > 1) c.speed -= 7 * slope * dt;
    if (!gas && Math.abs(c.speed) < .6) c.speed = 0;
    c.speed = clamp(c.speed, -top * .35, top);
    const turn = Math.min(1, Math.abs(c.speed) / 6) * Math.sign(c.speed);
    c.heading += steer * (hand ? 3.3 : 2.3) * turn * (1 - .3 * Math.abs(c.speed) / top) * dt;
    fwd.set(Math.sin(c.heading), 0, Math.cos(c.heading));
    const rx = fwd.z, rz = -fwd.x;
    let lat = (c.vel.x * rx + c.vel.z * rz) * Math.exp(-(hand ? 1.6 : 14 * grip / 9 * (c.spec.grip ? 1.3 : 1)) * dt);
    if (Math.abs(lat) < .05) lat = 0;
    c.vel.set(fwd.x * c.speed + rx * lat, 0, fwd.z * c.speed + rz * lat);
    c.pos.addScaledVector(c.vel, dt);
    const imp = collide(c, 1.8);
    if (c.touch) c.speed = clamp(c.vel.x * fwd.x + c.vel.z * fwd.z, -top * .35, top);
    return imp;
  }
  function place(c) {
    const x = c.pos.x, z = c.pos.z;
    c.y = groundY(x, z);
    c.mesh.position.set(x, c.y + (c.jy || 0), z);
    if (c.foot) { c.mesh.rotation.y = c.heading; return; }
    const sn = Math.sin(c.heading), cs = Math.cos(c.heading);
    const pitch = Math.atan2(groundY(x + sn * 1.6, z + cs * 1.6) - groundY(x - sn * 1.6, z - cs * 1.6), 3.2), roll = Math.atan2(groundY(x + cs * .9, z - sn * .9) - groundY(x - cs * .9, z + sn * .9), 1.8);
    c.mesh.rotation.set(-pitch, c.heading, roll + c.lean);
  }
  const clear = (a, b) => world.hitT(a, b, groundY(a.x, a.z) + 1.2, groundY(b.x, b.z) + 1.2) >= 1;
  let copField = null, copSrc = -1, copAt = 0;
  function towardPlayer() {
    const n = nav.nearest(player.pos.x, player.pos.z);
    if (!copField || (n !== copSrc && now > copAt)) { copSrc = n; copAt = now + .5; copField = nav.field(n); }
    return copField;
  }
  const nodeDist = c => Math.hypot(nav.NX[c.wn] - c.pos.x, nav.NZ[c.wn] - c.pos.z);
  function route(c) {
    const f = towardPlayer();
    if (c.wn < 0) { c.wn = nav.nearest(c.pos.x, c.pos.z); return; }
    let best = c.wn, bd = f[c.wn];
    for (const e of nav.adj[c.wn]) { const d = f[e.to] + rand(0, 4); if (d < bd) { bd = d; best = e.to; } }
    c.wn = best;
  }
  const live = () => state === 'play' && !menu && !mapOpen;
  const surrender = () => player.foot || Math.abs(player.speed) < 4 || (!on('up') && !on('down') && Math.abs(player.speed) < 15);
  function copThink(c, dt) {
    const d = c.pos.distanceTo(player.pos), top = 22 + Math.ceil(heat) * 3;
    let tx, tz;
    if (d < 70 && clear(c.pos, player.pos)) { tx = player.pos.x + player.vel.x * .5; tz = player.pos.z + player.vel.z * .5; c.wn = -1; }
    else {
      if (c.wn < 0 || nodeDist(c) < 7) route(c);
      tx = nav.NX[c.wn]; tz = nav.NZ[c.wn];
    }
    const diff = wrap(Math.atan2(tx - c.pos.x, tz - c.pos.z) - c.heading);
    let gas = Math.abs(diff) > 1.3 && c.speed > 15 ? -.5 : 1, steer = clamp(diff * 2.2, -1, 1);
    if (c.reverse > 0) { c.reverse -= dt; gas = -1; steer = -steer; }
    else if (d < 40 && surrender()) {
      const want = Math.max(0, (d - 7) * 1.1);
      gas = c.speed > want + 1 ? -1 : c.speed < want - 1 ? .5 : 0;
      if (want <= 4 || Math.abs(c.speed) >= 1) c.stuck = 0;
      else if ((c.stuck += dt) > 1.5) { c.reverse = .9; c.stuck = 0; }
    }
    else if (Math.abs(c.speed) < 2 && (c.stuck += dt) > 1) { c.reverse = .9; c.stuck = 0; }
    else if (Math.abs(c.speed) >= 2) c.stuck = 0;
    drive(c, gas, steer, Math.abs(diff) > 1.8 && c.speed > 8, dt, top);
  }
  function nodeAround(lo, hi) {
    const opts = [];
    for (let n = 0; n < nav.NN; n++) { const d = Math.hypot(nav.NX[n] - player.pos.x, nav.NZ[n] - player.pos.z); if (d > lo && d < hi && groundY(nav.NX[n], nav.NZ[n]) > .3) opts.push(n); }
    return opts.length ? pick(opts) : -1;
  }
  function spawnCop() {
    const n = nodeAround(60, 140);
    if (n < 0) return;
    const c = car(specs.cop);
    c.pos.set(nav.NX[n], 0, nav.NZ[n]); c.heading = Math.atan2(player.pos.x - c.pos.x, player.pos.z - c.pos.z); c.wn = n;
    cops.push(c); scene.add(c.mesh); place(c, 1);
  }
  function dropCop(k) { scene.remove(cops[k].mesh); cops.splice(k, 1); }

  function hurt(n, why) {
    if (state !== 'play' || invuln > 0) return;
    hp -= n * player.spec.armor * (run.armor && !player.foot ? .6 : 1); cause = why; lastHurt = now; shakeAmt = Math.min(1.6, shakeAmt + n * .05); hurtFx = Math.min(1, hurtFx + .3 + n / 30);
    if (hp < 30 && hp > 0 && site.loot.cheese > 0) { site.loot.cheese--; site.saveLoot(); hp = 100; ann('СЫР!', 'gold'); hint('Сожрал сыр с Рошана, здоровье полное', 2.5); }
    if (hp <= 0) { hp = 0; die(why); }
  }
  function die(why) {
    if (state !== 'play') return;
    cause = why; dlg.classList.add('dying'); if (why === 'bust' || !play(pick(['scream1', 'scream2']))) noise(.6, 300, .7, 'lowpass');
    if (why !== 'bust' && why !== 'triada' && site.loot.aegis > 0) {
      site.loot.aegis--; site.saveLoot(); state = 'dying'; dyingT = 1.8; ann('АЕГИС СРАБОТАЛ', 'gold');
      return;
    }
    state = 'over';
    const record = run.gold > best.get();
    if (record) best.set(run.gold);
    setTimeout(() => { if (state === 'over' && opened) baseScreen(overHtml(record)); }, 1300);
  }
  function respawn() {
    if (exam) examEnd(false, 'Азиз: «Экзамен окончен. В ЦРБ передачки не носим»');
    zone = 'city'; room = null; mapC.hidden = false;
    const lost = Math.floor(run.gold * (cause === 'triada' ? .6 : cause === 'bust' ? .2 : run.bahily ? .15 : .3)), m = cause === 'bust' ? P.mvd : P.hospital;
    run.gold -= lost; run.deaths++; if (cause !== 'bust') run.bahily = false;
    state = 'play'; screen(''); dlg.classList.remove('dying'); dlg.focus();
    hp = 100; heat = 0; bust = 0; invuln = 2.5; lastHurt = now;
    while (cops.length) dropCop(0);
    beat.active = false; beat.mesh.visible = false; beat.cd = 8; reviveTriada();
    const [rx, rz] = roadside(m, player.foot ? 3 : 9);
    player.pos.set(rx, 0, rz); player.heading = player.foot ? m.ang : m.ang + Math.PI / 2; player.speed = 0; player.vel.set(0, 0, 0); player.mesh.visible = true; place(player, 1);
    chase(0, true);
    hint(lost ? `−${lost} золота. Осталось ${run.gold}` : 'Золота и так не было', 3);
  }
  function revive() {
    state = 'play'; dlg.classList.remove('dying'); hp = 100; stamina = 1; invuln = 2.5; bust = 0; flashFx = 1; hurtFx = 0;
    floatText('+100', player.pos);
    if (cause === 'kama') { const n = nav.nearest(player.pos.x, player.pos.z), e = nav.adj[n][0]; player.pos.set(nav.NX[n], 0, nav.NZ[n]); player.heading = Math.atan2(nav.NX[e.to] - nav.NX[n], nav.NZ[e.to] - nav.NZ[n]); }
    player.speed = 0; player.vel.set(0, 0, 0);
    for (let k = cops.length - 1; k >= 0; k--) if (cops[k].pos.distanceTo(player.pos) < 30) dropCop(k);
    spray(player.pos, ['#ffd24a', '#fff3a0', '#ff4fb8'], 30, 10);
    hint('Аегис потрачен: здоровье полное, менты разбежались', 2.5);
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
  function aimTargets(g) {
    const h = player, found = [];
    const look = (e, kind) => {
      const dx = e.pos.x - h.pos.x, dz = e.pos.z - h.pos.z, d = Math.hypot(dx, dz), a = Math.abs(wrap(Math.atan2(dx, dz) - h.heading));
      if (d < g.range && a < g.cone && clear(h.pos, e.pos)) found.push({ e, kind, score: d + a * 40 });
    };
    for (const c of crowd) if (!c.dead) look(c, 'crowd');
    for (const c of cops) look(c, 'cop');
    for (const c of crews) if (c.alive) look(c, 'triada');
    if (beat.active) look(beat, 'beat');
    return found.sort((a, b) => a.score - b.score);
  }
  function rayTargets(g) {
    camera.getWorldDirection(rd);
    const o = camera.position, found = [], tp = (player.pos.x - o.x) * rd.x + (player.y + 1.2 - o.y) * rd.y + (player.pos.z - o.z) * rd.z;
    const look = (e, kind, rad, y) => {
      const ex = e.pos.x - o.x, ey = y - o.y, ez = e.pos.z - o.z, t = ex * rd.x + ey * rd.y + ez * rd.z;
      if (t <= tp + .5) return;
      const miss = Math.hypot(ex - rd.x * t, ey - rd.y * t, ez - rd.z * t), d = Math.hypot(e.pos.x - player.pos.x, e.pos.z - player.pos.z);
      if (miss < rad * (g.spread ? 2 : 1) && d < g.range && clear(player.pos, e.pos)) found.push({ e, kind, score: t });
    };
    for (const c of crowd) if (!c.dead) look(c, 'crowd', 1.3, groundY(c.pos.x, c.pos.z) + .7);
    for (const c of cops) look(c, 'cop', 2.2, c.y + 1);
    for (const c of crews) if (c.alive) look(c, 'triada', 2, c.y + 1.2);
    if (beat.active) look(beat, 'beat', .9, beat.y + 1.2);
    return found.sort((a, b) => a.score - b.score);
  }
  function fire() {
    const g = GUNS[run.gun];
    fireCD = g.rate;
    if (!run.guns[run.gun]) { hint(`Патроны кончились — Охота и рыбалка ${ico('gun')}`, 1.5); noise(.05, 3000, .2, 'highpass'); return; }
    run.guns[run.gun]--; aimT = .35;
    const h = player, from = V(h.pos.x + Math.sin(h.heading) * .9 - Math.cos(h.heading) * .5, h.y + 1.55, h.pos.z + Math.cos(h.heading) * .9 + Math.sin(h.heading) * .5);
    const fr = free(), hits = (fr ? rayTargets(g) : aimTargets(g)).slice(0, g.spread || 1);
    if (!hits.length) tracer(from, fr ? tmp.copy(camera.position).addScaledVector(rd, g.range + 8) : tmp.set(h.pos.x + Math.sin(h.heading) * g.range, from.y, h.pos.z + Math.cos(h.heading) * g.range), '#ffe9a0');
    for (const { e, kind } of hits) {
      tracer(from, tmp.set(e.pos.x, groundY(e.pos.x, e.pos.z) + 1, e.pos.z), '#ffe9a0');
      if (kind === 'crowd') squash(e, .5);
      else if (kind === 'triada') killTriada(e);
      else if (kind === 'beat') beatDown();
      else { e.hp -= g.dmg; spray(e.pos, ['#ffb347', '#fff3a0'], 5, 5); if (e.hp <= 0) blowCop(e); }
    }
    play(run.gun === 'sg' ? 'shotgun' : 'shot', run.gun === 'ak' ? .55 : .9, run.gun === 'ak' ? 1.2 : rand(.95, 1.05)) || noise(run.gun === 'sg' ? .35 : .14, run.gun === 'sg' ? 900 : 1600, run.gun === 'sg' ? .9 : .6, 'bandpass');
    if (heat < .6) { heat = .6; lastKill = now; }
  }
  function squash(s, cut = 1) {
    const courier = s.k.kind === 'courier', gold = Math.round((courier ? 1337 : pick([69, 69, 228, 228, 322, 420])) * cut);
    if (exam) { exam.until -= 8; hint('Азиз: «Паука задавил! Минус восемь секунд»', 2); }
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
      c.pos.set(x, 0, z); c.heading = h; c.speed = 0; c.vel.set(0, 0, 0); c.stolen = false; c.mesh.visible = true; c.lean = 0;
      cars.push(c); place(c, 1);
    }
    if (race) { for (const c of race.cars) scene.remove(c.mesh); race = null; }
    player = myCar; hero.mesh.visible = false; zone = 'city'; room = null; mapC.hidden = false; raceGate.inside = false;
    beat.active = false; beat.mesh.visible = false; beat.cd = 0; reviveTriada();
    gps = null; copField = null; mapOpen = false; fullEl.hidden = true; hurtFx = flashFx = 0;
    hp = 100; heat = 0; bust = 0; invuln = 0; streak = 0; lastKill = -99; firstBlood = true; spawnCD = 0; shakeAmt = 0;
    run = { gold: 0, spiders: 0, couriers: 0, stars: 0, time: 0, engine: 0, armor: false, seeds: 0, job: null, jobs: 0, deaths: 0, guns: {}, gun: null, drunk: 0, energy: 0, bahily: false, license: false, spravka: false, passport: false, blockOpen: false, shoes: false, respect: false };
    exam = null; rock = null; examRing.visible = examIcon.visible = false; rockMesh.visible = false;
    if (block) { block.solid.gone = false; block.boom.visible = true; block.boom.rotation.z = 0; block.asked = false; }
    for (const l of loiterers) { l.down = 0; l.mesh.rotation.x = 0; }
    heroGun.visible = false;
    stamina = 1; hour = 18.8; setWeather();
    for (const d of drunks) { d.active = false; d.mesh.visible = false; }
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
      const jm = joy.id !== null ? Math.hypot(joy.x, joy.y) : 0, stick = jm > .18;
      const sprint = (on('sprint') || jm > .93) && stamina > .03;
      stamina = clamp(stamina + (sprint && !run.energy ? -.22 : .16) * dt, 0, 1);
      const top = ((sprint ? (run.energy ? 13 : 11) : 7) + (run.shoes ? 2 : 0)) * (stick && !sprint ? clamp(jm * 1.3, .4, 1) : 1);
      if (free() || stick) {
        const fz = stick ? joy.y : (on('up') || (sprint && !on('down')) ? 1 : 0) - (on('down') ? 1 : 0), fx = stick ? joy.x : (on('right') ? 1 : 0) - (on('left') ? 1 : 0), aiming = free() && run.gun && (on('fire') || on('mouse') || aimT > 0);
        const want = Math.atan2(Math.sin(camYaw) * fz - Math.cos(camYaw) * fx, Math.cos(camYaw) * fz + Math.sin(camYaw) * fx) + (run.drunk ? Math.sin(now * 2.1) * .4 : 0);
        player.heading += wrap((aiming ? camYaw : fz || fx ? want : player.heading) - player.heading) * Math.min(1, dt * 14);
        walk(player, fz || fx ? 1 : 0, 0, dt, top, want);
      } else walk(player, on('up') || sprint ? 1 : on('down') ? -1 : 0, steer, dt, top);
      fireCD -= dt; aimT -= dt;
      heroGun.visible = !!run.gun;
      if (run.gun && (on('fire') || on('mouse')) && fireCD <= 0) fire();
      if (aimT > 0) hero.arms[0].rotation.x = -1.5;
    } else {
      const jy = joy.id !== null ? joy.y : 0, jx = joy.id !== null ? joy.x : 0;
      const gas = clamp((on('up') ? 1 : 0) - (on('down') ? 1 : 0) + (jy > .2 ? (jy - .2) / .8 : jy < -.3 ? (jy + .3) / .7 : 0), -1, 1), wheel = clamp(steer - Math.sign(jx) * Math.abs(jx) ** 1.4, -1, 1);
      const before = Math.abs(player.speed), imp = drive(player, gas, wheel, on('hand') || on('sprint'), dt, player.spec.top + run.engine * 4);
      if (imp > 6) { play('crash', Math.min(1, imp / 18)) || noise(.35, 500, Math.min(.8, imp / 20), 'lowpass'); spray(tmp.copy(player.pos).addScaledVector(fwd, 2), ['#ffb347', '#fff3a0'], 6, 5); }
      const atBlock = imp > 6 && block && !run.blockOpen && Math.hypot(player.pos.x - block.bx, player.pos.z - block.bz) < 10;
      if (atBlock && before > 27.5 && run.armor) { breakBlock(); hurt(40, 'wall'); player.speed = before * .75; player.vel.set(Math.sin(player.heading) * player.speed, 0, Math.cos(player.heading) * player.speed); }
      else {
        if (atBlock && before > 12) hint(run.armor ? 'Мало! Разгонись больше 100 км/ч' : `Шлагбаум МВД крепче тачки. Нужна броня — шиномонтаж ${ico('tire')}`, 2.5);
        if (imp > 14 && before > 14) hurt((imp - 14) * 1.2, atBlock ? 'block' : 'wall');
      }
      player.lean = -wheel * Math.min(1, Math.abs(player.speed) / 20) * .06;
    }
    player.mesh.visible = invuln <= 0 || now * 10 % 2 < 1.4;
    if (state !== 'play') return;
    if (zone === 'inside') { roomStep(); return; }
    if (zone === 'race') { raceStep(dt); return; }
    if (groundY(player.pos.x, player.pos.z) < -.7) { die('kama'); return; }
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
    if (block && !run.blockOpen) {
      const bd = Math.hypot(player.pos.x - block.x, player.pos.z - block.z);
      if (bd < 7 && Math.abs(player.speed) < 8 && !block.asked) { block.asked = true; openShop(blockDoor); return; }
      if (bd > 14) block.asked = false;
    }
    if (Math.hypot(player.pos.x - EX[0], player.pos.z - EX[1]) < 9) {
      if (run.blockOpen) { escape(); return; }
      if (now > exitHintAt) { exitHintAt = now + 4; hint('Пост ДПС: «Без отметки с моста не выпустим». Блокпост на мосту', 3); }
    }
    if (P.school && !player.foot && hour > 7.5 && hour < 15 && now > schoolAt && Math.abs(player.speed) > 16.7 && Math.hypot(player.pos.x - P.school.px, player.pos.z - P.school.pz) < 80) {
      schoolAt = now + 10; heat = Math.min(5, heat + 1); lastKill = now; run.gold = Math.max(0, run.gold - 228);
      hint('Камера у школы №1: больше 60 в школьной зоне. Звезда и штраф 228', 2.5);
    }
    examStep();
    for (const c of cars) {
      if (c === player) continue;
      if (c.speed || c.vel.lengthSq() > .0025) { c.speed *= Math.exp(-5 * dt); drive(c, 0, 0, false, dt, c.spec.top); if (Math.abs(c.speed) < .05 && c.vel.lengthSq() < .01) { c.speed = 0; c.vel.set(0, 0, 0); } }
      bump(player, c);
      for (const p of cops) bump(p, c);
    }
    for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) if (cars[a] !== player && cars[b] !== player) bump(cars[a], cars[b]);
    for (const cr of crews) if (cr.alive && !player.foot && Math.abs(player.speed) > 5 && Math.hypot(player.pos.x - cr.cx, player.pos.z - cr.cz) < 3.4) killTriada(cr);
    if (triadaDoom && now > triadaDoom) { triadaDoom = 0; die('triada'); return; }
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
    const grabbed = beatStep(dt); jobStep(); gpsStep(dt);
    if (now - lastKill > 8 && near > 35) heat = Math.max(0, heat - (player.spec.chill ? .6 : .3) * dt);
    if (grabbed || ((player.foot ? Math.abs(player.speed) < 2.5 : surrender()) && near < 10 && invuln <= 0)) bust += dt * (grabbed ? 1.4 : 1); else bust = Math.max(0, bust - dt * 2);
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
        if (groundY(s.pos.x + s.vel.x * .4, s.pos.z + s.vel.z * .4) < .4) s.heading += Math.PI;
        if (d > 230 && zone === 'city') s.pos.copy(spot(70, 180));
        if (live() && (player.foot ? d < 1.8 && player.speed > 1 : d < 2.7 && Math.abs(player.speed) > 4)) squash(s);
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
        const floor = groundY(g.pos.x, g.pos.z) + .2;
        if (g.pos.y < floor) { g.pos.y = floor; g.vel.multiplyScalar(.5); g.vel.y *= -.4; }
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
    if (state === 'win' && (winT += dt) > .45) {
      winT = 0;
      spray(tmp2.set(player.pos.x + rand(-30, 30), player.y + rand(18, 30), player.pos.z + rand(-30, 30)), ['#ff4fb8', '#ffd24a', '#ff8a5c', '#fff'], 22, 9);
      noise(.5, 160, .35, 'lowpass');
    }
    for (const c of crews) c.icon.position.set(c.cx, c.y + 3.4 + Math.sin(now * 2 + c.x) * .25, c.cz);
    const delivering = run.job && !run.job.kill;
    drop.ring.visible = drop.icon.visible = !!delivering;
    if (delivering) { drop.ring.material.opacity = .4 + Math.sin(now * 6) * .2; drop.icon.position.set(drop.x, drop.y + 4 + Math.sin(now * 3) * .4, drop.z); }
    if (beat.active) place(beat, dt);
    for (const p of world.smoke) {
      p.phase = (p.phase + dt * .05) % 1;
      p.mesh.position.set(p.x + p.phase * 18, p.y + p.phase * 40, p.z + p.phase * 6);
      p.mesh.scale.setScalar(5 + p.phase * 16);
    }
    const flash = now * 6 % 2 < 1;
    for (const tr of tracers) if (tr.t > 0 && (tr.t -= dt) <= 0) tr.line.visible = false;
    for (const c of cops.concat(cars)) {
      if (c.lights.length) { c.lights[0].visible = flash; c.lights[1].visible = !flash; }
      if (c !== player) place(c, dt);
    }
    if (cause === 'kama' && (state === 'dying' || state === 'over')) { player.y = Math.max(player.y - dt * 1.2, -4); player.mesh.position.y = player.y; }
    else if (state !== 'title') place(player, dt);
  }
  function chase(dt, snap) {
    const portrait = camera.aspect < .9, v = Math.abs(player.speed), foot = player.foot;
    const inRoom = zone === 'inside', back = inRoom ? (portrait ? 6 : 5) : foot ? (portrait ? 8 : 6) : (portrait ? 14 : 10) + v * .12, up = inRoom ? 3 : foot ? (portrait ? 5 : 3.2) : (portrait ? 8.5 : 4.8) + v * .05, fr = orbit();
    if (!fr || snap) { camYaw = player.heading; camPitch = 0; }
    else if (touch ? now - lastLook > 1.1 && (!foot || v > 1) : !foot && now - lastLook > 1.6) camYaw += wrap(player.heading - camYaw) * Math.min(1, (foot ? 1.8 : 2.4) * dt);
    fwd.set(Math.sin(camYaw), 0, Math.cos(camYaw));
    const sh = free() && foot ? .9 : 0;
    tmp.copy(player.pos).addScaledVector(fwd, -back * Math.cos(camPitch * .9)); tmp.y = player.y + up + back * Math.sin(camPitch * .9); tmp.x -= fwd.z * sh; tmp.z += fwd.x * sh;
    const t = world.hitT(player.pos, tmp, player.y + 1.5, tmp.y);
    if (t < 1) tmp.lerpVectors(tmp2.set(player.pos.x, player.y + 1.5, player.pos.z), tmp, Math.max(.12, t - .06));
    tmp.y = Math.max(tmp.y, groundY(tmp.x, tmp.z) + 1.2);
    camera.position.lerp(tmp, snap ? 1 : 1 - Math.exp(-(t < 1 ? 18 : 5) * dt));
    if (shakeAmt > .01) { camera.position.x += rand(-1, 1) * shakeAmt; camera.position.y += rand(-1, 1) * shakeAmt * .5; shakeAmt *= Math.exp(-7 * dt); }
    tmp2.copy(player.pos).addScaledVector(fwd, foot ? (free() ? 6 : 3) : 6); tmp2.y = player.y + (foot ? 1.6 : 1.2) - (fr ? Math.sin(camPitch * .9) * 3 : 0); tmp2.x -= fwd.z * sh; tmp2.z += fwd.x * sh;
    camera.lookAt(tmp2);
    if (run.drunk) { camera.rotation.z += Math.sin(now * 1.3) * .09; camera.position.y += Math.sin(now * 1.7) * .25; }
  }
  function show(text, key, el) { if (shown[key] !== text) { shown[key] = text; el.innerHTML = text; } }
  function drawHud() {
    const want = Math.ceil(heat - 1e-6);
    if (shown.stars !== want) { shown.stars = want; stars.forEach((s, k) => s.classList.toggle('on', k < want)); }
    wantedEl.classList.toggle('cool', want > 0 && now - lastKill > 8);
    show(`${ico('gold')} ${run.gold || 0}`, 'gold', goldEl);
    const q = goal();
    questEl.hidden = state === 'title' || zone === 'race';
    show(!prefs.questOpen ? `<div class="g-qh"><b>ЦЕЛЬ ${q.n}/5</b>${ico(q.icon)}<button type="button" class="g-qt" aria-label="Развернуть цель">+</button></div>` : `<div class="g-qh"><b>ЦЕЛЬ ${q.n}/5</b><button type="button" class="g-qt" aria-label="Свернуть цель">−</button></div><span>${ico(q.icon)} ${q.text}</span>${q.price && run.gold < q.price ? `<i class="g-bar"><u style="width:${Math.floor(Math.min(1, run.gold / q.price) * 100)}%"></u></i>` : ''}<span class="g-steps">${[['license', 'license'], ['spravka', 'scroll'], ['passport', 'passport'], ['blockOpen', 'barrier']].map(([k, i]) => `<span class="${run[k] ? '' : 'g-off'}">${ico(i)}</span>`).join('')}<span class="g-off">${ico('sunset')}</span></span><small>${gps && gps.goal ? 'маршрут проложен' : touch ? 'тап — проложить маршрут' : 'G или клик — проложить маршрут'}</small>`, 'quest', questEl);
    show(`${ico('aegis')} ${site.loot.aegis} · ${ico('cheese')} ${site.loot.cheese}${run.drunk ? ` · ${ico('bottle')}` : ''}${run.energy ? ` · ${ico('bolt')}` : ''}`, 'loot', lootEl);
    show(run.gun ? `${ico('gun')} ${GUNS[run.gun].name} · ${run.guns[run.gun]}${Object.keys(run.guns).length > 1 ? ' ⇄' : ''}` : '', 'gun', gunEl);
    const w = Math.round(hp) + '%';
    if (shown.hp !== w) { shown.hp = w; hpEl.style.width = w; }
    const near = state === 'play' && player.foot ? nearestCar() : null;
    const crew = state === 'play' ? nearCrew() : null;
    show(zone === 'race' ? 'СДАТЬСЯ' : crew ? 'БАЗАР' : player.foot ? (near ? 'СЕСТЬ' : run.gun ? 'ОГОНЬ' : '—') : 'ВЫЙТИ', 'act', actEl);
    const j = run.job;
    if (race && now > (shown.raceAt || 0)) {
      shown.raceAt = now + .25;
      const me = race.car, my = raceProg(me), covered = Math.max(0, my) * segLen, total = TR.laps * trackLen;
      const next = race.cars.filter(c => c !== me && raceProg(c) > my).map(raceProg).sort((a, b) => a - b)[0];
      const html = `<b>${ico('race')} Круг ${clamp(me.lap + 1, 1, TR.laps)}/${TR.laps} · место ${racePlace()}/11</b><span>${ico('hourglass')} ${clockStr(Math.max(0, run.time - race.start))} · ${next === undefined ? 'ты первый' : 'впереди ' + dist((next - my) * segLen)}</span><i><u style="width:${Math.min(100, covered / total * 100).toFixed(1)}%"></u></i><span>проехал ${dist(covered)} · осталось ${dist(Math.max(0, total - covered))}</span>`;
      if (shown.raceHtml !== html) { shown.raceHtml = html; raceEl.innerHTML = html; }
    } else if (!race && shown.raceHtml) { shown.raceHtml = ''; raceEl.innerHTML = ''; }
    const drivingNow = state === 'play' && !player.foot && zone !== 'inside';
    speedEl.hidden = !drivingNow;
    if (drivingNow) show(String(Math.round(Math.abs(player.speed) * 3.6)), 'speed', speedEl.firstChild);
    show(exam ? `${ico('flag')} Экзамен ${exam.i}/${exam.cps.length} · ${clockStr(Math.max(0, exam.until - run.time))}` : j ? `${ico('target')} ${j.kill ? `Пауки ${Math.min(j.need, run.spiders + run.couriers - j.base)}/${j.need}` : 'Передачка на ГРЭС'} · ${clockStr(Math.max(0, j.until - run.time))}` : '', 'job', jobEl);
    radio.hidden = !(prefs.fm && state === 'play' && !player.foot);
    const ag = state === 'play' && player.foot && run.gun && zone === 'city' && !menu ? GUNS[run.gun] : null;
    aimEl.hidden = !ag;
    if (ag && free()) { aimEl.style.left = aimEl.style.top = '50%'; aimEl.classList.toggle('lock', !!rayTargets(ag)[0]); }
    else if (ag) {
      const t = aimTargets(ag)[0];
      if (t) tmp.set(t.e.pos.x, groundY(t.e.pos.x, t.e.pos.z) + 1.2, t.e.pos.z); else tmp.set(player.pos.x + Math.sin(player.heading) * 14, player.y + 1.5, player.pos.z + Math.cos(player.heading) * 14);
      tmp.project(camera);
      aimEl.style.left = (tmp.x * .5 + .5) * 100 + '%'; aimEl.style.top = (-tmp.y * .5 + .5) * 100 + '%';
      aimEl.classList.toggle('lock', !!t);
    }
    if (!radio.hidden && now > radioAt) { radioAt = now + 7; radio.innerHTML = `${ico('radio')} Добрянка FM · ${pick(RADIO)()}`; radio.classList.remove('on'); void radio.offsetWidth; radio.classList.add('on'); }
    show(`${ico(hour >= 21 || hour < 5 ? 'moon' : 'sun')} ${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.floor(hour % 1 * 6) * 10).padStart(2, '0')} · ${ico(weather.icon)} ${temp > 0 ? '+' : ''}${temp}°`, 'weather', weatherEl);
    show(player.foot ? 'ПРЫЖОК' : 'РУЧНИК', 'jump', jumpEl);
    stamEl.hidden = !player.foot || state !== 'play';
    const sw = Math.round(stamina * 100) + '%';
    if (shown.stam !== sw) { shown.stam = sw; stamEl.firstChild.style.width = sw; }
    if (state === 'play' && bust > .3) show(player.foot ? 'МВД принимает… беги!' : 'МВД принимает… газуй!', 'hint', hintEl);
    else if (now <= hintUntil) shown.hint = hintEl.innerHTML;
    else if (doorNear && state === 'play') show(`Вылези из тачки (${touch ? 'кнопка сверху' : 'F'}) и зайди в кольцо: ${SHOPDEF[doorNear.kind].title}`, 'hint', hintEl);
    else show(crew && !touch ? 'F — побазарить с Триадой' : near && !touch ? `F — ${near === myCar ? 'сесть в свою девятку' : 'угнать ' + near.spec.name}` : '', 'hint', hintEl);
    drawMap();
  }
  function frame(t) {
    const dt = Math.min(.05, (t - last) / 1000 || 0);
    last = t; now += dt;
    const w = dlg.clientWidth, h = dlg.clientHeight;
    if (w !== shown.w || h !== shown.h) {
      shown.w = w; shown.h = h; renderer.setSize(w, h, false); fv.dirty = true;
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    const fovT = prefs.fov + (camera.aspect < .9 ? 18 : 0) + (prefs.speedFov && state === 'play' && !player.foot ? Math.min(1, Math.abs(player.speed) / 46) * 14 : 0);
    if (Math.abs(camera.fov - fovT) > .05) { camera.fov += (fovT - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
    if (state === 'play' && !menu && !mapOpen) update(dt);
    if (mapOpen && fv.dirty) drawFull();
    else if (state === 'dying' && (dyingT -= dt) <= 0) revive();
    crowdStep(dt); drunkStep(dt); loiterStep(dt); rockStep(dt); effects(dt); weatherStep(dt); routeStep(dt); ambientStep(dt);
    hurtFx *= Math.exp(-2.2 * dt); flashFx *= Math.exp(-1.8 * dt);
    const low = state === 'play' && hp < 30 ? (.25 + Math.sin(now * 6) * .12) * (1 - hp / 30) : 0, ho = Math.max(hurtFx, low).toFixed(2), fo = flashFx.toFixed(2);
    if (shown.hurt !== ho) { shown.hurt = ho; hurtEl.style.opacity = ho; }
    if (shown.flash !== fo) { shown.flash = fo; flashEl.style.opacity = fo; }
    const far = Math.max(160, scene.fog.far + 40);
    if (Math.abs(camera.far - far) > 4) { camera.far = far; camera.updateProjectionMatrix(); }
    if (state === 'title') { const C = world.centre, a = now * .06, y = groundY(C.x, C.z); camera.position.set(C.x + Math.sin(a) * 175, y + 80, C.z + Math.cos(a) * 175); camera.lookAt(C.x, y + 6, C.z); }
    else if (state === 'win') {
      const p = player, fx = Math.sin(p.heading), fz = Math.cos(p.heading), sl = Math.hypot(sunDir.x, sunDir.z) || 1, sx = sunDir.x / sl, sz = sunDir.z / sl;
      if (!p.foot && now - winAt < 6) { const want = Math.atan2(sx, sz); p.heading += wrap(want - p.heading) * Math.min(1, dt * .8); p.pos.x += fx * dt * 12; p.pos.z += fz * dt * 12; }
      camera.position.lerp(tmp.set(p.pos.x - sx * 16, p.y + 5, p.pos.z - sz * 16), 1 - Math.exp(-1.5 * dt));
      camera.lookAt(p.pos.x + sx * 40, p.y + 6, p.pos.z + sz * 40);
    }
    else if (state === 'over') { const a = now * .25; camera.position.lerp(tmp.set(player.pos.x + Math.sin(a) * 16, player.y + 9, player.pos.z + Math.cos(a) * 16), 1 - Math.exp(-2 * dt)); camera.lookAt(player.pos.x, player.y + 1, player.pos.z); }
    else chase(dt);
    sky.position.copy(camera.position);
    sun.position.copy(camera.position).addScaledVector(sunDir, 92); sun.lookAt(camera.position);
    moon.position.copy(camera.position).addScaledVector(sunDir, -92); moon.lookAt(camera.position);
    sound(); drawHud();
    present();
  }

  const post = (() => {
    const VS = 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    const mk = (fs, uniforms) => new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false });
    const geo = new THREE.BufferGeometry(), sc = new THREE.Scene(), cam = new THREE.Camera(), quad = new THREE.Mesh(geo);
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    quad.frustumCulled = false; sc.add(quad);
    const opt = { type: THREE.HalfFloatType }, main = new THREE.WebGLRenderTarget(1, 1, { ...opt, samples: 4 }), a = new THREE.WebGLRenderTarget(1, 1, opt), b = new THREE.WebGLRenderTarget(1, 1, opt);
    const bright = mk('uniform sampler2D t; uniform float th; uniform vec2 px; varying vec2 vUv;\nvoid main() {\n vec3 c = (texture2D(t, vUv + px).rgb + texture2D(t, vUv - px).rgb + texture2D(t, vUv + vec2(px.x, -px.y)).rgb + texture2D(t, vUv - vec2(px.x, -px.y)).rgb) * .25;\n float l = max(c.r, max(c.g, c.b));\n gl_FragColor = vec4(c * smoothstep(th, th + .35, l), 1.0);\n}', { t: { value: null }, th: { value: .8 }, px: { value: new THREE.Vector2() } });
    const blur = mk('uniform sampler2D t; uniform vec2 d; varying vec2 vUv;\nvoid main() {\n vec3 c = texture2D(t, vUv).rgb * .227;\n c += (texture2D(t, vUv + d).rgb + texture2D(t, vUv - d).rgb) * .195;\n c += (texture2D(t, vUv + d * 2.0).rgb + texture2D(t, vUv - d * 2.0).rgb) * .122;\n c += (texture2D(t, vUv + d * 3.0).rgb + texture2D(t, vUv - d * 3.0).rgb) * .054;\n c += (texture2D(t, vUv + d * 4.0).rgb + texture2D(t, vUv - d * 4.0).rgb) * .016;\n gl_FragColor = vec4(c, 1.0);\n}', { t: { value: null }, d: { value: new THREE.Vector2() } });
    const final = mk('uniform sampler2D t, b; uniform float time, grain, ca, blur, bloom, vig; uniform vec2 res; varying vec2 vUv;\nfloat hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }\nvoid main() {\n vec2 d = vUv - .5; float r = length(d);\n vec2 o = d * ca * (.5 + r * 2.0);\n vec3 c = vec3(0.0);\n for (int i = 0; i < 6; i++) {\n  vec2 uv = vUv - d * blur * float(i) / 5.0;\n  c += vec3(texture2D(t, uv + o).r, texture2D(t, uv).g, texture2D(t, uv - o).b);\n }\n c = c / 6.0 + texture2D(b, vUv).rgb * bloom;\n c *= 1.0 - vig * dot(d, d) * 1.8;\n gl_FragColor = vec4(max(c, 0.0), 1.0);\n #include <colorspace_fragment>\n gl_FragColor.rgb += (hash(vUv * res + fract(time * 7.3) * 91.0) - .5) * grain;\n}', { t: { value: null }, b: { value: null }, time: { value: 0 }, grain: { value: .035 }, ca: { value: .002 }, blur: { value: 0 }, bloom: { value: .5 }, vig: { value: .35 }, res: { value: new THREE.Vector2() } });
    const size = new THREE.Vector2(), pass = (m, target) => { quad.material = m; renderer.setRenderTarget(target); renderer.render(sc, cam); };
    return {
      final, bright,
      render() {
        renderer.getDrawingBufferSize(size);
        if (main.width !== size.x || main.height !== size.y) {
          main.setSize(size.x, size.y); a.setSize(Math.max(1, size.x >> 2), Math.max(1, size.y >> 2)); b.setSize(a.width, a.height);
          final.uniforms.res.value.copy(size); bright.uniforms.px.value.set(1 / size.x, 1 / size.y);
        }
        renderer.setRenderTarget(main); renderer.render(scene, camera);
        bright.uniforms.t.value = main.texture; pass(bright, a);
        blur.uniforms.t.value = a.texture; blur.uniforms.d.value.set(1.4 / a.width, 0); pass(blur, b);
        blur.uniforms.t.value = b.texture; blur.uniforms.d.value.set(0, 1.4 / a.height); pass(blur, a);
        final.uniforms.t.value = main.texture; final.uniforms.b.value = a.texture; pass(final, null);
      }
    };
  })();
  function present() {
    if (!prefs.post || prefs.quality === 'low') { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
    const u = post.final.uniforms, night = zone === 'inside' ? .8 : dayW.n, v = state === 'play' && !player.foot ? Math.abs(player.speed) : 0;
    u.time.value = now; u.ca.value = .0016 + Math.min(1, v / 46) * .004 + hurtFx * .012;
    u.blur.value = Math.max(0, (v - 16) / 30) * .04 + (state === 'play' && player.foot && player.speed > 9 ? .008 : 0);
    u.bloom.value = .3 + .9 * night; post.bright.uniforms.th.value = .95 - .45 * night;
    post.render();
  }
  const MN = 320, motePos = new Float32Array(MN * 3), moteSeed = new Float32Array(MN);
  for (let i = 0; i < MN; i++) { motePos[i * 3] = rand(-30, 30); motePos[i * 3 + 1] = rand(-2, 10); motePos[i * 3 + 2] = rand(-30, 30); moteSeed[i] = rand(0, 99); }
  const moteMat = new THREE.PointsMaterial({ map: dotTex, color: '#fff4d0', size: .1, transparent: true, opacity: .4, depthWrite: false, blending: THREE.AdditiveBlending });
  const motes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(motePos, 3)), moteMat);
  motes.frustumCulled = false; scene.add(motes);
  const birdGeo = new THREE.BufferGeometry();
  birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .25, -1.1, .35, 0, 0, 0, -.25, 0, 0, .25, 0, 0, -.25, 1.1, .35, 0], 3)); birdGeo.computeVertexNormals();
  const birds = new THREE.InstancedMesh(birdGeo, new THREE.MeshBasicMaterial({ color: '#1c1a26', side: THREE.DoubleSide }), 16);
  birds.frustumCulled = false; scene.add(birds);
  const flocks = [0, 1].map(k => ({ a: k * 3, r: rand(70, 110), h: rand(32, 48), spin: k ? .12 : -.1 }));
  function ambientStep(dt) {
    const c = camera.position, night = dayW.n > .5, dry = wcur.rain < .3 && wcur.snow < .3;
    motes.visible = zone === 'city' && dry && state !== 'title';
    if (motes.visible) {
      moteMat.color.set(night ? '#d8ff70' : '#fff4d0').multiplyScalar(night ? 2.2 : 1); moteMat.size = night ? .28 : .14; moteMat.opacity = night ? .55 + .35 * Math.sin(now * 2.7) : .35;
      for (let i = 0; i < MN; i++) {
        const k = i * 3, sd = moteSeed[i];
        motePos[k] = wrapc(motePos[k] + Math.sin(now * .3 + sd) * dt * .7, c.x, 30);
        motePos[k + 2] = wrapc(motePos[k + 2] + Math.cos(now * .27 + sd) * dt * .7, c.z, 30);
        const g = groundY(motePos[k], motePos[k + 2]);
        motePos[k + 1] = clamp(motePos[k + 1] + Math.sin(now * .5 + sd * 3) * dt * .4, g + .3, g + 9);
      }
      motes.geometry.attributes.position.needsUpdate = true;
    }
    birds.visible = zone === 'city' && dry && hour > 6 && hour < 20;
    if (!birds.visible) return;
    flocks.forEach((f, fi) => {
      f.a += f.spin * dt;
      const fx = c.x + Math.cos(f.a) * f.r, fz = c.z + Math.sin(f.a) * f.r, fy = groundY(fx, fz) + f.h, head = Math.atan2(-Math.sin(f.a) * f.spin, Math.cos(f.a) * f.spin);
      for (let i = 0; i < 8; i++) {
        const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, bx = -Math.sin(head) * row * 2.2 + Math.cos(head) * side * row * 1.8, bz = -Math.cos(head) * row * 2.2 - Math.sin(head) * side * row * 1.8;
        dummy.position.set(fx + bx, fy + Math.sin(now * 1.3 + i) * .6, fz + bz); dummy.rotation.set(0, head, 0); dummy.scale.set(1, 1 + Math.sin(now * 11 + i * 1.7) * .9, 1); dummy.updateMatrix();
        birds.setMatrixAt(fi * 8 + i, dummy.matrix);
      }
    });
    birds.instanceMatrix.needsUpdate = true;
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
    () => `Реклама. Казино «Крипта обмен»: ставь всё, Триада одобряет. Иди по ${ico('cards')} на карте`,
    () => 'Шиномонтаж «У Палыча»: поставим движок от комбайна, без вопросов и без гарантии',
    () => 'Кама сегодня +4. Купаться можно только с Аегисом',
    () => 'Новости спорта: Pis`master снова слил Рошана и винит курьера',
    () => 'Участковый просит вернуть ему фуражку. Сука, верни фуражку',
    () => `Блокпост на мосту стоит. Без документов — ${NO_DOCS}, МВД работает без выходных и без совести`,
    () => 'Автошкола Азиза: права за неделю. Или за шесть тысяч за минуту',
    () => 'Бепис снова просит метеорит',
    () => 'У «Янтаря» опять стоят пацаны. Если спросят сотку — у тебя нет',
    () => 'В КБ акция: коньяк «Три звезды». Звёзды розыска в подарок',
    () => 'Хит недели: «Бруда — паучья любовь». Ставим в третий раз, пока не выучишь',
    () => 'Курьер опять сдох. Кто-то заказал варды прямо в Каму',
    () => 'Триада на районе напоминает: семки — это валюта',
    () => heat > 0 ? `Внимание! Розыск ${ico('star').repeat(Math.ceil(heat))}. Все экипажи МВД выехали, участковый бежит пешком` : 'На дорогах Добрянки спокойно. Подозрительно спокойно'
  ];
  const bestTime = {
    get() { try { return +localStorage.getItem('gtaEscape') || 0; } catch (e) { return 0; } },
    set(v) { try { localStorage.setItem('gtaEscape', v); } catch (e) {} }
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
        if (r < .6) return `Бирка упала. Минус ${bet}`;
        run.gold += bet * 2; return `Бирка выросла! +${bet}`;
      }
    }));
    if (kind === 'strip') return [
      { name: 'Кинуть 228', note: 'Бруда делает лишний круг', price: 228, buy: () => { tipDancers(4); return pick(['Бруда довольна', 'Пудж подмигнул', 'Плюс уважение на районе']); } },
      { name: 'Кинуть 1337', note: 'денежный дождь, здоровье полное от счастья', price: 1337, buy: () => { tipDancers(10); hp = 100; return 'ДЕНЕЖНЫЙ ДОЖДЬ. Бруда в ахуе'; } },
      { name: 'Приват с Пуджем', note: 'что было в подсобке — остаётся в подсобке', price: 5000, buy: () => { tipDancers(15); site.loot.aegis++; site.saveLoot(); return 'Пудж выдал тебе Аегис. Не спрашивай откуда'; } }
    ];
    if (kind === 'guns') return [
      ...Object.entries(GUNS).map(([key, g]) => ({ name: g.name, note: run.guns[key] !== undefined ? `уже есть, патронов ${run.guns[key]}` : `${key === 'sg' ? 'косит пачку пауков разом' : key === 'ak' ? 'очередями, как в девяностые' : 'классика участкового'}, ${g.ammo} патронов`, price: g.price, off: run.guns[key] !== undefined, buy: () => { run.guns[key] = g.ammo; run.gun = key; hint(touch ? 'Пешком: жёлтая кнопка справа — огонь, тап по стволу — сменить' : 'Клик или Ctrl — огонь, Q — сменить ствол', 3); return `${g.name} твой. Не свети на районе`; } })),
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
    if (kind === 'race') return [{ name: `Погнали: ${TR.laps} круга против 10 экипажей`, note: 'победа — 2000 и спорткар «Бруда GT», подиум — 700. F — сдаться', price: 300, buy: () => { startRace(); } }];
    if (kind === 'hospital') return [
      { name: 'Справка «Годен»', note: run.spravka ? 'уже есть, висит на холодильнике' : 'нужна на блокпосту. Терапевт в отпуске, подпишет уборщица', price: 2500, off: run.spravka, buy: () => { run.spravka = true; return 'Справка получена. Печать кривая, но настоящая'; } },
      { name: 'Полечиться', note: 'полное здоровье, бахилы в подарок', price: 400, buy: () => { hp = 100; run.bahily = true; return 'Медсестра сделала укол и наорала. Как новый'; } },
      { name: 'Сдать анализы', note: 'просто так, для души', price: 228, buy: () => pick(['Анализы показали Добрянку в крови', 'Сахар в норме. Шаурма нет', 'В селезёнке нашли Аегис. Шутка']) }
    ];
    if (kind === 'autoschool') return [
      { name: 'Экзамен на права', note: run.license ? 'права уже есть' : 'на Гранте Азиза: пять флажков за 80 секунд, пауков не дави', price: 1500, off: run.license, buy: () => { startExam(); } },
      { name: 'Купить права у Азиза', note: 'Азиз сказал: никому не говори, брат', price: 6000, off: run.license, buy: () => { run.license = true; return 'Азиз выдал права. Фотография чужая, но похож'; } },
      { name: 'Урок вождения', note: 'Азиз двадцать минут объясняет, почему Поло лучше Гранты', price: 300, buy: () => pick(['Азиз: «Поло — немецкое качество, брат»', 'Азиз: «Гранта тоже машина. Но Поло — машина»', 'Ничего не понял, но кивал']) }
    ];
    if (kind === 'yantar') return [
      { name: 'Пиво «Жигулёвское»', note: '20 секунд всё плывёт', price: 69, buy: () => { run.drunk = Math.max(run.drunk, 20); return 'Пацаны у входа одобрительно кивнули'; } },
      { name: 'Сухарики «Кириешки»', note: '+25 здоровья', price: 30, buy: () => { hp = Math.min(100, hp + 25); return 'Хрустишь. Жизнь налаживается'; } },
      { name: 'Энергетик «Адреналин»', note: 'минуту бегаешь быстрее', price: 120, buy: () => { run.energy = 60; stamina = 1; return 'Сердце стучит в ритме «Добрянка FM»'; } },
      { name: 'Дать пацанам сотку', note: 'всё равно же спросят', price: 100, off: run.respect, buy: () => { run.respect = true; return 'Пацаны: «Уважаемый человек». Больше не спрашивают'; } }
    ];
    if (kind === 'kb') return [
      { name: 'Водка «Пять озёр»', note: 'минуту всё плывёт', price: 228, buy: () => { run.drunk = 60; return 'Пять озёр. Шестое — Кама'; } },
      { name: 'Коньяк «Три звезды»', note: 'сразу три звезды. Розыска', price: 500, buy: () => { heat = Math.max(heat, 3); lastKill = now; return 'Три звезды, как и обещали. МВД уже едет'; } },
      { name: 'Пиво по акции', note: '+10 здоровья и 15 секунд весело', price: 49, buy: () => { hp = Math.min(100, hp + 10); run.drunk = Math.max(run.drunk, 15); return 'Акция: второе пиво тоже за деньги'; } },
      { name: 'Пакет КБ', note: 'теперь ты свой', price: 5, buy: () => 'Пакет с собой. Кассирша узнала тебя в лицо' }
    ];
    if (kind === 'hotel') return [
      { name: 'Переночевать', note: 'до утра: розыск забудут, здоровье полное', price: 400, buy: () => { hour = 8; hp = 100; heat = 0; while (cops.length) dropCop(0); return 'Проснулся в 8 утра. Тараканы помахали лапкой'; } },
      { name: 'Номер на час', note: 'никто не спрашивает зачем', price: 228, buy: () => { hp = 100; hour = (hour + 1) % 24; return 'Администратор подмигнула. Здоровье полное'; } },
      { name: 'Шведский стол', note: 'три сосиски и чай из пакетика: минуту бегаешь без устали', price: 150, buy: () => { run.energy = 60; stamina = 1; return 'Сосиски пермские. Сила в ногах'; } }
    ];
    if (kind === 'ozon') return [
      { name: 'Загранпаспорт (б/у)', note: run.passport ? 'уже есть' : 'нужен на блокпосту. Фото переклеишь сам', price: 4000, off: run.passport, buy: () => { run.passport = true; return 'Паспорт выдан. Владелец — Иванов И. И., тебе подходит'; } },
      { name: 'Посылка-сюрприз', note: 'что внутри — не знает даже Ozon', price: 300, buy: parcel },
      { name: 'Метеорит', note: 'Бепис попросил добавить', price: METEOR, buy: () => { meteor(); } }
    ];
    if (kind === 'wb') return [
      { name: 'Посылка-сюрприз', note: 'продавец пишет «как на фото». Фото нет', price: 228, buy: parcel },
      { name: 'Кроссовки «Найк»', note: 'бегаешь быстрее до конца заезда', price: 1500, off: run.shoes, buy: () => { run.shoes = true; return 'Кроссовки «Найк» с тремя полосками. Бегут сами'; } },
      { name: 'Вернуть товар', note: 'очередь сорок минут', price: 0, buy: () => { hour = (hour + .7) % 24; return 'Отстоял очередь. Возврат одобрят через 30 дней. Может быть'; } }
    ];
    if (kind === 'block') {
      const missing = [['license', 'прав'], ['spravka', 'справки'], ['passport', 'паспорта']].filter(([k]) => !run[k]).map(([, t]) => t);
      return [
        { name: `Документы и ${BRIBE} сверху`, note: missing.length ? `нет ${missing.join(', ')}. Права — автошкола Азиза, справка — ЦРБ, паспорт — Ozon` : 'всё на месте. Сержант пересчитывает купюры', price: BRIBE, off: missing.length > 0, buy: () => { openBlock('docs'); } },
        { name: 'Без документов', note: 'из уважения к Добрянке. Прописку больше не продаём', price: NO_DOCS, buy: () => { openBlock('bribe'); } },
        { name: 'Прорваться', note: run.armor ? 'отъедь, разгонись больше 100 и тарань. Минус 40 здоровья и пять звёзд' : 'без брони из шиномонтажа шлагбаум не пробить', price: 0, buy: () => { leaveShop(); hint(run.armor ? 'Отъедь и разгонись больше 100 км/ч. Тарань' : `Сначала броня: шиномонтаж ${ico('tire')}`, 3); } }
      ];
    }
    if (kind === 'pawn') return [['sport', 'Спорткар «Бруда GT»', 6000, 'скорость 46, держит дорогу как клей'], ['priora', 'Белая приора', 1500, 'скорость 38, гнётся от взгляда'], ['cart', 'Телега Батрайдера', 2280, 'медленная, но урон в 2 раза меньше'], ['uaz', 'Списанный УАЗ МВД', 3220, 'менты думают, что свой: розыск спадает в 2 раза быстрее']].map(([key, name, price, note]) => ({
      name, note, price, buy: () => {
        leaveShop(); exitRoom();
        const c = car(specs[key]);
        const [px, pz] = roadside(shopDoor, 8);
        c.pos.set(px, 0, pz); c.heading = shopDoor.ang + Math.PI / 2; c.stolen = true; scene.add(c.mesh); cars.push(c); place(c, 1);
        hero.mesh.visible = false; player = c; ann('ТАЧКА ТВОЯ', 'gold');
      }
    }));
    return [
      { name: 'Взятка участковому', note: stars ? 'розыск снимут, менты отстанут' : 'розыска нет, иди с богом', price: 300 * Math.max(1, stars), off: !stars, buy: () => { heat = 0; while (cops.length) dropCop(0); return 'Участковый взял и отвернулся. Розыск снят'; } },
      { name: 'Справка о несудимости', note: 'дежурный хохочет минуту, потом выгоняет', price: 0, buy: () => 'Дежурный: «Ты? Несудимый? Иди отсюда»' }
    ];
  }
  function tipDancers(n) {
    stripHype = now + n;
    for (let i = 0; i < n; i++) spray(tmp2.set(room.ox + rand(-3, 3), 4.5, room.oz + 3 + rand(-3, 3)), ['#3fbf2a', '#7ad65a', '#ffd24a'], 6, 3);
    play('coins', .8) || noise(.3, 2500, .3, 'bandpass');
  }
  const SYMS = [['apple', 30], ['spider', 25], ['cheese', 18], ['aegis', 12], ['gold', 10], ['seven', 5]], PAY = { apple: 4, spider: 5, cheese: 6, aegis: 8, gold: 10, seven: 20 };
  const sym = () => { let r = rand(0, 100); for (const [s, w] of SYMS) if ((r -= w) < 0) return s; return 'apple'; };
  const reelHtml = list => `<div class="g-reel"><div>${list.map(s => `<span>${ico(s)}</span>`).join('')}</div></div>`;
  const slotsHtml = (msg, faces) => `<p class="g-kicker">${ico('cards')} Однорукий бандит «Триада»</p><p class="g-inv">${ico('gold')} ${run.gold}</p><div class="g-reels">${(faces || [sym(), sym(), sym()]).map(f => reelHtml([f])).join('')}</div><p class="g-msg">${msg || `Три одинаковых — выигрыш до ×20. ${ico('aegis').repeat(3)} — настоящий Аегис, ${ico('cheese').repeat(3)} — сыр`}</p><div class="g-btns">${[100, 500, 1337].map(b => `<button type="button" data-spin="${b}"${run.gold < b ? ' disabled' : ''}>${b} ${ico('gold')}</button>`).join('')}<button type="button" class="g-out" data-go="leave">УЙТИ</button></div>`;
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
    scr.querySelector('.g-inv').innerHTML = `${ico('gold')} ${run.gold}`;
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
        if (a === 'aegis') { site.loot.aegis++; site.saveLoot(); }
        if (a === 'cheese') { site.loot.cheese++; site.saveLoot(); }
        msg = `ДЖЕКПОТ ${ico(a).repeat(3)} +${win}${a === 'aegis' ? ' и Аегис' : a === 'cheese' ? ' и сыр' : ''}`;
        ann('ДЖЕКПОТ', 'gold');
      } else if (a === b || b === c || a === c) {
        const pair = a === b || a === c ? a : b;
        win = Math.round(bet * (pair === 'apple' ? 1.5 : 1));
        msg = `Пара ${ico(pair).repeat(2)} — +${win}`;
      } else msg = pick(['Мимо. Казино всегда в плюсе', 'Пусто. Триада благодарит за вклад', 'Ничего. Ещё разок?']);
      run.gold += win;
      if (state !== 'shop' || shopDoor.kind !== 'slots') { if (win) hint(msg, 2.5); return; }
      (win && play(a === b && b === c ? 'slotwin' : 'coins')) || noise(win ? .4 : .15, win ? 3000 : 400, .35, win ? 'bandpass' : 'lowpass');
      screen(slotsHtml(msg, res), `[data-spin="${bet}"]:not(:disabled)`);
    }, 2100);
  }
  function shopHtml(msg) {
    const def = SHOPDEF[shopDoor.kind];
    return `<p class="g-kicker">${ico(def.icon)} ${def.title}</p><p>${def.sub}</p><p class="g-inv">${ico('gold')} ${run.gold} · ${ico('heart')} ${Math.round(hp)}</p>${msg ? `<p class="g-msg">${msg}</p>` : ''}<div class="g-shop">${shopItems(shopDoor.kind).map((it, k) => `<button type="button" data-buy="${k}"${it.off || run.gold < it.price ? ' disabled' : ''}><b>${it.name}</b><span>${it.note}</span><i>${it.price ? `${it.price} ${ico('gold')}` : ''}</i></button>`).join('')}</div><div class="g-btns"><button type="button" class="g-out" data-go="leave">УЙТИ</button></div>`;
  }
  function openShop(d) {
    shopDoor = d; state = 'shop';
    for (const k in keys) keys[k] = false;
    screen(shopHtml(''), '[data-buy]:not(:disabled)');
    noise(.15, 2200, .25, 'bandpass');
  }
  function leaveShop() { if (state !== 'shop') return; state = 'play'; screen(''); dlg.focus(); lock(); }
  function buy(k) {
    const it = shopItems(shopDoor.kind)[k];
    if (!it || it.off || run.gold < it.price) return;
    run.gold -= it.price;
    play('cash') || noise(.12, 3000, .3, 'bandpass');
    const msg = it.buy();
    if (state === 'shop') screen(shopHtml(msg), `[data-buy="${k}"]:not(:disabled)`);
  }
  function escape() {
    state = 'win'; winT = 0; winAt = now; hour = 18.65; gps = null; setWeather(WEATHER[0]); Object.assign(wcur, { rain: 0, snow: 0, f0: 70, f1: 320, light: 1 });
    while (cops.length) dropCop(0);
    ann('УЕХАЛ В ЗАКАТ', 'gold');
    const prev = bestTime.get(), record = !prev || run.time < prev;
    if (record) bestTime.set(run.time);
    setTimeout(() => { if (state === 'win' && opened) baseScreen(winHtml(record, prev)); }, 5200);
  }
  const winHtml = (record, prev) => `<p class="g-kicker">${ico('sunset')} Конец</p><h2 class="g-dead g-win">УЕХАЛ ИЗ ДОБРЯНКИ</h2><p>${{ docs: 'Документы в порядке, сержант козырнул и пересчитал.', bribe: `Сержант пересчитал ${NO_DOCS} и отдал честь.`, ram: 'Шлагбаум снесён, МВД до сих пор ищет его в Каме.' }[run.blockOpen] || ''} Добрянка в зеркале, впереди Пермь и закат. Через неделю вернёшься: в Перми шаурма хуже.</p><ul class="g-recap"><li>Время: <b>${clockStr(run.time)}</b>${record ? ' — рекорд!' : ` · рекорд ${clockStr(prev)}`}</li><li>Пауков раздавлено: <b>${run.spiders}</b></li><li>Курьеров: <b>${run.couriers}</b></li><li>Золота с собой: <b>${run.gold}</b></li><li>Смертей по дороге: <b>${run.deaths}</b></li></ul><div class="g-btns"><button type="button" data-go="play">ЕЩЁ РАЗ</button><button type="button" class="g-out" data-go="out">НА САЙТ</button></div>`;
  const mapC = $('.g-map'), mx = mapC.getContext('2d'), MS = mapC.width;
  const marks = [
    ...doors.map(d => ({ x: d.x, z: d.z, icon: SHOPDEF[d.kind].icon, name: SHOPDEF[d.kind].title })),
    { x: raceGate.x, z: raceGate.z, icon: 'race', name: SHOPDEF.race.title },
    ...(block ? [{ x: block.x, z: block.z, icon: 'barrier', name: 'Блокпост на мосту' }] : []),
    { x: EX[0], z: EX[1], icon: 'sunset', name: 'Выезд из Добрянки' },
    ...crews.map(c => ({ x: c.x, z: c.z, icon: 'skull', name: 'Триада' })),
    ...Object.keys(PLACE_SIGNS).filter(k => P[k]).map(k => ({ x: P[k].x, z: P[k].z, icon: PLACE_SIGNS[k][0], name: PLACE_SIGNS[k][1] }))
  ];
  let gps = null;
  const segT = (px, pz, ax, az, bx, bz) => { const ex = bx - ax, ez = bz - az; return clamp(((px - ax) * ex + (pz - az) * ez) / (ex * ex + ez * ez || 1), 0, 1); };
  function routeFrom(n) { const path = [n]; for (let k = 0; k < 800 && gps.f[n] > 0; k++) { const m = nav.downhill(gps.f, n); if (m === n) break; path.push(n = m); } return path; }
  function setGps(x, z, icon, name, goalRoute = false) {
    const n = nav.nearest(x, z);
    gps = { x, z, icon, name, goal: goalRoute, node: n, f: nav.field(n), path: [], off: 0, left: 0, prev: -1 };
    gps.path = routeFrom(nav.nearest(player.pos.x, player.pos.z)); routeAt = 0; gpsStep(0);
  }
  function gpsStep(dt) {
    if (!gps) return;
    const px = player.pos.x, pz = player.pos.z, path = gps.path, X = nav.NX, Z = nav.NZ;
    if (state === 'play' && zone === 'city' && Math.hypot(gps.x - px, gps.z - pz) < 22) { hint(`${ico(gps.icon)} ${gps.name}: приехали`, 2); gps = null; return; }
    let best = Math.hypot(X[path[0]] - px, Z[path[0]] - pz), drop = 0;
    for (let i = 0, run = 0; i < path.length - 1 && run < 80; i++) {
      const ax = X[path[i]], az = Z[path[i]], bx = X[path[i + 1]], bz = Z[path[i + 1]], t = segT(px, pz, ax, az, bx, bz), d = Math.hypot(ax + (bx - ax) * t - px, az + (bz - az) * t - pz);
      if (d < best - .01 && d < 25) { best = d; drop = t > .02 ? i + 1 : i; }
      run += Math.hypot(bx - ax, bz - az);
    }
    if (drop) { gps.prev = path[drop - 1]; path.splice(0, drop); }
    gps.off = best > 30 && zone === 'city' ? gps.off + dt : 0;
    if (gps.off > 2) { gps.off = 0; gps.prev = -1; gps.path = routeFrom(nav.nearest(px, pz)); }
    const h = gps.path[0];
    gps.left = Math.hypot(X[h] - px, Z[h] - pz) + gps.f[h] + Math.hypot(gps.x - X[gps.node], gps.z - Z[gps.node]);
  }
  const chevC = canvas(64, 32), chx = chevC.getContext('2d');
  chx.lineJoin = 'round';
  chx.beginPath(); chx.moveTo(14, 5); chx.lineTo(36, 16); chx.lineTo(14, 27); chx.lineTo(26, 27); chx.lineTo(48, 16); chx.lineTo(26, 5); chx.closePath();
  chx.fillStyle = '#ff4fb8'; chx.fill(); chx.lineWidth = 3; chx.strokeStyle = '#fff'; chx.stroke();
  const chevTex = texture(chevC, true), routeMat = new THREE.MeshBasicMaterial({ map: chevTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 });
  const routeMesh = new THREE.Mesh(new THREE.BufferGeometry(), routeMat);
  routeMesh.frustumCulled = false; routeMesh.renderOrder = 2; routeMesh.visible = false; scene.add(routeMesh);
  let routeAt = 0;
  function routeStep(dt) {
    chevTex.offset.x -= dt * 1.3;
    routeMesh.visible = !!gps && zone === 'city' && (state === 'play' || state === 'shop');
    if (!routeMesh.visible || now < routeAt) return;
    routeAt = now + .15;
    const X = nav.NX, Z = nav.NZ, h0 = gps.path[0], pts = gps.path.map(n => [X[n], Z[n]]), pos = [], uv = [], idx = [];
    if (gps.prev >= 0) { const a = gps.prev, t = segT(player.pos.x, player.pos.z, X[a], Z[a], X[h0], Z[h0]); pts.unshift([X[a] + (X[h0] - X[a]) * t, Z[a] + (Z[h0] - Z[a]) * t]); }
    let walked = 0, carry = 0;
    for (let i = 0; i < pts.length - 1 && walked < 420; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az);
      if (len < .01) continue;
      const dx = (bx - ax) / len, dz = (bz - az) / len;
      let t = carry;
      for (; t <= len; t += 2.5) {
        const x = ax + dx * t, z = az + dz * t, y = groundY(x, z) + .2, k = pos.length / 6;
        pos.push(x - dz * .9, y, z + dx * .9, x + dz * .9, y, z - dx * .9);
        uv.push((walked + t) / 3, 0, (walked + t) / 3, 1);
        if (k) idx.push(2 * k - 2, 2 * k, 2 * k - 1, 2 * k - 1, 2 * k, 2 * k + 1);
      }
      carry = t - len;
      walked += len;
    }
    const g = routeMesh.geometry;
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  }
  function goal() {
    if (run.blockOpen) return { n: 5, icon: 'sunset', text: 'Гони к выезду из Добрянки', x: EX[0], z: EX[1] };
    const docs = [['license', 'uschool', 'autoschool', 'Права: экзамен у Азиза', 'на права у Азиза', 1500], ['spravka', 'cross', 'hospital', 'Справка «Годен» в ЦРБ', 'на справку в ЦРБ', 2500], ['passport', 'ozon', 'ozon', 'Загранпаспорт на Ozon', 'на паспорт с Ozon', 4000]];
    const i = docs.findIndex(([k]) => !run[k]);
    if (i >= 0) { const [, icon, place, text, saving, price] = docs[i], p = P[place]; return { n: i + 1, icon, text: run.gold < price ? `Накопи ${price} ${saving}: дави пауков, работай на Триаду` : `${text} — ${price}`, route: text, price, x: p.x, z: p.z }; }
    return { n: 4, icon: 'barrier', text: `Блокпост на мосту: документы и ${BRIBE}`, price: BRIBE, x: block.x, z: block.z };
  }
  function routeGoal() {
    if (state !== 'play' || zone !== 'city') return;
    const q = goal();
    if (gps && gps.goal && gps.x === q.x && gps.z === q.z) { gps = null; return; }
    setGps(q.x, q.z, q.icon, (q.route || q.text).split(':')[0], true);
  }
  function routeLine(x, to, unit) {
    if (!gps || !gps.path.length) return;
    x.lineJoin = x.lineCap = 'round';
    for (const [w, c] of [[2.2, '#000'], [1, '#ff4fb8']]) {
      x.strokeStyle = c; x.lineWidth = w * unit; x.beginPath(); x.moveTo(...to(player.pos.x, player.pos.z));
      for (const n of gps.path) x.lineTo(...to(nav.NX[n], nav.NZ[n]));
      x.lineTo(...to(gps.x, gps.z)); x.stroke();
    }
  }
  function arrow(x, px, py, r, ang) {
    x.save(); x.translate(px, py); x.rotate(ang);
    x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = r / 4.5;
    x.beginPath(); x.moveTo(r * 1.4, 0); x.lineTo(-r, r * .9); x.lineTo(-r * .4, 0); x.lineTo(-r, -r * .9); x.closePath(); x.fill(); x.stroke();
    x.restore();
  }
  function vectorRoads(x, to, x0, z0, x1, z1, scale, minW) {
    const groups = new Map();
    world.edgesIn(x0, z0, x1, z1, (ax, az, bx, bz, w) => { let g = groups.get(w); if (!g) groups.set(w, g = []); g.push(ax, az, bx, bz); });
    x.lineCap = 'round'; x.strokeStyle = '#efe6cf';
    for (const [w, l] of groups) {
      x.lineWidth = Math.max(minW, w * scale); x.beginPath();
      for (let i = 0; i < l.length; i += 4) { const [p1, q1] = to(l[i], l[i + 1]), [p2, q2] = to(l[i + 2], l[i + 3]); x.moveTo(p1, q1); x.lineTo(p2, q2); }
      x.stroke();
    }
  }
  const TMR = 320, tsc = MS / (2 * TMR), toTrack = (x, z) => [(TMR - (x - TR.ox)) * tsc, (TMR - (z - TR.oz)) * tsc];
  const trackBase = canvas(MS, MS), tb2 = trackBase.getContext('2d');
  tb2.fillStyle = '#24361f'; tb2.fillRect(0, 0, MS, MS); tb2.strokeStyle = '#3a3444'; tb2.lineWidth = TR.halfW * 2 * tsc + 2; tb2.lineJoin = 'round';
  tb2.beginPath(); tp.forEach((p, i) => { const [x, y] = toTrack(p.x, p.z); i ? tb2.lineTo(x, y) : tb2.moveTo(x, y); }); tb2.closePath(); tb2.stroke();
  { const [x, y] = toTrack(tp[0].x, tp[0].z); drawIcon(tb2, 'race', x, y, 36); }
  function drawMap() {
    if (zone === 'race') {
      mx.drawImage(trackBase, 0, 0);
      for (const c of race.cars) if (c !== player) { const [x, y] = toTrack(c.pos.x, c.pos.z); mx.fillStyle = '#2a6bff'; mx.beginPath(); mx.arc(x, y, MS / 50, 0, 7); mx.fill(); }
      const [x, y] = toTrack(player.pos.x, player.pos.z); mx.fillStyle = '#ff2fa8'; mx.beginPath(); mx.arc(x, y, MS / 32, 0, 7); mx.fill(); mx.strokeStyle = '#fff'; mx.lineWidth = MS / 100; mx.stroke();
      return;
    }
    if (zone !== 'city') return;
    const R = 110 + Math.min(1, Math.abs(player.speed) / 40) * 90, k = MS / (2 * R), cx = player.pos.x, cz = player.pos.z, b = world.map;
    camera.getWorldDirection(rd);
    const th = Math.PI + Math.atan2(rd.x, rd.z), cs = Math.cos(th), sn = Math.sin(th);
    const toMap = (x, z) => { const dx = (x - cx) * k, dz = (z - cz) * k; return [MS / 2 + dx * cs - dz * sn, MS / 2 + dx * sn + dz * cs]; };
    mx.fillStyle = '#2d5a8f'; mx.fillRect(0, 0, MS, MS);
    mx.save(); mx.translate(MS / 2, MS / 2); mx.rotate(th); mx.scale(k / b.s, k / b.s); mx.imageSmoothingEnabled = true;
    mx.drawImage(b.canvas, (b.x0 - cx) * b.s, (b.z0 - cz) * b.s);
    mx.restore();
    vectorRoads(mx, toMap, cx - R * 1.45, cz - R * 1.45, cx + R * 1.45, cz + R * 1.45, k, 2);
    routeLine(mx, toMap, MS / 70);
    for (const m of marks) { const [x, y] = toMap(m.x, m.z); if (x > -20 && x < MS + 20 && y > -20 && y < MS + 20) drawIcon(mx, m.icon, x, y, 36); }
    const blink = now * 4 % 2 < 1;
    if (gps) {
      let [x, y] = toMap(gps.x, gps.z);
      const dx = x - MS / 2, dy = y - MS / 2, lim = MS / 2 - 18, far = Math.max(Math.abs(dx), Math.abs(dy));
      if (far > lim) { x = MS / 2 + dx / far * lim; y = MS / 2 + dy / far * lim; }
      drawIcon(mx, far > lim && blink ? 'pin' : gps.icon, x, y, 32);
    }
    for (const c of cops) { const [x, y] = toMap(c.pos.x, c.pos.z); mx.fillStyle = blink ? '#ff2030' : '#2a6bff'; mx.beginPath(); mx.arc(x, y, MS / 45, 0, 7); mx.fill(); }
    if (beat.active) { const [x, y] = toMap(beat.pos.x, beat.pos.z); mx.fillStyle = '#8fd0ff'; mx.fillRect(x - MS / 60, y - MS / 60, MS / 30, MS / 30); }
    const [hx, hy] = toMap(cx + Math.sin(player.heading), cz + Math.cos(player.heading));
    arrow(mx, MS / 2, MS / 2, MS / 22, Math.atan2(hy - MS / 2, hx - MS / 2));
    {
      const [nx, ny] = toMap(cx, cz - 1e4), d = Math.hypot(nx - MS / 2, ny - MS / 2) || 1, lim = MS / 2 - 22, ex = MS / 2 + (nx - MS / 2) / d * lim, ey = MS / 2 + (ny - MS / 2) / d * lim;
      mx.fillStyle = '#1a1030'; mx.fillRect(ex - 15, ey - 15, 30, 30); mx.strokeStyle = '#fff'; mx.lineWidth = 3; mx.strokeRect(ex - 15, ey - 15, 30, 30);
      mx.font = '700 22px GCraft,monospace'; mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillStyle = '#fff'; mx.fillText('С', ex, ey + 1);
    }
    if (gps) {
      mx.font = `700 ${Math.round(MS / 13)}px GCraft,monospace`; mx.textAlign = 'center'; mx.textBaseline = 'bottom'; mx.lineWidth = MS / 50; mx.strokeStyle = '#000'; mx.fillStyle = '#fff';
      const t = dist(gps.left), w = mx.measureText(t).width, x = MS / 2 + 20;
      drawIcon(mx, gps.icon, x - w / 2 - 22, MS - 22, 36);
      mx.strokeText(t, x, MS - 6); mx.fillText(t, x, MS - 6);
    }
  }
  const fullEl = $('.g-full'), fullC = fullEl.firstElementChild, fx = fullC.getContext('2d'), tipEl = $('.g-ftip');
  let mapOpen = false;
  const fv = { cx: 0, cz: 0, s: .55, dirty: true };
  const fullSize = () => [fullC.clientWidth || 1, fullC.clientHeight || 1];
  const BD = [world.bounds[0] + 40, world.bounds[1] + 40, world.bounds[2] - 40, world.bounds[3] - 40];
  const minS = () => { const [w, h] = fullSize(); return Math.max(w / (BD[2] - BD[0]), h / (BD[3] - BD[1])); };
  function clampView() {
    const [w, h] = fullSize();
    fv.s = clamp(fv.s, minS(), 6);
    const hw = w / 2 / fv.s, hh = h / 2 / fv.s;
    fv.cx = clamp(fv.cx, BD[0] + hw, BD[2] - hw); fv.cz = clamp(fv.cz, BD[1] + hh, BD[3] - hh);
  }
  const fullTo = (x, z) => { const [w, h] = fullSize(); return [(x - fv.cx) * fv.s + w / 2, (z - fv.cz) * fv.s + h / 2]; };
  const fullFrom = (px, py) => { const [w, h] = fullSize(); return [(px - w / 2) / fv.s + fv.cx, (py - h / 2) / fv.s + fv.cz]; };
  const markSize = () => Math.round(clamp(18 + Math.log2(fv.s / minS()) * 4, 18, 34));
  function markAt(px, py) {
    let best = null, bd = (markSize() * .8) ** 2;
    for (const m of marks) { const [x, y] = fullTo(m.x, m.z), d = (x - px) ** 2 + (y - py) ** 2; if (d < bd) { bd = d; best = m; } }
    return best;
  }
  function drawFull() {
    fv.dirty = false; clampView();
    const dpr = Math.min(2, devicePixelRatio || 1), [w, h] = fullSize(), b = world.map;
    if (fullC.width !== Math.round(w * dpr) || fullC.height !== Math.round(h * dpr)) { fullC.width = Math.round(w * dpr); fullC.height = Math.round(h * dpr); }
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.fillStyle = '#2d5a8f'; fx.fillRect(0, 0, w, h);
    const [bx, by] = fullTo(b.x0, b.z0);
    fx.imageSmoothingEnabled = true;
    fx.drawImage(b.canvas, bx, by, b.canvas.width / b.s * fv.s, b.canvas.height / b.s * fv.s);
    const [x0, z0] = fullFrom(0, 0), [x1, z1] = fullFrom(w, h);
    if (fv.s > .7) {
      for (const B of world.vec.B) {
        if (B.cx < x0 - 60 || B.cx > x1 + 60 || B.cz < z0 - 60 || B.cz > z1 + 60) continue;
        fx.fillStyle = B.code === 'h' || B.code === 'g' ? '#8a6a5a' : '#6e667c'; fx.beginPath();
        for (let i = 0; i < B.p.length; i += 2) { const [px, py] = fullTo(B.p[i], B.p[i + 1]); i ? fx.lineTo(px, py) : fx.moveTo(px, py); }
        fx.closePath(); fx.fill();
      }
      vectorRoads(fx, fullTo, x0, z0, x1, z1, fv.s, 1.5);
    }
    routeLine(fx, fullTo, 3);
    const size = markSize();
    fx.font = '700 11px GCraft,monospace'; fx.textAlign = 'center'; fx.textBaseline = 'top'; fx.lineWidth = 3; fx.strokeStyle = '#000'; fx.fillStyle = '#fff';
    for (const m of marks) {
      const [px, py] = fullTo(m.x, m.z);
      if (px < -40 || py < -40 || px > w + 40 || py > h + 40) continue;
      drawIcon(fx, m.icon, px, py, size);
      if (fv.s > 1.4) { fx.strokeText(m.name, px, py + size / 2 + 2); fx.fillText(m.name, px, py + size / 2 + 2); }
    }
    if (gps) { const [px, py] = fullTo(gps.x, gps.z); fx.strokeStyle = '#ff4fb8'; fx.lineWidth = 3; fx.beginPath(); fx.arc(px, py, size * .75, 0, 7); fx.stroke(); }
    arrow(fx, ...fullTo(player.pos.x, player.pos.z), 9, Math.atan2(Math.cos(player.heading), Math.sin(player.heading)));
    fx.font = '700 15px GCraft,monospace'; fx.textAlign = 'left'; fx.textBaseline = 'top'; fx.lineWidth = 4; fx.strokeStyle = '#000'; fx.fillStyle = '#fff';
    const tx = gps ? 40 : 12;
    let head = gps ? `${gps.name} · ${dist(gps.left)} · тапни ещё раз — сбросить` : 'Тапни точку — проложу маршрут. Колесо или щипок — зум';
    if (fx.measureText(head).width > w - tx - 70) head = gps ? `${gps.name} · ${dist(gps.left)}` : 'Тапни точку на карте';
    if (gps) drawIcon(fx, gps.icon, 22, 24, 18);
    fx.strokeText(head, tx, 16); fx.fillText(head, tx, 16);
    fx.font = '11px GCraft,monospace'; fx.textAlign = 'right'; fx.textBaseline = 'bottom'; fx.fillStyle = 'rgba(255,255,255,.75)';
    fx.fillText('© OpenStreetMap', w - 10, h - 8);
  }
  function zoomAt(px, py, f) {
    const [wx, wz] = fullFrom(px, py), [w, h] = fullSize();
    fv.s = clamp(fv.s * f, minS(), 6); fv.cx = wx - (px - w / 2) / fv.s; fv.cz = wz - (py - h / 2) / fv.s; clampView(); fv.dirty = true;
  }
  const ptrs = new Map();
  let dragged = 0, pinch = 0;
  const pinchInfo = () => { const [a, c] = [...ptrs.values()], r = fullC.getBoundingClientRect(); return { d: Math.hypot(a[0] - c[0], a[1] - c[1]), x: (a[0] + c[0]) / 2 - r.left, y: (a[1] + c[1]) / 2 - r.top }; };
  fullC.addEventListener('pointerdown', e => { try { fullC.setPointerCapture(e.pointerId); } catch (err) {} ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 1) dragged = 0; else pinch = pinchInfo().d; });
  fullC.addEventListener('pointermove', e => {
    const r = fullC.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    if (ptrs.has(e.pointerId)) {
      const [ox, oy] = ptrs.get(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 1) { fv.cx -= (e.clientX - ox) / fv.s; fv.cz -= (e.clientY - oy) / fv.s; clampView(); dragged += Math.abs(e.clientX - ox) + Math.abs(e.clientY - oy); fv.dirty = true; tipEl.hidden = true; }
      else if (ptrs.size === 2) { const p2 = pinchInfo(); zoomAt(p2.x, p2.y, p2.d / (pinch || p2.d)); pinch = p2.d; dragged = 99; }
      return;
    }
    const m = markAt(px, py);
    tipEl.hidden = !m;
    if (m) { tipEl.innerHTML = `${ico(m.icon)} ${m.name} · ${dist(Math.hypot(m.x - player.pos.x, m.z - player.pos.z))}`; tipEl.style.left = Math.min(px + 16, r.width - tipEl.offsetWidth - 8) + 'px'; tipEl.style.top = py + 18 + 'px'; }
  });
  const ptrEnd = e => {
    const had = ptrs.delete(e.pointerId);
    if (!had || ptrs.size || dragged > 8 || e.type === 'pointercancel') return;
    const r = fullC.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, m = markAt(px, py);
    if (m && gps && gps.name === m.name && gps.x === m.x) gps = null;
    else if (m) setGps(m.x, m.z, m.icon, m.name);
    else { const [wx, wz] = fullFrom(px, py), n = nav.nearest(wx, wz); setGps(nav.NX[n], nav.NZ[n], 'pin', 'Точка'); }
    fv.dirty = true;
  };
  fullC.addEventListener('pointerup', ptrEnd); fullC.addEventListener('pointercancel', ptrEnd);
  fullC.addEventListener('pointerleave', () => { tipEl.hidden = true; });
  fullC.addEventListener('wheel', e => { e.preventDefault(); const r = fullC.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * .0016)); }, { passive: false });
  fullEl.querySelector('.g-fz').addEventListener('click', e => {
    const z = e.target.closest('[data-z]');
    if (!z) return;
    const [w, h] = fullSize();
    if (z.dataset.z === 'me') { fv.cx = player.pos.x; fv.cz = player.pos.z; fv.dirty = true; } else zoomAt(w / 2, h / 2, z.dataset.z === 'in' ? 1.6 : 1 / 1.6);
  });
  function openMap() {
    if (state !== 'play' || zone !== 'city' || menu || mapOpen) return;
    unlock(); mapOpen = true; fullEl.hidden = false; fv.cx = player.pos.x; fv.cz = player.pos.z; fv.s = Math.max(fv.s, minS());
    for (const k in keys) keys[k] = false;
    drawFull();
  }
  function closeMap() { if (!mapOpen) return; mapOpen = false; fullEl.hidden = true; tipEl.hidden = true; dlg.focus(); lock(); }
  $('.g-fx').addEventListener('click', closeMap);
  mapC.addEventListener('click', openMap);
  const tip = () => site.loot.aegis ? '' : '<p class="g-tip">Аегис = вторая жизнь. Падает с Рошана: таймер слева внизу на сайте, дождись и бей.</p>';
  let menu = false;
  const menuStack = [];
  const settingsHtml = () => `<p class="g-kicker">${ico('gear')} Настройки</p><div class="g-set">${[['vol', 'Общая громкость'], ['sfx', 'Стволы, удары, анонсер'], ['weather', 'Дождь и гром'], ['car', 'Мотор и сирены']].map(([k, t]) => `<label>${t}<input type="range" min="0" max="1" step="0.05" value="${prefs[k]}" data-pref="${k}"></label>`).join('')}<label>Обзор (FOV): <b>${prefs.fov}</b><input type="range" min="50" max="90" step="1" value="${prefs.fov}" data-pref="fov"></label>${canLock ? `<label>Чувствительность мыши<input type="range" min="0.0006" max="0.006" step="0.0002" value="${prefs.sens}" data-pref="sens"></label>` : ''}<label class="g-check"><input type="checkbox" data-pref="speedFov"${prefs.speedFov ? ' checked' : ''}>FOV растёт на скорости</label><label class="g-check"><input type="checkbox" data-pref="post"${prefs.post ? ' checked' : ''}>Эффекты: зерно, блюр, свечение</label><label class="g-check"><input type="checkbox" data-pref="fm"${prefs.fm ? ' checked' : ''}>Добрянка FM</label><label>Графика<select data-pref="quality">${[['low', 'Тапок'], ['mid', 'Норм'], ['high', 'Красиво']].map(([v, t]) => `<option value="${v}"${prefs.quality === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div><div class="g-btns"><button type="button" data-go="back">ГОТОВО</button></div>`;
  const pauseHtml = () => `<p class="g-kicker">Пауза</p><h2 class="g-dead g-win">ПАУЗА</h2><p>Мышь отпущена. Жми «Дальше» — и снова в Добрянку.</p><div class="g-btns"><button type="button" data-go="back">ДАЛЬШЕ</button><button type="button" class="g-out" data-go="settings">НАСТРОЙКИ</button><button type="button" class="g-out" data-go="out">ВЫЙТИ</button></div>`;
  const confirmHtml = () => `<p class="g-kicker">Выход</p><h2 class="g-dead">ТОЧНО ВЫЙТИ?</h2><p>${state === 'title' ? 'Вернёшься на сайт.' : 'Заезд не сохранится: золото, документы и розыск пропадут. Аегис и сыр останутся.'}</p><div class="g-btns"><button type="button" data-go="back">ОСТАТЬСЯ</button><button type="button" class="g-out" data-go="exit">ВЫЙТИ</button></div>`;
  function overlay(html, focus) {
    unlock();
    menuStack.push({ html: scr.hidden ? '' : scr.firstElementChild.innerHTML, menu });
    menu = true;
    for (const k in keys) keys[k] = false;
    screen(html, focus);
  }
  function back() {
    const prev = menuStack.pop();
    if (!prev) return;
    menu = prev.menu;
    if (prev.html) { scr.hidden = false; scr.firstElementChild.innerHTML = prev.html; const b = scr.querySelector('[data-go],[data-buy]:not(:disabled)'); if (b) b.focus(); }
    else { screen(''); dlg.focus(); lock(); setTimeout(() => { if (canLock && !locked && state === 'play' && !menu && !mapOpen) hint('Клик по игре — вернуть мышь', 2.5); }, 250); }
  }
  function baseScreen(html) { if (menuStack.length) { menuStack[0].html = html; menuStack[0].menu = false; } else screen(html); }
  function openSettings() { if (scr.hidden || !scr.querySelector('.g-set')) overlay(settingsHtml(), '[data-pref]'); }
  let pausedAt = -1e4;
  function openPause() { if (!menu && state === 'play') { pausedAt = performance.now(); overlay(pauseHtml()); } }
  function confirmExit() { if (scr.hidden || !scr.querySelector('[data-go="exit"]')) overlay(confirmHtml()); }
  function onEsc() { if (performance.now() - pausedAt < 400) return; if (mapOpen) closeMap(); else if (menu) back(); else if (state === 'shop') leaveShop(); else if (state === 'play') openPause(); else confirmExit(); }
  function lock() { if (!canLock || locked || !opened || state !== 'play' || menu || mapOpen || !scr.hidden) return; try { const r = renderer.domElement.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
  function unlock() { if (locked) { selfUnlock = true; document.exitPointerLock(); } }
  document.addEventListener('pointerlockchange', () => {
    const was = locked;
    locked = document.pointerLockElement === renderer.domElement;
    if (was && !locked && !selfUnlock && opened && state === 'play' && !menu && !mapOpen) openPause();
    if (!locked) selfUnlock = false;
  });
  dlg.addEventListener('mousemove', e => { if (!locked) return; camYaw -= e.movementX * prefs.sens; camPitch = clamp(camPitch + e.movementY * prefs.sens, -.45, 1.05); lastLook = now; });
  renderer.domElement.addEventListener('click', lock);
  const titleHtml = () => `<p class="g-kicker">Триада Games представляет</p><h2 class="g-title">GTA VI<span>Добрянка</span></h2><p>Перенесли семь раз. Вышла только в Добрянке.</p><p>${touch ? 'Слева джойстик: в тачке руль и газ (вниз — тормоз), пешком ходьба, до упора — бег. Справа свайп крутит камеру, кнопки — действие и прыжок (в тачке ручник). Тап по миникарте — карта, тап по цели — маршрут.' : 'WASD или стрелки, мышь — камера (клик по игре захватывает курсор), Shift — бег, пробел — прыжок (в тачке — ручник), F — выйти или угнать тачку, клик или Ctrl — огонь, M — карта, G — маршрут к цели, Esc — пауза.'} Дави пауков и курьеров, от МВД уходи, в Каму не падай.</p><p class="g-goal">Цель: свалить из Добрянки в закат. Мост на Пермь перекрыл блокпост МВД ${ico('barrier')}. Собери документы — права в автошколе Азиза ${ico('uschool')}, справку в ЦРБ ${ico('cross')}, загранпаспорт на Ozon ${ico('ozon')} — и сунь сержанту ${BRIBE}. Или снеси шлагбаум на броне.</p><p>Магазины на карте — заходи пешком в кольцо. Триада ${ico('skull')} даёт работу, на ${ico('race')} — гонка с МВД.</p><p class="g-inv">${ico('aegis')} Аегис: ${site.loot.aegis} · ${ico('cheese')} Сыр: ${site.loot.cheese}${bestTime.get() ? ` · рекорд побега ${clockStr(bestTime.get())}` : ''}</p>${tip()}<div class="g-btns"><button type="button" data-go="play">ПОЕХАЛИ</button><button type="button" class="g-out" data-go="settings">НАСТРОЙКИ</button></div><p class="g-build">сборка ${BUILD}</p>`;
  const overHtml = record => {
    const [title, sub] = DEATHS[cause] || DEATHS.cop, m = Math.floor(run.time / 60), s = Math.floor(run.time % 60);
    return `<h2 class="g-dead">${title}</h2><p>${sub}</p><ul class="g-recap"><li>Золото: <b>${run.gold}</b>${record && run.gold ? ' — рекорд!' : ''}</li><li>Пауков раздавлено: <b>${run.spiders}</b></li><li>Курьеров: <b>${run.couriers}</b></li><li>Розыск: ${ico('star').repeat(run.stars) || 'не было'}</li><li>В игре: ${m}:${String(s).padStart(2, '0')}</li></ul>${tip()}<div class="g-btns"><button type="button" data-go="respawn">ВОСКРЕСНУТЬ</button><button type="button" class="g-out" data-go="play">ЗАНОВО</button><button type="button" class="g-out" data-go="out">НА САЙТ</button></div>`;
  };
  function screen(html, focus) {
    if (html) unlock();
    scr.hidden = !html;
    scr.classList.toggle('g-shopping', state === 'shop');
    scr.classList.toggle('g-strip', state === 'shop' && shopDoor && shopDoor.kind === 'strip');
    if (!html) return;
    scr.firstElementChild.innerHTML = html;
    (focus && scr.querySelector(focus) || scr.querySelector('[data-go]')).focus();
  }
  function start() {
    audio(); reset(); menuStack.length = 0; menu = false; state = 'play'; screen(''); dlg.focus(); chase(0, true); ann('THE BATTLE BEGINS'); lock();
  }
  function hide() {
    if (!opened) return;
    unlock(); opened = false; state = 'title'; menuStack.length = 0; menu = false; mapOpen = false; fullEl.hidden = true;
    renderer.setAnimationLoop(null);
    if (ac) ac.suspend();
    document.body.classList.remove('gta');
    paused.forEach(v => v.play().catch(() => {})); paused = [];
    for (const k in keys) keys[k] = false;
    if (vp) vp.content = vpBase;
    if (dlg.open) dlg.close();
  }

  scr.addEventListener('click', e => {
    const b = e.target.closest('[data-go],[data-buy],[data-spin]');
    if (!b) return;
    const go = b.dataset.go;
    if (b.dataset.buy) buy(+b.dataset.buy);
    else if (b.dataset.spin) spin(+b.dataset.spin);
    else if (go === 'play') start();
    else if (go === 'leave') leaveShop();
    else if (go === 'respawn') { respawn(); lock(); }
    else if (go === 'settings') openSettings();
    else if (go === 'back') back();
    else if (go === 'exit') hide();
    else if (go === 'out') confirmExit();
  });
  dlg.addEventListener('cancel', e => { e.preventDefault(); onEsc(); });
  $('.g-gear').addEventListener('click', openSettings);
  scr.addEventListener('input', e => {
    const el = e.target.closest('[data-pref]');
    if (!el) return;
    prefs[el.dataset.pref] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
    const b = el.parentElement.querySelector('b');
    if (b) b.textContent = el.value;
    applyPrefs();
  });
  $('.g-x').addEventListener('click', confirmExit);
  questEl.addEventListener('click', e => { if (e.target.closest('.g-qt')) { prefs.questOpen = !prefs.questOpen; savePrefs(); } else routeGoal(); });
  dlg.addEventListener('close', hide);
  for (const t of ['click', 'pointerdown', 'pointermove', 'pointerup', 'mousemove']) dlg.addEventListener(t, e => e.stopPropagation());
  let lastTap = 0;
  dlg.addEventListener('touchend', e => { if (e.timeStamp - lastTap < 350 && !e.target.closest('button,input,select,label,.g-screen')) e.preventDefault(); lastTap = e.timeStamp; }, { passive: false });
  for (const t of ['dblclick', 'gesturestart', 'contextmenu']) dlg.addEventListener(t, e => e.preventDefault());
  dlg.addEventListener('selectstart', e => { if (!e.target.closest || !e.target.closest('input,select')) e.preventDefault(); });
  const joyEl = $('.g-joy'), stickEl = $('.g-stick'), knobEl = stickEl.firstElementChild;
  joyEl.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (joy.id !== null) return;
    const r = dlg.getBoundingClientRect();
    joy.id = e.pointerId; joy.ox = e.clientX - r.left; joy.oy = e.clientY - r.top; joy.x = joy.y = 0;
    try { joyEl.setPointerCapture(e.pointerId); } catch (err) {}
    stickEl.classList.add('on'); stickEl.style.left = joy.ox + 'px'; stickEl.style.top = joy.oy + 'px'; stickEl.style.bottom = 'auto';
  });
  joyEl.addEventListener('pointermove', e => {
    if (e.pointerId !== joy.id) return;
    const r = dlg.getBoundingClientRect(), dx = e.clientX - r.left - joy.ox, dy = e.clientY - r.top - joy.oy, d = Math.hypot(dx, dy), k = d > 56 ? 56 / d : 1;
    joy.x = dx * k / 56; joy.y = -dy * k / 56;
    knobEl.style.transform = `translate(${dx * k}px,${dy * k}px)`;
  });
  const joyEnd = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; knobEl.style.transform = ''; stickEl.classList.remove('on'); stickEl.style.left = stickEl.style.top = stickEl.style.bottom = ''; };
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) joyEl.addEventListener(t, joyEnd);
  const cv = renderer.domElement;
  cv.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && camTouch.id === null) { camTouch.id = e.pointerId; camTouch.x = e.clientX; camTouch.y = e.clientY; } });
  cv.addEventListener('pointermove', e => {
    if (e.pointerId !== camTouch.id) return;
    camYaw -= (e.clientX - camTouch.x) * .008; camPitch = clamp(camPitch + (e.clientY - camTouch.y) * .005, -.45, 1.05); lastLook = now;
    camTouch.x = e.clientX; camTouch.y = e.clientY;
  });
  for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, e => { if (e.pointerId === camTouch.id) camTouch.id = null; });
  const pad = $('.g-pad');
  pad.addEventListener('pointerdown', e => {
    const b = e.target.closest('button');
    if (!b) return;
    e.preventDefault();
    if (b.hasAttribute('data-act')) {
      if (state === 'play' && player.foot && run.gun && !nearestCar() && !nearCrew()) { held.fire.add(e.pointerId); b.classList.add('held'); } else act();
      return;
    }
    if (b.dataset.k === 'hand' && player.foot) jump();
    held[b.dataset.k].add(e.pointerId); b.classList.add('held');
  });
  const release = e => { for (const k in held) held[k].delete(e.pointerId); pad.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('held', held[b.dataset.k].size > 0)); actEl.classList.toggle('held', held.fire.size > 0); };
  const switchGun = () => { const own = Object.keys(run.guns); if (own.length) run.gun = own[(own.indexOf(run.gun) + 1) % own.length]; };
  gunEl.addEventListener('click', switchGun);
  dlg.firstElementChild.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0 && (locked || !canLock)) keys.mouse = true; });
  dlg.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') keys.mouse = false; });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(t, release);
  pad.addEventListener('contextmenu', e => e.preventDefault());
  const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'hand', ShiftLeft: 'sprint', ShiftRight: 'sprint', ControlLeft: 'fire', ControlRight: 'fire', KeyX: 'fire' };
  const driving = () => opened && !menu && !mapOpen && (state === 'play' || state === 'dying');
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && opened) { e.preventDefault(); if (!e.repeat) onEsc(); return; }
    if ((e.code === 'KeyF' || e.code === 'KeyE') && driving()) { e.preventDefault(); if (!e.repeat) act(); return; }
    if (e.code === 'KeyQ' && driving()) { e.preventDefault(); if (!e.repeat) switchGun(); return; }
    if (e.code === 'KeyM' && opened && !e.repeat && (mapOpen || driving())) { e.preventDefault(); mapOpen ? closeMap() : openMap(); return; }
    if (e.code === 'KeyG' && driving() && !e.repeat) { e.preventDefault(); routeGoal(); return; }
    if (e.code === 'Space' && driving() && player.foot && !e.repeat) jump();
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
      if (vp) vp.content = vpBase + ', maximum-scale=1, user-scalable=no';
      dlg.showModal(); reset(); screen(titleHtml());
      last = performance.now(); renderer.setAnimationLoop(frame);
    }
  };
}

const CSS = `
@font-face{font-family:GCraft;src:url(fonts/monocraft-regular.woff2?v=${BUILD}) format("woff2");font-weight:400;font-display:swap}
@font-face{font-family:GCraft;src:url(fonts/monocraft-bold.woff2?v=${BUILD}) format("woff2");font-weight:700;font-display:swap}
body.gta{overflow:hidden}
#gta{--px:GCraft,ui-monospace,monospace;--pp:GCraft,ui-monospace,monospace;--panel:rgba(14,7,30,.9);--pink:#ff4fb8;--gold:#ffd24a;--cyan:#5ff2ff;--green:#39ff6a;--red:#ff3b3b;--o:2px 0 0 #000,-2px 0 0 #000,0 2px 0 #000,0 -2px 0 #000,2px 2px 0 #000;--box:3px solid #000;--sh:4px 4px 0 #000;position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#120826;color:#fff;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;font:500 17px/1.3 var(--px);outline:0;-webkit-font-smoothing:none}
#gta *{border-radius:0!important}
#gta li{display:block;line-height:1.3}
#gta::backdrop{background:#000}
#gta [hidden]{display:none!important}
#gta button{font-family:var(--px)}
#gta,#gta *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
#gta *{touch-action:none}
#gta .g-screen,#gta .g-screen *{touch-action:pan-y}
#gta .g-set input[type=range]{touch-action:pan-x}
.g-quest .g-qh{display:flex;align-items:center;gap:8px}
.g-quest .g-qt{margin-left:auto;width:24px;height:22px;padding:0;border:2px solid #000;background:#2a1a40;color:#fff;font:700 14px var(--px);line-height:1;cursor:pointer}
#gta .g-stick{display:none;position:absolute;left:calc(96px + env(safe-area-inset-left,0px));bottom:calc(64px + env(safe-area-inset-bottom,0px));width:112px;height:112px;margin:-56px 0 0 -56px;translate:0 50%;border:3px solid rgba(255,255,255,.3);background:rgba(14,7,30,.28);box-shadow:var(--sh);pointer-events:none;opacity:.55}
#gta .g-stick.on{translate:none;opacity:1}
#gta .g-stick i{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;background:rgba(255,79,184,.8);border:3px solid #000}
#gta .gi{display:inline-block;width:1.15em;height:1.15em;vertical-align:-.22em;background:url(img/gta-icons.png?v=${BUILD}) 0 0/${ICONS.length * 100}% 100% no-repeat;image-rendering:pixelated;font-style:normal}
${ICONS.map((k, i) => `#gta .gi-${k}{background-position:${(i / (ICONS.length - 1) * 100).toFixed(4)}% 0}`).join('\n')}
#gta .g-reel .gi{width:48px;height:48px}
#gta .g-gear .gi{width:32px;height:32px;vertical-align:0;display:block}
#gta .g-gold .gi{width:1em;height:1em;vertical-align:-.1em}
#gta .g-hprow .gi{width:18px;height:18px;vertical-align:0}
#gta>canvas{position:absolute;inset:0;width:100%;height:100%;display:block;transition:filter .4s}
#gta.dying>canvas{filter:grayscale(1) brightness(.7)}
.g-hud{position:absolute;inset:0;pointer-events:none;text-shadow:var(--o)}
.g-x{pointer-events:auto;position:absolute;left:12px;top:calc(10px + env(safe-area-inset-top,0px));width:44px;height:44px;border:var(--box);background:var(--red);color:#fff;font:700 22px var(--px);text-shadow:var(--o);box-shadow:var(--sh);cursor:pointer}
.g-stats{position:absolute;right:12px;top:calc(10px + env(safe-area-inset-top,0px));display:grid;justify-items:end;gap:6px}
.g-stats>*:not(.g-wanted):not(.g-hprow):not(.g-stam){background:var(--panel);border:var(--box);box-shadow:var(--sh);padding:3px 8px}
.g-wanted span{font-size:18px;opacity:.2;filter:grayscale(1)}
.g-wanted span.on{opacity:1;filter:none}
.g-wanted.cool span.on{animation:gBlink .5s steps(2) infinite}
.g-gold{color:var(--gold);font:700 19px/1.3 var(--pp)}
.g-hp{width:156px;height:14px;border:var(--box);background:#3b0d0d;box-shadow:var(--sh)}
.g-hp i{display:block;height:100%;width:100%;background:repeating-linear-gradient(90deg,var(--green) 0 10px,#1d8a2d 10px 12px)}
.g-stam{width:156px;height:8px;border:var(--box);background:#0d1e3b}
.g-stam i{display:block;height:100%;background:var(--cyan)}
.g-loot{font-size:15px}
.g-hprow{display:flex;align-items:center;gap:6px;filter:drop-shadow(2px 2px 0 #000)}
.g-quest{pointer-events:auto;cursor:pointer;position:absolute;left:12px;top:calc(64px + env(safe-area-inset-top,0px));width:min(300px,calc(100% - 210px));box-sizing:border-box;padding:6px 9px;background:var(--panel);border:var(--box);box-shadow:var(--sh);display:grid;gap:4px;font-size:14px;line-height:1.25}
.g-quest b{font:700 12px var(--px);letter-spacing:.08em;color:var(--gold)}
.g-quest .g-steps{display:flex;gap:6px;font-size:16px}
.g-quest .g-bar{display:block;height:6px;border:2px solid #000;background:#2a1a40}
.g-quest .g-bar u{display:block;height:100%;background:var(--gold)}
.g-quest small{color:#b9a8d8;font-size:11px}
.g-quest:hover{border-color:var(--pink)}
.g-hurt,.g-flash{position:absolute;inset:0;pointer-events:none;opacity:0}
.g-hurt{background:radial-gradient(ellipse at center,transparent 38%,rgba(200,0,24,.8) 100%)}
.g-flash{background:radial-gradient(ellipse at center,rgba(255,240,170,.2) 25%,rgba(255,210,74,.85) 100%)}
.g-mapbox{position:absolute;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:200px;display:grid;gap:6px;justify-items:end}
.g-weather{background:var(--panel);border:var(--box);box-shadow:var(--sh);padding:3px 8px;font-size:15px}
.g-ftip{position:absolute;pointer-events:none;padding:4px 8px;background:var(--panel);border:var(--box);box-shadow:var(--sh);font-size:14px;white-space:nowrap;text-shadow:var(--o)}
.g-fz{position:absolute;right:12px;bottom:calc(30px + env(safe-area-inset-bottom,0px));display:grid;gap:8px}
.g-fz button{width:44px;height:44px;border:var(--box);background:var(--panel);color:#fff;font:700 24px var(--px);box-shadow:var(--sh);cursor:pointer;display:grid;place-items:center;padding:0}
#gta .g-fz .gi{width:24px;height:24px;vertical-align:0}
#gta .g-off{opacity:.35;filter:grayscale(1)}
.g-job{font-size:15px;color:var(--gold)}
.g-job:empty,.g-gun:empty,.g-race:empty{display:none}
.g-gun{pointer-events:auto;color:#fff;font:500 15px var(--px);text-shadow:var(--o);cursor:pointer}
.g-race{display:grid;gap:4px;width:min(260px,calc(100vw - 190px));box-sizing:border-box;text-align:right;font-size:clamp(13px,3.6vw,16px)}
.g-race b{font:700 1em/1.3 var(--px);color:var(--gold);text-transform:uppercase}
.g-race span{font-size:.92em;color:#e9dcff}
.g-race i{display:block;height:10px;border:2px solid #000;background:#2a1a40}
.g-race u{display:block;height:100%;background:repeating-linear-gradient(90deg,var(--pink) 0 8px,var(--gold) 8px 16px)}
.g-map{pointer-events:auto;cursor:pointer;display:block;width:200px;height:200px;border:var(--box);box-shadow:var(--sh)}
.g-full{position:absolute;inset:0;background:#2d5a8f;touch-action:none}
.g-full canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair}
.g-fx{position:absolute;right:12px;top:calc(10px + env(safe-area-inset-top,0px));width:44px;height:44px;border:var(--box);background:var(--red);color:#fff;font:700 22px var(--px);text-shadow:var(--o);box-shadow:var(--sh);cursor:pointer}
.g-speed{position:absolute;left:50%;translate:-50% 0;top:calc(10px + env(safe-area-inset-top,0px));min-width:84px;padding:6px 8px;text-align:center;line-height:1;background:var(--panel);border:var(--box);box-shadow:var(--sh)}
.g-speed b{display:block;font:700 28px var(--pp);color:#fff}
.g-speed small{display:block;margin-top:4px;font:700 11px var(--px);color:var(--cyan)}
.g-radio{position:absolute;left:50%;translate:-50% 0;bottom:calc(196px + env(safe-area-inset-bottom,0px));max-width:min(640px,calc(100% - 24px));box-sizing:border-box;padding:6px 10px;background:var(--panel);border:var(--box);box-shadow:var(--sh);font-size:14px;color:#f4e9ff;text-align:center}
.g-radio.on{animation:gRadio .4s steps(4)}
.g-ann{position:absolute;left:12px;right:12px;top:max(24%,236px);text-align:center;font:700 clamp(1.8rem,8vw,4.2rem)/1.05 var(--px);text-transform:uppercase;color:var(--pink);opacity:0;text-shadow:3px 0 0 #000,-3px 0 0 #000,0 3px 0 #000,0 -3px 0 #000,4px 4px 0 #000}
.g-ann.show{animation:gAnn 1.7s steps(12)}
.g-ann.gold{color:var(--gold)}
.g-hint{position:absolute;left:12px;right:12px;bottom:calc(240px + env(safe-area-inset-bottom,0px));text-align:center;font-size:17px;color:var(--cyan)}
.g-float{position:absolute;translate:-50% -50%;font:700 22px var(--pp);color:var(--gold);animation:gFloat .9s steps(9) forwards}
.g-pad{position:absolute;inset:0;pointer-events:none;text-shadow:none}
.g-pad .g-joy{position:absolute;left:0;bottom:0;width:52%;height:64%;pointer-events:auto}
.g-pad button{position:absolute;pointer-events:auto;border:var(--box);color:#fff;font:700 13px var(--px);text-shadow:var(--o);box-shadow:var(--sh);touch-action:none}
.g-pad button.held{background:var(--pink);translate:2px 2px;box-shadow:2px 2px 0 #000}
.g-pad .g-act{right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(26px + env(safe-area-inset-bottom,0px));width:84px;height:84px;background:rgba(110,80,10,.9);font-size:14px}
.g-pad .g-jump{right:calc(116px + env(safe-area-inset-right,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));width:66px;height:66px;background:rgba(20,70,110,.88)}
@media (hover:hover) and (pointer:fine){.g-pad{display:none}.g-radio{bottom:14px;max-width:min(640px,calc(100% - 500px))}.g-hint{bottom:64px;left:240px;right:240px}}
@media (max-width:560px) and (pointer:fine){.g-mapbox{width:150px}.g-map{width:150px;height:150px}.g-speed{left:12px;translate:none;top:auto;bottom:calc(12px + env(safe-area-inset-bottom,0px));min-width:72px}.g-radio{bottom:calc(230px + env(safe-area-inset-bottom,0px))}.g-hint{left:12px;right:12px;bottom:calc(290px + env(safe-area-inset-bottom,0px))}.g-quest{width:calc(100% - 190px)}}
@media (pointer:coarse){#gta .g-stick{display:block}.g-x{left:calc(10px + env(safe-area-inset-left,0px))}.g-gear{left:calc(62px + env(safe-area-inset-left,0px))}.g-stats{right:calc(10px + env(safe-area-inset-right,0px));gap:4px}.g-gold{font-size:16px}.g-hp{width:120px}.g-loot{font-size:13px}.g-quest{left:calc(10px + env(safe-area-inset-left,0px));top:calc(62px + env(safe-area-inset-top,0px));width:min(250px,calc(100% - 180px));background:none;border:0;box-shadow:none;padding:2px 0;font-size:13px;text-shadow:var(--o)}.g-quest .g-steps,.g-quest small,.g-quest .g-bar{display:none}.g-mapbox{right:calc(10px + env(safe-area-inset-right,0px));bottom:calc(126px + env(safe-area-inset-bottom,0px));width:136px;gap:4px}.g-map{width:136px;height:136px}.g-weather{font-size:12px;padding:2px 6px}.g-speed{left:50%;translate:-50% 0;top:calc(10px + env(safe-area-inset-top,0px));bottom:auto;min-width:60px;padding:4px 6px}.g-speed b{font-size:22px}.g-hint{left:12px;right:12px;top:calc(150px + env(safe-area-inset-top,0px));bottom:auto;font-size:14px}.g-radio{top:calc(190px + env(safe-area-inset-top,0px));bottom:auto;font-size:12px}.g-ann{top:32%}}
@media (pointer:coarse) and (max-height:520px){.g-quest{top:calc(8px + env(safe-area-inset-top,0px));left:calc(116px + env(safe-area-inset-left,0px));width:min(300px,36%)}.g-mapbox{right:auto;left:50%;translate:-50% 0;bottom:calc(6px + env(safe-area-inset-bottom,0px));width:104px}.g-map{width:104px;height:104px}.g-weather{display:none}.g-speed{top:auto;bottom:calc(116px + env(safe-area-inset-bottom,0px))}.g-hint{top:calc(58px + env(safe-area-inset-top,0px));left:30%;right:30%}.g-radio{display:none}.g-ann{top:22%}#gta .g-stick{width:96px;height:96px;margin:-48px 0 0 -48px;bottom:calc(52px + env(safe-area-inset-bottom,0px))}.g-pad .g-joy{height:80%;width:42%}}
.g-screen{position:absolute;inset:0;display:flex;padding:calc(24px + env(safe-area-inset-top,0px)) 16px calc(24px + env(safe-area-inset-bottom,0px));background:rgba(14,7,30,.72);background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,transparent 2px 4px);text-align:center;overflow:auto;touch-action:pan-y}
.g-screen>div{margin:auto;width:min(540px,100%);box-sizing:border-box;display:grid;gap:12px;justify-items:center;padding:20px 16px;background:var(--panel);border:var(--box);box-shadow:inset 0 0 0 3px var(--pink),8px 8px 0 #000}
.g-screen p{margin:0;color:#f4e9ff;max-width:46ch}
.g-kicker.g-kicker{font:700 14px/1.4 var(--px);letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
.g-title{margin:0;font:700 clamp(2.8rem,14vw,5.4rem)/1 var(--pp);color:#fff;text-shadow:4px 4px 0 var(--pink),8px 8px 0 #000}
.g-title span{display:block;margin-top:12px;font:700 .5em var(--px);letter-spacing:.12em;text-transform:uppercase;color:var(--pink);text-shadow:3px 3px 0 #000}
.g-inv.g-inv{color:var(--gold)}
.g-tip.g-tip{color:var(--cyan);font-size:15px}
.g-goal.g-goal{color:#fff}
.g-build.g-build{font-size:12px;color:#8a7aa8}
.g-gear{pointer-events:auto;display:grid;place-items:center;padding:0;position:absolute;left:64px;top:calc(10px + env(safe-area-inset-top,0px));width:44px;height:44px;border:var(--box);background:#2a1a40;color:#fff;font:700 22px var(--px);box-shadow:var(--sh);cursor:pointer}
.g-aim{position:absolute;width:26px;height:26px;translate:-50% -50%;border:3px solid #fff;box-shadow:0 0 0 2px #000,inset 0 0 0 2px #000}
.g-aim::after{content:"";position:absolute;left:50%;top:50%;width:4px;height:4px;translate:-50% -50%;background:#fff;box-shadow:0 0 0 2px #000}
.g-aim.lock{border-color:var(--red);width:34px;height:34px}
.g-aim.lock::after{background:var(--red)}
.g-set{display:grid;gap:10px;width:min(100%,420px);text-align:left}
.g-set label{display:grid;gap:4px;font-size:16px}
.g-set .g-check{display:flex;gap:10px;align-items:center}
.g-set input[type=range]{width:100%;accent-color:var(--pink);touch-action:pan-x}
.g-set input[type=checkbox]{width:22px;height:22px;accent-color:var(--pink)}
.g-set select{font:700 16px var(--px);padding:6px;border:var(--box);background:#22143a;color:#fff}
.g-msg.g-msg{color:var(--gold)}
.g-dead{margin:0;font:700 clamp(1.8rem,8vw,3.2rem)/1.05 var(--px);text-transform:uppercase;color:var(--red);text-shadow:4px 4px 0 #000}
.g-win{color:var(--gold)}
.g-recap{width:min(100%,380px);box-sizing:border-box;list-style:none;margin:0;padding:10px 14px;border:var(--box);background:rgba(0,0,0,.45);display:grid;gap:4px;text-align:left}
.g-btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:4px}
.g-btns button{padding:12px 18px;border:var(--box);font:700 17px var(--px);text-transform:uppercase;cursor:pointer;background:var(--pink);color:#000;box-shadow:var(--sh)}
.g-btns button:active:not(:disabled){translate:2px 2px;box-shadow:2px 2px 0 #000}
.g-btns .g-out{background:#2a1a40;color:#fff}
.g-btns button:disabled{opacity:.45;cursor:not-allowed}
.g-btns button:focus-visible,.g-x:focus-visible,.g-shop button:focus-visible{outline:3px solid var(--cyan);outline-offset:3px}
.g-shop{display:grid;gap:8px;width:min(100%,460px)}
.g-shop button{display:grid;grid-template-columns:1fr auto;gap:2px 12px;text-align:left;padding:10px 12px;border:var(--box);background:#22143a;color:#fff;font:500 17px var(--px);box-shadow:var(--sh);cursor:pointer}
.g-shop b{font-weight:700}
.g-shop span{grid-column:1;font-size:14px;color:#cbb8e0}
.g-shop i{grid-row:1/span 2;grid-column:2;align-self:center;font:700 16px var(--pp);color:var(--gold);white-space:nowrap}
.g-shop button:disabled{opacity:.42;cursor:not-allowed}
.g-shop button:not(:disabled):hover{background:#3a1f5e}
.g-screen.g-shopping{background-color:rgba(14,7,30,.6)}
.g-screen.g-strip{background:linear-gradient(to top,rgba(14,7,30,.9) 30%,transparent 70%)}
.g-screen.g-strip>div{margin:auto auto 0}
.g-reels{--cell:72px;display:flex;gap:8px;padding:10px;border:var(--box);background:var(--gold);box-shadow:inset 0 0 0 3px #8a6a10,var(--sh)}
.g-reel{width:var(--cell);height:var(--cell);overflow:hidden;border:var(--box);background:#1a1030}
.g-reel div{display:flex;flex-direction:column}
.g-reel span{height:var(--cell);flex:none;display:grid;place-items:center;font-size:42px;line-height:1}
@keyframes gAnn{0%{opacity:0;scale:1.6}12%{opacity:1;scale:1}75%{opacity:1}100%{opacity:0}}
@keyframes gFloat{to{translate:-50% -170%;opacity:0}}
@keyframes gBlink{50%{opacity:.2}}
@keyframes gRadio{from{opacity:0;translate:-50% 8px}}
@media (max-height:520px){.g-screen>div{gap:8px;padding:12px}.g-title{font-size:2rem}.g-dead{font-size:1.5rem}.g-recap{grid-template-columns:1fr 1fr;column-gap:18px}}
`;
