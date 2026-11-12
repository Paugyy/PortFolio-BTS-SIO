"""
build_procedures.py — génère la rubrique « Procédures » du portfolio.

Pour chaque procédure du CATALOGUE :
  1. (labo) recopie le mode opératoire depuis le dossier E6, liens internes réécrits
  2. assets/docs/procedures/<id>.md    → fichier Markdown téléchargeable
  3. assets/docs/procedures/html/<id>.html → contenu affiché par /procedure?id=<id>
  4. assets/docs/procedures/pdf/<id>.pdf   → PDF téléchargeable (Edge ou Chrome sans interface)
Puis : assets/js/procedures-data.js (catalogue) et une archive ZIP de tout.

Utilisation (depuis la racine du portfolio) :
    python -m pip install markdown        # une seule fois
    python tools/build_procedures.py      # tout régénérer
    python tools/build_procedures.py --sans-pdf   # plus rapide, sans les PDF
"""
import datetime, html, json, os, re, shutil, subprocess, sys, tempfile, unicodedata, zipfile
from pathlib import Path

import markdown

RACINE = Path(__file__).resolve().parent.parent
DOCS = RACINE / "assets" / "docs" / "procedures"
E6 = Path.home() / "Documents/10_BTS-SIO/14_E6/E6-SISR-PAUGY/2-a-rendre/eleves-livrables/paugy-yannis/annexes"

