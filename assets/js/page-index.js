/* Script propre à la page index (sorti du HTML pour la CSP) */
// Texte "tapé à la machine" dans le hero
const words = ["$ sudo apt install passion", "> Get-ADUser -Filter *", "# pfctl -s rules", "$ docker compose up -d"];
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
