# Troubleshooting — incidents rencontrés et résolution

> 📁 Document de mon dossier E6 (BTS SIO SISR), tel que je l'ai rédigé pendant la mise en place de mon laboratoire. Version du 06/11/2026. Les adresses sont celles de mon laboratoire : adapte-les au tien.

Méthode de diagnostic, puis incidents classés par composant (symptôme → cause → correction).

> 🔐 Aucun mot de passe ni clé dans ce document : les secrets sont remplacés par des marque-places.

> ⚠️ **Écarts avec le labo réel** (configuration relevée le 01/10/2026, voir le DAT §7.2) :
> HAProxy contrôle ses serveurs **toutes les 2 s** (`inter 2s fall 3 rise 2`), le contrôle SQL est un simple
> test de port (`tcp-check`, pas `mysql-check`), et il n'y a **ni page de statistiques (8404) ni en-tête
> `X-Served-By`** : les passages qui les citent décrivent une cible, pas l'existant. adm-01 est le contrôleur
> de domaine Windows : les commandes notées « sur adm-01 » se jouent depuis une session du bastion Guacamole.

## Sommaire

- Méthodologie de diagnostic
- Journal des incidents
- pfSense — Dépannage
- Galera — Dépannage
- Dépannage — Galera
- HAProxy — Dépannage
- Dépannage — HAProxy
- WordPress — Dépannage
- Dépannage — WordPress
- Dépannage — Apache
- GLPI — Dépannage
- Dépannage — SSH
- Dépannage — APT / dpkg

---

## Méthodologie de diagnostic

### Démarche

```text
1. Observer      Quel est le symptôme exact ? (message, code, depuis quand, qui est touché)
2. Délimiter     Quel maillon de la chaîne ? (client → pfSense → HAProxy → web → HAProxy → Galera)
3. Hypothèses    Quelles causes possibles, de la plus probable à la moins probable ?
4. Tester        Une hypothèse à la fois, avec une commande dont le résultat est sans ambiguïté
5. Corriger      Le minimum nécessaire, en sauvegardant avant de modifier
6. Valider       Rejouer le test qui échouait + les tests de non-régression
7. Documenter    incidents.md
```

### Suivre la chaîne

Pour WordPress, tester chaque maillon **de l'intérieur vers l'extérieur** :

| # | Maillon | Commande | Machine |
|---|---------|----------|---------|
| 1 | Galera | `./scripts/validation/check-galera.sh` | bdd-0X |
| 2 | HAProxy → Galera | `nc -zv 10.0.20.1 3306` | haproxy |
| 3 | SQL via HAProxy | `mariadb -h 10.0.10.2 -u wordpress -p -e 'SELECT 1'` | web-01 |
| 4 | Apache/PHP local | `curl -sI http://localhost/wp-login.php` | web-01 |
| 5 | HAProxy → web | `curl -sI http://10.0.10.1/` | haproxy |
| 6 | Point d'entrée | `curl -sI http://10.0.10.2/` | adm-01 |
| 7 | NAT | `curl -sI http://10.4.0.198:8081/` | Poste labo |

Le premier maillon en échec localise le problème.

### Lire les messages réseau

| Message | Signification | Où chercher |
|---------|---------------|-------------|
| `Connection refused` | Le paquet est arrivé, rien n'écoute sur ce port/IP | Service arrêté, `bind-address`, mauvais port |
| `Connection timed out` | Aucune réponse : paquet bloqué ou perdu | Pare-feu (pfSense, nftables), routage, VM éteinte |
| `No route to host` | Pas de chemin ou hôte injoignable en couche 2 | IP, passerelle, VLAN |
| `Name or service not known` | Résolution DNS impossible | `/etc/resolv.conf`, DNS pfSense |
| HTTP `503` (HAProxy) | Aucun serveur sain dans le backend | Health-checks, backends |
| HTTP `502` (HAProxy) | Réponse invalide du backend | Apache/PHP plante |
| HTTP `404` | Ressource introuvable | DocumentRoot, réécriture |
| HTTP `500` | Erreur applicative | Journal Apache / PHP |

### Boîte à outils

| Besoin | Commande |
|--------|----------|
| État d'un service | `systemctl status <service> --no-pager` |
| Journal d'un service | `journalctl -u <service> -n 50 --no-pager` (`-f` en direct) |
| Ports en écoute | `sudo ss -ltnp` |
| Test de port distant | `nc -zv -w 3 <ip> <port>` |
| Test HTTP | `curl -sI <url>` ; `curl -v <url>` |
| IP et routes | `ip -4 addr` ; `ip route` |
| Résolution | `getent hosts <nom>` |
| Espace disque | `df -h` ; `du -sh /var/lib/mysql` |
| Configuration Apache | `apachectl configtest` ; `apache2ctl -S` |
| Configuration HAProxy | `haproxy -c -f /etc/haproxy/haproxy.cfg` |

### Bonnes pratiques

- **Une modification à la fois**, puis test : sinon impossible de savoir laquelle a corrigé (ou aggravé).
- **Sauvegarder** un fichier avant de le modifier (`cp fichier fichier.$(date +%F).orig`).
- **Snapshot Proxmox** avant une opération risquée (bootstrap Galera, changement de règles).
- **Noter** les commandes et résultats au fil de l'eau : c'est la matière de incidents.md.

---

## Journal des incidents

Incidents **réellement rencontrés** pendant la construction du lab, documentés au format :
**Symptôme → Cause probable → Diagnostic → Commandes → Correction → Validation**.

> Les messages d'erreur sont reproduits sous leur forme standard. Compléter les champs *Date* lors de la mise à jour du journal ; aucune donnée sensible (mot de passe, clé) n'y figure.

