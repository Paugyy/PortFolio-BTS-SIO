/* =========================================================
   synthese-data.js — données du tableau de synthèse E5
   Structure du modèle officiel (circulaire nationale BTS SIO) :
   6 compétences du bloc 1, 22 sous-compétences, réalisations
   classées par modalité.
   ➜ Pour modifier le tableau : éditer uniquement REALISATIONS.
     « comp » liste les codes des sous-compétences mobilisées.
   ========================================================= */

const SYNTHESE_CANDIDAT = {
  nom: "Yannis PAUGY",
  option: "SISR",
  centre: "MyDigitalSchool Caen",
  formation: "2025 — 2027",
};

const COMPETENCES_B1 = [
  { code: "1.1", titre: "Gérer le patrimoine informatique", items: [
    { code: "1.1.1", label: "Recenser et identifier les ressources numériques" },
    { code: "1.1.2", label: "Exploiter des référentiels, normes et standards adoptés par le prestataire informatique" },
    { code: "1.1.3", label: "Mettre en place et vérifier les niveaux d'habilitation associés à un service" },
    { code: "1.1.4", label: "Vérifier les conditions de la continuité d'un service informatique" },
    { code: "1.1.5", label: "Gérer des sauvegardes" },
    { code: "1.1.6", label: "Vérifier le respect des règles d'utilisation des ressources numériques" },
  ]},
  { code: "1.2", titre: "Répondre aux incidents et aux demandes d'assistance et d'évolution", items: [
    { code: "1.2.1", label: "Collecter, suivre et orienter des demandes" },
    { code: "1.2.2", label: "Traiter des demandes concernant les services réseau et système, applicatifs" },
    { code: "1.2.3", label: "Traiter des demandes concernant les applications" },
  ]},
  { code: "1.3", titre: "Développer la présence en ligne de l'organisation", items: [
    { code: "1.3.1", label: "Participer à la valorisation de l'image de l'organisation sur les médias numériques en tenant compte du cadre juridique et des enjeux économiques" },
    { code: "1.3.2", label: "Référencer les services en ligne de l'organisation et mesurer leur visibilité" },
    { code: "1.3.3", label: "Participer à l'évolution d'un site Web exploitant les données de l'organisation" },
  ]},
  { code: "1.4", titre: "Travailler en mode projet", items: [
    { code: "1.4.1", label: "Analyser les objectifs et les modalités d'organisation d'un projet" },
    { code: "1.4.2", label: "Planifier les activités" },
    { code: "1.4.3", label: "Évaluer les indicateurs de suivi d'un projet et analyser les écarts" },
  ]},
  { code: "1.5", titre: "Mettre à disposition des utilisateurs un service informatique", items: [
    { code: "1.5.1", label: "Réaliser les tests d'intégration et d'acceptation d'un service" },
    { code: "1.5.2", label: "Déployer un service" },
    { code: "1.5.3", label: "Accompagner les utilisateurs dans la mise en place d'un service" },
  ]},
  { code: "1.6", titre: "Organiser son développement professionnel", items: [
    { code: "1.6.1", label: "Mettre en place son environnement d'apprentissage personnel" },
    { code: "1.6.2", label: "Mettre en œuvre des outils et stratégies de veille informationnelle" },
    { code: "1.6.3", label: "Gérer son identité professionnelle" },
    { code: "1.6.4", label: "Développer son projet professionnel" },
  ]},
];

const MODALITES = {
  pro1: "Milieu professionnel — 1re année",
  pro2: "Milieu professionnel — 2e année",
  formation: "En cours de formation",
};

