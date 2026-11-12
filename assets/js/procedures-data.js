/* =========================================================
   procedures-data.js — GÉNÉRÉ par tools/build_procedures.py
   Ne pas modifier à la main : modifier le CATALOGUE du script puis le relancer.
   ========================================================= */
const PROCEDURES_MAJ = "12/11/2026";
const PROCEDURES_ZIP_KO = 2631;
const PROCEDURES = [
 {
  "id": "mo-01-galera",
  "titre": "MO-1 — Monter un cluster MariaDB Galera à 3 nœuds",
  "resume": "Monter la grappe MariaDB Galera de 3 nœuds : concepts, installation, configuration de chaque nœud, amorçage, validation et reprise après panne.",
  "groupe": "labo",
  "theme": "Bases de données et HA",
  "icon": "🗄️",
  "ordre": 1,
  "sections": [
   "Galera — Concepts",
   "Galera — Installation",
   "bdd-01 — 10.0.20.1",
   "bdd-02 — 10.0.20.2",
   "bdd-03 — 10.0.20.3",
   "Galera — Bootstrap",
   "Galera — Validation",
   "Galera — Reprise après panne"
  ],
  "mots": 3191,
  "pdfKo": 485,
  "mdKo": 23
 },
 {
  "id": "mo-02-haproxy",
  "titre": "MO-2 — Répartiteur de charge HAProxy",
  "resume": "Installer le répartiteur HAProxy : vérifications d'état, répartition HTTP (WordPress, GLPI) et accès SQL à la grappe.",
  "groupe": "labo",
  "theme": "Bases de données et HA",
  "icon": "🔀",
  "ordre": 2,
  "sections": [
   "HAProxy — Installation",
   "HAProxy — Health-checks",
   "HAProxy — Répartition WordPress",
   "HAProxy — Publication de GLPI",
   "HAProxy — Répartition SQL"
  ],
  "mots": 2006,
  "pdfKo": 351,
  "mdKo": 14
 },
 {
  "id": "mo-03-wordpress-ha",
  "titre": "MO-3 — WordPress sur deux serveurs web",
  "resume": "WordPress sur deux serveurs web : Apache, base commune, synchronisation des fichiers et test de bascule.",
  "groupe": "labo",
  "theme": "Applications",
  "icon": "🌐",
  "ordre": 3,
  "sections": [
   "WordPress — Apache",
   "WordPress — Installation",
   "WordPress — Base de données",
   "web-01 — 10.0.10.1",
   "web-02 — 10.0.10.4",
   "WordPress — Synchronisation des fichiers",
   "WordPress — Failover"
  ],
  "mots": 2602,
  "pdfKo": 421,
  "mdKo": 18
 },
 {
  "id": "mo-04-glpi",
  "titre": "MO-4 — GLPI (gestion des incidents)",
  "resume": "GLPI pour la gestion des incidents : installation, Apache, base sur la grappe et publication derrière HAProxy.",
  "groupe": "labo",
  "theme": "Applications",
  "icon": "🎫",
  "ordre": 4,
  "sections": [
   "GLPI — Installation",
   "GLPI — Apache",
   "GLPI — Base de données",
   "GLPI — Intégration HAProxy"
  ],
  "mots": 1214,
  "pdfKo": 295,
  "mdKo": 8
 },
 {
  "id": "mo-05-ssh-durcissement",
  "titre": "MO-5 — Clés SSH, durcissement et moindre privilège",
  "resume": "Connexion SSH par clé, durcissement des serveurs, comptes à privilèges minimaux et gestion des secrets.",
  "groupe": "labo",
  "theme": "Réseau et sécurité",
  "icon": "🔐",
  "ordre": 5,
  "sections": [
   "Sécurité — SSH",
   "Sécurité — Durcissement",
   "Sécurité — Moindre privilège",
   "Sécurité — Gestion des secrets"
  ],
  "mots": 2029,
  "pdfKo": 401,
  "mdKo": 15
 },
 {
  "id": "mo-06-sauvegarde",
  "titre": "MO-6 — Sauvegarde et restauration",
  "resume": "Sauvegarder et restaurer MariaDB, WordPress, GLPI et les machines virtuelles Proxmox.",
  "groupe": "labo",
  "theme": "Sauvegarde",
  "icon": "💾",
  "ordre": 6,
  "sections": [
   "Sauvegarde et restauration — MariaDB",
   "Sauvegarde et restauration — WordPress",
   "Sauvegarde et restauration — GLPI",
   "Sauvegarde et restauration — Proxmox et pfSense"
  ],
  "mots": 1303,
  "pdfKo": 267,
  "mdKo": 9
 },
 {
  "id": "mo-07-git",
  "titre": "MO-7 — Versionner et publier avec Git et GitHub",
  "resume": "Versionner et publier la documentation avec Git et GitHub : flux de travail et organisation du dépôt.",
  "groupe": "labo",
  "theme": "Outils",
  "icon": "📦",
  "ordre": 7,
  "sections": [
   "Workflow Git"
  ],
  "mots": 679,
  "pdfKo": 199,
  "mdKo": 5
 },
 {
  "id": "mo-08-zabbix",
  "titre": "MO-8 — Supervision Zabbix 7.0 LTS",
  "resume": "Installer Zabbix 7.0 LTS, stocker sa base sur la grappe via HAProxy et superviser les VM par agent.",
  "groupe": "labo",
  "theme": "Supervision et journaux",
  "icon": "📡",
  "ordre": 8,
  "sections": [
   "Machines et flux",
   "1. pfSense : autoriser Zabbix",
   "2. Base de données",
   "3. Installer Zabbix",
   "4. Installer les agents",
   "5. Ajouter les hôtes et vérifier",
   "Pièges déjà rencontrés"
  ],
  "mots": 1072,
  "pdfKo": 180,
  "mdKo": 7
 },
 {
  "id": "mo-09-rsyslog-loganalyzer",
  "titre": "MO-9 — Journalisation centralisée : Rsyslog et LogAnalyzer",
  "resume": "Centraliser les journaux des serveurs avec Rsyslog et les consulter dans LogAnalyzer.",
  "groupe": "labo",
  "theme": "Supervision et journaux",
  "icon": "📜",
  "ordre": 9,
  "sections": [
   "État au 06/11/2026 (fin de journée de mise en service)",
   "Machines et flux",
   "1. Récepteur Rsyslog — ✅",
   "2. Site Apache LogAnalyzer sur 8085 — ✅",
   "3. Assistant LogAnalyzer 5.0.2 — ✅ fait · ⬜ verrouillage",
   "4. Envoi depuis les 8 VM Linux — ✅",
   "5. Restant à faire — ⬜",
   "6. Sécurité et exploitation",
   "Retour arrière",
   "Diagnostic par symptôme"
  ],
  "mots": 2505,
  "pdfKo": 366,
  "mdKo": 17
 },
 {
  "id": "mo-10-pfsense-journalisation",
  "titre": "MO-10 — pfSense : flux de la journalisation (NAT 2233, Syslog 514)",
  "resume": "Ouvrir sur pfSense les flux de la journalisation : redirection NAT de LogAnalyzer et envoi Syslog vers le collecteur.",
  "groupe": "labo",
  "theme": "Réseau et sécurité",
  "icon": "🔥",
  "ordre": 10,
  "sections": [
   "1. Pourquoi, et où on en est",
   "2. Configuration cible (fichier corrigé)",
   "3. Relire la configuration active (à faire en premier)",
   "4. Reconstruire ces flux (si besoin)",
   "5. Envoi des journaux de pfSense (à faire)",
   "6. Retour arrière",
   "7. Recette"
  ],
  "mots": 1317,
  "pdfKo": 284,
  "mdKo": 9
 },
 {
  "id": "plan-de-tests",
  "titre": "Plan de tests et matrice de validation",
  "resume": "Plan de tests et matrice de validation : bascule des serveurs web, panne d'un nœud Galera, répartiteur et réseau.",
  "groupe": "labo",
  "theme": "Tests et dépannage",
  "icon": "🧪",
  "ordre": 11,
  "sections": [
   "Plan de tests",
   "Matrice de validation",
   "Tests Galera",
   "Tests HAProxy",
   "Test de failover WordPress"
  ],
  "mots": 3039,
  "pdfKo": 581,
  "mdKo": 20
 },
 {
  "id": "depannage",
  "titre": "Troubleshooting — incidents rencontrés et résolution",
  "resume": "Méthode de diagnostic et incidents réellement rencontrés, classés par composant : symptôme, cause, correction.",
  "groupe": "labo",
  "theme": "Tests et dépannage",
  "icon": "🛠️",
  "ordre": 12,
  "sections": [
   "Méthodologie de diagnostic",
   "Journal des incidents",
   "pfSense — Dépannage",
   "Galera — Dépannage",
   "Dépannage — Galera",
   "HAProxy — Dépannage",
   "Dépannage — HAProxy",
   "WordPress — Dépannage",
   "Dépannage — WordPress",
   "Dépannage — Apache",
   "GLPI — Dépannage",
   "Dépannage — SSH",
   "Dépannage — APT / dpkg"
  ],
  "mots": 6316,
  "pdfKo": 920,
  "mdKo": 46
 },
 {
  "id": "guide-proxmox-vm",
  "titre": "Proxmox VE — créer une VM Debian",
  "resume": "Créer une VM Debian sur Proxmox VE, installer l'agent invité et en faire un modèle réutilisable.",
  "groupe": "guide",
  "theme": "Systèmes",
  "icon": "🖥️",
  "ordre": 13,
  "sections": [
   "Étapes"
  ],
  "mots": 84,
  "pdfKo": 59,
  "mdKo": 1
 },
 {
  "id": "guide-pfsense",
  "titre": "pfSense — installation et configuration de base",
  "resume": "Installer pfSense, créer des VLAN, écrire des règles de pare-feu, publier un service en NAT et monter un VPN OpenVPN.",
  "groupe": "guide",
  "theme": "Réseau et sécurité",
  "icon": "🔥",
  "ordre": 14,
  "sections": [
   "1. Prérequis",
   "2. Installation",
   "3. Interface web",
   "4. Créer des VLAN",
   "5. Règles de pare-feu",
   "6. Redirection de port (NAT)",
   "7. VPN OpenVPN (accès distant)"
  ],
  "mots": 313,
  "pdfKo": 115,
  "mdKo": 2
 },
 {
  "id": "guide-active-directory",
  "titre": "Active Directory sur Windows Server",
  "resume": "Installer Active Directory sur Windows Server : promotion, OU, utilisateurs, GPO, en graphique et en PowerShell.",
  "groupe": "guide",
  "theme": "Systèmes",
  "icon": "🗂️",
  "ordre": 15,
  "sections": [
   "Dans l'interface graphique",
   "La même chose en PowerShell"
  ],
  "mots": 169,
  "pdfKo": 68,
  "mdKo": 1
 },
 {
  "id": "guide-ssh-cle",
  "titre": "SSH par clé (sans mot de passe)",
  "resume": "Se connecter à un serveur Linux par clé et désactiver la connexion par mot de passe.",
  "groupe": "guide",
  "theme": "Réseau et sécurité",
  "icon": "🔑",
  "ordre": 16,
  "sections": [
   "Étapes"
  ],
  "mots": 91,
  "pdfKo": 59,
  "mdKo": 1
 },
 {
  "id": "guide-guacamole-docker",
  "titre": "Apache Guacamole avec Docker",
  "resume": "Déployer le bastion Apache Guacamole avec Docker Compose pour accéder aux serveurs depuis un navigateur.",
  "groupe": "guide",
  "theme": "Réseau et sécurité",
  "icon": "🧭",
  "ordre": 17,
  "sections": [
   "1. Préparer le dossier",
   "2. Fichier docker-compose.yml",
   "3. Lancer et se connecter"
  ],
  "mots": 225,
  "pdfKo": 155,
  "mdKo": 2
 },
 {
  "id": "guide-docker-debian",
  "titre": "Installer Docker sur Debian",
  "resume": "Installer Docker et Docker Compose sur Debian depuis le dépôt officiel.",
  "groupe": "guide",
  "theme": "Outils",
  "icon": "🐳",
  "ordre": 18,
  "sections": [
   "Étapes"
  ],
  "mots": 112,
  "pdfKo": 45,
  "mdKo": 1
 },
 {
  "id": "guide-glpi-lamp",
  "titre": "GLPI sur Debian (LAMP)",
  "resume": "Installer GLPI sur un serveur LAMP Debian pour la gestion de parc et les tickets.",
  "groupe": "guide",
  "theme": "Applications",
  "icon": "🎫",
  "ordre": 19,
  "sections": [
   "Étapes"
  ],
  "mots": 128,
  "pdfKo": 52,
  "mdKo": 1
 }
];