| ID | Titre | Composant | VM | Gravité |
|----|-------|-----------|----|---------|
| [INC-01](#inc-01--cluster-galera-non-primary) | Cluster Galera non Primary | Galera | bdd-0X | Critique |
| [INC-02](#inc-02--bind-address-incorrect) | bind-address incorrect | MariaDB | bdd-01/02/03 | Bloquant |
| [INC-03](#inc-03--dpkg-interrompu) | dpkg interrompu | APT | Toutes | Bloquant |
| [INC-04](#inc-04--rsync-absent) | rsync absent | Système | bdd-0X, web-0X | Bloquant |
| [INC-05](#inc-05--glpi--erreur-404-apache) | GLPI : erreur 404 Apache | Apache / GLPI | glpi | Majeur |
| [INC-06](#inc-06--ssh-permission-denied-publickey) | SSH Permission denied (publickey) | SSH | Toutes | Bloquant |
| [INC-07](#inc-07--remote-host-identification-has-changed) | REMOTE HOST IDENTIFICATION HAS CHANGED | SSH | adm-01 | Sécurité |
| [INC-08](#inc-08--conflit-avec-le-compte-système-haproxy) | Conflit avec le compte système haproxy | HAProxy | haproxy | Majeur |
| Registre du 06/11 : INC-01 à INC-10, OBS-11 | Journalisation centralisée : droits, NAT 2233, `403` Apache, Rsyslog absent, clés SSH (06/11/2026) | Rsyslog · Apache · pfSense · SSH | zabbix, fw-01, émetteurs | Majeur |

---

### INC-01 — Cluster Galera non Primary

*Date : `<AAAA-MM-JJ>` — VM : bdd-0X*

**Symptôme**

- WordPress : « Erreur lors de la connexion à la base de données ».
- Sur un nœud : `ERROR 1047 (08S01): WSREP has not yet prepared node for application use`.
- `wsrep_cluster_status = non-Primary`.

**Cause probable**

Perte de quorum : le nœud ne voit plus la majorité du cluster (arrêt brutal de plusieurs nœuds, coupure réseau, redémarrage de l'hôte Proxmox). Par sécurité (anti split-brain), un composant minoritaire refuse toute requête.

**Diagnostic**

Déterminer combien de nœuds tournent, ce que chacun voit, et lequel est le plus à jour.

**Commandes**

```bash
# SUR CHAQUE NŒUD
systemctl is-active mariadb
sudo mariadb -e "SHOW STATUS WHERE Variable_name IN ('wsrep_cluster_size','wsrep_cluster_status','wsrep_local_state_comment','wsrep_last_committed');"
# SUR CHAQUE NŒUD ARRÊTÉ
sudo cat /var/lib/mysql/grastate.dat
sudo galera_recovery
```

**Correction**

Selon le scénario de [MO-1-Cluster-Galera.md](/procedure?id=mo-01-galera) :

- nœuds en marche, réseau rétabli → le cluster se reforme seul ;
- tous arrêtés → bootstrap du nœud `safe_to_bootstrap: 1` (ou du `seqno` le plus élevé), **puis** `systemctl start mariadb` sur les autres.

Jamais de `galera_new_cluster` sur plusieurs nœuds.

**Validation**

```bash
# SUR CHAQUE NŒUD
./scripts/validation/check-galera.sh       # 3 / Primary / Synced / ON
```

**Leçon** : le comportement `non-Primary` est une protection, pas une panne de Galera. Un snapshot Proxmox avant chaque manipulation risquée simplifie la reprise.

---

### INC-02 — bind-address incorrect

*Date : `<AAAA-MM-JJ>` — VM : bdd-01, bdd-02, bdd-03*

**Symptôme**

```text
ERROR 2002 (HY000): Can't connect to MySQL server on '10.0.20.2' (111 "Connection refused")
```

Les nœuds ne se joignent pas sur 3306 ; le health-check HAProxy marque les serveurs DOWN.

**Cause probable**

Valeur par défaut Debian dans `/etc/mysql/mariadb.conf.d/50-server.cnf` :

```ini
bind-address = 127.0.0.1
```

MariaDB n'écoute que sur la boucle locale : toute connexion venant du réseau est **refusée** (le paquet arrive, mais aucun processus n'écoute sur l'IP du VLAN).

**Diagnostic**

`Connection refused` (refus immédiat) et non `timed out` : ce n'est pas le pare-feu, c'est le service.

**Commandes**

```bash
# SUR bdd-02
sudo ss -ltnp | grep 3306                     # 127.0.0.1:3306 → problème
grep -n bind-address /etc/mysql/mariadb.conf.d/*.cnf
```

**Correction**

Chaque nœud écoute sur **sa propre IP** du VLAN vBDD :

| Nœud | `bind-address` |
|------|----------------|
| bdd-01 | `10.0.20.1` |
| bdd-02 | `10.0.20.2` |
| bdd-03 | `10.0.20.3` |

```bash
# SUR bdd-02 (adapter l'IP sur chaque nœud)
sudo sed -i 's/^bind-address.*/bind-address            = 10.0.20.2/' /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb
```

Choix de l'IP précise plutôt que `0.0.0.0` : MariaDB n'est joignable que par l'interface prévue.

**Validation**

```bash
# SUR bdd-02
sudo ss -ltnp | grep 3306                     # 10.0.20.2:3306
# SUR haproxy
nc -zv 10.0.20.2 3306                         # succeeded
```

La CI vérifie désormais que `bind-address` = `wsrep_node_address` dans les fichiers d'exemple.

---

### INC-03 — dpkg interrompu

*Date : `<AAAA-MM-JJ>` — VM : plusieurs*

**Symptôme**

```text
E: dpkg was interrupted, you must manually run 'sudo dpkg --configure -a' to correct the problem.
```

Plus aucune commande `apt install` ne fonctionne.

**Cause probable**

Installation interrompue : session SSH coupée, VM redémarrée ou `Ctrl+C` pendant `apt install`, laissant des paquets à moitié configurés.

**Diagnostic**

```bash
# SUR LA VM CONCERNÉE
sudo dpkg --audit
ps aux | grep -E 'apt|dpkg' | grep -v grep      # une autre installation en cours ?
```

**Commandes / Correction**

```bash
# SUR LA VM CONCERNÉE
sudo dpkg --configure -a
sudo apt --fix-broken install -y
sudo apt update
```

**Validation**

```bash
sudo dpkg --audit            # aucune sortie
sudo apt install -y rsync    # une installation fonctionne à nouveau
```

**Prévention** : lancer les installations longues dans `tmux` ou `screen` pour survivre à une déconnexion. Fiche : apt-dpkg.md

---

### INC-04 — rsync absent

*Date : `<AAAA-MM-JJ>` — VM : bdd-0X / web-0X*

**Symptôme**

```text
bash: rsync: command not found
```

Côté Galera, un nœud ne parvient pas à rejoindre le cluster (journal : échec du script `wsrep_sst_rsync`) ; côté WordPress, la synchronisation web-01 → web-02 échoue.

**Cause probable**

`rsync` n'est pas installé par défaut sur une Debian minimale. La méthode SST `wsrep_sst_method = rsync` et la synchronisation de fichiers l'exigent **aux deux extrémités** (le binaire distant est lancé par SSH ou par le script SST).

**Diagnostic**

```bash
# SUR LES DEUX MACHINES CONCERNÉES
command -v rsync || echo "rsync absent"
# SUR LE NŒUD QUI NE REJOINT PAS
sudo journalctl -u mariadb -n 50 --no-pager | grep -i -E 'sst|rsync'
```

**Correction**

```bash
# SUR bdd-01, bdd-02, bdd-03, web-01, web-02
sudo apt install -y rsync
```

**Validation**

```bash
rsync --version | head -n1
# Galera : le nœud rejoint
./scripts/validation/check-galera.sh
```

`rsync` fait désormais partie des paquets installés par `install-galera.sh` et `install-wordpress-deps.sh`.

---

### INC-05 — GLPI : erreur 404 Apache

*Date : `<AAAA-MM-JJ>` — VM : glpi*

**Symptôme**

La page d'accueil de GLPI s'affiche, mais la navigation (`/front/central.php`, après connexion) renvoie `404 Not Found`.

**Cause probable**

Problème de **RewriteRule** : GLPI 10 route toutes les requêtes vers `public/index.php`. Les règles de réécriture n'étaient pas appliquées correctement (placées hors du bloc `<Directory>`, et/ou `mod_rewrite` non activé), et `DocumentRoot` ne pointait pas sur `public/`.

**Diagnostic**

```bash
# SUR glpi
apache2ctl -M | grep rewrite
apache2ctl -S
sudo grep -n -i -E 'DocumentRoot|Directory|Rewrite' /etc/apache2/sites-available/glpi.conf
sudo tail -n 20 /var/log/apache2/glpi-error.log
```

**Correction**

```bash
# SUR glpi
sudo a2enmod rewrite
sudo cp configs/apache/glpi.conf.example /etc/apache2/sites-available/glpi.conf
sudo apachectl configtest && sudo systemctl reload apache2
```

Avec : `DocumentRoot /var/www/glpi/public` et les `RewriteCond`/`RewriteRule` **dans** `<Directory /var/www/glpi/public>`. Explication : [MO-4-GLPI.md](/procedure?id=mo-04-glpi).

**Validation**

```bash
curl -sI http://10.0.10.3/front/central.php | head -n1    # 302 (vers login), plus de 404
./scripts/validation/check-glpi.sh
```

---

### INC-06 — SSH Permission denied (publickey)

*Date : `<AAAA-MM-JJ>` — VM : plusieurs*

**Symptôme**

```text
<ADMIN_USER>@10.0.20.1: Permission denied (publickey).
```

**Cause probable**

Confusion entre clé privée et clé publique : la **clé privée** avait été placée dans `~/.ssh/authorized_keys` du serveur.

`authorized_keys` doit contenir les **clés publiques autorisées** (`id_ed25519.pub`, une ligne commençant par `ssh-ed25519 AAAA…`), et **non** la clé privée (bloc multiligne dont l'en-tête contient `BEGIN OPENSSH PRIVATE KEY`). Autres causes possibles : droits trop ouverts sur `~/.ssh`, mauvais utilisateur.

**Diagnostic**

```bash
# SUR adm-01 — mode verbeux : quelle clé est proposée ?
ssh -v <ADMIN_USER>@10.0.20.1 2>&1 | grep -E 'Offering|Authentications|denied'
# SUR LE SERVEUR (console Proxmox)
head -c 40 ~/.ssh/authorized_keys; echo       # doit commencer par ssh-ed25519
ls -ld ~/.ssh ~/.ssh/authorized_keys
sudo journalctl -u ssh -n 20 --no-pager
```

**Correction**

```bash
# SUR LE SERVEUR : retirer toute clé privée copiée par erreur
rm ~/.ssh/authorized_keys
# SUR adm-01 : déposer la clé PUBLIQUE
ssh-copy-id -i ~/.ssh/id_ed25519.pub <ADMIN_USER>@10.0.20.1
# SUR LE SERVEUR : droits
chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
```

Une clé privée qui a transité sur un serveur doit être considérée comme **exposée** : en générer une nouvelle et retirer l'ancienne clé publique de tous les serveurs.

**Validation**

```bash
# SUR adm-01
ssh -o BatchMode=yes <ADMIN_USER>@10.0.20.1 hostname
```

---

### INC-07 — REMOTE HOST IDENTIFICATION HAS CHANGED

*Date : `<AAAA-MM-JJ>` — VM : adm-01 (client)*

**Symptôme**

```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Host key verification failed.
```

**Cause probable**

La VM répondant sur cette IP présente une clé d'hôte différente de celle mémorisée : VM **réinstallée** (nouvelles clés générées) ou IP **réattribuée** à une autre VM. Mais c'est aussi exactement le symptôme d'une attaque de l'**homme du milieu**.

**Diagnostic**

Ne **pas** supprimer l'entrée par réflexe. Vérifier d'abord :

1. La VM a-t-elle été réinstallée ou son IP réaffectée (par moi, récemment) ?
2. L'empreinte annoncée correspond-elle à celle de la VM, lue par un canal de confiance ?

```bash
# SUR LA VM (console Proxmox, canal de confiance)
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Comparer avec l'empreinte `SHA256:…` affichée dans l'avertissement.

**Correction**

Uniquement si les empreintes correspondent :

```bash
# SUR adm-01
ssh-keygen -R 10.0.20.1
ssh <ADMIN_USER>@10.0.20.1          # accepter la nouvelle empreinte
```

Si elles ne correspondent pas : **ne pas se connecter** ; rechercher une usurpation d'IP (doublon d'adresse, VM inconnue).

**Validation**

Connexion sans avertissement ; nouvelle empreinte enregistrée dans `~/.ssh/known_hosts`.

---

### INC-08 — Conflit avec le compte système haproxy

*Date : `<AAAA-MM-JJ>` — VM : haproxy*

**Symptôme**

Erreurs ou avertissements lors de `apt install haproxy` concernant l'utilisateur `haproxy` déjà existant ; service démarré avec un compte doté d'un shell et d'un répertoire personnel.

**Cause probable**

Lors de l'installation de Debian, l'utilisateur **humain** avait été nommé `haproxy`. Or le paquet `haproxy` crée un compte **système** du même nom (uid < 1000, shell `/usr/sbin/nologin`, home `/var/lib/haproxy`) pour exécuter le service avec des privilèges minimaux. Les deux usages entrent en conflit.

**Diagnostic**

```bash
# SUR haproxy
getent passwd haproxy          # uid ≥ 1000 et /bin/bash → compte humain : problème
id haproxy
```

**Correction**

Séparer les deux rôles :

| Compte | Type | Usage |
|--------|------|-------|
| `haproxyadmin` | Humain (uid ≥ 1000, sudo) | Administration de la VM |
| `haproxy` | Système (paquet) | Exécution du service |

```bash
# SUR haproxy (depuis la console ou un autre compte sudo)
sudo adduser haproxyadmin
sudo usermod -aG sudo haproxyadmin
# se reconnecter en haproxyadmin, vérifier sudo, puis :
sudo deluser --remove-home haproxy      # supprime le compte humain
sudo apt install --reinstall haproxy    # recrée le compte système proprement
```

**Validation**

```bash
getent passwd haproxy          # haproxy:x:1xx:...:/var/lib/haproxy:/usr/sbin/nologin
ps -o user= -C haproxy | sort -u   # haproxy
./scripts/validation/check-haproxy.sh
```

`install-haproxy.sh` détecte désormais ce cas avant l'installation.

---

### Journalisation centralisée (06/11/2026)

Registre complet (contexte, erreur exacte, cause, correction exécutée, validation) : `../incidents/2026-11-06-journalisation-centralisee.md`. Numérotation propre à ce registre.

| ID | Symptôme | Cause | Correction | État |
|---|---|---|---|---|
| INC-01 | `install: invalid user 'syslog'` | Pas de compte `syslog` sur Debian 12 | `root:www-data`, `0750` / `0640` | ✅ |
| INC-02 | `Permission denied` sur `central.log` (compte `zabbix`) | Droits restreints, voulu | Lecture avec `sudo` | ✅ |
| INC-03 | `AH00558 … fully qualified domain name` | Pas de `ServerName` global | Non bloquant (`Syntax OK`) | ✅ |
| INC-04 | `http://10.4.0.198:2233/` ne répond pas | Ni NAT 2233 ni règle WAN vers 8085 dans l'export de 07:38 | Transfert mis en place ([MO-10](/procedure?id=mo-10-pfsense-journalisation)) | ✅ (règles à relire) |
| INC-05 | `403`, `AH01630: client denied` pour `10.2.0.122` | Réseau du poste absent de `Require ip` | Réseau ajouté, `Require valid-user` conservé | ✅ |
| INC-06 | `main configuration file is missing!` | Assistant LogAnalyzer pas joué | `install.php`, source `SYSLOG-CENTRAL` | ✅ |
| INC-07 | `central.log: No such file or directory` sur web-01 | Contrôle lancé sur l'émetteur | Lire sur 10.0.30.3 | ✅ procédure |
| INC-08 | `rsyslogd: command not found` sur web-01 | Rsyslog pas installé | `apt install rsyslog`, `enable --now` | ✅ 8/8 |
| INC-09 | `REMOTE HOST IDENTIFICATION HAS CHANGED` (MYSQL-03, 2227) | Ancienne clé d'hôte dans `known_hosts` | Entrée ciblée retirée, nouvelle empreinte acceptée | ✅ (contrôle Proxmox à documenter) |
| INC-10 | `Permission denied (publickey)` (MYSQL-03) | Cause non établie | Compte, `authorized_keys`, droits vérifiés | ✅ connexion rétablie |
| OBS-11 | `mariadbd` : `Aborted connection … to db: 'zabbix'` | Non diagnostiqué | — | 👁 à surveiller |

---

### Ajouter un incident

Copier un bloc ci-dessus, incrémenter l'ID, renseigner tous les champs, ajouter la ligne au tableau et un commit `docs(troubleshooting): add INC-0X ...`. Méthode : diagnostic-methodology.md.

---

## pfSense — Dépannage

### Une VM ne joint pas sa passerelle

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `ping 10.0.X0.254` échoue depuis une VM |
| **Cause probable** | Mauvais tag VLAN sur la carte Proxmox, `vmbr1` non *VLAN aware*, interface pfSense non activée, mauvaise IP/masque dans la VM |
| **Diagnostic** | Comparer tag Proxmox, IP de la VM et interface pfSense |
| **Commandes** | `ip -4 addr` et `ip route` (VM) ; `qm config <vmid> \| grep net` (hôte Proxmox) ; *Status → Interfaces* (pfSense) |
| **Correction** | Corriger le tag (`qm set <vmid> --net0 virtio,bridge=vmbr1,tag=302`) ou l'adresse |
| **Validation** | `ping -c 2 10.0.X0.254` réussi |

### Un flux inter-VLAN est bloqué

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `Connection timed out` entre deux VLAN (ex. HAProxy → bdd-01:3306) |
| **Cause probable** | Règle absente, mal placée (sous un *Block*) ou sur la mauvaise interface (doit être sur l'interface **source**) |
| **Diagnostic** | Journal pare-feu ; *Diagnostics → States* pendant le test |
| **Commandes** | **SUR haproxy** `nc -zv -w 3 10.0.20.1 3306` ; **SUR PFSENSE** *Status → System Logs → Firewall* |
| **Correction** | Ajouter / déplacer la règle *Pass* sur l'interface vWEB |
| **Validation** | `nc -zv 10.0.20.1 3306` → `succeeded` |

> `Connection refused` (refus immédiat) ≠ `timed out` (silence). Un refus signifie que le paquet **est arrivé** mais que rien n'écoute : le problème est sur le serveur (service arrêté, `bind-address`), pas sur pfSense.

### Le NAT ne fonctionne pas

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `http://10.4.0.198:8081` ne répond pas depuis le réseau labo |
| **Cause probable** | *Block private networks* coché sur le WAN ; règle WAN associée absente ; HAProxy arrêté |
| **Diagnostic** | Tester d'abord HAProxy de l'intérieur, puis le NAT |
| **Commandes** | **SUR adm-01** `curl -I http://10.0.10.2` ; **SUR PFSENSE** *Interfaces → WAN* et *Firewall → Rules → WAN* |
| **Correction** | Décocher *Block private networks and loopback addresses* ; recréer la règle associée |
| **Validation** | `curl -I http://10.4.0.198:8081` → `HTTP/1.1 200` ou `30x` |

### Perte d'accès à l'interface web

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `https://10.0.30.254` inaccessible après modification des règles |
| **Cause probable** | Règle d'administration supprimée, anti-lockout désactivé |
| **Diagnostic** | Console Proxmox de la VM pfSense |
| **Commandes** | Console : option *8) Shell*, puis `pfctl -d` (désactive le filtrage **temporairement**) |
| **Correction** | Recréer la règle vADMIN → 443, puis `pfctl -e` |
| **Validation** | Accès web rétabli avec filtrage actif |

### Les VM n'accèdent pas aux dépôts Debian

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `apt update` : `Temporary failure resolving 'deb.debian.org'` |
| **Cause probable** | Règle DNS absente, NAT sortant désactivé, résolveur pfSense non configuré |
| **Commandes** | `cat /etc/resolv.conf` ; `ping -c 2 10.0.X0.254` ; `getent hosts deb.debian.org` |
| **Correction** | Autoriser 53 vers l'adresse pfSense du VLAN ; `nameserver 10.0.X0.254` dans la VM |
| **Validation** | `sudo apt update` sans erreur |

---

## Galera — Dépannage

Fiches détaillées et incidents réels : 09-troubleshooting/galera.md et incidents.md.

### Arbre de décision

```text
check-galera.sh en échec
│
├── "Connexion à MariaDB impossible"
│     └── systemctl status mariadb ──► inactif ? ──► journalctl -u mariadb -n 50
│
├── wsrep_cluster_size < 3
│     ├── nœud manquant arrêté ? ──► systemctl start mariadb (PAS de bootstrap)
│     └── nœud en marche mais isolé ? ──► réseau / ports 4567-4568-4444 / cluster_name
│
├── wsrep_cluster_status = non-Primary
│     └── perte de quorum ──► recovery.md (NE PAS redémarrer au hasard)
│
├── wsrep_local_state_comment ≠ Synced
│     ├── Joiner / Donor ──► SST en cours : attendre, surveiller le journal
│     └── bloqué ──► rsync présent ? port 4444 ouvert ? espace disque ?
│
└── wsrep_ready = OFF
      └── le nœud n'accepte pas de requêtes ──► voir état et statut ci-dessus
```

### Commandes de diagnostic

| Objectif | Commande (SUR LE NŒUD CONCERNÉ) |
|----------|----------------------------------|
| Journal | `sudo journalctl -u mariadb -n 100 --no-pager` |
| Fichier d'erreurs | `sudo tail -n 100 /var/log/mysql/error.log` |
| Ports en écoute | `sudo ss -ltnp \| grep -E '3306\|4567\|4568\|4444'` |
| Joindre un voisin | `nc -zv 10.0.20.2 4567` |
| État Galera | `sudo cat /var/lib/mysql/grastate.dat` |
| Membres vus | `sudo mariadb -e "SHOW STATUS LIKE 'wsrep_incoming_addresses'"` |
| Configuration effective | `sudo mariadb -e "SHOW VARIABLES LIKE 'wsrep_%'"` |
| Espace disque | `df -h /var/lib/mysql` |

### Messages fréquents

| Message dans le journal | Cause | Correction |
|-------------------------|-------|------------|
| `Can't connect to MySQL server ... (111 "Connection refused")` | Service arrêté ou `bind-address = 127.0.0.1` | INC-02 |
| `WSREP: failed to open gcomm backend connection: 110: failed to reach primary view` | Aucun pair joignable | Démarrer un nœud du cluster d'abord ; ou bootstrap si création |
| `WSREP: It may not be safe to bootstrap the cluster from this node` | `safe_to_bootstrap: 0` | [MO-1-Cluster-Galera.md](/procedure?id=mo-01-galera) |
| `rsync: command not found` / `wsrep_sst_rsync ... failed` | rsync absent | INC-04 |
| `gcs connect failed: Connection timed out` | Port 4567 filtré | Pare-feu local / VLAN |
| `node uses different cluster name` (`wsrep_cluster_name` différent) | Faute de frappe | Aligner `wsrep_cluster_name` sur les 3 nœuds |
| `Deadlock found when trying to get lock` (côté application) | Conflit de certification multi-maître | Rejouer la transaction ; envisager un écrivain unique |

---

## Dépannage — Galera

Voir aussi : 03-galera/troubleshooting.md (arbre de décision) et [MO-1-Cluster-Galera.md](/procedure?id=mo-01-galera).

### Un nœud ne rejoint pas le cluster

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `systemctl start mariadb` échoue ou reste en `Joining` ; `wsrep_cluster_size` reste à 2 sur les autres |
| **Cause probable** | Ports 4567/4568/4444 bloqués ; `rsync` absent ; `wsrep_cluster_name` différent ; espace disque insuffisant pour le SST |
| **Diagnostic** | Lire le journal du nœud **et** du donneur |
| **Commandes** | **SUR LE NŒUD** `sudo journalctl -u mariadb -n 100 --no-pager` ; `command -v rsync` ; `df -h /var/lib/mysql` ; `nc -zv 10.0.20.1 4567` ; `grep wsrep_cluster_name /etc/mysql/mariadb.conf.d/60-galera.cnf` |
| **Correction** | Installer rsync ; ouvrir les ports (nftables) ; aligner le nom du cluster ; libérer de l'espace |
| **Validation** | `check-galera.sh` : `cluster_size = 3`, `Synced` |

### Nœud bloqué en Donor/Desynced

| Élément | Contenu |
|---------|---------|
| **Symptôme** | Un nœud `Donor/Desynced` longtemps ; requêtes lentes ou bloquées sur ce nœud |
| **Cause probable** | SST rsync en cours vers un nœud qui rejoint : le donneur est verrouillé pendant la copie |
| **Diagnostic** | Un autre nœud est en `Joiner` ? |
| **Commandes** | **SUR haproxy** `./scripts/utilities/show-cluster-status.sh -w 5` |
| **Correction** | Attendre la fin du SST. Pour éviter le blocage : `wsrep_sst_method = mariabackup` (paquet `mariadb-backup`, compte SST dédié) |
| **Validation** | Les deux nœuds reviennent `Synced` |

### Conflits d'écriture (Deadlock)

| Élément | Contenu |
|---------|---------|
| **Symptôme** | Erreurs applicatives intermittentes `ERROR 1213 (40001): Deadlock found when trying to get lock` |
| **Cause probable** | Deux transactions concurrentes modifient la même ligne via deux nœuds différents : la seconde échoue à la certification |
| **Commandes** | **SUR UN NŒUD** `sudo mariadb -e "SHOW STATUS LIKE 'wsrep_local_cert_failures'"` |
| **Correction** | Passer HAProxy SQL en **écrivain unique** (variante commentée de `haproxy.cfg.example`) |
| **Validation** | `wsrep_local_cert_failures` n'augmente plus |

### Taille de cluster incohérente entre nœuds

| Élément | Contenu |
|---------|---------|
| **Symptôme** | bdd-01 annonce `cluster_size = 2`, bdd-03 annonce `1` |
| **Cause probable** | Partition réseau ou nœud bootstrappé à tort (deux clusters distincts) |
| **Commandes** | **SUR CHAQUE NŒUD** `sudo mariadb -e "SHOW STATUS LIKE 'wsrep_cluster_state_uuid'"` — UUID différents = **deux clusters** |
| **Correction** | Choisir le cluster de référence (données les plus récentes), arrêter le nœud de l'autre cluster, le redémarrer normalement pour qu'il reçoive un SST. Les écritures faites sur le cluster écarté sont **perdues** |
| **Validation** | Même `wsrep_cluster_state_uuid` et `cluster_size = 3` partout |

### MariaDB ne démarre plus après modification de configuration

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `Job for mariadb.service failed` |
| **Cause probable** | Faute de frappe dans un `.cnf`, option inconnue |
| **Commandes** | `sudo journalctl -u mariadb -n 30 --no-pager` ; `sudo mariadbd --help --verbose >/dev/null` |
| **Correction** | Corriger la ligne signalée ; comparer avec `configs/galera/` |
| **Validation** | Démarrage normal, `check-galera.sh` OK |

---

## HAProxy — Dépannage

Fiches complètes : 09-troubleshooting/haproxy.md

### Réflexes

```bash
# SUR haproxy
sudo haproxy -c -f /etc/haproxy/haproxy.cfg      # syntaxe
sudo systemctl status haproxy --no-pager         # état du service
sudo journalctl -u haproxy -n 50 --no-pager      # journal
sudo ss -ltnp | grep haproxy                     # ports en écoute
./scripts/validation/check-haproxy.sh            # synthèse + état des backends
```

### Symptômes fréquents

| Symptôme | Cause probable | Vérification | Correction |
|----------|----------------|--------------|------------|
| `503 Service Unavailable` | Tous les serveurs du backend DOWN | `check-haproxy.sh` | Réparer les backends (Apache, PHP, base) |
| Service ne démarre pas : `cannot bind socket [10.0.10.2:80]` | IP absente de la VM, ou port déjà pris (Apache installé sur HAProxy ?) | `ip a`, `ss -ltnp \| grep :80` | Corriger l'IP / désinstaller le service concurrent |
| Backend WordPress DOWN alors que le site répond en direct | Health-check reçoit `404`/`500` (URI, Host) | `curl -I -H 'Host: 10.0.10.2' http://10.0.10.1/wp-login.php` | Adapter `http-check send` ou `expect` |
| Backend SQL DOWN : `mysql-check` en échec | Compte `haproxy_check` absent ou mauvais hôte | `mariadb -h 10.0.20.1 -u haproxy_check -e 'SELECT 1'` | `CREATE USER 'haproxy_check'@'10.0.10.2';` |
| Nœuds bloqués après trop de checks échoués | `Host '10.0.10.2' is blocked because of many connection errors` | Journal MariaDB | `sudo mariadb-admin flush-hosts` sur le nœud ; corriger la cause |
| Une seule machine répond toujours | Cookie de persistance dans le navigateur | `curl` sans cookie | Comportement normal |
| `reload` sans effet | Erreur de syntaxe : ancienne config conservée | `haproxy -c` | Corriger, puis `reload` |

---

## Dépannage — HAProxy

### 503 Service Unavailable

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `curl -I http://10.0.10.2` → `HTTP/1.1 503 Service Unavailable` |
| **Cause probable** | Tous les serveurs du backend sont DOWN (Apache arrêté, health-check en échec, base inaccessible) |
| **Diagnostic** | Pourquoi le health-check échoue-t-il ? |
| **Commandes** | **SUR haproxy** `./scripts/validation/check-haproxy.sh` ; `sudo journalctl -u haproxy -n 30 --no-pager \| grep -i down` ; `curl -sI -H 'Host: 10.0.10.2' http://10.0.10.1/wp-login.php` |
| **Correction** | Réparer le backend (service, PHP, base) ou corriger l'URI / le code attendu du health-check |
| **Validation** | `check-wordpress.sh` : HAProxy UP |

### HAProxy ne démarre pas

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `systemctl start haproxy` échoue |
| **Cause probable** | Erreur de syntaxe ; IP `10.0.10.2` absente ; port déjà utilisé (Apache ou MariaDB installés sur la VM HAProxy) |
| **Commandes** | `sudo haproxy -c -f /etc/haproxy/haproxy.cfg` ; `ip -4 addr` ; `sudo ss -ltnp \| grep -E ':(80\|3306\|8080)\b'` |
| **Correction** | Corriger la ligne signalée ; libérer le port (`sudo systemctl disable --now apache2`) |
| **Validation** | `systemctl is-active haproxy` → `active` |

### Backends SQL DOWN

| Élément | Contenu |
|---------|---------|
| **Symptôme** | Les 3 serveurs `galera_cluster` DOWN, alors que Galera est sain |
| **Cause probable** | Compte `haproxy_check` absent ou créé pour un autre hôte ; règle pfSense HAProxy → 3306 absente ; hôte bloqué par MariaDB |
| **Commandes** | **SUR haproxy** `nc -zv 10.0.20.1 3306` ; `mariadb -h 10.0.20.1 -u haproxy_check -e 'SELECT 1'` |
| **Correction** | `CREATE USER 'haproxy_check'@'10.0.10.2';` ; règle pfSense ; **SUR LE NŒUD** `sudo mariadb-admin flush-hosts` si `Host '10.0.10.2' is blocked` |
| **Validation** | `check-haproxy.sh` : bdd-01/02/03 UP |

### Un serveur oscille UP/DOWN (flapping)

| Élément | Contenu |
|---------|---------|
| **Symptôme** | Journal : alternance `is DOWN` / `is UP` |
| **Cause probable** | Serveur surchargé, health-check trop exigeant (`timeout check` court), réseau instable |
| **Commandes** | `sudo journalctl -u haproxy --since '10 min ago' \| grep -E 'UP\|DOWN'` ; **SUR LE BACKEND** `uptime`, `free -m` |
| **Correction** | Traiter la charge ; ajuster `inter`, `fall`, `timeout check` |
| **Validation** | Plus d'oscillation sur 10 minutes |

### Page de statistiques inaccessible

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `http://10.0.10.2:8404/stats` : `403 Forbidden` ou timeout |
| **Cause probable** | `403` : requête hors de vADMIN (ACL `from_admin`) ; timeout : règle pfSense absente |
| **Commandes** | **SUR adm-01** `curl -sI http://10.0.10.2:8404/stats` |
| **Correction** | Accéder depuis adm-01 ou Guacamole ; règle vADMIN → 8404 |
| **Validation** | `401` (authentification demandée) puis page affichée avec le mot de passe |

---

## WordPress — Dépannage

Fiches complètes : 09-troubleshooting/wordpress.md et apache.md

### « Erreur lors de la connexion à la base de données »

| Élément | Contenu |
|---------|---------|
| **Symptôme** | Page blanche avec ce message, sur un ou les deux serveurs |
| **Cause probable** | HAProxy SQL indisponible ; cluster non-Primary ; mauvais `DB_HOST`/`DB_PASSWORD` ; compte créé pour le mauvais hôte |
| **Diagnostic** | Tester la chaîne maillon par maillon |
| **Commandes** | **SUR web-01** `mariadb -h 10.0.10.2 -u wordpress -p -e 'SELECT 1'` ; **SUR haproxy** `./scripts/validation/check-haproxy.sh` ; **SUR bdd-01** `./scripts/validation/check-galera.sh` |
| **Correction** | Selon le maillon défaillant |
| **Validation** | `check-wordpress.sh` : HAProxy UP |

### Redirection vers une mauvaise adresse

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `http://10.4.0.198:8081` redirige vers `http://10.0.10.1/` ou `http://10.0.10.2/` (injoignable depuis le WAN) |
| **Cause probable** | `siteurl` / `home` enregistrés lors de l'installation via une autre adresse |
| **Commandes** | **SUR bdd-01** `sudo mariadb -e "SELECT option_name, option_value FROM wordpress.wp_options WHERE option_name IN ('siteurl','home');"` |
| **Correction** | Définir `WP_HOME` et `WP_SITEURL` dans `wp-config.php` (sur les **deux** serveurs) avec l'URL utilisée par les clients |
| **Validation** | `curl -sI http://10.4.0.198:8081 \| grep -i location` : pas de redirection vers une IP interne |

### Images cassées une fois sur deux

| Élément | Contenu |
|---------|---------|
| **Symptôme** | Un média s'affiche ou non selon le rafraîchissement |
| **Cause probable** | Fichier présent sur un seul serveur (Galera ne réplique pas les fichiers) |
| **Commandes** | **SUR web-01 et web-02** `ls -l /var/www/wordpress/wp-content/uploads/AAAA/MM/` |
| **Correction** | Synchroniser depuis web-01 ([MO-3-WordPress-HA.md](/procedure?id=mo-03-wordpress-ha)) |
| **Validation** | `curl -sI` sur l'URL du média : `200` sur web-01 **et** web-02 |

### Déconnexion de wp-admin en boucle

| Élément | Contenu |
|---------|---------|
| **Symptôme** | Retour à l'écran de connexion après chaque clic |
| **Cause probable** | Clés/sels différents entre web-01 et web-02 ; URL du site incohérente (cookie posé pour un autre domaine) |
| **Commandes** | **SUR web-01 et web-02** `sudo sha256sum /var/www/wordpress/wp-config.php` |
| **Correction** | Copier le `wp-config.php` de web-01 vers web-02 |
| **Validation** | Empreintes identiques ; navigation dans wp-admin stable |

---

## Dépannage — WordPress

Fiches détaillées : 05-wordpress/troubleshooting.md

| Symptôme | Cause probable | Commande de diagnostic | Correction |
|----------|----------------|------------------------|------------|
| « Erreur lors de la connexion à la base de données » | Chaîne SQL rompue (HAProxy, Galera, identifiants) | **SUR web-01** `mariadb -h 10.0.10.2 -u wordpress -p -e 'SELECT 1'` | Maillon défaillant ; `DB_HOST`/`DB_PASSWORD` |
| `Access denied for user 'wordpress'@'10.0.10.2'` | Compte créé pour `10.0.10.1`/`10.0.10.4` | **SUR bdd-01** `SELECT user,host FROM mysql.user WHERE user='wordpress';` | Créer le compte pour `10.0.10.2` |
| Redirection vers une IP interne | `siteurl`/`home` incohérents | **SUR bdd-01** `SELECT option_value FROM wordpress.wp_options WHERE option_name IN ('siteurl','home');` | `WP_HOME`/`WP_SITEURL` dans `wp-config.php` |
| Images cassées une fois sur deux | Fichiers non synchronisés | **SUR web-01 et web-02** `ls wp-content/uploads/...` | rsync web-01 → web-02 |
| Déconnexion en boucle | Clés/sels différents | `sha256sum wp-config.php` sur les deux | Copier le fichier de web-01 |
| Page blanche | Erreur PHP fatale | **SUR web-0X** `sudo tail -n 30 /var/log/apache2/wordpress-error.log` | Désactiver l'extension en cause (renommer son dossier) |
| Versions différentes entre serveurs | Mise à jour faite sur un seul serveur | `grep wp_version /var/www/wordpress/wp-includes/version.php` sur les deux | Mettre à jour web-01 puis synchroniser |
| « Briefly unavailable for scheduled maintenance » | Fichier `.maintenance` restant après une mise à jour interrompue | `ls -la /var/www/wordpress/.maintenance` | Supprimer le fichier (sur les deux serveurs) |

---

## Dépannage — Apache

### Commandes de base

```bash
# SUR web-01 / web-02 / glpi
sudo apachectl configtest                         # syntaxe
sudo apache2ctl -S                                # vhosts actifs et vhost par défaut
apache2ctl -M                                     # modules chargés
sudo systemctl status apache2 --no-pager
sudo tail -n 50 /var/log/apache2/error.log
ls -l /etc/apache2/sites-enabled/
```

### Fiches

| Symptôme | Cause probable | Diagnostic | Correction | Validation |
|----------|----------------|------------|------------|------------|
| Page « Apache2 Debian Default Page » | `000-default` actif, vhost du projet non activé | `ls /etc/apache2/sites-enabled/` | `a2dissite 000-default && a2ensite wordpress` (ou `glpi`) + `reload` | La page de l'application s'affiche |
| `404` sur les permaliens WordPress | `mod_rewrite` inactif ou `AllowOverride None` | `apache2ctl -M \| grep rewrite` ; vhost | `a2enmod rewrite` ; `AllowOverride All` | `/sample-page/` s'affiche |
| `404` sur les pages GLPI | Voir INC-05 | | | |
| `403 Forbidden` | Droits fichiers, `Require all denied`, `Options -Indexes` sans `index.php` | `namei -l /var/www/wordpress/index.php` ; journal d'erreurs | Propriétaire `www-data`, droits 755/644 ; `Require all granted` | `200` |
| Code PHP affiché en clair | Module PHP absent | `apache2ctl -M \| grep php` | `apt install libapache2-mod-php` + `restart` | Page exécutée |
| `AH00558: Could not reliably determine the server's fully qualified domain name` | `ServerName` global absent (avertissement sans gravité) | — | `echo 'ServerName localhost' \| sudo tee /etc/apache2/conf-available/servername.conf && sudo a2enconf servername` | Avertissement disparu |
| Journaux montrant toujours `10.0.10.2` | `mod_remoteip` inactif | `apache2ctl -M \| grep remoteip` | `a2enmod remoteip` + directives `RemoteIP*` | IP clients visibles |
| `reload` sans effet | Erreur de syntaxe : ancienne config conservée | `apachectl configtest` | Corriger | `Syntax OK` |

---

## GLPI — Dépannage

### Erreur 404 sur toutes les pages sauf l'accueil

Incident réel : INC-05

| Élément | Contenu |
|---------|---------|
| **Symptôme** | La page de connexion s'affiche, mais après authentification ou sur `/front/...` : `404 Not Found` (page Apache) |
| **Cause probable** | `mod_rewrite` inactif, `DocumentRoot` pointant sur `/var/www/glpi` au lieu de `/public`, ou règles de réécriture hors du bloc `<Directory>` |
| **Diagnostic** | Vérifier module, vhost actif et journal d'erreurs |
| **Commandes** | **SUR glpi** `apache2ctl -M \| grep rewrite` ; `apache2ctl -S` ; `grep -n -A12 '<Directory' /etc/apache2/sites-available/glpi.conf` ; `sudo tail -n 20 /var/log/apache2/glpi-error.log` |
| **Correction** | `sudo a2enmod rewrite` ; vhost conforme à `glpi.conf.example` (dépôt GitHub) ; `sudo systemctl reload apache2` |
| **Validation** | `curl -sI http://10.0.10.3/front/central.php` → `302` (et non `404`) |

### Page Apache par défaut au lieu de GLPI

| Élément | Contenu |
|---------|---------|
| **Symptôme** | « Apache2 Debian Default Page » |
| **Cause probable** | Site `000-default` toujours actif ou `glpi.conf` non activé |
| **Commandes** | **SUR glpi** `ls -l /etc/apache2/sites-enabled/` |
| **Correction** | `sudo a2dissite 000-default && sudo a2ensite glpi && sudo systemctl reload apache2` |
| **Validation** | `check-glpi.sh` : « la page servie est bien GLPI » |

### Erreur de connexion SQL

| Élément | Contenu |
|---------|---------|
| **Symptôme** | `Connection to the database failed` |
| **Cause probable** | Compte créé pour un autre hôte que `10.0.10.2`, HAProxy SQL indisponible, cluster non-Primary |
| **Commandes** | **SUR glpi** `mariadb -h 10.0.10.2 -u glpi -p -e 'SELECT 1'` |
| **Correction** | `CREATE USER 'glpi'@'10.0.10.2' ...` ; voir HAProxy / Galera |
| **Validation** | Connexion SQL OK, interface GLPI fonctionnelle |

### Avertissement « Web server root directory configuration is not safe »

| Élément | Contenu |
|---------|---------|
| **Symptôme** | Avertissement de sécurité dans l'assistant ou la page d'accueil |
| **Cause** | `DocumentRoot` sur `/var/www/glpi` : `config/` et `files/` accessibles par URL |
| **Correction** | `DocumentRoot /var/www/glpi/public` + réécritures |
| **Validation** | `curl -sI http://10.0.10.3/config/config_db.php` → `404` |

---

## Dépannage — SSH

Incidents réels : INC-06, INC-07. Bonnes pratiques : [MO-5-SSH-et-durcissement.md](/procedure?id=mo-05-ssh-durcissement).

### Diagnostic universel

```bash
# SUR LE CLIENT (adm-01) — mode très verbeux
ssh -vvv mysql01
```

Lignes utiles : `Connecting to`, `Server host key`, `Offering public key`, `Authentications that can continue`, `Permission denied`.

```bash
# SUR LE SERVEUR (console Proxmox si SSH est inaccessible)
sudo journalctl -u ssh -n 30 --no-pager
sudo sshd -t                                   # syntaxe de sshd_config
```

### Fiches

| Symptôme | Cause probable | Commandes | Correction | Validation |
|----------|----------------|-----------|------------|------------|
| `Permission denied (publickey)` | Clé publique absente de `authorized_keys`, clé privée copiée à la place, droits trop ouverts | `ls -la ~/.ssh` (serveur) ; `ssh -v` (client) | `ssh-copy-id` ; `chmod 700 ~/.ssh`, `chmod 600 ~/.ssh/authorized_keys` | Connexion par clé |
| `REMOTE HOST IDENTIFICATION HAS CHANGED` | VM réinstallée, IP réattribuée… ou attaque | `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` (console VM) | **Après vérification** : `ssh-keygen -R <ip>` | Connexion, nouvelle empreinte acceptée |
| `Connection timed out` | Règle pfSense absente (source hors vADMIN), VM éteinte | `nc -zv -w 3 <ip> 22` ; journal pfSense | Règle vADMIN → 22 | `nc` : succeeded |
| `Connection refused` | `sshd` arrêté ou non installé | `systemctl status ssh` (console) | `sudo apt install openssh-server` ; `systemctl enable --now ssh` | Port 22 en écoute |
| `UNPROTECTED PRIVATE KEY FILE!` | Clé privée lisible par d'autres (fréquent sous Windows) | `ls -l ~/.ssh/id_ed25519` | `chmod 600 ~/.ssh/id_ed25519` (Windows : propriétés → sécurité, propriétaire seul) | Clé acceptée |
| `Too many authentication failures` | L'agent propose trop de clés | `ssh-add -l` | `IdentitiesOnly yes` + `IdentityFile` dans `~/.ssh/config` | Connexion |
| Coupé de SSH après durcissement | `PasswordAuthentication no` avant d'avoir installé la clé | Console Proxmox | Réactiver temporairement, installer la clé, re-durcir | Connexion par clé |

---

## Dépannage — APT / dpkg

Incident réel : INC-03

### dpkg interrompu

```text
E: dpkg was interrupted, you must manually run 'sudo dpkg --configure -a' to correct the problem.
```

```bash
# SUR LA VM CONCERNÉE
sudo dpkg --configure -a
sudo apt --fix-broken install -y
sudo apt update
```

### Verrou APT occupé

```text
E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 1234 (apt)
```

| Étape | Commande |
|-------|----------|
| Identifier le processus | `ps -fp 1234` |
| S'il s'agit d'une installation légitime (unattended-upgrades) | **Attendre** sa fin |
| S'il est figé depuis longtemps | `sudo kill 1234`, puis `sudo dpkg --configure -a` |

Ne **jamais** supprimer les fichiers de verrou à la main pendant qu'un processus APT tourne : risque de corruption de la base dpkg.

### Dépendances cassées

```text
The following packages have unmet dependencies: ...
```

```bash
sudo apt --fix-broken install
sudo apt update && sudo apt full-upgrade
apt-cache policy <paquet>       # versions disponibles et dépôt d'origine
```

### Résolution DNS impossible

```text
Temporary failure resolving 'deb.debian.org'
```

```bash
cat /etc/resolv.conf            # nameserver = passerelle pfSense du VLAN ?
ping -c 2 10.0.X0.254
getent hosts deb.debian.org
```

Correction : règle pfSense DNS (53) et NAT sortant — voir 02-pfsense/troubleshooting.md.

### Signatures / dépôts

```text
The following signatures couldn't be verified because the public key is not available
```

Cause habituelle : dépôt tiers ajouté sans sa clé. Dans ce projet, **seuls les dépôts Debian officiels** sont utilisés (MariaDB, Galera, HAProxy, Apache, PHP) : supprimer tout dépôt tiers non nécessaire dans `/etc/apt/sources.list.d/`.

### Prévention

- Lancer les installations longues dans `tmux` (`sudo apt install tmux`).
- Snapshot Proxmox avant une mise à jour majeure.
- `sudo apt update` avant chaque `apt install`.
