# Portfolio BTS SIO — Yannis Paugy

Portfolio réalisé en HTML / CSS / JavaScript (sans framework), hébergé sur **GitHub Pages**.

🌐 **En ligne :** https://paugy.org

## Pages
| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : présentation, compétences, parcours |
| `entreprise.html` | Projets réalisés en alternance |
| `ecole.html` | Projets réalisés en BTS SIO |
| `ressources.html` | Commandes Linux / Windows / Cisco / Docker / Git + procédures (pfSense, Guacamole, AD…) |
| `cv.html` | CV en HTML (imprimable en PDF) |
| `contact.html` | Coordonnées + formulaire (envoi par e-mail via FormSubmit) |

## Modifier le contenu
- **Ajouter un projet** → `assets/js/data.js` (copier un bloc `{ ... }`)
- **Menu, liens GitHub/LinkedIn** → haut de `assets/js/main.js` (objet `SITE`)
- **Ajouter une commande** → `ressources.html`, objet `CMDS`
- **Couleurs** → variables en haut de `assets/css/style.css`

## Formulaire de contact
Il utilise [FormSubmit](https://formsubmit.co) (gratuit, sans compte).
⚠️ Au **premier envoi**, FormSubmit envoie un e-mail de confirmation à `yapaugy@gmail.com` : il faut cliquer sur le lien pour activer le formulaire.

## Tester en local
Ouvrir `index.html` dans un navigateur, ou : `python -m http.server 8000` puis http://localhost:8000
