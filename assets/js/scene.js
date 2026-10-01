/* =========================================================
   Scène « Réseau » : globe de nœuds, liaisons en arc et
   paquets de données qui circulent. Suit la souris, tourne
   et remonte doucement au défilement.
   ========================================================= */
import { createStage, THREE } from "/assets/js/scene-base.js";

const stage = createStage({ fov: 45, z: 9 });
if (stage) {
  const { scene, state } = stage;
  const R = 2.5;
  const globe = new THREE.Group();
  scene.add(globe);

  // Points répartis uniformément sur la sphère (spirale de Fibonacci)
  const N = state.mobile ? 900 : 1600;
  const positions = new Float32Array(N * 3);
  const nodes = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    const v = new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r).multiplyScalar(R);
    v.toArray(positions, i * 3);
    nodes.push(v);
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  globe.add(new THREE.Points(pointsGeo, new THREE.PointsMaterial({
    color: 0x7dd3fc, size: 0.028, transparent: true, opacity: 0.75, sizeAttenuation: true, depthWrite: false,
  })));

  // Sphère sombre intérieure : masque les points de la face arrière (lisibilité)
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x060a14, transparent: true, opacity: 0.82 })
  ));

  // Halo léger
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.12, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.06, side: THREE.BackSide, depthWrite: false })
  );
  globe.add(halo);

  // Liaisons en arc entre des nœuds + paquets
  const arcMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55 });
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
  const packetMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const packets = [];
  const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })(); // déterministe
  const LINKS = state.mobile ? 10 : 18;
  for (let i = 0; i < LINKS; i++) {
    const a = nodes[Math.floor(rand() * N)];
    const b = nodes[Math.floor(rand() * N)];
    if (a.distanceTo(b) < R * 0.6) { i--; continue; }
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.25 + a.distanceTo(b) / (R * 6)));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), arcMat));
    for (const p of [a, b]) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), nodeMat);
      dot.position.copy(p);
      globe.add(dot);
    }
    const packet = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), packetMat);
    globe.add(packet);
    packets.push({ curve, mesh: packet, t: rand(), speed: 0.12 + rand() * 0.18 });
  }

  // Deux orbites fines (satellites / liens WAN)
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.18 });
  for (const [rx, tilt] of [[R * 1.45, 0.45], [R * 1.7, -0.3]]) {
    const pts = new THREE.EllipseCurve(0, 0, rx, rx * 0.92).getPoints(128).map(p => new THREE.Vector3(p.x, 0, p.y));
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), orbitMat);
    ring.rotation.set(Math.PI / 2 + tilt, tilt, 0);
    globe.add(ring);
  }

  // Placement selon la page et l'écran
  const base = { x: 0, y: 0, s: 1 };
  stage.onResize(s => {
    if (s.isHome) {
      Object.assign(base, s.wide ? { x: 3.1, y: -0.1, s: 0.88 } : { x: 0, y: s.mobile ? 2.2 : 1.6, s: s.mobile ? 0.62 : 0.8 });
    } else {
      Object.assign(base, s.wide ? { x: 4.2, y: 1.6, s: 0.85 } : { x: 1.4, y: 2.6, s: 0.6 });
    }
  });

  stage.onFrame((dt, s) => {
    globe.rotation.y += dt * 0.06;
    globe.rotation.x = 0.25 + s.smooth.y * 0.12;
    globe.rotation.z = -s.smooth.x * 0.06;
    const lift = s.isHome ? Math.min(s.scrollPx / s.height, 1.2) : 0;
    globe.position.set(base.x + s.smooth.x * 0.15, base.y + lift * 2.4, 0);
    globe.scale.setScalar(base.s * (1 + s.scroll * 0.08));
    for (const p of packets) {
      p.t = (p.t + dt * p.speed) % 1;
      p.mesh.position.copy(p.curve.getPoint(p.t));
    }
  });

  stage.start();
}
