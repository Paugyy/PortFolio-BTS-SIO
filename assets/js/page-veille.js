/* =========================================================
   page-veille.js — rend la page veille depuis veille-data.js
   ========================================================= */
(() => {
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const link = (href, text) => {
    const a = el("a", null, text);
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  };
  const fmt = iso => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  /* Sujet */
  document.getElementById("vt-titre").textContent = VEILLE_SUJET.titre;
  document.getElementById("vt-question").textContent = VEILLE_SUJET.question;
  document.getElementById("vt-contexte").textContent = VEILLE_SUJET.contexte;

  /* Indicateurs */
  const dates = VEILLE_ARTICLES.map(a => a.date).sort();
  const kpis = [
    [String(VEILLE_ARTICLES.length), "synthèses publiées"],
    [String(VEILLE_SOURCES.length), "sources suivies"],
    [dates.length ? fmt(dates[dates.length - 1]) : "—", "dernière synthèse"],
  ];
  const kbox = document.getElementById("vt-kpis");
  kpis.forEach(([v, l]) => {
    const d = el("div", "vt-kpi");
    d.append(el("strong", null, v), el("span", null, l));
    kbox.append(d);
  });

  /* Méthode */
  const mbox = document.getElementById("vt-methode");
  VEILLE_METHODE.forEach((m, i) => {
    const d = el("div", "vt-step");
    d.append(el("span", "vt-num", String(i + 1)), el("h4", null, m.etape), el("p", null, m.detail));
    mbox.append(d);
  });

  /* Sources */
  const sbody = document.getElementById("vt-sources");
  VEILLE_SOURCES.forEach(s => {
    const tr = el("tr");
    const td1 = el("td");
    td1.append(link(s.url, s.nom));
    tr.append(td1, el("td", null, s.type), el("td", null, s.pourquoi));
    sbody.append(tr);
  });

  /* Synthèses + filtres par étiquette */
  const tags = [...new Set(VEILLE_ARTICLES.flatMap(a => a.tags))];
  const fbox = document.getElementById("vt-filtres");
  const abox = document.getElementById("vt-articles");
  let actif = null;

  function renderArticles() {
    abox.textContent = "";
    VEILLE_ARTICLES
      .filter(a => !actif || a.tags.includes(actif))
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach(a => {
        const card = el("article", "card vt-article");
        const head = el("div", "vt-meta");
        const t = el("time", null, fmt(a.date));
        t.dateTime = a.date;
        head.append(t, el("span", null, "· " + a.source));
        const tg = el("div", "tags");
        a.tags.forEach(x => tg.append(el("span", "tag", x)));
        card.append(head, el("h3", null, a.titre), el("p", "vt-resume", a.resume));
        const imp = el("div", "vt-impact");
        imp.append(el("strong", null, "Ce que j'en retiens pour le parc"), el("p", null, a.impact));
        const foot = el("p", "vt-lien");
        foot.append(link(a.url, "Lire l'article source ↗"));
        card.append(imp, tg, foot);
        abox.append(card);
      });
  }

  ["Toutes", ...tags].forEach(t => {
    const b = el("button", "vt-filtre" + (t === "Toutes" ? " active" : ""), t);
    b.type = "button";
    b.addEventListener("click", () => {
      actif = t === "Toutes" ? null : t;
      fbox.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
      renderArticles();
    });
    fbox.append(b);
  });
  renderArticles();

  /* Bilan */
  const bbox = document.getElementById("vt-bilan");
  VEILLE_BILAN.forEach(b => bbox.append(el("li", null, b)));
})();
