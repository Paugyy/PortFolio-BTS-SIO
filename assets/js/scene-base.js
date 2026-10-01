/* =========================================================
   scene-base.js — socle commun des scènes 3D (Three.js)
   - canevas fixe derrière le contenu, transparent
   - suivi souris lissé, progression du défilement
   - pause quand l'onglet est masqué, image fixe si
     « réduire les animations » est activé, abandon propre
     si WebGL est indisponible (le site reste utilisable)
   ========================================================= */
import * as THREE from "/assets/vendor/three.module.min.js";

export { THREE };

export function createStage({ fov = 45, z = 10, near = 0.1, far = 200 } = {}) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  canvas.id = "scene3d";
  canvas.setAttribute("aria-hidden", "true");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  document.body.prepend(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, near, far);
  camera.position.z = z;

  const state = {
    time: 0,
    pointer: { x: 0, y: 0 },
    smooth: { x: 0, y: 0 },
    scroll: 0,      // 0 → 1 sur toute la page
    scrollPx: 0,
    width: innerWidth,
    height: innerHeight,
    mobile: innerWidth < 760,
    wide: innerWidth >= 1000,
    isHome: document.documentElement.classList.contains("is-home"),
    reduce,
  };

  const frames = [];
  const resizers = [];

  function resize() {
    state.width = innerWidth;
    state.height = innerHeight;
    state.mobile = innerWidth < 760;
    state.wide = innerWidth >= 1000;
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    resizers.forEach(f => f(state));
    if (reduce) render(0);
  }

  function readScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    state.scrollPx = scrollY;
    state.scroll = max > 0 ? Math.min(scrollY / max, 1) : 0;
  }

  addEventListener("resize", resize);
  addEventListener("scroll", readScroll, { passive: true });
  addEventListener("pointermove", e => {
    state.pointer.x = (e.clientX / innerWidth) * 2 - 1;
    state.pointer.y = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  function render(dt) {
    const k = Math.min(1, dt * 3);
    state.smooth.x += (state.pointer.x - state.smooth.x) * k;
    state.smooth.y += (state.pointer.y - state.smooth.y) * k;
    frames.forEach(f => f(dt, state));
    renderer.render(scene, camera);
  }

  let running = false;
  let last = 0;
  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    state.time += dt;
    render(dt);
    requestAnimationFrame(loop);
  }
  function play() {
    if (running || reduce || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? (running = false) : play()));

  return {
    THREE, scene, camera, renderer, state,
    onFrame: f => frames.push(f),
    onResize: f => resizers.push(f),
    start() {
      readScroll();
      resize();
      if (reduce) render(0); else play();
      requestAnimationFrame(() => canvas.classList.add("ready"));
    },
  };
}

/* Petit utilitaire : interpolation linéaire */
export const lerp = (a, b, t) => a + (b - a) * t;
