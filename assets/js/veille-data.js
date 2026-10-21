/* =========================================================
   veille-data.js — veille technologique
   ➜ Ajouter une synthèse : copier un bloc dans VEILLE_ARTICLES
     (le plus récent en premier). La page se met à jour seule.
   ========================================================= */

const VEILLE_SUJET = {
  titre: "Sécurité des navigateurs : les extensions malveillantes",
  question: "Comment protéger un parc de postes contre les extensions de navigateur malveillantes, alors que même les magasins officiels en distribuent ?",
  contexte: "Chez Santé BTP Normandie, je gère les navigateurs du parc avec le browser management de NinjaOne : filtrage des sites indésirables (en complément d'Orange Cyberdefense) et blocage des extensions non vérifiées ou suspectes. Cette veille me sert à savoir quoi bloquer, et pourquoi.",
};

const VEILLE_SOURCES = [
  { nom: "CERT-FR", type: "Institutionnelle", url: "https://www.cert.ssi.gouv.fr/", pourquoi: "Alertes et avis officiels sur les vulnérabilités" },
  { nom: "ANSSI — cyber.gouv.fr", type: "Institutionnelle", url: "https://cyber.gouv.fr/", pourquoi: "Guides et recommandations de sécurité" },
  { nom: "IT-Connect", type: "Spécialisée FR", url: "https://www.it-connect.fr/", pourquoi: "Actualités et tutoriels d'administration systèmes" },
  { nom: "CyberVeille", type: "Spécialisée FR", url: "https://cyberveille.ch/", pourquoi: "Résumés en français des rapports de chercheurs" },
  { nom: "BleepingComputer", type: "Internationale", url: "https://www.bleepingcomputer.com/", pourquoi: "Actualité des menaces, très réactive" },
  { nom: "Socket — Threat Research", type: "Chercheurs", url: "https://socket.dev/blog", pourquoi: "Découvertes de campagnes d'extensions malveillantes" },
  { nom: "Akamai — Security Research", type: "Chercheurs", url: "https://www.akamai.com/blog/security-research", pourquoi: "Analyses techniques des extensions et du navigateur" },
];

const VEILLE_METHODE = [
  { etape: "Collecter", detail: "Les flux RSS des sources sont regroupés dans Inoreader, avec des mots-clés : « extension », « Chrome Web Store », « Edge Add-ons »." },
  { etape: "Trier", detail: "Je garde ce qui touche les navigateurs du parc (Chrome, Edge) et ce qui donne des identifiants d'extensions à bloquer." },
  { etape: "Synthétiser", detail: "Chaque article retenu donne une fiche datée : les faits, puis ce que ça change pour le parc." },
  { etape: "Appliquer", detail: "Les enseignements alimentent la politique de navigateurs dans NinjaOne." },
];

const VEILLE_ARTICLES = [
  {
    date: "2026-10-06",
    titre: "MalExt : une base ouverte de près de 7 000 extensions malveillantes",
    source: "IT-Connect",
    url: "https://www.it-connect.tech/malext-open-source-database-lists-nearly-7000-malicious-chrome-extensions/",
    tags: ["Outil", "Liste de blocage"],
    resume: "Un projet open source recense les extensions Chrome et Edge retirées des magasins ou signalées par des chercheurs : environ 7 000 entrées, avec leur identifiant, le motif et la date. La base existe en CSV, JSON et formats de partage de menaces, et un script analyse les profils de navigateur d'un poste.",
    impact: "Une source directement exploitable pour vérifier les identifiants d'extensions présents sur le parc. L'auteur rappelle toutefois que détecter ne remplace pas prévenir : il recommande d'interdire par défaut et de n'autoriser que les extensions validées.",
  },
  {
    date: "2026-09-30",
    titre: "32 extensions « de productivité » pilotées à distance",
    source: "Akamai Security Research",
    url: "https://www.akamai.com/blog/security-research/when-productivity-extensions-become-attack-platforms",
    tags: ["Campagne", "Permissions"],
    resume: "Des chercheurs décrivent 32 extensions présentées comme des outils de productivité (notes, compteurs de texte, améliorations YouTube). Leur comportement est défini par un fichier de configuration hébergé à l'extérieur : l'attaquant peut le modifier sans repasser par la vérification du magasin. Elles demandent l'accès à tous les sites pour observer et rediriger la navigation.",
    impact: "Une extension peut sembler inoffensive lors de sa vérification puis changer de comportement plus tard. Les permissions demandées sont le meilleur indice : un bloc-notes n'a aucune raison de lire tous les sites visités.",
  },
  {
    date: "2026-08-27",
    titre: "Campagne « Superior » : des extensions rachetées puis piégées",
    source: "Socket, relayé par CyberVeille",
    url: "https://cyberveille.ch/posts/2026-09-01-19-extensions-chrome-edge-malveillantes-delivrent-un-wallet-drainer-et-volent-des-identifiants/",
    tags: ["Campagne", "Mise à jour piégée"],
    resume: "19 extensions Chrome et Edge publient d'abord une version saine, puis une mise à jour malveillante. Cinq d'entre elles ont été rachetées à des développeurs légitimes. Elles volent des portefeuilles de cryptomonnaie, des identifiants et le contenu des formulaires ; la plus diffusée comptait environ 80 000 utilisateurs.",
    impact: "Une extension autorisée hier peut devenir dangereuse demain, sans action de l'utilisateur. La liste des extensions autorisées doit être revue régulièrement, en surveillant les changements d'éditeur.",
  },
  {
    date: "2026-04-14",
    titre: "Plus de 100 extensions du Chrome Web Store volent des comptes",
    source: "BleepingComputer",
    url: "https://www.bleepingcomputer.com/news/security/over-100-chrome-extensions-in-web-store-target-users-accounts-and-data/",
    tags: ["Campagne", "Vol de comptes"],
    resume: "Plus d'une centaine d'extensions, publiées sous cinq noms d'éditeurs mais reliées à la même infrastructure, récupèrent des jetons de connexion Google et détournent des sessions Telegram Web. Une partie contient une porte dérobée qui exécute des commandes au démarrage du navigateur. Au moment de l'article, la plupart étaient encore disponibles sur le magasin.",
    impact: "Être sur le Chrome Web Store ne garantit pas qu'une extension est sûre, et le retrait peut prendre du temps. Il faut comparer les extensions installées aux listes d'identifiants publiées par les chercheurs.",
  },
];

const VEILLE_BILAN = [
  "Les magasins officiels ne suffisent pas : des extensions malveillantes y restent plusieurs semaines.",
  "Le danger arrive souvent après l'installation : rachat de l'extension, mise à jour piégée, configuration modifiée à distance.",
  "Une liste noire a toujours un temps de retard. Ce qui protège vraiment : n'autoriser que les extensions validées, contrôler leurs permissions et revoir la liste régulièrement.",
];
