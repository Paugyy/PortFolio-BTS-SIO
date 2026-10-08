/* =========================================================
   infra-data.js — TOUTE L'INFRASTRUCTURE EST DÉCRITE ICI
   La page /infra (schéma interactif) est entièrement générée
   à partir de cet objet : pour ajouter une VM, changer une IP
   ou un lien d'accès, c'est ici et nulle part ailleurs.

   Champs d'une machine (nodes) :
   - id, name, dns, ip, zone (id d'un VLAN, ou null hors VLAN)
   - role : une phrase ; os ; ports : services en écoute
   - needs : ce dont elle dépend ; down : ce qui se passe si elle tombe
   - spof : true si sa panne coupe un service
   - order : rang dans l'ordre de création
   - access : liens d'accès
       scope "vpn"     -> joignable depuis le réseau du labo : la page
                          demande si le VPN est activé avant d'ouvrir
       scope "interne" -> joignable seulement depuis l'intérieur du labo :
                          l'adresse est affichée et se copie, on passe par le bastion
       scope "cmd"     -> commande à copier (SSH)
   ========================================================= */

const INFRA = {
  vpn: { name: "vpnoob", label: "VPN de l'école" },
  bastion: { label: "Bastion Guacamole", href: "http://10.4.0.198:8080/guacamole" },

  wan: { net: "10.4.0.0/24", gateway: "10.4.0.254", fw: "10.4.0.198" },

  nat: [
    { port: "8081", target: "10.0.10.2:80", label: "WordPress" },
    { port: "8080", target: "10.0.30.2:8080", label: "Bastion" },
    { port: "2223", target: "10.0.30.2:22", label: "SSH" },
  ],

  zones: [
    { id: "web", vlan: 301, name: "WEB", alias: "vWEB", net: "10.0.10.0/24", gw: "10.0.10.254", note: "2 frontaux WordPress + GLPI, derrière HAProxy" },
    { id: "bdd", vlan: 302, name: "BDD", alias: "vBDD", net: "10.0.20.0/24", gw: "10.0.20.254", note: "Cluster Galera · quorum 2 sur 3" },
    { id: "adm", vlan: 303, name: "ADM", alias: "vADMIN", net: "10.0.30.0/24", gw: "10.0.30.254", note: "Seule zone autorisée en SSH" },
    { id: "usr", vlan: 304, name: "USERS", alias: "vUSER", net: "10.0.40.0/24", gw: "10.0.40.254", note: "Zone sans privilège" },
  ],

  nodes: [
    {
      id: "fw", name: "pfSense", dns: "fw-01", ip: "10.4.0.198", zone: null, os: "pfSense", order: 1, spof: true,
      role: "Pare-feu, routeur inter-VLAN et NAT. Passerelle (.254) de chaque VLAN.",
      ports: ["NAT 8081 · 8080 · 2223", "DNS 53", "NTP 123", "Interface web 443"],
      needs: "L'hôte Proxmox (bridge VLAN-aware)",
      down: "Plus de routage entre VLAN ni de NAT : rien ne passe d'une zone à l'autre.",
      access: [
        { label: "Interface web pfSense", href: "https://10.0.30.254", scope: "interne", note: "Ouverte depuis vADMIN uniquement (règle 443)." },
      ],
    },
    {
      id: "adm01", name: "ADM-01", dns: "adm-01", ip: "10.0.30.1", zone: "adm", os: "Windows Server", order: 2, spof: true,
      role: "Contrôleur de domaine Active Directory (paugy.lan) et DNS du domaine.",
      ports: ["AD DS", "DNS 53", "Kerberos 88", "LDAP 389", "SMB 445"],
      needs: "pfSense",
      down: "Plus d'ouverture de session de domaine pour les postes.",
      access: [],
    },
    {
      id: "cli01", name: "CLI-01", dns: "cli-01", ip: "10.0.40.1", zone: "usr", os: "Windows", order: 3,
      role: "Poste utilisateur Windows, membre du domaine paugy.lan.",
      ports: ["Client : 80 et 8080 vers HAProxy"],
      needs: "pfSense, ADM-01",
      down: "Aucun impact sur les services : c'est un poste de travail.",
      access: [],
    },
    {
      id: "mysql1", name: "MYSQL-01", dns: "bdd-01", ip: "10.0.20.1", zone: "bdd", os: "Debian", order: 4,
      role: "Nœud 1 du cluster MariaDB Galera : celui qui crée le cluster (bootstrap).",
      ports: ["MariaDB 3306", "Galera 4567", "IST 4568", "SST 4444", "SSH 22"],
      needs: "pfSense ; MYSQL-02 et MYSQL-03 pour le quorum",
      down: "Quorum conservé (2 sur 3) : le service continue.",
      access: [],
    },
    {
      id: "mysql2", name: "MYSQL-02", dns: "bdd-02", ip: "10.0.20.2", zone: "bdd", os: "Debian", order: 5,
      role: "Nœud 2 du cluster MariaDB Galera.",
      ports: ["MariaDB 3306", "Galera 4567", "IST 4568", "SST 4444", "SSH 22"],
      needs: "MYSQL-01 (cluster déjà créé)",
      down: "Quorum conservé (2 sur 3) : le service continue.",
      access: [],
    },
    {
      id: "mysql3", name: "MYSQL-03", dns: "bdd-03", ip: "10.0.20.3", zone: "bdd", os: "Debian", order: 6,
      role: "Nœud 3 du cluster MariaDB Galera : celui qui donne le quorum.",
      ports: ["MariaDB 3306", "Galera 4567", "IST 4568", "SST 4444", "SSH 22"],
      needs: "MYSQL-01 et MYSQL-02",
      down: "Quorum conservé (2 sur 3) : le service continue.",
      access: [],
    },
    {
      id: "haproxy", name: "HAProxy", dns: "haproxy", ip: "10.0.10.2", zone: "web", os: "Debian", order: 7, spof: true,
      role: "Reverse proxy et répartiteur : point d'entrée unique du web, de GLPI et du SQL.",
      ports: ["WordPress 80", "GLPI 8080", "SQL 3306", "SSH 22"],
      needs: "Le cluster Galera, puis WEB-01, WEB-02 et GLPI-01",
      down: "Le site, GLPI et l'accès SQL s'arrêtent : c'est le point unique de défaillance.",
      access: [
        { label: "WordPress (adresse interne)", href: "http://10.0.10.2", scope: "interne" },
        { label: "GLPI (adresse interne)", href: "http://10.0.10.2:8080", scope: "interne" },
      ],
    },
    {
      id: "guac", name: "Guacamole", dns: "guacamol", ip: "10.0.30.2", zone: "adm", os: "Debian", order: 8,
      role: "Bastion d'administration : sessions SSH et RDP dans un navigateur.",
      ports: ["Web 8080", "SSH 22"],
      needs: "pfSense ; une base MariaDB pour ses comptes",
      down: "Perte de l'accès distant d'administration (la console Proxmox reste le secours).",
      access: [
        { label: "Ouvrir le bastion", href: "http://10.4.0.198:8080/guacamole", scope: "vpn" },
        { label: "SSH de gestion", cmd: "ssh -p 2223 <utilisateur>@10.4.0.198", scope: "cmd" },
      ],
    },
    {
      id: "web1", name: "WEB-01", dns: "web-01", ip: "10.0.10.1", zone: "web", os: "Debian", order: 9,
      role: "Frontal WordPress n° 1 : Apache + PHP. Serveur de référence pour le code.",
      ports: ["Apache 80", "SSH 22"],
      needs: "HAProxy (SQL), le cluster Galera",
      down: "HAProxy bascule sur WEB-02 en 6 secondes environ.",
      access: [
        { label: "Ouvrir le site WordPress", href: "http://10.4.0.198:8081", scope: "vpn", note: "Publié par pfSense, servi par WEB-01 ou WEB-02." },
      ],
    },
    {
      id: "web2", name: "WEB-02", dns: "web-02", ip: "10.0.10.4", zone: "web", os: "Debian", order: 10,
      role: "Frontal WordPress n° 2 : copie conforme de WEB-01.",
      ports: ["Apache 80", "SSH 22"],
      needs: "WEB-01 (source de la copie), HAProxy, le cluster Galera",
      down: "HAProxy bascule sur WEB-01 en 6 secondes environ.",
      access: [
        { label: "Ouvrir le site WordPress", href: "http://10.4.0.198:8081", scope: "vpn", note: "Publié par pfSense, servi par WEB-01 ou WEB-02." },
      ],
    },
    {
      id: "glpi", name: "GLPI-01", dns: "glpi", ip: "10.0.10.3", zone: "web", os: "Debian", order: 11, spof: true,
      role: "Outil de gestion de parc et de tickets : Apache + PHP + GLPI.",
      ports: ["Apache 80, publié par HAProxy sur 8080", "SSH 22"],
      needs: "HAProxy (SQL et publication), le cluster Galera",
      down: "GLPI est indisponible : frontal unique, limite assumée.",
      access: [
        { label: "GLPI (adresse interne)", href: "http://10.0.10.2:8080", scope: "interne", note: "Depuis CLI-01, ADM-01 ou une session du bastion." },
      ],
    },
  ],

  /* Scénarios animés. Une étape = un trajet "from" -> "to".
     "to" peut être une liste : la cible change à chaque tour (roundrobin). */
  scenarios: [
    {
      id: "apercu", label: "Vue d'ensemble",
      intro: "Chaque fonction vit dans sa zone. Rien ne passe d'une zone à l'autre sans traverser pfSense. Cliquez sur une machine pour ouvrir sa fiche.",
      steps: [],
    },
    {
      id: "visite", label: "Un visiteur ouvre le site",
      intro: "Le visiteur ne connaît qu'une adresse. Il ne sait jamais quel serveur lui répond.",
      steps: [
        { from: "client", to: "lab", kind: "http", tag: ":8081", text: "Le visiteur appelle http://10.4.0.198:8081." },
        { from: "lab", to: "fw", kind: "http", tag: ":8081", text: "La demande arrive sur l'adresse WAN de pfSense." },
        { from: "fw", to: "haproxy", kind: "http", tag: "NAT → :80", text: "pfSense la redirige vers HAProxy : jamais vers un serveur web en direct." },
        { from: "haproxy", to: ["web1", "web2"], kind: "http", tag: ":80", text: "HAProxy choisit un serveur web en état de marche, chacun son tour." },
        { from: ["web1", "web2"], to: "haproxy", kind: "sql", tag: ":3306", same: true, text: "WordPress lit sa base par 10.0.10.2:3306, pas par un nœud SQL." },
        { from: "haproxy", to: ["mysql1", "mysql2", "mysql3"], kind: "sql", tag: "SQL 3306", text: "pfSense ne laisse passer que HAProxy vers la base, sur le seul port 3306." },
      ],
    },
    {
      id: "glpi", label: "Un utilisateur ouvre GLPI",
      intro: "Depuis son poste, l'utilisateur passe par le répartiteur, comme pour le site.",
      steps: [
        { from: "cli01", to: "haproxy", kind: "http", tag: ":8080", text: "CLI-01 appelle http://10.0.10.2:8080. pfSense n'ouvre que les ports 80 et 8080 de HAProxy." },
        { from: "haproxy", to: "glpi", kind: "http", tag: ":80", text: "HAProxy transmet à GLPI-01, le seul serveur GLPI." },
        { from: "glpi", to: "haproxy", kind: "sql", tag: ":3306", text: "GLPI lit sa propre base, toujours à travers HAProxy." },
        { from: "haproxy", to: ["mysql1", "mysql2", "mysql3"], kind: "sql", tag: "SQL 3306", text: "La requête arrive sur l'un des trois nœuds Galera." },
      ],
    },
    {
      id: "galera", label: "La base se réplique",
      intro: "Une écriture validée est présente sur les trois nœuds : aucune perte si l'un tombe.",
      steps: [
        { from: "mysql1", to: "mysql2", kind: "galera", tag: "4567", text: "Une écriture faite sur MYSQL-01 est copiée sur MYSQL-02 avant d'être validée." },
        { from: "mysql2", to: "mysql3", kind: "galera", tag: "4567", text: "Et sur MYSQL-03. La réplication reste dans le VLAN : elle ne dépend pas de pfSense." },
        { from: "mysql3", to: "mysql2", kind: "galera", tag: "4567", text: "Chaque nœud accepte les écritures : il n'y a pas de serveur « principal »." },
      ],
    },
    {
      id: "admin", label: "L'administrateur intervient",
      intro: "Une seule porte d'administration : le bastion. Lui seul a le droit d'ouvrir le SSH vers les serveurs.",
      steps: [
        { from: "client", to: "lab", kind: "ssh", tag: "VPN", text: "L'administrateur active le VPN de l'école pour atteindre le réseau du labo." },
        { from: "lab", to: "fw", kind: "ssh", tag: ":8080", text: "Il ouvre http://10.4.0.198:8080/guacamole dans son navigateur." },
        { from: "fw", to: "guac", kind: "ssh", tag: "NAT → :8080", text: "pfSense redirige vers le bastion Guacamole, dans la zone d'administration." },
        { from: "guac", to: "web1", kind: "ssh", tag: "SSH 22", text: "Depuis le bastion, il ouvre une session SSH sur le serveur concerné." },
        { from: "guac", to: "mysql1", kind: "ssh", tag: "SSH 22", text: "Même chemin pour la base : seule vADMIN peut joindre le port 22." },
      ],
    },
    {
      id: "session", label: "Un utilisateur ouvre sa session",
      intro: "Un seul compte par personne, vérifié par l'annuaire.",
      steps: [
        { from: "cli01", to: "adm01", kind: "ad", tag: "AD", text: "Le poste interroge l'annuaire : DNS, Kerberos, LDAP, SMB. pfSense n'autorise que ces échanges." },
        { from: "adm01", to: "cli01", kind: "ad", tag: "OK", text: "ADM-01 vérifie le compte et le mot de passe : la session s'ouvre." },
      ],
    },
  ],

  /* Ordre de mise en place (étape 0 = le socle, pas une VM) */
  order: [
    { n: 0, title: "Socle Proxmox", why: "Le bridge VLAN-aware range chaque VM dans sa zone grâce à une étiquette." },
    { n: 1, title: "pfSense", node: "fw", why: "Passerelle de toutes les zones : sans lui, rien ne communique." },
    { n: 2, title: "ADM-01", node: "adm01", why: "L'annuaire vient avant les postes qui le rejoignent." },
    { n: 3, title: "CLI-01", node: "cli01", why: "Valide tout de suite la jonction au domaine et le filtrage." },
    { n: 4, title: "MYSQL-01", node: "mysql1", why: "La base avant ce qui s'en sert. Ce nœud crée le cluster." },
    { n: 5, title: "MYSQL-02", node: "mysql2", why: "Rejoint le cluster et reçoit une copie complète." },
    { n: 6, title: "MYSQL-03", node: "mysql3", why: "Le troisième nœud donne le quorum." },
    { n: 7, title: "HAProxy", node: "haproxy", why: "WordPress et GLPI joignent leur base à travers lui." },
    { n: 8, title: "Guacamole", node: "guac", why: "Le bastion enregistre ses comptes dans la base." },
    { n: 9, title: "WEB-01", node: "web1", why: "WordPress s'installe par l'adresse publiée." },
    { n: 10, title: "WEB-02", node: "web2", why: "Copie conforme de WEB-01." },
    { n: 11, title: "GLPI-01", node: "glpi", why: "En dernier : rien d'autre n'en dépend." },
  ],
};