# groupe : "labo" = mon infrastructure réelle (dossier E6) · "guide" = guide de base générique
# ordre  : ordre d'affichage dans le groupe
CATALOGUE = [
    # ---------- Mon infrastructure haute disponibilité (labo réel) ----------
    dict(id="mo-01-galera", source="modes-operatoires/MO-1-Cluster-Galera.md", groupe="labo", theme="Bases de données et HA", icon="🗄️",
         resume="Monter la grappe MariaDB Galera de 3 nœuds : concepts, installation, configuration de chaque nœud, amorçage, validation et reprise après panne."),
    dict(id="mo-02-haproxy", source="modes-operatoires/MO-2-HAProxy.md", groupe="labo", theme="Bases de données et HA", icon="🔀",
         resume="Installer le répartiteur HAProxy : vérifications d'état, répartition HTTP (WordPress, GLPI) et accès SQL à la grappe."),
    dict(id="mo-03-wordpress-ha", source="modes-operatoires/MO-3-WordPress-HA.md", groupe="labo", theme="Applications", icon="🌐",
         resume="WordPress sur deux serveurs web : Apache, base commune, synchronisation des fichiers et test de bascule."),
    dict(id="mo-04-glpi", source="modes-operatoires/MO-4-GLPI.md", groupe="labo", theme="Applications", icon="🎫",
         resume="GLPI pour la gestion des incidents : installation, Apache, base sur la grappe et publication derrière HAProxy."),
    dict(id="mo-05-ssh-durcissement", source="modes-operatoires/MO-5-SSH-et-durcissement.md", groupe="labo", theme="Réseau et sécurité", icon="🔐",
         resume="Connexion SSH par clé, durcissement des serveurs, comptes à privilèges minimaux et gestion des secrets."),
    dict(id="mo-06-sauvegarde", source="modes-operatoires/MO-6-Sauvegarde-restauration.md", groupe="labo", theme="Sauvegarde", icon="💾",
         resume="Sauvegarder et restaurer MariaDB, WordPress, GLPI et les machines virtuelles Proxmox."),
    dict(id="mo-07-git", source="modes-operatoires/MO-7-Git-GitHub.md", groupe="labo", theme="Outils", icon="📦",
         resume="Versionner et publier la documentation avec Git et GitHub : flux de travail et organisation du dépôt."),
    dict(id="mo-08-zabbix", source="modes-operatoires/MO-8-Supervision-Zabbix.md", groupe="labo", theme="Supervision et journaux", icon="📡",
         resume="Installer Zabbix 7.0 LTS, stocker sa base sur la grappe via HAProxy et superviser les VM par agent."),
    dict(id="mo-09-rsyslog-loganalyzer", source="modes-operatoires/MO-9-Journalisation-Rsyslog-LogAnalyzer.md", groupe="labo", theme="Supervision et journaux", icon="📜",
         resume="Centraliser les journaux des serveurs avec Rsyslog et les consulter dans LogAnalyzer."),
    dict(id="mo-10-pfsense-journalisation", source="modes-operatoires/MO-10-pfSense-flux-journalisation.md", groupe="labo", theme="Réseau et sécurité", icon="🔥",
         resume="Ouvrir sur pfSense les flux de la journalisation : redirection NAT de LogAnalyzer et envoi Syslog vers le collecteur."),
    dict(id="plan-de-tests", source="documentation/Plan-de-tests.md", groupe="labo", theme="Tests et dépannage", icon="🧪",
         resume="Plan de tests et matrice de validation : bascule des serveurs web, panne d'un nœud Galera, répartiteur et réseau."),
    dict(id="depannage", source="documentation/Troubleshooting.md", groupe="labo", theme="Tests et dépannage", icon="🛠️",
         resume="Méthode de diagnostic et incidents réellement rencontrés, classés par composant : symptôme, cause, correction."),
    # ---------- Guides de base ----------
    dict(id="guide-proxmox-vm", groupe="guide", theme="Systèmes", icon="🖥️",
         resume="Créer une VM Debian sur Proxmox VE, installer l'agent invité et en faire un modèle réutilisable."),
    dict(id="guide-pfsense", groupe="guide", theme="Réseau et sécurité", icon="🔥",
         resume="Installer pfSense, créer des VLAN, écrire des règles de pare-feu, publier un service en NAT et monter un VPN OpenVPN."),
    dict(id="guide-active-directory", groupe="guide", theme="Systèmes", icon="🗂️",
         resume="Installer Active Directory sur Windows Server : promotion, OU, utilisateurs, GPO, en graphique et en PowerShell."),
    dict(id="guide-ssh-cle", groupe="guide", theme="Réseau et sécurité", icon="🔑",
         resume="Se connecter à un serveur Linux par clé et désactiver la connexion par mot de passe."),
    dict(id="guide-guacamole-docker", groupe="guide", theme="Réseau et sécurité", icon="🧭",
         resume="Déployer le bastion Apache Guacamole avec Docker Compose pour accéder aux serveurs depuis un navigateur."),
    dict(id="guide-docker-debian", groupe="guide", theme="Outils", icon="🐳",
         resume="Installer Docker et Docker Compose sur Debian depuis le dépôt officiel."),
    dict(id="guide-glpi-lamp", groupe="guide", theme="Applications", icon="🎫",
         resume="Installer GLPI sur un serveur LAMP Debian pour la gestion de parc et les tickets."),
]

PAR_FICHIER = {Path(p["source"]).name: p["id"] for p in CATALOGUE if p.get("source")}


def slug(texte):
    t = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode()
    t = re.sub(r"[^\w\s-]", "", t).strip().lower()
    return re.sub(r"[\s_-]+", "-", t) or "section"


def reecrire_liens(md):
    """Liens vers un autre document publié → page du portfolio ; autres liens relatifs → texte seul."""
    def remplace(m):
        texte, cible = m.group(1), m.group(2)
        if re.match(r"^(https?:|mailto:|#)", cible):
            return m.group(0)
        nom = Path(cible.split("#")[0]).name
        if nom in PAR_FICHIER:
            return f"[{texte}](/procedure?id={PAR_FICHIER[nom]})"
        return texte
    return re.sub(r"(?<!!)\[([^\]]+)\]\(([^)\s]+)\)", remplace, md)


