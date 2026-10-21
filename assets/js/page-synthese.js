/* =========================================================
   page-synthese.js — tableau de synthèse E5
   Tout est calculé à partir de synthese-data.js :
   couverture par compétence, sous-compétences manquantes,
   tableau officiel, filtres.
   ========================================================= */
(() => {
  const ALL_ITEMS = COMPETENCES_B1.flatMap(c => c.items.map(i => ({ ...i, groupe: c.code })));
  const count = code => REALISATIONS.filter(r => r.comp.includes(code)).length;
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  let filtre = null; // { type: "groupe" | "item", code }

  /* ---------- En-tête candidat ---------- */
  function renderCandidat() {
    const box = document.getElementById("syn-candidat");
    [["Candidat", SYNTHESE_CANDIDAT.nom], ["Option", SYNTHESE_CANDIDAT.option],
     ["Centre de formation", SYNTHESE_CANDIDAT.centre], ["Formation", SYNTHESE_CANDIDAT.formation]]
      .forEach(([k, v]) => {
        const d = el("div");
        d.append(el("small", null, k), el("strong", null, v));
        box.append(d);
      });
  }

  /* ---------- Indicateurs globaux ---------- */
  function renderKpis() {
    const couverts = ALL_ITEMS.filter(i => count(i.code) > 0).length;
    const pct = Math.round((couverts / ALL_ITEMS.length) * 100);
    const kpis = [
      [`${pct} %`, "des sous-compétences couvertes"],
      [`${couverts} / ${ALL_ITEMS.length}`, "sous-compétences mobilisées"],
      [String(REALISATIONS.length), "réalisations"],
      [String(REALISATIONS.filter(r => r.modalite !== "formation").length), "en milieu professionnel"],
    ];
    const box = document.getElementById("syn-kpis");
    kpis.forEach(([v, l]) => {
      const d = el("div", "syn-kpi");
      d.append(el("strong", null, v), el("span", null, l));
      box.append(d);
    });
    const manquants = ALL_ITEMS.filter(i => count(i.code) === 0);
    const gaps = document.getElementById("syn-gaps");
    if (!manquants.length) {
      gaps.append(el("p", "syn-ok", "✅ Toutes les sous-compétences du bloc 1 sont couvertes."));
      return;
    }
    gaps.append(el("h3", null, `⚠️ ${manquants.length} sous-compétence${manquants.length > 1 ? "s" : ""} à couvrir`));
    const ul = el("ul");
    manquants.forEach(i => {
      const li = el("li");
      li.append(el("code", null, i.code), document.createTextNode(" " + i.label));
      ul.append(li);
    });
    gaps.append(ul);
  }

  /* ---------- Cartes par compétence ---------- */
  function renderCartes() {
    const box = document.getElementById("syn-cartes");
    COMPETENCES_B1.forEach(c => {
      const couverts = c.items.filter(i => count(i.code) > 0).length;
      const card = el("button", "syn-card");
      card.type = "button";
      card.dataset.groupe = c.code;
      card.append(el("span", "syn-code", "B" + c.code), el("h4", null, c.titre));
      const bar = el("div", "syn-bar");
      const fill = el("span");
      fill.style.width = (couverts / c.items.length) * 100 + "%";
      if (couverts === c.items.length) fill.classList.add("full");
      bar.append(fill);
      card.append(bar, el("p", "syn-count", `${couverts} / ${c.items.length} sous-compétences`));
      const ul = el("ul");
      c.items.forEach(i => {
        const n = count(i.code);
        const li = el("li", n ? "on" : "off");
        li.append(el("span", "syn-dot", n ? "✓" : "○"), document.createTextNode(i.label));
        li.title = n ? `${n} réalisation${n > 1 ? "s" : ""}` : "Aucune réalisation";
        ul.append(li);
      });
      card.append(ul);
      card.addEventListener("click", () => setFiltre({ type: "groupe", code: c.code }));
      box.append(card);
    });
  }

  /* ---------- Tableau officiel ---------- */
  function renderTableau() {
    const table = document.getElementById("syn-table");
    const thead = el("thead");
    const r1 = el("tr"), r2 = el("tr");
    const th0 = el("th", "syn-th-real", "Réalisations professionnelles");
    th0.rowSpan = 2;
    r1.append(th0);
    COMPETENCES_B1.forEach((c, gi) => {
      const th = el("th", "syn-th-group g" + (gi % 2), "B" + c.code);
      th.colSpan = c.items.length;
      th.title = c.titre;
      r1.append(th);
      c.items.forEach(i => {
        const t = el("th", "syn-th-item g" + (gi % 2), i.code.split(".").pop());
        t.title = `${i.code} — ${i.label}`;
        t.dataset.item = i.code;
        t.tabIndex = 0;
        t.addEventListener("click", () => setFiltre({ type: "item", code: i.code }));
        t.addEventListener("keydown", e => { if (e.key === "Enter") setFiltre({ type: "item", code: i.code }); });
        r2.append(t);
      });
    });
    thead.append(r1, r2);

    const tbody = el("tbody");
    Object.entries(MODALITES).forEach(([mod, libelle]) => {
      const rows = REALISATIONS.filter(r => r.modalite === mod);
      if (!rows.length) return;
      const sec = el("tr", "syn-section");
      const td = el("td", null, libelle);
      td.colSpan = ALL_ITEMS.length + 1;
      sec.append(td);
      tbody.append(sec);
      rows.forEach(r => {
        const tr = el("tr", "syn-row");
        tr.dataset.comp = r.comp.join(" ");
        const cell = el("td", "syn-real");
        cell.append(el("strong", null, r.titre), el("span", "syn-periode", r.periode));
        if (r.productions.length) {
          const links = el("span", "syn-links");
          r.productions.forEach(p => {
            const a = el("a", null, p.label);
            a.href = p.href;
            if (/^https?:/.test(p.href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
            links.append(a);
          });
          cell.append(links);
        } else {
          cell.append(el("span", "syn-todo", "Fiche à publier"));
        }
        tr.append(cell);
        COMPETENCES_B1.forEach((c, gi) => c.items.forEach(i => {
          const on = r.comp.includes(i.code);
          const td = el("td", "syn-cell g" + (gi % 2) + (on ? " on" : ""), on ? "✓" : "");
          td.dataset.item = i.code;
          if (on) td.title = `${i.code} — ${i.label}`;
          tr.append(td);
        }));
        tbody.append(tr);
      });
    });

    const tfoot = el("tfoot");
    const tot = el("tr");
    tot.append(el("td", "syn-real", "Nombre de réalisations"));
    ALL_ITEMS.forEach((i, idx) => {
      const gi = COMPETENCES_B1.findIndex(c => c.code === i.groupe);
      const n = count(i.code);
      tot.append(el("td", "syn-cell g" + (gi % 2) + (n ? "" : " zero"), String(n)));
    });
    tfoot.append(tot);
    table.append(thead, tbody, tfoot);
  }

  /* ---------- Légende des 22 sous-compétences ---------- */
  function renderLegende() {
    const box = document.getElementById("syn-legende");
    COMPETENCES_B1.forEach(c => {
      const bloc = el("div", "syn-leg-bloc");
      bloc.append(el("h4", null, `B${c.code} · ${c.titre}`));
      const ul = el("ul");
      c.items.forEach(i => {
        const n = count(i.code);
        const li = el("li", n ? "" : "off");
        li.append(el("code", null, i.code), el("span", null, i.label), el("em", null, n ? `×${n}` : "—"));
        ul.append(li);
      });
      bloc.append(ul);
      box.append(bloc);
    });
  }

  /* ---------- Filtres ---------- */
  function setFiltre(f) {
    filtre = filtre && f && filtre.type === f.type && filtre.code === f.code ? null : f;
    const rows = document.querySelectorAll(".syn-row");
    const info = document.getElementById("syn-filtre");
    document.querySelectorAll(".syn-card").forEach(c =>
      c.classList.toggle("active", !!filtre && filtre.type === "groupe" && c.dataset.groupe === filtre.code));
    document.querySelectorAll("[data-item]").forEach(n =>
      n.classList.toggle("hl", !!filtre && (filtre.type === "item" ? n.dataset.item === filtre.code : n.dataset.item.startsWith(filtre.code + "."))));
    if (!filtre) {
      rows.forEach(r => (r.hidden = false));
      info.hidden = true;
      return;
    }
    let shown = 0;
    rows.forEach(r => {
      const codes = r.dataset.comp.split(" ");
      const ok = filtre.type === "item" ? codes.includes(filtre.code) : codes.some(c => c.startsWith(filtre.code + "."));
      r.hidden = !ok;
      if (ok) shown++;
    });
    const label = filtre.type === "item"
      ? `${filtre.code} — ${ALL_ITEMS.find(i => i.code === filtre.code).label}`
      : `B${filtre.code} — ${COMPETENCES_B1.find(c => c.code === filtre.code).titre}`;
    info.hidden = false;
    info.querySelector("span").textContent = `${shown} réalisation${shown > 1 ? "s" : ""} pour ${label}`;
    document.getElementById("syn-tableau").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelector("#syn-filtre button").addEventListener("click", () => setFiltre(null));
  renderCandidat();
  renderKpis();
  renderCartes();
  renderTableau();
  renderLegende();
})();
