/* Hero scene: three product panels connected to a central "trust core".
   Loaded lazily by main.js only on wide screens, with WebGL, and without
   a reduced-motion preference. The static SVG stays underneath as fallback. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const PANELS = [
  { title: 'Enterprise AI', sub: 'Integrations · analytics', color: '#A78BFA', pos: [-2.35, 1.45, 0.1], rot: [0.05, 0.32, -0.05], kind: 'bars' },
  { title: 'Consumer AI', sub: 'Reading coach · families', color: '#67E8F9', pos: [2.35, 1.2, -0.3], rot: [0.04, -0.32, 0.04], kind: 'progress' },
  { title: 'Responsible decisions', sub: 'Guardrails as spec', color: '#F2C374', pos: [0.05, -2.25, 0.5], rot: [-0.18, 0, 0], kind: 'checks' }
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panelTexture(p) {
  const W = 640, H = 400, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, 'rgba(40,40,50,0.96)');
  bg.addColorStop(1, 'rgba(24,24,31,0.96)');
  roundRect(g, 4, 4, W - 8, H - 8, 34); g.fillStyle = bg; g.fill();
  g.lineWidth = 2; g.strokeStyle = 'rgba(242,238,230,0.18)'; g.stroke();
  // header
  g.fillStyle = p.color; g.beginPath(); g.arc(46, 52, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#F2EEE6'; g.font = '600 34px Inter, system-ui, sans-serif'; g.fillText(p.title, 68, 64);
  g.fillStyle = 'rgba(242,238,230,0.55)'; g.font = '500 22px "JetBrains Mono", ui-monospace, monospace'; g.fillText(p.sub.toUpperCase(), 38, 108);
  g.fillStyle = 'rgba(242,238,230,0.10)'; g.fillRect(38, 130, W - 76, 2);
  if (p.kind === 'bars') {
    const hs = [70, 120, 96, 160, 138, 190];
    hs.forEach((h, i) => {
      roundRect(g, 46 + i * 52, 350 - h, 34, h, 7);
      g.fillStyle = i === hs.length - 1 ? p.color : 'rgba(167,139,250,0.45)'; g.fill();
    });
    [0, 1, 2].forEach(i => { roundRect(g, 380, 180 + i * 44, 200 - i * 40, 16, 8); g.fillStyle = 'rgba(242,238,230,0.18)'; g.fill(); });
  } else if (p.kind === 'progress') {
    [0, 1, 2].forEach(i => {
      roundRect(g, 46, 168 + i * 50, 380, 18, 9); g.fillStyle = 'rgba(242,238,230,0.14)'; g.fill();
      roundRect(g, 46, 168 + i * 50, [250, 170, 310][i], 18, 9); g.fillStyle = i === 0 ? p.color : 'rgba(103,232,249,0.45)'; g.fill();
    });
    g.lineWidth = 16; g.strokeStyle = 'rgba(242,238,230,0.14)'; g.beginPath(); g.arc(520, 250, 58, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = p.color; g.lineCap = 'round'; g.beginPath(); g.arc(520, 250, 58, -Math.PI / 2, Math.PI * 0.9); g.stroke();
  } else {
    const rows = [['✓', '#67E8F9', 330], ['✓', '#67E8F9', 280], ['✓', '#67E8F9', 360], ['✕', '#F49AA6', 250]];
    rows.forEach(([m, col, w], i) => {
      g.fillStyle = col; g.font = '700 26px Inter, system-ui, sans-serif'; g.fillText(m, 46, 186 + i * 50);
      roundRect(g, 90, 168 + i * 50, w, 16, 8); g.fillStyle = 'rgba(242,238,230,0.18)'; g.fill();
    });
    roundRect(g, 470, 170, 120, 46, 23); g.fillStyle = 'rgba(242,195,116,0.16)'; g.fill();
    g.fillStyle = p.color; g.font = '600 22px "JetBrains Mono", monospace'; g.fillText('≥ 90', 498, 201);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function glowTexture(rgb) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, `rgba(${rgb},0.55)`);
  r.addColorStop(0.4, `rgba(${rgb},0.16)`);
  r.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function mount(host) {
  try { await document.fonts.ready; } catch (e) { /* draw with fallbacks */ }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 12.6);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const kv = new THREE.PointLight(0xA78BFA, 40, 30); kv.position.set(-4, 3, 5); scene.add(kv);
  const kc = new THREE.PointLight(0x67E8F9, 26, 30); kc.position.set(4, -2, 5); scene.add(kc);

  const rig = new THREE.Group(); scene.add(rig);

  // Core
  const coreGeo = new THREE.IcosahedronGeometry(0.95, 0);
  const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({ color: 0x8B78E6, roughness: 0.35, metalness: 0.25, flatShading: true, emissive: 0x2A1F5C, emissiveIntensity: 0.6 }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeo), new THREE.LineBasicMaterial({ color: 0xF2EEE6, transparent: true, opacity: 0.35 }));
  core.add(edges);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 1), new THREE.MeshBasicMaterial({ color: 0xA78BFA, wireframe: true, transparent: true, opacity: 0.07 }));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('167,139,250'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(6, 6, 1);
  rig.add(glow, core, shell);

  // Orbit ring
  const ringPts = new THREE.EllipseCurve(0, 0, 3.4, 3.4).getPoints(160).map(p => new THREE.Vector3(p.x, 0, p.y));
  const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: 0xF2EEE6, transparent: true, opacity: 0.08 }));
  ring.rotation.x = 0.32; rig.add(ring);

  // Panels, links, pulses
  const panels = [], links = [];
  PANELS.forEach((p, i) => {
    const mat = new THREE.MeshBasicMaterial({ map: panelTexture(p), transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 1.6), mat);
    mesh.position.set(...p.pos); mesh.rotation.set(...p.rot);
    mesh.userData = { base: mesh.position.clone(), phase: i * 2.1 };
    rig.add(mesh); panels.push(mesh);

    const col = new THREE.Color(p.color);
    const pulseMat = new THREE.MeshBasicMaterial({ color: col });
    const pulses = [0, 0.5].map(o => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), pulseMat); rig.add(s); return { s, o }; });
    const lineMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.45 });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(41 * 3), 3));
    const line = new THREE.Line(lineGeo, lineMat);
    rig.add(line);
    links.push({ mesh, line, pulses, curve: null });
  });

  // Dust
  const N = 220, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 3 + Math.random() * 4, a = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 6;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(a) * r - 2;
  }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xF2EEE6, size: 0.025, transparent: true, opacity: 0.35, depthWrite: false }));
  scene.add(dust);

  // Pointer (desktop only — gentle)
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const onMove = e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  // Size
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(host);

  // Run only when visible
  let visible = true, raf = 0, last = performance.now(), t = 0, shown = false;
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const frame = now => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;

    cur.x += (target.x - cur.x) * 0.04; cur.y += (target.y - cur.y) * 0.04;
    rig.rotation.y = cur.x * 0.22 + Math.sin(t * 0.15) * 0.06;
    rig.rotation.x = cur.y * 0.12;

    core.rotation.y += dt * 0.25; core.rotation.x += dt * 0.08;
    shell.rotation.y -= dt * 0.05;
    glow.material.opacity = 0.85 + Math.sin(t * 1.2) * 0.12;
    dust.rotation.y += dt * 0.01;

    links.forEach(l => {
      const m = l.mesh, u = m.userData;
      m.position.y = u.base.y + Math.sin(t * 0.7 + u.phase) * 0.08;
      tmpA.set(0, 0, 0);
      tmpB.copy(m.position);
      const mid = tmpA.clone().lerp(tmpB, 0.5); mid.z += 0.9; mid.y += 0.25;
      l.curve = new THREE.QuadraticBezierCurve3(tmpA.clone(), mid, tmpB.clone());
      const attr = l.line.geometry.attributes.position;
      l.curve.getPoints(40).forEach((pt, k) => attr.setXYZ(k, pt.x, pt.y, pt.z));
      attr.needsUpdate = true;
      l.pulses.forEach(p => { l.curve.getPoint((t * 0.22 + p.o) % 1, p.s.position); });
    });

    renderer.render(scene, camera);
    if (!shown) { shown = true; host.classList.add('is-3d'); }
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }, { threshold: 0.01 }).observe(host);
  document.addEventListener('visibilitychange', kick);
  kick();
}
