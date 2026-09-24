/* =========================================================
   main.js — code commun à toutes les pages
   - injecte le menu, le fond animé et le pied de page
   - animations d'apparition au scroll
   - réseau de particules en arrière-plan
   ========================================================= */

const SITE = {
  name: "Yannis Paugy",
  initials: "YP",
  github: "https://github.com/Paugyy",
  linkedin: "https://www.linkedin.com/in/A-COMPLETER",
  email: "yapaugy@gmail.com",
};

const PAGES = [
  { href: "index.html", label: "Accueil" },
  { href: "entreprise.html", label: "Projets entreprise" },
  { href: "ecole.html", label: "Projets école" },
  { href: "ressources.html", label: "Ressources" },
  { href: "cv.html", label: "CV" },
  { href: "contact.html", label: "Contact" },
];

/* ---------- 1. Menu + fond + footer (un seul endroit à modifier) ---------- */
function buildLayout() {
  const current = location.pathname.split("/").pop() || "index.html";

  const bg = document.createElement("div");
  bg.className = "bg";
  bg.innerHTML = '<div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div>';
  document.body.prepend(bg);

  const canvas = document.createElement("canvas");
  canvas.id = "particles";
  document.body.prepend(canvas);

  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="index.html"><span class="logo">${SITE.initials}</span>${SITE.name}</a>
      <button class="burger" aria-label="Ouvrir le menu"><span></span></button>
      <ul class="nav-links">
        ${PAGES.map(p => `<li><a href="${p.href}" class="${p.href === current ? "active" : ""}">${p.label}</a></li>`).join("")}
      </ul>
    </div>`;
  document.body.insertBefore(nav, document.querySelector("main"));
  nav.querySelector(".burger").addEventListener("click", () => nav.classList.toggle("open"));

  const footer = document.createElement("footer");
  footer.innerHTML = `
    <div class="socials">
      <a href="${SITE.github}" target="_blank" rel="noopener">GitHub</a>
      <a href="${SITE.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
      <a href="contact.html">Contact</a>
    </div>
    © ${new Date().getFullYear()} ${SITE.name} — Portfolio BTS SIO`;
  document.body.appendChild(footer);
}

/* ---------- 2. Apparition des éléments au scroll ---------- */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visible");
      // barres de compétences : on remplit à l'apparition
      e.target.querySelectorAll("[data-level]").forEach(b => (b.style.width = b.dataset.level + "%"));
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
}

/* ---------- 3. Compteurs animés ---------- */
function initCounters() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const start = performance.now();
      const step = now => {
        const p = Math.min((now - start) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (el.dataset.suffix || "");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-count]").forEach(el => io.observe(el));
}

/* ---------- 4. Réseau de particules (fond fixe, léger parallaxe au scroll) ---------- */
function initParticles() {
  const canvas = document.getElementById("particles");
  if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = canvas.getContext("2d");
  let w, h, dots, dpr;
  const colors = ["79,70,229", "6,182,212", "244,114,182"];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    const count = Math.min(70, Math.floor((innerWidth * innerHeight) / 22000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * dpr,
      vy: (Math.random() - 0.5) * 0.25 * dpr,
      r: (Math.random() * 1.8 + 0.8) * dpr,
      c: colors[Math.floor(Math.random() * colors.length)],
      z: Math.random() * 0.6 + 0.2, // profondeur pour le parallaxe
    }));
  }

  const mouse = { x: -9999, y: -9999 };
  addEventListener("mousemove", e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const sy = scrollY * dpr;
    const link = 130 * dpr;
    const pos = dots.map(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > w) d.vx *= -1;
      if (d.y < 0 || d.y > h) d.vy *= -1;
      // parallaxe : les points "proches" bougent plus avec le scroll
      let y = (d.y - sy * d.z * 0.25) % h;
      if (y < 0) y += h;
      return { x: d.x, y, d };
    });
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < link) {
          ctx.strokeStyle = `rgba(${pos[i].d.c},${0.14 * (1 - dist / link)})`;
          ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
        }
      }
      const md = Math.hypot(pos[i].x - mouse.x, pos[i].y - mouse.y);
      if (md < link * 1.4) {
        ctx.strokeStyle = `rgba(${pos[i].d.c},${0.3 * (1 - md / (link * 1.4))})`;
        ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${pos[i].d.c},0.55)`;
      ctx.beginPath(); ctx.arc(pos[i].x, pos[i].y, pos[i].d.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize();
  addEventListener("resize", resize);
  draw();
}

/* ---------- 5. Les blobs du fond suivent légèrement la souris ---------- */
function initBlobParallax() {
  const blobs = document.querySelectorAll(".bg .blob");
  addEventListener("mousemove", e => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    blobs.forEach((b, i) => {
      const f = (i + 1) * 12;
      b.style.translate = `${x * f}px ${y * f}px`;
    });
  });
}

