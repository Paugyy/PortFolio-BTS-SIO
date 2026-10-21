/* Script propre à la page index (sorti du HTML pour la CSP) */
// Texte "tapé à la machine" dans le hero
// Vraies commandes du quotidien : $ shell Linux · # root / pfSense · > PowerShell · Switch# Cisco IOS
const words = [
  "$ ssh -J bastion admin@web-01",     // rebond SSH par le bastion
  "> tnc dc01 -Port 389",              // le contrôleur de domaine répond-il en LDAP ?
  "$ journalctl -u haproxy -f",        // journaux HAProxy en direct
  "> Get-HotFix | sort InstalledOn",   // dernières mises à jour KB installées
  "Switch# show vlan brief",           // VLAN d'un switch Cisco
  "$ ss -tulpn | grep LISTEN",         // ports en écoute
  "# pfctl -s rules",                  // règles actives du pare-feu pfSense
  "> netsh wlan show profiles",        // profils Wi-Fi d'un poste
  "$ sudo tail -f /var/log/auth.log",  // connexions SSH en direct
  "> gpupdate /force",                 // appliquer les GPO tout de suite
  "$ dig +short paugy.org",            // résolution DNS
  "$ docker compose up -d",
  "$ git push origin main",            // et ce site se met à jour
];
const typed = document.getElementById("typed");
let wi = 0, ci = 0, del = false;
(function type() {
  const w = words[wi];
  typed.textContent = w.slice(0, ci);
  if (!del && ci < w.length) ci++;
  else if (del && ci > 0) ci--;
  else if (!del) { del = true; return setTimeout(type, 1600); }
  else { del = false; wi = (wi + 1) % words.length; }
  setTimeout(type, del ? 35 : 70);
})();

// Bandeau de technos (dupliqué pour une boucle infinie)
const techs = ["🐧 Linux", "🪟 Windows Server", "🔥 pfSense", "🖥️ Proxmox", "🐳 Docker", "🗂️ Active Directory", "🌐 Nginx", "🐘 PostgreSQL", "🔐 VPN", "🧭 Guacamole", "📦 Git / GitHub", "⚡ PowerShell", "🐚 Bash", "📡 Cisco", "🎫 GLPI", "☎️ Téléphonie Teams", "🛡️ HarfangLab EDR", "🥷 NinjaOne", "📶 Cisco Meraki", "💚 Vue.js"];
document.getElementById("marquee").innerHTML = [...techs, ...techs].map(t => `<span>${t}</span>`).join("");
