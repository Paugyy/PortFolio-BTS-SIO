# Portfolio BTS SIO — Yannis Paugy

Portfolio réalisé en HTML / CSS / JavaScript (sans framework), hébergé sur **GitHub Pages**.

🌐 **En ligne :** https://paugy.org

## Pages
| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : présentation, compétences, parcours |
| `entreprise.html` | Projets réalisés en alternance |
| `ecole.html` | Projets réalisés en BTS SIO |
| `projet-ha.html` | Fiche détaillée du projet haute disponibilité (architecture, tests, incidents ; liens vers ses procédures) |
| `infra.html` | Schéma interactif de l'infrastructure : flux animés, fiche et accès de chaque machine, simulation de panne |
| `procedures.html` | **Procédures** : catalogue (filtres par thème, recherche), téléchargement PDF / Markdown / ZIP |
| `procedure.html` | Lecture d'une procédure : `/procedure?id=<id>` (sommaire, bouton Copier, précédente / suivante) |
| `ressources.html` | Menu « Commandes » : aide-mémoire Linux / Windows / Cisco / Docker / Git |
| `cv.html` | CV en HTML (imprimable en PDF) |
| `contact.html` | Coordonnées + formulaire (envoi par e-mail via FormSubmit) |

## Modifier le contenu
- **Ajouter un projet** → `assets/js/data.js` (copier un bloc `{ ... }`) ; plusieurs boutons possibles avec `links: [{ href, label }]`
- **Menu, liens GitHub/LinkedIn** → haut de `assets/js/main.js` (objet `SITE`)
- **Ajouter une commande** → `assets/js/page-ressources.js`, objet `CMDS`
- **Procédures** → voir la section ci-dessous
- **Couleurs** → variables en haut de `assets/css/style.css`
- **Schéma interactif** (`/infra`) → tout est dans `assets/js/infra-data.js` : machines, IP, liens d'accès, scénarios de flux. La page demande « le VPN est-il activé ? » avant d'ouvrir une adresse du labo ; elle ne teste rien elle-même.

## Procédures (PDF, Markdown, ZIP)
Tout est généré par `tools/build_procedures.py` à partir de fichiers Markdown :
- **modes opératoires du labo** (MO-1 à MO-10, plan de tests, dépannage) : recopiés depuis mon dossier E6, liens réécrits ;
- **guides de base** : écrits directement dans `assets/docs/procedures/guide-*.md`.

```bash
python -m pip install markdown           # une seule fois
python tools/build_procedures.py         # régénère HTML, PDF (Edge sans interface), catalogue et ZIP
```
Ajouter une procédure : créer `assets/docs/procedures/<id>.md` (titre en `# …`), ajouter une ligne dans `CATALOGUE` en haut du script, relancer.
Ne jamais modifier `assets/js/procedures-data.js` à la main, ni les dossiers `html/` et `pdf/` (fichiers générés).

## Formulaire de contact
Il utilise [FormSubmit](https://formsubmit.co) (gratuit, sans compte).
⚠️ Au **premier envoi**, FormSubmit envoie un e-mail de confirmation à `yapaugy@gmail.com` : il faut cliquer sur le lien pour activer le formulaire.

## Tester en local
Ouvrir `index.html` dans un navigateur, ou : `python -m http.server 8000` puis http://localhost:8000

## Design 3D « Réseau »
- Styles du thème : `assets/css/theme.css` (chargé après `style.css`) ; scène 3D : `assets/js/scene.js` + `scene-base.js` ; Three.js r160 servi en local dans `assets/vendor/` (compatible avec la CSP `script-src 'self'`).
- Variantes et outil de prévisualisation : dossier local `~/portfolio-themes` (thèmes 8081 / 8082 / 8083).

### Revenir instantanément à l'ancien design
L'ancien design est sauvegardé dans la branche `backup/design-original` (et le tag `backup-design-original`) :
```bash
git restore --source=backup-design-original --staged --worktree -- .   # tous les fichiers = ancien design (fichiers du thème supprimés)
git commit -m "revert: retour au design original" && git push
```
En ligne en ~1 minute (GitHub Pages). Pour remettre le thème 3D ensuite : `git revert HEAD` puis `git push`.