/* ---------- 6. Modale projet (pages projets) ---------- */
function renderProjects(list, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const filters = document.getElementById("filters");
  const cats = ["Tous", ...new Set(list.map(p => p.category))];

  filters.innerHTML = cats.map((c, i) => `<button class="chip ${i === 0 ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
  const tagColors = ["", "cyan", "pink", "amber"];

  function draw(cat) {
    const items = cat === "Tous" ? list : list.filter(p => p.category === cat);
    grid.innerHTML = items.map((p, i) => `
      <article class="card project reveal visible" data-id="${list.indexOf(p)}" style="animation-delay:${i * 60}ms">
        <div class="cover" style="background:${p.color}">${p.icon}</div>
        <div class="meta">${p.category} · ${p.date}</div>
        <h3>${p.title}</h3>
        <p>${p.summary}</p>
        <div class="tags">${p.tags.map((t, k) => `<span class="tag ${tagColors[k % 4]}">${t}</span>`).join("")}</div>
        <div class="more">Voir le détail →</div>
      </article>`).join("");
  }
  draw("Tous");

  filters.addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    filters.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    draw(btn.dataset.cat);
  });

  const modal = document.getElementById("modal");
  const box = modal.querySelector(".modal-content");
  grid.addEventListener("click", e => {
    const card = e.target.closest(".project");
    if (!card) return;
    const p = list[card.dataset.id];
    box.innerHTML = `
      <div class="meta" style="color:var(--accent);font-weight:700;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em">${p.category} · ${p.date}</div>
      <h2 style="margin-top:6px">${p.icon} ${p.title}</h2>
      <p style="color:var(--text-soft)">${p.description}</p>
      <h4>🎯 Objectifs</h4><ul>${p.objectives.map(o => `<li>${o}</li>`).join("")}</ul>
      <h4>🛠️ Ce que j'ai réalisé</h4><ul>${p.tasks.map(o => `<li>${o}</li>`).join("")}</ul>
      ${p.skills ? `<h4>📚 Compétences BTS SIO mobilisées</h4><ul>${p.skills.map(o => `<li>${o}</li>`).join("")}</ul>` : ""}
      <div class="tags">${p.tags.map((t, k) => `<span class="tag ${tagColors[k % 4]}">${t}</span>`).join("")}</div>
      ${p.link ? `<div class="btn-row" style="justify-content:flex-start"><a class="btn btn-primary" href="${p.link}" target="_blank" rel="noopener">Voir le projet ↗</a></div>` : ""}`;
    modal.classList.add("open");
  });
  const close = () => modal.classList.remove("open");
  modal.addEventListener("click", e => { if (e.target === modal || e.target.closest(".modal-close")) close(); });
  addEventListener("keydown", e => e.key === "Escape" && close());
}

document.addEventListener("DOMContentLoaded", () => {
  buildLayout();
  initReveal();
  initCounters();
  initParticles();
  initBlobParallax();
});
