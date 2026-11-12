/* =========================================================
   page-procedure.js — lecture d'une procédure (/procedure?id=...)
   Le contenu est un fragment HTML généré par tools/build_procedures.py
   ========================================================= */
(async function () {
  const DOSSIER = "/assets/docs/procedures/";
  const id = new URLSearchParams(location.search).get("id");
  const liste = [...PROCEDURES].sort((a, b) => a.ordre - b.ordre);
  const i = liste.findIndex(p => p.id === id);           // seul un id du catalogue est accepté
  const $ = s => document.getElementById(s);
  const doc = $("pd-doc");

  if (i < 0) {
    $("pd-titre").textContent = "Procédure introuvable";
    $("pd-crumb").textContent = "introuvable";
    $("pd-resume").textContent = "Ce lien ne correspond à aucune procédure.";
    $("pd-actions").innerHTML = '<a class="pr-btn main" href="/procedures">← Toutes les procédures</a>';
    $("pd-toc").hidden = true;
    doc.hidden = true;
    return;
  }

  const p = liste[i];
  const groupe = p.groupe === "labo" ? "Mon infrastructure haute disponibilité" : "Guide de base";
  document.title = `${p.titre} — Procédures — Yannis Paugy`;
  $("pd-crumb").textContent = p.titre;
  $("pd-kicker").textContent = `${p.icon} ${groupe} · ${p.theme}`;
  $("pd-titre").textContent = p.titre;
  $("pd-resume").textContent = p.resume;

  const actions = $("pd-actions");
  const bouton = (href, texte, classe, telecharger) => {
    const a = document.createElement("a");
    a.className = "pr-btn" + (classe ? " " + classe : "");
    a.href = href;
    a.textContent = texte;
    if (telecharger) a.setAttribute("download", "");
    actions.append(a);
    return a;
  };
  if (p.pdfKo) bouton(`${DOSSIER}pdf/${p.id}.pdf`, `⬇ Télécharger le PDF (${p.pdfKo} Ko)`, "main", true);
  bouton(`${DOSSIER}${p.id}.md`, "⬇ Markdown", "", true);
  const imprimer = bouton("#", "🖨 Imprimer");
  imprimer.addEventListener("click", e => { e.preventDefault(); window.print(); });
  bouton("/procedures", "← Toutes les procédures");

  try {
    const r = await fetch(`${DOSSIER}html/${p.id}.html?v=${encodeURIComponent(PROCEDURES_MAJ)}`);
    if (!r.ok) throw new Error(r.status);
    doc.innerHTML = await r.text();     // fichier généré par le script du site, jamais une saisie de visiteur
  } catch {
    doc.innerHTML = `<p>Le contenu n'a pas pu être chargé. Tu peux <a href="${DOSSIER}pdf/${p.id}.pdf">ouvrir le PDF</a>.</p>`;
  }

  // Sommaire à partir des titres de niveau 2
  const titres = [...doc.querySelectorAll("h2[id]")];
  const toc = $("pd-toc-list");
  titres.forEach(h => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#" + h.id;
    a.textContent = h.textContent;
    li.append(a);
    toc.append(li);
  });
  if (titres.length < 2) $("pd-toc").hidden = true;
  const liens = toc.querySelectorAll("a");
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) liens.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-20% 0px -70% 0px" });
  titres.forEach(h => io.observe(h));

  // Bouton « Copier » sur chaque bloc de commandes
  doc.querySelectorAll("pre").forEach(pre => {
    const b = document.createElement("button");
    b.className = "copy";
    b.type = "button";
    b.textContent = "Copier";
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(pre.querySelector("code")?.innerText ?? pre.innerText); b.textContent = "Copié ✓"; }
      catch { b.textContent = "Échec"; }
      setTimeout(() => (b.textContent = "Copier"), 1500);
    });
    pre.append(b);
  });

  // Ancre demandée dans l'URL (le contenu arrive après le chargement de la page)
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();

  // Précédente / suivante
  const nav = $("pd-nav");
  const lien = (q, sens) => q ? `<a class="card ${sens}" href="/procedure?id=${q.id}"><small>${sens === "prev" ? "← Précédente" : "Suivante →"}</small><span>${q.icon} ${q.titre.replace(/[<>&]/g, "")}</span></a>` : "<span></span>";
  nav.innerHTML = lien(liste[i - 1], "prev") + lien(liste[i + 1], "next");
})();
