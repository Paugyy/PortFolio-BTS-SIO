/* =========================================================
   veille-data.js — veille technologique
   ➜ Ajouter une synthèse : copier un bloc dans VEILLE_ARTICLES
     (le plus récent en premier). La page se met à jour seule.
   ========================================================= */

const VEILLE_SUJET = {
  titre: "Sécurité des navigateurs : les extensions malveillantes",
  question: "Comment protéger un parc de postes contre les extensions de navigateur malveillantes, alors que même les magasins officiels en distribuent ?",
  contexte: "En alternance, je gère les navigateurs du parc avec NinjaOne : filtrage des sites indésirables et blocage des extensions non vérifiées ou suspectes. Cette veille me sert à savoir quoi bloquer, et pourquoi.",
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
  { etape: "Collecter", detail: "Je consulte régulièrement les sources ci-dessous et je fais des recherches par mots-clés : « extension », « Chrome Web Store », « Edge Add-ons »." },
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

/* =========================================================
   Alertes et incidents suivis (hors sujet principal)
   ➜ Ajouter une alerte : copier un bloc dans VEILLE_ALERTES.
     date = pour le tri ; quand = texte affiché si la date exacte n'est pas connue
   ========================================================= */
const VEILLE_ALERTES = [
  {
    date: "2026-11-11",
    titre: "FortiOS : prise de contrôle d'un pare-feu sans authentification",
    produit: "Fortinet FortiOS", cve: "CVE-2026-126259", gravite: "Critique (CVSS 9,0)",
    resume: "Publiée le 11/11/2026 (avis Fortinet FG-IR-26-273). Une fonction critique n'exige pas d'authentification : un attaquant qui envoie des paquets de haute disponibilité forgés peut exécuter des commandes avec les droits super administrateur. Seules les configurations FGSP avec synchronisation de configuration autonome, ou en autoscale, sont concernées. Versions touchées : 7.2.0 à 7.2.13, 7.4.0 à 7.4.12, 7.6.0 à 7.6.7 et 8.0.0. Pas d'exploitation connue à la publication.",
    action: "Vérifier la version de chaque FortiGate et si le mode FGSP ou autoscale est utilisé, puis appliquer la version corrigée indiquée dans l'avis. Le trafic de synchronisation entre pare-feu doit circuler sur un lien dédié, jamais exposé. Mon labo utilise pfSense : pas concerné, mais même principe pour la synchronisation de pare-feu en haute disponibilité.",
    sources: [
      { nom: "The Hacker Wire", url: "https://www.thehackerwire.com/cve-2026-126259-fortinet-fortios-unauthenticated-rce-via-crafted-ha-packets/" },
      { nom: "SecurityOnline", url: "https://securityonline.info/fortinet-critical-vulnerabilities-november-2026/" },
    ],
  },
  {
    date: "2026-11-10",
    titre: "Outlook : faille « zero-day » exploitée qui fait fuiter le hash NTLMv2",
    produit: "Microsoft Outlook (Microsoft 365 Apps, Office LTSC 2021 et 2024)", cve: "CVE-2026-124194", gravite: "Moyenne (CVSS 6,5), mais exploitée",
    resume: "Corrigée au Patch Tuesday de novembre 2026. Un message piégé, une fois ouvert, fait se connecter Outlook à un serveur de l'attaquant sans afficher l'avertissement habituel : le hash NTLMv2 de l'utilisateur peut fuiter et servir à usurper son identité. La faille est déjà exploitée : la CISA l'a ajoutée le 10/11 à son catalogue des failles exploitées (correction exigée avant le 24/11).",
    action: "Le correctif passe par la mise à jour d'Office, pas par Windows Update : vérifier dans NinjaOne que les mises à jour Office sont bien déployées sur tout le parc. En complément, bloquer le SMB sortant (port 445) vers Internet sur le pare-feu.",
    sources: [
      { nom: "SecurityWeek", url: "https://www.securityweek.com/exploited-outlook-zero-day-among-1094-flaws-patched-by-microsoft/" },
      { nom: "SecurityOnline", url: "https://securityonline.info/outlook-zero-day-cve-2026-124194/" },
    ],
  },
  {
    date: "2026-11-10",
    titre: "Ivanti Endpoint Manager : injection SQL menant à l'exécution de code",
    produit: "Ivanti Endpoint Manager (Core)", cve: "CVE-2026-121653", gravite: "Critique (CVSS 9,8)",
    resume: "Publiée le 10/11/2026 avec 12 autres failles corrigées par Ivanti le même jour. Une injection SQL exploitable à distance et sans authentification permet d'aller jusqu'à l'exécution de code sur le serveur de gestion. Versions antérieures à 2024 SU8 touchées ; correctif : 2024 SU8. Pas d'exploitation connue à la publication.",
    action: "Un outil de gestion de parc pilote tous les postes : s'il est compromis, tout le parc l'est. Mettre à jour en 2024 SU8, et ne jamais exposer la console de gestion sur Internet. Même raisonnement pour NinjaOne et GLPI : comptes protégés, accès restreint.",
    sources: [
      { nom: "SecurityOnline", url: "https://securityonline.info/ivanti-security-advisories-november-2026/" },
      { nom: "Cyberpress", url: "https://cyberpress.org/critical-ivanti-flaws/" },
    ],
  },
  {
    date: "2026-10-31", quand: "Fin octobre 2026",
    titre: "PHP2Shell : deux failles critiques dans PHP, déjà exploitées",
    produit: "PHP", cve: "CVE-2026-109618 · CVE-2026-109619", gravite: "Critique (CVSS 4.0 : 9,2)",
    resume: "Deux failles du cœur de PHP permettent l'exécution de code à distance : l'une dans la gestion des erreurs de mémoire insuffisante, l'autre due à un état conservé d'une requête à l'autre. Elles sont exploitées et le FBI a publié une alerte. Corrigées dans PHP 8.2.35, 8.3.36, 8.4.27 et 8.5.12. Contournement si la mise à jour est impossible : fixer memory_limit=-1 sans que l'application puisse le changer, désactiver session.upload_progress.enabled, puis redémarrer les processus PHP.",
    action: "Mon labo est concerné : web-01, web-02 (WordPress), GLPI et l'interface Zabbix tournent sous PHP 8.2 (Debian 12). Faire les mises à jour de sécurité Debian (apt update puis apt upgrade), vérifier la version installée, redémarrer Apache, puis contrôler que les sites répondent.",
    sources: [
      { nom: "Tenable (FAQ)", url: "https://www.tenable.com/blog/php2shell-cve-2026-109618-cve-2026-109619-frequently-asked-questions-about-critical-php-remote" },
      { nom: "NCSC (Royaume-Uni)", url: "https://www.ncsc.gov.uk/news/critical-security-issue-affecting-php" },
    ],
  },
  {
    date: "2026-10-21",
    titre: "Panne nationale du réseau mobile Orange",
    produit: "Orange et Sosh (réseau mobile)", cve: "", gravite: "Incident de disponibilité",
    resume: "Le 21/10/2026, à partir d'environ 11h30, des abonnés Orange et Sosh de toute la France ont perdu le réseau mobile : appels, SMS et données. Les box 5G, qui passent par le réseau mobile, ont aussi été coupées. Le service n'a été rétabli qu'après plusieurs heures. Orange a indiqué que la panne venait de la défaillance d'un équipement au cœur de son réseau mobile, et non d'une cyberattaque.",
    action: "Un seul équipement défaillant suffit à couper des millions de clients : c'est un point unique de défaillance, comme ceux que je supprime dans mon projet haute disponibilité. Pour une entreprise : prévoir un lien de secours chez un autre opérateur (fibre + 4G/5G d'un second opérateur) et un plan de continuité qui dit quoi faire quand Internet tombe.",
    sources: [
      { nom: "franceinfo", url: "https://www.franceinfo.fr/faits-divers/des-millions-d-abonnes-orange-sans-reseau-mobile-une-panne-en-chaine-evoquee_8247907.html" },
      { nom: "Alliancy", url: "https://alliancy.fr/orange-frappe-par-une-panne-nationale-de-son-reseau-mobile-lorigine-toujours-inconnue-43c8c174-0378-488c-8852-6da4a2a1bea8" },
    ],
  },
];