def importer(p):
    src = E6 / p["source"]
    if not src.exists():
        print(f"   (source absente, je garde la copie existante) {src}")
        return
    md = reecrire_liens(src.read_text(encoding="utf-8"))
    # schémas du dépôt E6 → copies déjà publiées dans le portfolio
    md = re.sub(r'src="(?:\.\./)+diagrams/([\w-]+\.svg)"', r'src="/assets/img/ha/\1"', md)
    maj = datetime.date.fromtimestamp(src.stat().st_mtime).strftime("%d/%m/%Y")
    lignes = md.split("\n")
    note = (f"> 📁 Document de mon dossier E6 (BTS SIO SISR), tel que je l'ai rédigé pendant la mise en place de mon laboratoire. "
            f"Version du {maj}. Les adresses sont celles de mon laboratoire : adapte-les au tien.")
    lignes.insert(1, "\n" + note)
    (DOCS / f"{p['id']}.md").write_text("\n".join(lignes), encoding="utf-8", newline="\n")


def sans_sommaire(md):
    # Le sommaire écrit à la main fait doublon avec celui de la page : on le retire de l'affichage
    return re.sub(r"\n## Sommaire\n.*?(?=\n## |\n---)", "\n", md, flags=re.S)


def vers_html(md):
    conv = markdown.Markdown(extensions=["extra", "sane_lists", "toc"],
                             extension_configs={"toc": {"slugify": lambda v, s: slug(v), "toc_depth": "2-3"}})
    corps = conv.convert(md)
    corps = re.sub(r"<h1[^>]*>.*?</h1>\s*", "", corps, count=1, flags=re.S)       # le titre est affiché à part
    corps = corps.replace("<table>", '<div class="doc-table"><table>').replace("</table>", "</table></div>")
    corps = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener noreferrer"', corps)
    return corps, conv.toc_tokens


CSS_PDF = """
@page { size: A4; margin: 16mm 14mm 18mm; }
body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #0f172a; }
header.pdf { border-bottom: 3px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 18px; }
header.pdf .kick { color: #1d4ed8; font-weight: 700; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; }
header.pdf h1 { margin: 4px 0 6px; font-size: 19pt; }
header.pdf p { margin: 0; color: #475569; }
h2 { font-size: 14pt; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-top: 22px; page-break-after: avoid; }
h3 { font-size: 12pt; margin-top: 16px; page-break-after: avoid; }
h4 { font-size: 11pt; page-break-after: avoid; }
code { font-family: Consolas, monospace; font-size: 9pt; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
pre { background: #0f172a; color: #e2e8f0; padding: 10px 12px; border-radius: 6px; white-space: pre-wrap; word-break: break-word; page-break-inside: avoid; }
pre code { background: none; color: inherit; padding: 0; }
table { border-collapse: collapse; width: 100%; font-size: 9pt; margin: 10px 0; page-break-inside: auto; }
th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; vertical-align: top; }
th { background: #eff6ff; }
tr { page-break-inside: avoid; }
blockquote { margin: 10px 0; padding: 8px 12px; border-left: 4px solid #1d4ed8; background: #eff6ff; color: #1e293b; }
blockquote p { margin: 4px 0; }
a { color: #1d4ed8; text-decoration: none; }
hr { border: 0; border-top: 1px solid #e2e8f0; margin: 18px 0; }
img { max-width: 100%; height: auto; display: block; margin: 10px auto; }
footer.pdf { margin-top: 26px; padding-top: 8px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 8.5pt; }
"""


