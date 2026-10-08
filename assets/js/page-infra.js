/* =========================================================
   page-infra.js — schéma interactif de l'infrastructure (/infra)
   Tout est généré depuis assets/js/infra-data.js (objet INFRA) :
   1. dessin du schéma (SVG)        4. simulation de panne
   2. fiche d'une machine           5. tableau des accès
   3. scénarios animés              6. question « VPN activé ? »
   Aucune requête réseau : la page ne teste pas le VPN, elle pose la question.
   ========================================================= */

(() => {
  if (typeof INFRA === "undefined") return;

  const NS = "http://www.w3.org/2000/svg";
  const W = 1200, H = 720, TRUNK = 176;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Disposition (présentation uniquement, les données sont dans infra-data.js) ---------- */
  const TOP = {
    client: { x: 30, y: 36, w: 180, h: 64, name: "Poste distant", sub: "hors de l'école" },
    lab: { x: 290, y: 36, w: 260, h: 64, name: "Réseau de labo", sub: `${INFRA.wan.net} · passerelle ${INFRA.wan.gateway}` },
  };
  const ZONE_BOX = { web: { x: 30, w: 430 }, bdd: { x: 480, w: 240 }, adm: { x: 740, w: 220 }, usr: { x: 980, w: 190 } };
  const ZONE_Y = 214, ZONE_H = 476;
  const SLOT = {
    fw: { x: 640, y: 26, w: 250, h: 84 },
    haproxy: { x: 160, y: 300, w: 170, h: 66 },
    web1: { x: 56, y: 470, w: 118, h: 66 },
    web2: { x: 186, y: 470, w: 118, h: 66 },
    glpi: { x: 316, y: 470, w: 118, h: 66 },
    mysql1: { x: 506, y: 300, w: 188, h: 66 },
    mysql2: { x: 506, y: 420, w: 188, h: 66 },
    mysql3: { x: 506, y: 540, w: 188, h: 66 },
    adm01: { x: 766, y: 300, w: 168, h: 66 },
    guac: { x: 766, y: 470, w: 168, h: 66 },
    cli01: { x: 1006, y: 300, w: 138, h: 66 },
  };
  const KIND = {
    http: { label: "HTTP" },
    sql: { label: "SQL" },
    galera: { label: "Réplication" },
    ssh: { label: "Administration" },
    ad: { label: "Annuaire" },
  };

  const byId = Object.fromEntries(INFRA.nodes.map(n => [n.id, n]));
  const zoneById = Object.fromEntries(INFRA.zones.map(z => [z.id, z]));
  const down = new Set(); // machines « en panne » (simulation)

  // Emplacement de secours si une VM est ajoutée dans les données sans emplacement prévu ici
  INFRA.zones.forEach(z => {
    const box = ZONE_BOX[z.id];
    if (!box) return;
    let y = ZONE_Y + 86;
    INFRA.nodes.filter(n => n.zone === z.id).forEach(n => {
      if (SLOT[n.id]) { y = Math.max(y, SLOT[n.id].y + SLOT[n.id].h + 20); return; }
      SLOT[n.id] = { x: box.x + 26, y, w: box.w - 52, h: 60 };
      y += 80;
    });
  });

  const rect = id => SLOT[id] || TOP[id];
  const cx = r => r.x + r.w / 2;
  const cy = r => r.y + r.h / 2;
  const zoneOf = id => (byId[id] ? byId[id].zone : null);
  const nameOf = id => (byId[id] ? byId[id].name : TOP[id] ? TOP[id].name : id);

  /* ---------- Petits utilitaires ---------- */
  function svg(tag, attrs = {}, text) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text != null) e.textContent = text;
    return e;
  }
  function html(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (v === true) e.setAttribute(k, "");
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => c != null && e.append(c));
    return e;
  }
  const $ = id => document.getElementById(id);

  /* =========================================================
     1. Dessin du schéma
     ========================================================= */
  const stage = $("infra-stage");
  const scroller = $("infra-scroll");
  if (!stage || !scroller) return;

  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, class: "infra-svg", role: "group",
    "aria-label": "Schéma de l'infrastructure : pfSense relie le réseau de labo à quatre VLAN",
  });
  const gLinks = svg("g", { class: "infra-links" });
  const gZones = svg("g");
  const gFlows = svg("g", { class: "infra-flows", "aria-hidden": "true" });
  const gNodes = svg("g");
  root.append(gLinks, gZones, gFlows, gNodes);

  function drawStatic() {
    // Liaison poste distant -> labo (le VPN) et labo -> pfSense
    const c = TOP.client, l = TOP.lab, f = SLOT.fw;
    gLinks.append(
      svg("line", { x1: c.x + c.w, y1: cy(c), x2: l.x, y2: cy(l), class: "infra-link vpn" }),
      svg("text", { x: (c.x + c.w + l.x) / 2, y: cy(c) - 10, class: "infra-cap", "text-anchor": "middle" }, INFRA.vpn.name),
      svg("line", { x1: l.x + l.w, y1: cy(l), x2: f.x, y2: cy(f), class: "infra-link" }),
      // pfSense -> trunk, puis le trunk
      svg("line", { x1: cx(f), y1: f.y + f.h, x2: cx(f), y2: TRUNK, class: "infra-link trunk" }),
      svg("line", { x1: 60, y1: TRUNK, x2: 1150, y2: TRUNK, class: "infra-link trunk" }),
      svg("text", { x: 60, y: TRUNK - 30, class: "infra-cap" }, "Trunk 802.1Q · bridge Proxmox VLAN-aware"),
    );

    // Encadré NAT
    const nat = svg("g", { class: "infra-nat" });
    nat.append(svg("rect", { x: 930, y: 26, width: 240, height: 100, rx: 14 }));
    nat.append(svg("text", { x: 946, y: 48, class: "infra-nat-title" }, `Publication NAT · ${INFRA.wan.fw}`));
    INFRA.nat.forEach((n, i) => {
      nat.append(svg("text", { x: 946, y: 68 + i * 16, class: "infra-mono" }, `${n.port} → ${n.target}`));
      nat.append(svg("text", { x: 1158, y: 68 + i * 16, class: "infra-note", "text-anchor": "end" }, n.label));
    });
    gLinks.append(nat);

    // Les deux éléments hors labo
    for (const [id, t] of Object.entries(TOP)) {
      const g = svg("g", { class: "infra-ext", "data-id": id });
      g.append(svg("rect", { x: t.x, y: t.y, width: t.w, height: t.h, rx: 14 }));
      g.append(svg("text", { x: cx(t), y: t.y + 28, class: "infra-name", "text-anchor": "middle" }, t.name));
      g.append(svg("text", { x: cx(t), y: t.y + 47, class: "infra-ip", "text-anchor": "middle" }, t.sub));
      gNodes.append(g);
    }

    // Les VLAN
    INFRA.zones.forEach(z => {
      const b = ZONE_BOX[z.id];
      if (!b) return;
      const g = svg("g", { class: `infra-zone z-${z.id}` });
      const mid = b.x + b.w / 2;
      gLinks.append(svg("line", { x1: mid, y1: TRUNK, x2: mid, y2: ZONE_Y, class: "infra-link trunk" }));
      g.append(svg("rect", { x: b.x, y: ZONE_Y, width: b.w, height: ZONE_H, rx: 20 }));
      g.append(svg("text", { x: b.x + 26, y: ZONE_Y + 34, class: "infra-zone-name" }, `VLAN ${z.vlan} · ${z.name}`));
      g.append(svg("text", { x: b.x + 26, y: ZONE_Y + 54, class: "infra-ip" }, z.net));
      g.append(svg("text", { x: b.x + 26, y: ZONE_Y + ZONE_H - 20, class: "infra-note" }, z.note));
      gZones.append(g);
    });

    // Les machines (cliquables, accessibles au clavier)
    INFRA.nodes.forEach(n => {
      const r = SLOT[n.id];
      if (!r) return;
      const g = svg("g", {
        class: `infra-node${n.zone ? " z-" + n.zone : " is-fw"}`, "data-id": n.id, tabindex: "0", role: "button",
        "aria-label": `${n.name}, ${n.ip}. Ouvrir la fiche.`,
      });
      g.append(svg("rect", { x: r.x, y: r.y, width: r.w, height: r.h, rx: 13 }));
      g.append(svg("circle", { cx: r.x + r.w - 15, cy: r.y + 15, r: 4.5, class: "infra-led" }));
      if (n.id === "fw") {
        g.append(svg("text", { x: cx(r), y: r.y + 31, class: "infra-name big", "text-anchor": "middle" }, `${n.name} · ${n.dns}`));
        g.append(svg("text", { x: cx(r), y: r.y + 51, class: "infra-ip", "text-anchor": "middle" }, `WAN ${n.ip}`));
        g.append(svg("text", { x: cx(r), y: r.y + 69, class: "infra-note", "text-anchor": "middle" }, "routage · filtrage · NAT"));
      } else {
        g.append(svg("text", { x: r.x + 14, y: r.y + 29, class: "infra-name" }, n.name));
        g.append(svg("text", { x: r.x + 14, y: r.y + 49, class: "infra-ip" }, n.ip));
      }
      gNodes.append(g);
    });

    scroller.append(root);
  }

  /* =========================================================
     2. Trajets : un flux entre deux VLAN monte au trunk et passe par pfSense
     ========================================================= */
  const LANE = 13;
  const laneL = z => ZONE_BOX[z].x + LANE;
  const laneR = z => ZONE_BOX[z].x + ZONE_BOX[z].w - LANE;
  const FWX = cx(SLOT.fw), FWB = SLOT.fw.y + SLOT.fw.h;

  // Une machine a-t-elle une voisine à sa droite sur la même ligne ? (sinon elle sort par la droite)
  function blockedRight(id) {
    const r = SLOT[id];
    return INFRA.nodes.some(n => n.id !== id && n.zone === zoneOf(id) && SLOT[n.id] &&
      Math.abs(SLOT[n.id].y - r.y) < r.h && SLOT[n.id].x > r.x);
  }

  function route(a, b, shift = 0) {
    const A = rect(a), B = rect(b);
    const za = zoneOf(a), zb = zoneOf(b);
    const top = id => !!TOP[id];

    if (top(a) && (top(b) || b === "fw")) return [[A.x + A.w, cy(A)], [B.x, cy(B)]];
    if (a === "fw" && zb) return [[FWX, FWB], [FWX, TRUNK], [laneL(zb), TRUNK], [laneL(zb), cy(B)], [B.x, cy(B)]];

    if (za && zb && za === zb) {
      // Même VLAN : commutation directe, sans pfSense
      if (Math.abs(cx(A) - cx(B)) < 1) {
        const x = cx(A) + shift;
        return A.y < B.y ? [[x, A.y + A.h], [x, B.y]] : [[x, A.y], [x, B.y + B.h]];
      }
      const ya = A.y < B.y ? A.y + A.h : A.y, yb = A.y < B.y ? B.y : B.y + B.h;
      const mid = (ya + yb) / 2 + shift;
      return [[cx(A) + shift, ya], [cx(A) + shift, mid], [cx(B) + shift, mid], [cx(B) + shift, yb]];
    }

    if (za && zb) {
      // Deux VLAN différents : sortie -> trunk -> pfSense -> trunk -> entrée
      const out = blockedRight(a)
        ? [[cx(A), A.y + A.h], [cx(A), A.y + A.h + 16], [laneR(za), A.y + A.h + 16]]
        : [[A.x + A.w, cy(A)], [laneR(za), cy(A)]];
      return [...out, [laneR(za), TRUNK], [FWX, TRUNK], [FWX, FWB + 4], [FWX, TRUNK],
        [laneL(zb), TRUNK], [laneL(zb), cy(B)], [B.x, cy(B)]];
    }
    return [[cx(A), cy(A)], [cx(B), cy(B)]];
  }
  const crossesFw = (a, b) => a === "fw" || b === "fw" || (!!zoneOf(a) && !!zoneOf(b) && zoneOf(a) !== zoneOf(b));
  const toD = pts => pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");

  /* =========================================================
     3. Scénarios animés
     ========================================================= */
  const toolbar = $("infra-scenarios");
  const stepsBox = $("infra-steps");
  let current = INFRA.scenarios[0];
  let turn = 0;          // compteur de tours : sert au roundrobin
  let raf = 0, timer = 0;

  const isUp = id => !down.has(id);
  const galeraUp = () => ["mysql1", "mysql2", "mysql3"].filter(isUp);
  const isGalera = ids => ids.every(i => /^mysql/.test(i));

  // Résout une étape pour ce tour : qui parle à qui, et est-ce que ça passe ?
  function resolve(step, ctx) {
    let from = step.from, to = step.to, reason = "";
    if (Array.isArray(from)) from = step.same && ctx.pick ? ctx.pick : from.find(isUp) || from[0];
    if (Array.isArray(to)) {
      const up = to.filter(isUp);
      if (isGalera(to) && galeraUp().length < 2) {
        reason = "Quorum perdu : il reste moins de 2 nœuds sur 3, le cluster refuse les requêtes.";
        to = up[0] || to[0];
      } else if (!up.length) {
        reason = `Aucun serveur disponible (${to.map(nameOf).join(", ")}).`;
        to = to[0];
      } else {
        to = up[turn % up.length];
      }
    }
    if (!reason && byId[from] && !isUp(from)) reason = `${nameOf(from)} est arrêté.`;
    if (!reason && crossesFw(from, to) && !isUp("fw")) reason = "pfSense est arrêté : plus de routage entre les zones ni de NAT.";
    if (!reason && byId[to] && !isUp(to)) reason = `${nameOf(to)} ne répond pas.`;
    if (!reason && /^mysql/.test(to) && /^mysql/.test(from) && galeraUp().length < 2) reason = "Quorum perdu : la réplication s'arrête.";
    ctx.pick = Array.isArray(step.to) ? to : ctx.pick;
    return { from, to, reason };
  }

  function clearFlows() {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    gFlows.replaceChildren();
    gNodes.querySelectorAll(".is-active").forEach(n => n.classList.remove("is-active"));
  }

  function renderSteps() {
    stepsBox.replaceChildren();
    stepsBox.append(html("h3", { text: current.label }), html("p", { class: "ha-text", text: current.intro }));
    if (!current.steps.length) {
      const legend = html("ul", { class: "infra-legend" });
      Object.entries(KIND).forEach(([k, v]) => legend.append(html("li", {}, [html("span", { class: `infra-swatch k-${k}` }), v.label])));
      stepsBox.append(html("p", { class: "ha-small", text: "Choisissez un scénario au-dessus du schéma pour voir un flux circuler. Les couleurs :" }), legend);
      return;
    }
    const ol = html("ol", { class: "infra-steplist" });
    current.steps.forEach((s, i) => ol.append(html("li", { "data-step": i }, [html("span", { class: `infra-swatch k-${s.kind}` }), html("span", { text: s.text })])));
    stepsBox.append(ol);
  }

  const caption = $("infra-caption");
  function setCaption(text, cls) {
    if (!caption) return;
    caption.textContent = text;
    caption.className = "infra-caption" + (cls ? " " + cls : "");
  }

  function markStep(i, state, reason) {
    const s = current.steps[i];
    if (s) setCaption(state === "blocked" ? `Étape ${i + 1} sur ${current.steps.length} — bloqué : ${reason}` : `Étape ${i + 1} sur ${current.steps.length} — ${s.text}`, state === "blocked" ? "is-blocked" : `k-${s.kind}`);
    stepsBox.querySelectorAll("[data-step]").forEach(li => {
      const k = +li.dataset.step;
      li.classList.toggle("is-current", k === i && state === "run");
      li.classList.toggle("is-blocked", k === i && state === "blocked");
      li.classList.toggle("is-done", k < i);
      const old = li.querySelector(".infra-reason");
      if (old) old.remove();
      if (k === i && state === "blocked") li.append(html("span", { class: "infra-reason", text: reason }));
    });
  }

  // Étiquette du flux : sur le trunk quand le trajet y passe (aucune machine à cet endroit),
  // sinon au milieu du trajet.
  function tagAt(path, pts, text, kind, dy = 0) {
    const len = path.getTotalLength();
    const m = path.getPointAtLength(len * 0.5);
    let p = { x: m.x, y: m.y + dy }, best = -1;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      if (y1 === TRUNK && y2 === TRUNK && Math.abs(x2 - x1) > best) { best = Math.abs(x2 - x1); p = { x: (x1 + x2) / 2, y: TRUNK }; }
    }
    const w = text.length * 6.6 + 16;
    const g = svg("g", { class: `infra-tag k-${kind}` });
    g.append(svg("rect", { x: p.x - w / 2, y: p.y - 11, width: w, height: 22, rx: 11 }));
    g.append(svg("text", { x: p.x, y: p.y + 4, "text-anchor": "middle" }, text));
    return g;
  }

  function play() {
    clearFlows();
    if (!current.steps.length) { stage.classList.add("is-idle"); setCaption(current.intro); return; }
    stage.classList.remove("is-idle");
    const ctx = {};
    let i = 0;

    const next = () => {
      if (i >= current.steps.length) {
        timer = setTimeout(() => { turn++; play(); }, 1400);
        return;
      }
      const step = current.steps[i];
      const r = resolve(step, ctx);
      const shift = step.kind === "sql" && zoneOf(r.from) === zoneOf(r.to) ? 14 : zoneOf(r.from) === zoneOf(r.to) ? -14 : 0;
      let pts = route(r.from, r.to, shift);
      // pfSense arrêté : le flux s'arrête à sa porte, pas à destination
      if (r.reason && !isUp("fw")) {
        const k = pts.findIndex(q => q[0] === FWX && q[1] === FWB + 4);
        if (k > 0) pts = pts.slice(0, k + 1);
      }
      const path = svg("path", { d: toD(pts), class: `infra-flow k-${step.kind}${r.reason ? " is-blocked" : ""}` });
      gFlows.append(path);
      [r.from, r.to].forEach(id => { const n = gNodes.querySelector(`[data-id="${id}"]`); if (n) n.classList.add("is-active"); });

      if (r.reason) {
        const end = path.getPointAtLength(path.getTotalLength());
        gFlows.append(svg("text", { x: end.x - 14, y: end.y - 10, class: "infra-cross" }, "✕"));
        markStep(i, "blocked", r.reason);
        timer = setTimeout(() => { turn++; play(); }, 3200);
        return;
      }
      markStep(i, "run");
      const tag = tagAt(path, pts, step.tag, step.kind, TOP[r.from] ? 22 : 0);
      gFlows.append(tag);
      const len = path.getTotalLength();
      const done = () => { path.classList.add("is-done"); tag.remove(); i++; next(); };

      if (REDUCED) { timer = setTimeout(done, 1500); return; }
      const dot = svg("circle", { r: 6.5, class: `infra-packet k-${step.kind}` });
      const halo = svg("circle", { r: 13, class: `infra-halo k-${step.kind}` });
      gFlows.append(halo, dot);
      const dur = Math.max(750, Math.min(2600, len * 2.3));
      const t0 = performance.now();
      const tick = now => {
        const k = Math.min((now - t0) / dur, 1);
        const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // accélère puis ralentit
        const p = path.getPointAtLength(len * e);
        dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
        halo.setAttribute("cx", p.x); halo.setAttribute("cy", p.y);
        if (k < 1) raf = requestAnimationFrame(tick);
        else { dot.remove(); halo.remove(); done(); }
      };
      raf = requestAnimationFrame(tick);
    };
    next();
  }

  function setScenario(id) {
    current = INFRA.scenarios.find(s => s.id === id) || INFRA.scenarios[0];
    toolbar.querySelectorAll(".chip").forEach(c => {
      const on = c.dataset.id === current.id;
      c.classList.toggle("active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    turn = 0;
    renderSteps();
    play();
  }

  function buildToolbar() {
    INFRA.scenarios.forEach(s => toolbar.append(html("button", { class: "chip", type: "button", "data-id": s.id, "aria-pressed": "false", text: s.label })));
    toolbar.addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) setScenario(b.dataset.id); });
  }

  /* =========================================================
     4. Simulation de panne : état des services
     ========================================================= */
  const statusBox = $("infra-status");
  function services() {
    const u = isUp, g = galeraUp().length, sql = g >= 2;
    return [
      { label: "Site WordPress", ok: u("fw") && u("haproxy") && (u("web1") || u("web2")) && sql,
        why: !u("fw") ? "pfSense arrêté" : !u("haproxy") ? "HAProxy arrêté" : !sql ? "quorum perdu" : !(u("web1") || u("web2")) ? "aucun serveur web" : !(u("web1") && u("web2")) ? "sur un seul serveur web" : "2 serveurs web" },
      { label: "GLPI", ok: u("fw") && u("haproxy") && u("glpi") && sql,
        why: !u("fw") ? "pfSense arrêté" : !u("haproxy") ? "HAProxy arrêté" : !u("glpi") ? "serveur unique arrêté" : !sql ? "quorum perdu" : "1 serveur" },
      { label: "Base de données", ok: sql, why: `${g} nœud${g > 1 ? "s" : ""} sur 3 · ${sql ? "quorum conservé" : "quorum perdu"}` },
      { label: "Administration", ok: u("fw") && u("guac"), why: !u("fw") ? "pfSense arrêté" : !u("guac") ? "bastion arrêté" : "par le bastion" },
      { label: "Ouverture de session", ok: u("fw") && u("adm01"), why: !u("fw") ? "pfSense arrêté" : !u("adm01") ? "annuaire arrêté" : "annuaire joignable" },
    ];
  }
  function renderStatus() {
    statusBox.replaceChildren();
    statusBox.append(html("h3", { text: "État des services" }));
    statusBox.append(html("p", { class: "ha-text", text: down.size
      ? `Panne simulée : ${[...down].map(nameOf).join(", ")}.`
      : "Tout est en service. Ouvrez la fiche d'une machine et simulez sa panne pour voir ce qui tient." }));
    const ul = html("ul", { class: "infra-status" });
    services().forEach(s => ul.append(html("li", { class: s.ok ? "ok" : "ko" }, [
      html("span", { class: "infra-pill", text: s.ok ? "✓ Disponible" : "✕ Coupé" }),
      html("strong", { text: s.label }),
      html("span", { class: "infra-why", text: s.why }),
    ])));
    statusBox.append(ul);
    if (down.size) statusBox.append(html("button", { class: "btn btn-ghost infra-reset", type: "button", id: "infra-reset", text: "Tout remettre en service" }));
  }
  function refreshDown() {
    gNodes.querySelectorAll(".infra-node").forEach(n => n.classList.toggle("is-down", down.has(n.dataset.id)));
    renderStatus();
    turn = 0;
    play();
  }
  statusBox.addEventListener("click", e => { if (e.target.closest("#infra-reset")) { down.clear(); closePop(); refreshDown(); } });

  /* =========================================================
     5. Liens d'accès (fiche + tableau) et question VPN
     ========================================================= */
  function accessOf(n) {
    const list = (n.access || []).slice();
    // Toute machine du labo s'atteint aussi par le bastion (sauf le bastion lui-même)
    if (n.id !== "guac") list.push({ label: `Passer par le bastion`, href: INFRA.bastion.href, scope: "vpn", via: true });
    return list;
  }
  function accessNodes(n, compact) {
    return accessOf(n).map(a => {
      if (a.scope === "vpn") {
        return html("button", {
          class: `btn ${a.via ? "btn-ghost" : "btn-primary"} infra-go`, type: "button",
          "data-href": a.href, "data-label": a.via ? `${INFRA.bastion.label} (pour atteindre ${n.name})` : `${a.label} — ${n.name}`,
          text: a.label + " ↗",
        });
      }
      const value = a.cmd || a.href;
      const row = html("div", { class: "infra-copy" }, [
        html("span", { class: "infra-copy-label", text: a.label }),
        html("button", { class: "cmd", type: "button", "data-copy": value, "aria-label": `Copier ${value}`, text: value }),
      ]);
      if (!compact && (a.note || a.scope === "interne")) row.append(html("span", { class: "infra-copy-note", text: a.note || "Joignable seulement depuis l'intérieur du labo." }));
      return row;
    });
  }

  function buildAccessTable() {
    const body = $("infra-access");
    if (!body) return;
    const groups = [{ title: `Hors VLAN · WAN ${INFRA.wan.net}`, ids: INFRA.nodes.filter(n => !n.zone) },
      ...INFRA.zones.map(z => ({ title: `VLAN ${z.vlan} · ${z.alias} · ${z.net} · passerelle ${z.gw}`, ids: INFRA.nodes.filter(n => n.zone === z.id) }))];
    groups.forEach(g => {
      if (!g.ids.length) return;
      body.append(html("tr", { class: "cat-row" }, html("td", { colspan: "4", text: g.title })));
      g.ids.forEach(n => {
        const open = html("button", { class: "infra-linkbtn", type: "button", "data-open": n.id, text: n.name });
        body.append(html("tr", {}, [
          html("td", {}, [open, html("div", { class: "infra-dns", text: n.dns })]),
          html("td", {}, html("code", { text: n.ip })),
          html("td", { text: n.role }),
          html("td", {}, html("div", { class: "infra-access-cell" }, accessNodes(n, true))),
        ]));
      });
    });
  }

  // --- Question « VPN activé ? » avant toute ouverture d'un lien du labo ---
  const modal = $("vpn-modal");
  let lastFocus = null;
  function askVpn(href, label, trigger) {
    lastFocus = trigger || document.activeElement;
    $("vpn-target-label").textContent = label;
    $("vpn-target-url").textContent = href;
    $("vpn-yes").href = href;
    $("vpn-help").hidden = true;
    modal.inert = false;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    $("vpn-yes").focus();
  }
  function closeVpn() {
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modal.inert = true;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function initVpnModal() {
    modal.inert = true;
    $("vpn-name").textContent = INFRA.vpn.name;
    $("vpn-name-2").textContent = INFRA.vpn.name;
    modal.addEventListener("click", e => {
      if (e.target === modal || e.target.closest(".modal-close")) closeVpn();
      else if (e.target.closest("#vpn-no")) { $("vpn-help").hidden = false; $("vpn-yes").focus(); }
      else if (e.target.closest("#vpn-yes")) setTimeout(closeVpn, 150); // le lien s'ouvre dans un nouvel onglet
    });
    modal.addEventListener("keydown", e => {
      if (e.key !== "Tab") return;
      const f = [...modal.querySelectorAll("a[href], button:not([hidden])")].filter(x => x.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* =========================================================
     6. Fiche d'une machine
     ========================================================= */
  const pop = $("infra-pop");
  let openId = null, opener = null;

  function openPop(id, trigger) {
    const n = byId[id];
    if (!n) return;
    openId = id; opener = trigger || gNodes.querySelector(`[data-id="${id}"]`);
    const z = zoneById[n.zone];
    const isDown = down.has(id);
    pop.replaceChildren(
      html("button", { class: "modal-close", type: "button", "aria-label": "Fermer la fiche", text: "✕" }),
      html("div", { class: "infra-pop-meta", text: z ? `VLAN ${z.vlan} · ${z.alias}` : "Hors VLAN · périmètre" }),
      html("h3", { id: "infra-pop-title", text: n.name }),
      html("div", { class: "infra-pop-ip" }, [html("code", { text: n.ip }), html("span", { text: ` · ${n.dns} · ${n.os}` })]),
      html("p", { class: "ha-text", text: n.role }),
      html("div", { class: "tags" }, [...n.ports.map(p => html("span", { class: "tag", text: p })), n.spof ? html("span", { class: "tag amber", text: "Point unique" }) : null]),
      html("dl", { class: "infra-dl" }, [
        html("dt", { text: "Dépend de" }), html("dd", { text: n.needs }),
        html("dt", { text: "Si elle tombe" }), html("dd", { text: n.down }),
        html("dt", { text: "Ordre de création" }), html("dd", { text: `Étape ${n.order} sur ${INFRA.nodes.length}` }),
      ]),
      html("div", { class: "infra-pop-access" }, accessNodes(n, false)),
      html("button", { class: `btn infra-fail${isDown ? " is-on" : ""}`, type: "button", "data-fail": id, text: isDown ? "Remettre en service" : "Simuler une panne" }),
    );
    // Petit écran : la fiche devient une feuille fixée en bas de la fenêtre. Elle doit alors sortir
    // de la carte, dont le flou d'arrière-plan (backdrop-filter) piégerait le « position: fixed ».
    const small = matchMedia("(max-width: 760px)").matches;
    if (small && pop.parentNode !== document.body) document.body.append(pop);
    if (!small && pop.parentNode !== stage) stage.append(pop);
    pop.hidden = false;
    gNodes.querySelectorAll(".is-open").forEach(x => x.classList.remove("is-open"));
    const g = gNodes.querySelector(`[data-id="${id}"]`);
    if (g) g.classList.add("is-open");
    placePop(id);
    pop.querySelector(".modal-close").focus({ preventScroll: true });
  }

  function placePop(id) {
    pop.style.left = pop.style.top = "";
    if (matchMedia("(max-width: 760px)").matches) return; // petit écran : la fiche est une feuille en bas (CSS)
    const r = SLOT[id];
    const onLeft = cx(r) < W / 2;
    pop.style.left = (onLeft ? stage.clientWidth - pop.offsetWidth - 12 : 12) + "px";
    pop.style.top = "12px";
  }

  function closePop() {
    if (pop.hidden) return;
    pop.hidden = true;
    openId = null;
    gNodes.querySelectorAll(".is-open").forEach(x => x.classList.remove("is-open"));
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  }

  /* =========================================================
     7. Ordre de mise en place
     ========================================================= */
  function buildOrder() {
    const box = $("infra-order");
    if (!box) return;
    INFRA.order.forEach(o => {
      const inner = [html("span", { class: "infra-order-n", text: String(o.n) }), html("strong", { text: o.title }), html("span", { class: "infra-order-why", text: o.why })];
      box.append(o.node
        ? html("li", {}, html("button", { class: "infra-order-item", type: "button", "data-open": o.node, "data-scroll": "1" }, inner))
        : html("li", {}, html("div", { class: "infra-order-item is-static" }, inner)));
    });
  }

  /* =========================================================
     Événements
     ========================================================= */
  function copy(btn) {
    const done = () => { btn.classList.add("copied"); setTimeout(() => btn.classList.remove("copied"), 1400); };
    if (navigator.clipboard) navigator.clipboard.writeText(btn.dataset.copy).then(done, () => {});
  }

  function initEvents() {
    gNodes.addEventListener("click", e => {
      const g = e.target.closest(".infra-node");
      if (g) (openId === g.dataset.id ? closePop() : openPop(g.dataset.id, g));
    });
    gNodes.addEventListener("keydown", e => {
      const g = e.target.closest(".infra-node");
      if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openPop(g.dataset.id, g); }
    });
    pop.addEventListener("click", e => {
      if (e.target.closest(".modal-close")) return closePop();
      const fail = e.target.closest("[data-fail]");
      if (fail) {
        const id = fail.dataset.fail;
        down.has(id) ? down.delete(id) : down.add(id);
        refreshDown();
        openPop(id, opener);
      }
    });
    document.addEventListener("click", e => {
      const go = e.target.closest(".infra-go");
      if (go) return askVpn(go.dataset.href, go.dataset.label, go);
      const c = e.target.closest("[data-copy]");
      if (c) return copy(c);
      const o = e.target.closest("[data-open]");
      if (o) {
        // Ramène le schéma juste sous le menu, puis centre la machine si le schéma défile (petit écran)
        const navH = (document.querySelector(".nav") || {}).offsetHeight || 64;
        window.scrollTo({ top: stage.getBoundingClientRect().top + scrollY - navH - 16, behavior: REDUCED ? "auto" : "smooth" });
        const r = SLOT[o.dataset.open];
        if (r) scroller.scrollLeft = cx(r) * (root.clientWidth / W) - scroller.clientWidth / 2;
        return openPop(o.dataset.open, o);
      }
      // clic en dehors de la fiche : on la ferme
      if (!pop.hidden && !e.target.closest("#infra-pop") && !e.target.closest(".infra-node") && !modal.contains(e.target)) closePop();
    });
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (modal.classList.contains("open")) closeVpn(); else closePop();
    });
    addEventListener("resize", () => { if (openId) placePop(openId); });
    // Le flux ne tourne pas quand l'onglet est caché
    document.addEventListener("visibilitychange", () => { document.hidden ? clearFlows() : play(); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    drawStatic();
    buildToolbar();
    buildAccessTable();
    buildOrder();
    initVpnModal();
    initEvents();
    renderStatus();
    setScenario(INFRA.scenarios[0].id);
    const count = $("infra-count");
    if (count) count.textContent = String(INFRA.nodes.length);
  });
})();