const REALISATIONS = [
  /* ---------- Santé BTP Normandie — 1re année ---------- */
  { modalite: "pro1", titre: "Administration du parc avec NinjaOne", periode: "2025 — 2026",
    productions: [{ label: "Fiche projet", href: "/entreprise" }, { label: "Certification NinjaOne", href: "https://academy.ninjaone.com/certificate/cKC9PqAsKA" }],
    comp: ["1.1.1", "1.2.1", "1.2.2", "1.6.1"] },
  { modalite: "pro1", titre: "Téléphonie Microsoft Teams et parc d'imprimantes", periode: "2025 — 2026",
    productions: [{ label: "Fiche projet", href: "/entreprise" }],
    comp: ["1.2.2", "1.5.2", "1.5.3"] },
  { modalite: "pro1", titre: "Gestion des appareils FIM (examens complémentaires)", periode: "2025 — 2026",
    productions: [{ label: "Fiche projet", href: "/entreprise" }],
    comp: ["1.1.1", "1.2.2"] },

  { modalite: "pro1", titre: "Déploiement de l'EDR HarfangLab", periode: "2025 — 2026 · terminé",
    productions: [{ label: "Fiche projet", href: "/entreprise" }],
    comp: ["1.1.1", "1.1.4", "1.4.2", "1.5.2"] },
  { modalite: "pro1", titre: "Déploiement réseau Cisco Meraki (accès Wi-Fi, portail captif)", periode: "Depuis 2025 · en cours",
    productions: [{ label: "Fiche projet", href: "/entreprise" }],
    comp: ["1.1.3", "1.4.1", "1.4.2", "1.5.2"] },

  /* ---------- Santé BTP Normandie — 2e année ---------- */
  { modalite: "pro2", titre: "Sécurisation des navigateurs du parc avec NinjaOne (filtrage web, blocage des extensions non vérifiées)", periode: "Sept. 2026",
    productions: [],
    comp: ["1.1.6", "1.6.2"] },

  /* ---------- En cours de formation ---------- */
  { modalite: "formation", titre: "Pare-feu pfSense et segmentation VLAN", periode: "1re année",
    productions: [{ label: "Fiche projet", href: "/ecole" }, { label: "Procédure", href: "/ressources#guides" }],
    comp: ["1.1.2", "1.5.2"] },
  { modalite: "formation", titre: "Domaine Active Directory", periode: "1re année",
    productions: [{ label: "Fiche projet", href: "/ecole" }, { label: "Procédure", href: "/ressources#guides" }],
    comp: ["1.1.3", "1.1.6", "1.5.2"] },
  { modalite: "formation", titre: "Gestion de parc avec GLPI", periode: "1re année",
    productions: [{ label: "Fiche projet", href: "/ecole" }],
    comp: ["1.1.1", "1.2.1"] },
  { modalite: "formation", titre: "Infrastructure Proxmox", periode: "2026",
    productions: [{ label: "Fiche projet", href: "/ecole" }],
    comp: ["1.5.2"] },
  { modalite: "formation", titre: "DataBridge — plateforme d'import de données (projet d'équipe)", periode: "2026",
    productions: [{ label: "Fiche projet", href: "/ecole" }],
    comp: ["1.3.3", "1.4.1", "1.4.2", "1.5.1"] },
  { modalite: "formation", titre: "Bastion d'accès Apache Guacamole", periode: "2e année",
    productions: [{ label: "Fiche projet", href: "/ecole" }],
    comp: ["1.1.3", "1.5.2"] },
  { modalite: "formation", titre: "Infrastructure haute disponibilité (Galera, HAProxy, WordPress, GLPI)", periode: "2e année",
    productions: [{ label: "Fiche détaillée", href: "/projet-ha" }, { label: "Schéma interactif", href: "/infra" }, { label: "Dépôt GitHub", href: "https://github.com/Paugyy/bts-sio-ha-infrastructure" }],
    comp: ["1.1.4", "1.4.1", "1.4.2", "1.5.1", "1.5.2"] },
  { modalite: "formation", titre: "Opération Blackout — réseau d'entreprise sous Packet Tracer (binôme)", periode: "Oct. 2026",
    productions: [],
    comp: ["1.2.2", "1.5.1"] },
  { modalite: "formation", titre: "Portfolio BTS SIO (paugy.org)", periode: "2e année",
    productions: [{ label: "Site", href: "/" }, { label: "Code source", href: "https://github.com/Paugyy/PortFolio-BTS-SIO" }],
    comp: ["1.3.1", "1.3.3", "1.6.3", "1.6.4"] },
];
