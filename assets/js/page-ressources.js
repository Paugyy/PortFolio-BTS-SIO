/* Script propre à la page ressources (sorti du HTML pour la CSP) */
/* ========= Commandes : [commande, description] — ["# Titre"] pour une catégorie ========= */
const CMDS = {
  linux: [
    ["# Navigation & fichiers"],
    ["pwd", "Afficher le dossier courant"],
    ["ls -la", "Lister tous les fichiers (cachés inclus) avec détails"],
    ["cd /chemin", "Changer de dossier"],
    ["mkdir -p a/b/c", "Créer des dossiers (et les parents)"],
    ["cp -r src dest", "Copier un dossier"],
    ["mv ancien nouveau", "Déplacer / renommer"],
    ["rm -rf dossier", "Supprimer un dossier (attention, définitif !)"],
    ["cat fichier", "Afficher un fichier"],
    ["tail -f /var/log/syslog", "Suivre un journal en temps réel"],
    ["find / -name 'fichier*'", "Rechercher un fichier"],
    ["grep -rn 'texte' /etc", "Rechercher du texte dans des fichiers"],
    ["nano fichier", "Éditer un fichier"],
    ["# Droits & utilisateurs"],
    ["chmod 755 fichier", "Changer les droits (rwx r-x r-x)"],
    ["chown user:groupe fichier", "Changer le propriétaire"],
    ["sudo adduser nom", "Créer un utilisateur"],
    ["sudo usermod -aG sudo nom", "Ajouter un utilisateur au groupe sudo"],
    ["passwd", "Changer son mot de passe"],
    ["whoami / id", "Qui suis-je / mes groupes"],
    ["# Paquets & services"],
    ["sudo apt update && sudo apt upgrade -y", "Mettre à jour le système"],
    ["sudo apt install paquet", "Installer un paquet"],
    ["systemctl status service", "État d'un service"],
    ["sudo systemctl restart service", "Redémarrer un service"],
    ["sudo systemctl enable --now service", "Activer au démarrage et lancer"],
    ["journalctl -u service -f", "Logs d'un service"],
    ["# Système & réseau"],
    ["ip a", "Voir les adresses IP"],
    ["ip r", "Voir la table de routage"],
    ["ss -tulpn", "Ports en écoute"],
    ["ping -c 4 8.8.8.8", "Tester la connectivité"],
    ["dig google.com", "Tester la résolution DNS"],
    ["sudo nano /etc/network/interfaces", "Configurer une IP fixe (Debian)"],
    ["df -h / free -h", "Espace disque / mémoire"],
    ["htop", "Processus en temps réel"],
    ["sudo ufw allow 22/tcp", "Ouvrir un port dans le pare-feu UFW"],
    ["tar -czvf archive.tar.gz dossier", "Compresser un dossier"],
    ["scp fichier user@ip:/chemin", "Copier un fichier vers un serveur"],
  ],
  windows: [
    ["# CMD"],
    ["ipconfig /all", "Configuration IP complète"],
    ["ipconfig /release & ipconfig /renew", "Renouveler l'adresse DHCP"],
    ["ipconfig /flushdns", "Vider le cache DNS"],
    ["ping -t 8.8.8.8", "Ping continu"],
    ["tracert google.com", "Tracer la route"],
    ["nslookup google.com", "Tester le DNS"],
    ["netstat -ano", "Connexions et ports ouverts (avec PID)"],
    ["gpupdate /force", "Appliquer les GPO immédiatement"],
    ["gpresult /r", "Voir les GPO appliquées"],
    ["sfc /scannow", "Réparer les fichiers système"],
    ["DISM /Online /Cleanup-Image /RestoreHealth", "Réparer l'image Windows"],
    ["whoami /groups", "Mes groupes"],
    ["net user nom /domain", "Infos sur un compte du domaine"],
    ["shutdown /r /t 0", "Redémarrer immédiatement"],
    ["# PowerShell"],
    ["Get-NetIPAddress", "Adresses IP"],
    ["New-NetIPAddress -InterfaceAlias Ethernet -IPAddress 192.168.1.10 -PrefixLength 24 -DefaultGateway 192.168.1.1", "Définir une IP fixe"],
    ["Set-DnsClientServerAddress -InterfaceAlias Ethernet -ServerAddresses 192.168.1.1", "Définir le DNS"],
    ["Test-NetConnection srv -Port 443", "Tester un port distant"],
    ["Rename-Computer -NewName SRV01 -Restart", "Renommer la machine"],
    ["Get-Service | Where Status -eq Running", "Services en cours"],
    ["Restart-Service nom", "Redémarrer un service"],
    ["Get-ADUser -Filter * | Select Name", "Lister les utilisateurs AD"],
    ["Unlock-ADAccount -Identity jdupont", "Déverrouiller un compte AD"],
    ["Set-ADAccountPassword jdupont -Reset", "Réinitialiser un mot de passe AD"],
    ["Get-WindowsFeature | Where Installed", "Rôles installés"],
    ["Get-EventLog -LogName System -Newest 20", "Derniers événements système"],
  ],
  reseau: [
    ["# Cisco IOS — bases"],
    ["enable", "Passer en mode privilégié"],
    ["configure terminal", "Entrer en mode configuration"],
    ["hostname SW1", "Nommer l'équipement"],
    ["show running-config", "Configuration en cours"],
    ["copy running-config startup-config", "Sauvegarder la configuration"],
    ["show ip interface brief", "Résumé des interfaces"],
    ["# VLAN"],
    ["vlan 10\\n name COMPTA", "Créer un VLAN"],
    ["interface fa0/1\\n switchport mode access\\n switchport access vlan 10", "Port en mode accès"],
    ["interface gi0/1\\n switchport mode trunk", "Port en mode trunk"],
    ["show vlan brief", "Lister les VLAN"],
    ["# Routage"],
    ["ip route 0.0.0.0 0.0.0.0 192.168.1.254", "Route par défaut"],
    ["interface gi0/0.10\\n encapsulation dot1Q 10\\n ip address 10.0.10.254 255.255.255.0", "Sous-interface (router-on-a-stick)"],
    ["show ip route", "Table de routage"],
    ["# Mémo sous-réseaux"],
    ["/24 = 255.255.255.0", "254 hôtes"],
    ["/25 = 255.255.255.128", "126 hôtes"],
    ["/26 = 255.255.255.192", "62 hôtes"],
    ["/27 = 255.255.255.224", "30 hôtes"],
    ["/28 = 255.255.255.240", "14 hôtes"],
    ["/30 = 255.255.255.252", "2 hôtes (liaison point à point)"],
  ],
  docker: [
    ["docker ps -a", "Lister tous les conteneurs"],
    ["docker images", "Lister les images"],
    ["docker run -d -p 8080:80 --name web nginx", "Lancer un conteneur"],
    ["docker exec -it web bash", "Ouvrir un terminal dans un conteneur"],
    ["docker logs -f web", "Suivre les logs"],
    ["docker stop web && docker rm web", "Arrêter et supprimer"],
    ["docker compose up -d", "Démarrer une stack Compose"],
    ["docker compose down", "Arrêter la stack"],
    ["docker compose up -d --build", "Reconstruire et redémarrer"],
    ["docker compose ps", "État des services"],
    ["docker network ls", "Lister les réseaux"],
    ["docker volume ls", "Lister les volumes"],
    ["docker system prune -a", "Nettoyer tout ce qui est inutilisé"],
  ],
  git: [
    ["git clone URL", "Récupérer un dépôt"],
    ["git status", "Voir les changements"],
    ["git add .", "Préparer tous les fichiers"],
    ["git commit -m \"message\"", "Enregistrer une version"],
    ["git push", "Envoyer sur GitHub"],
    ["git pull", "Récupérer les changements"],
    ["git checkout -b ma-branche", "Créer une branche"],
    ["git log --oneline --graph", "Historique compact"],
    ["git diff", "Voir les différences"],
  ],
};