def navigateur():
    for c in [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe"]:
        if os.path.exists(c):
            return c
    return shutil.which("msedge") or shutil.which("chromium") or shutil.which("google-chrome")


def faire_pdf(p, titre, corps, sortie, tmp):
    groupe = "Mon infrastructure haute disponibilité" if p["groupe"] == "labo" else "Guide de base"
    corps_pdf = corps.replace('href="/procedure?id=', 'href="https://paugy.org/procedure?id=').replace('src="/assets/', f'src="{(RACINE / "assets").as_uri()}/')
    page = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{html.escape(titre)}</title><style>{CSS_PDF}</style></head>
<body><header class="pdf"><div class="kick">Procédure · {groupe} · {html.escape(p['theme'])}</div><h1>{html.escape(titre)}</h1><p>{html.escape(p['resume'])}</p></header>
{corps_pdf}
<footer class="pdf">Yannis Paugy — BTS SIO SISR · Version en ligne : https://paugy.org/procedure?id={p['id']}</footer></body></html>"""
    f = Path(tmp) / f"{p['id']}.html"
    f.write_text(page, encoding="utf-8")
    subprocess.run([navigateur(), "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--no-first-run",
                    f"--user-data-dir={Path(tmp) / 'profil'}", f"--print-to-pdf={sortie}", f.as_uri()],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)


def main():
    avec_pdf = "--sans-pdf" not in sys.argv
    (DOCS / "html").mkdir(parents=True, exist_ok=True)
    (DOCS / "pdf").mkdir(parents=True, exist_ok=True)
    if avec_pdf and not navigateur():
        sys.exit("Ni Edge ni Chrome trouvé : relance avec --sans-pdf")
    sortie = []
    with tempfile.TemporaryDirectory() as tmp:
        for ordre, p in enumerate(CATALOGUE, 1):
            print(f"-> {p['id']}")
            if p.get("source"):
                importer(p)
            md = (DOCS / f"{p['id']}.md").read_text(encoding="utf-8")
            titre = re.search(r"^# (.+)$", md, re.M).group(1).strip()
            corps, toc = vers_html(sans_sommaire(md))
            (DOCS / "html" / f"{p['id']}.html").write_text(corps, encoding="utf-8", newline="\n")
            pdf = DOCS / "pdf" / f"{p['id']}.pdf"
            if avec_pdf:
                faire_pdf(p, titre, corps, pdf, tmp)
            sections = [t["name"] for t in toc[0]["children"]] if len(toc) == 1 and toc[0]["level"] == 1 else [t["name"] for t in toc]
            sortie.append(dict(
                id=p["id"], titre=titre, resume=p["resume"], groupe=p["groupe"], theme=p["theme"], icon=p["icon"], ordre=ordre,
                sections=[html.unescape(s) for s in sections if s.lower() != "sommaire"],
                mots=len(re.findall(r"\w+", md)),
                pdfKo=round(pdf.stat().st_size / 1024) if pdf.exists() else None,
                mdKo=max(1, round(len(md.encode("utf-8")) / 1024)),
            ))
    archive = DOCS / "procedures-yannis-paugy.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sortie:
            prefixe = "1-mon-infrastructure-ha" if p["groupe"] == "labo" else "2-guides-de-base"
            nom = f"{prefixe}/{p['ordre']:02d}-{p['id']}"
            z.write(DOCS / f"{p['id']}.md", f"markdown/{nom}.md")
            if (DOCS / "pdf" / f"{p['id']}.pdf").exists():
                z.write(DOCS / "pdf" / f"{p['id']}.pdf", f"pdf/{nom}.pdf")
    js = ("/* =========================================================\n"
          "   procedures-data.js — GÉNÉRÉ par tools/build_procedures.py\n"
          "   Ne pas modifier à la main : modifier le CATALOGUE du script puis le relancer.\n"
          "   ========================================================= */\n"
          f"const PROCEDURES_MAJ = \"{datetime.date.today().strftime('%d/%m/%Y')}\";\n"
          f"const PROCEDURES_ZIP_KO = {round(archive.stat().st_size / 1024)};\n"
          "const PROCEDURES = " + json.dumps(sortie, ensure_ascii=False, indent=1) + ";\n")
    (RACINE / "assets" / "js" / "procedures-data.js").write_text(js, encoding="utf-8", newline="\n")
    print(f"OK : {len(sortie)} procédures, archive {round(archive.stat().st_size / 1024)} Ko")


if __name__ == "__main__":
    main()
