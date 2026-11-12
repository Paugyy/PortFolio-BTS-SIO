/* =========================================================
   page-procedures.js — catalogue des procédures (/procedures)
   Les données viennent de procedures-data.js (généré par tools/build_procedures.py)
   ========================================================= */
(function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DOSSIER = "/assets/docs/procedures/";
  const lecture = mots => Math.max(1, Math.round(mots / 200));
  const numero = p => (p.groupe === "labo" && /^mo-(\d+)/.test(p.id)) ? "MO-" + Number(p.id.match(/^mo-(\d+)/)[1]) : (p.groupe === "labo" ? "Labo" : "Guide");

  // Chiffres clés + archive
  const labo = PROCEDURES.filter(p => p.groupe === "labo").length;
  const kpis = [[PROCEDURES.length, "procédures"], [labo, "de mon labo"], [PROCEDURES.length * 2, "fichiers à télécharger"]];
  document.getElementById("pr-kpis").innerHTML = kpis.map(([n, l]) => `<div class="pr-kpi"><strong>${n}</strong><span>${l}</span></div>`).join("");
  document.getElementById("pr-zip-size").textContent = `(ZIP, ${(PROCEDURES_ZIP_KO / 1024).toFixed(1).replace(".", ",")} Mo · PDF + Markdown)`;

  function carte(p) {
    const fichier = DOSSIER + p.id;
    const meta = [`${p.sections.length} partie${p.sections.length > 1 ? "s" : ""}`, `≈ ${lecture(p.mots)} min de lecture`].join(" · ");
    return `
      <article class="card pr-card" data-theme="${esc(p.theme)}" data-texte="${esc((p.titre + " " + p.resume + " " + p.theme + " " + p.sections.join(" ")).toLowerCase())}">
        <div class="pr-card-head">
          <span class="pr-icon" aria-hidden="true">${p.icon}</span>
          <div><div class="pr-num">${numero(p)} · ${esc(p.theme)}</div></div>
        </div>
        <h3><a href="/procedure?id=${p.id}">${esc(p.titre.replace(/^MO-\d+\s+—\s+/, ""))}</a></h3>
        <p>${esc(p.resume)}</p>
        <div class="pr-meta">${meta}</div>
        <div class="pr-actions">
          <a class="pr-btn main" href="/procedure?id=${p.id}">📖 Consulter</a>
          ${p.pdfKo ? `<a class="pr-btn" href="${fichier.replace(DOSSIER, DOSSIER + "pdf/")}.pdf" download>⬇ PDF <small>${p.pdfKo} Ko</small></a>` : ""}
          <a class="pr-btn" href="${fichier}.md" download>⬇ Markdown</a>
        </div>
      </article>`;
  }

  ["labo", "guide"].forEach(g => {
    document.getElementById("pr-" + g).innerHTML = PROCEDURES.filter(p => p.groupe === g).map(carte).join("");
  });

  // Filtres par thème + recherche
  const themes = ["Toutes", ...new Set(PROCEDURES.map(p => p.theme))];
  const filtres = document.getElementById("pr-filters");
  filtres.innerHTML = themes.map((t, i) => `<button class="chip ${i ? "" : "active"}" data-theme="${esc(t)}">${esc(t)}</button>`).join("");
  const recherche = document.getElementById("pr-search");
  let theme = "Toutes";

  function appliquer() {
    const q = recherche.value.toLowerCase().trim();
    let total = 0;
    ["labo", "guide"].forEach(g => {
      let n = 0;
      document.querySelectorAll(`#pr-${g} .pr-card`).forEach(c => {
        const ok = (theme === "Toutes" || c.dataset.theme === theme) && (!q || c.dataset.texte.includes(q));
        c.hidden = !ok;
        if (ok) n++;
      });
      document.getElementById("groupe-" + g).hidden = n === 0;
      document.getElementById("pr-count-" + g).textContent = `${n} procédure${n > 1 ? "s" : ""}`;
      total += n;
    });
    document.getElementById("pr-empty").hidden = total > 0;
  }

  filtres.addEventListener("click", e => {
    const b = e.target.closest(".chip");
    if (!b) return;
    filtres.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === b));
    theme = b.dataset.theme;
    appliquer();
  });
  recherche.addEventListener("input", appliquer);

  // Lien direct vers un thème : /procedures?theme=Supervision%20et%20journaux
  const demande = new URLSearchParams(location.search).get("theme");
  const bouton = demande && [...filtres.querySelectorAll(".chip")].find(c => c.dataset.theme === demande);
  if (bouton) bouton.click(); else appliquer();
})();