// Construction des tableaux
document.querySelectorAll("table[data-src]").forEach(t => {
  const rows = CMDS[t.dataset.src].map(r =>
    r.length === 1
      ? `<tr class="cat-row"><td colspan="2">${r[0].slice(2)}</td></tr>`
      : `<tr><td><button class="cmd" data-cmd="${r[0].replace(/"/g, "&quot;")}">${r[0].split("\\n")[0]}${r[0].includes("\\n") ? " …" : ""}</button></td><td>${r[1]}</td></tr>`
  ).join("");
  t.innerHTML = `<thead><tr><th>Commande</th><th>Description</th></tr></thead><tbody>${rows}</tbody>`;
});

// Copier une commande au clic
document.addEventListener("click", e => {
  const b = e.target.closest(".cmd");
  if (!b) return;
  navigator.clipboard.writeText(b.dataset.cmd.replace(/\\n/g, "\n")).then(() => {
    b.classList.add("copied");
    setTimeout(() => b.classList.remove("copied"), 1200);
  });
});

// Recherche instantanée
const search = document.getElementById("search");
search.addEventListener("input", () => {
  const q = search.value.toLowerCase().trim();
  let hits = 0;
  document.querySelectorAll(".cmd-table tbody tr:not(.cat-row)").forEach(tr => {
    const ok = !q || tr.textContent.toLowerCase().includes(q) || tr.querySelector(".cmd").dataset.cmd.toLowerCase().includes(q);
    tr.classList.toggle("hidden-by-search", !ok);
    if (ok) hits++;
  });
  document.querySelectorAll(".cat-row").forEach(tr => tr.classList.toggle("hidden-by-search", !!q));
  document.querySelectorAll(".res-section").forEach(s => {
    if (s.id === "guides") return;
    s.classList.toggle("hidden-by-search", !!q && !s.querySelector("tbody tr:not(.cat-row):not(.hidden-by-search)"));
  });
  document.querySelectorAll("details.guide").forEach(d => {
    const ok = !q || d.textContent.toLowerCase().includes(q);
    d.classList.toggle("hidden-by-search", !ok);
    if (ok) hits++;
  });
  document.getElementById("empty").hidden = hits > 0;
});

// Surligner la section active dans le sommaire
const links = document.querySelectorAll("#toc a");
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll(".res-section").forEach(s => io.observe(s));
