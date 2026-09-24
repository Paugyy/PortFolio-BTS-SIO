/* =========================================================
   data.js — TOUS LES PROJETS SONT ICI
   Pour ajouter un projet : copier un bloc { ... }, le coller
   dans la bonne liste et modifier le texte. Rien d'autre à toucher.

   Champs :
   - title, date, category (sert aux filtres), icon (emoji)
   - color : dégradé de la vignette
   - summary : 1-2 phrases affichées sur la carte
   - description / objectives / tasks / skills : affichés dans la fenêtre de détail
   - tags : technologies
   - link : lien GitHub ou autre (optionnel, mettre "" sinon)
   ========================================================= */

const COLORS = {
  indigo: "linear-gradient(135deg,#e0e7ff,#c7d2fe)",
  cyan: "linear-gradient(135deg,#cffafe,#a5f3fc)",
  pink: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
  amber: "linear-gradient(135deg,#fef3c7,#fde68a)",
  green: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
  violet: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
};

/* ---------------- PROJETS ENTREPRISE ---------------- */
const PROJECTS_ENTREPRISE = [
  /* ➕ Ajoute tes autres missions d'entreprise ici (copie un bloc ci-dessus) */
];

/* ---------------- PROJETS ÉCOLE ---------------- */
const PROJECTS_ECOLE = [
  {
    title: "DataBridge — plateforme d'import de données",
    date: "2026",
    category: "Développement & Infra",
    icon: "🌉",
    color: COLORS.indigo,
    summary: "Application web qui transforme les fichiers Excel/CSV des salariés en base PostgreSQL centralisée, déployée en conteneurs Docker.",
    description: "Les salariés stockaient leurs données dans des classeurs Excel isolés. DataBridge leur permet d'importer ces fichiers via une interface web simple : les données sont automatiquement analysées et stockées dans une base PostgreSQL commune. Projet réalisé en binôme dans le cadre du BTS SIO.",
    objectives: [
      "Centraliser les données de l'entreprise dans une base unique",
      "Offrir une interface utilisable par des non-techniciens",
      "Déployer une architecture sécurisée et reproductible",
    ],
    tasks: [
      "Création et configuration d'une VM Debian 12 sur Proxmox",
      "Architecture Docker Compose : 5 services (Nginx, Vue.js, API Node.js, PostgreSQL, MinIO)",
      "Segmentation en 4 réseaux Docker isolés (base de données et stockage inaccessibles depuis l'extérieur)",
      "Développement de l'API REST (Express) : upload, analyse Excel/CSV, pagination",
      "Frontend Vue.js 3 compilé et servi par Nginx (build multi-stage)",
      "Documentation complète : architecture, installation, journal de bord",
    ],
    skills: [
      "Gérer le patrimoine informatique",
      "Mettre à disposition des utilisateurs un service informatique",
      "Travailler en mode projet (Git, GitHub, TODO partagée)",
    ],
    tags: ["Docker", "Proxmox", "PostgreSQL", "Node.js", "Vue.js", "Nginx", "MinIO"],
    link: "",
  },
  {
    title: "Infrastructure Proxmox",
    date: "2026",
    category: "Virtualisation",
    icon: "🖥️",
    color: COLORS.cyan,
    summary: "Gestion des machines virtuelles et du réseau de l'hyperviseur Proxmox, configurations versionnées sur GitHub.",
    description: "Mise en place et gestion des VM du projet DataBridge sur l'hyperviseur Proxmox VE. Les configurations sont versionnées dans un dépôt Git dédié pour garder une trace de chaque changement.",
    objectives: ["Créer des VM standardisées", "Sécuriser l'accès (clés SSH, pas de mot de passe root)", "Tracer les modifications"],
    tasks: [
      "Création de VM Debian (ressources CPU/RAM/disque dimensionnées)",
      "Accès SSH par clé uniquement",
      "Installation de Docker et Docker Compose",
      "Versionnage des configurations dans le dépôt infra-proxmox",
    ],
    skills: ["Gérer le patrimoine informatique", "Répondre aux incidents et aux demandes d'assistance"],
    tags: ["Proxmox VE", "Debian", "SSH", "Git"],
    link: "",
  },
  {
    title: "Pare-feu pfSense & segmentation VLAN",
    date: "1ère année",
    category: "Réseau & Sécurité",
    icon: "🔥",
    color: COLORS.amber,
    summary: "Mise en place d'un pare-feu pfSense pour segmenter un réseau d'entreprise en VLAN avec règles de filtrage.",
    description: "Déploiement d'un pare-feu pfSense virtualisé pour protéger le réseau d'une PME fictive : séparation LAN / DMZ / invités, NAT, DHCP et règles de filtrage.",
    objectives: ["Isoler les différents réseaux", "Contrôler les flux entrants et sortants", "Publier un serveur web en DMZ"],
    tasks: ["Installation de pfSense (WAN / LAN / DMZ)", "Création de VLAN et de règles de pare-feu", "Configuration DHCP et NAT (redirection de port)", "Tests de connectivité et de filtrage"],
    skills: ["Gérer le patrimoine informatique", "Sécuriser les équipements et les usages"],
    tags: ["pfSense", "VLAN", "NAT", "DHCP"],
    link: "",
  },
  {
    title: "Bastion d'accès Apache Guacamole",
    date: "2ème année",
    category: "Réseau & Sécurité",
    icon: "🧭",
    color: COLORS.violet,
    summary: "Accès distant sécurisé aux serveurs (RDP / SSH / VNC) depuis un simple navigateur web.",
    description: "Installation d'Apache Guacamole pour offrir un point d'accès unique aux serveurs internes, sans client à installer, via le navigateur.",
    objectives: ["Centraliser les accès distants", "Éviter d'exposer RDP/SSH directement", "Tracer les connexions"],
    tasks: ["Déploiement de Guacamole avec Docker (guacd + guacamole + base de données)", "Création des connexions RDP et SSH", "Gestion des utilisateurs et des droits", "Mise derrière un reverse proxy HTTPS"],
    skills: ["Mettre à disposition des utilisateurs un service informatique", "Sécuriser les équipements et les usages"],
    tags: ["Guacamole", "Docker", "RDP", "SSH"],
    link: "",
  },
  {
    title: "Domaine Active Directory",
    date: "1ère année",
    category: "Systèmes",
    icon: "🗂️",
    color: COLORS.cyan,
    summary: "Création d'un domaine Windows Server : AD DS, DNS, DHCP, unités d'organisation et GPO.",
    description: "Installation d'un contrôleur de domaine Windows Server et organisation des utilisateurs, groupes et stratégies de groupe pour une entreprise fictive.",
    objectives: ["Centraliser l'authentification", "Appliquer des stratégies aux postes", "Structurer l'annuaire"],
    tasks: ["Promotion du serveur en contrôleur de domaine", "Création des OU, utilisateurs et groupes", "GPO : fond d'écran, lecteurs réseau, restrictions", "Jonction des postes clients au domaine"],
    skills: ["Gérer le patrimoine informatique", "Organiser son développement professionnel"],
    tags: ["Windows Server", "AD DS", "DNS", "GPO"],
    link: "",
  },
  {
    title: "Gestion de parc avec GLPI",
    date: "1ère année",
    category: "Systèmes",
    icon: "🎫",
    color: COLORS.green,
    summary: "Inventaire automatique du parc et gestion des tickets d'incident avec GLPI.",
    description: "Déploiement de GLPI sur un serveur Linux (LAMP) avec agent d'inventaire sur les postes, et utilisation du module d'assistance (tickets).",
    objectives: ["Inventorier le matériel automatiquement", "Suivre les incidents et demandes"],
    tasks: ["Installation LAMP + GLPI", "Déploiement de l'agent GLPI", "Création de catégories et traitement de tickets"],
    skills: ["Répondre aux incidents et aux demandes d'assistance"],
    tags: ["GLPI", "Linux", "Apache", "MariaDB"],
    link: "",
  },
  {
    title: "Portfolio BTS SIO",
    date: "2ème année",
    category: "Web",
    icon: "✨",
    color: COLORS.pink,
    summary: "Ce site ! Portfolio en HTML, CSS et JavaScript, hébergé sur GitHub Pages.",
    description: "Conception d'un portfolio responsive sans framework, avec animations au scroll, arrière-plan animé, filtres de projets et formulaire de contact.",
    objectives: ["Présenter mon travail", "Préparer l'épreuve E5 / E6"],
    tasks: ["Maquette et design", "Développement HTML / CSS / JS", "Hébergement GitHub Pages"],
    skills: ["Développer la présence en ligne de l'organisation", "Organiser son développement professionnel"],
    tags: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
    link: "https://github.com/Paugyy/PortFolio-BTS-SIO",
  },
  /* ➕ Ajoute tes autres projets d'école ici */
];
