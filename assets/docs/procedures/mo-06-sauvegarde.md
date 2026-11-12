# MO-6 — Sauvegarde et restauration

> 📁 Document de mon dossier E6 (BTS SIO SISR), tel que je l'ai rédigé pendant la mise en place de mon laboratoire. Version du 10/10/2026. Les adresses sont celles de mon laboratoire : adapte-les au tien.

MariaDB, WordPress, GLPI et machines virtuelles Proxmox.

> 🔐 Aucun mot de passe ni clé dans ce document : les secrets sont remplacés par des marque-places.

## Sommaire

- Sauvegarde et restauration — MariaDB
- Sauvegarde et restauration — WordPress
- Sauvegarde et restauration — GLPI
- Sauvegarde et restauration — Proxmox et pfSense

---

## Sauvegarde et restauration — MariaDB

### Sauvegarde

Un **seul nœud** suffit (les données sont identiques). bdd-03 est recommandé : en mode round-robin il reçoit autant de trafic que les autres, mais en mode écrivain unique (bdd-01 actif), il est le moins sollicité.

**SUR bdd-03**

```bash
sudo ./scripts/backup/backup-mariadb.sh
sudo ./scripts/backup/backup-mariadb.sh --retention 14     # supprime les sauvegardes de plus de 14 jours
ls -lh /var/backups/mariadb/
```

Ce que fait le script :

1. Vérifie que le nœud est `Synced` (sinon abandon).
2. `mariadb-dump --all-databases --single-transaction --routines --events --triggers` : instantané cohérent **sans verrou global**, le cluster continue de servir.
3. Compression gzip, droits `600`, empreinte SHA-256, test d'intégrité.

#### Planification (exemple, statut : futur)

```bash
# SUR bdd-03 — /etc/cron.d/backup-mariadb
30 2 * * * root /opt/bts-sio-ha-infrastructure/scripts/backup/backup-mariadb.sh --retention 14 >> /var/log/backup-mariadb.log 2>&1
```

#### Sauvegarde d'une seule base

```bash
# SUR bdd-03
sudo mariadb-dump --single-transaction --routines --triggers wordpress | gzip > /var/backups/mariadb/wordpress-$(date +%F).sql.gz
```

### Restauration

> Une restauration sur un nœud Galera est **répliquée sur tout le cluster**. C'est le comportement voulu pour revenir en arrière, mais il écrase les données actuelles des trois nœuds. Vérifier deux fois la base cible.

#### Restaurer une base (ex. WordPress)

```bash
# SUR bdd-01
sha256sum -c /var/backups/mariadb/<FICHIER>.sql.gz.sha256        # intégrité
# Extraire la base wordpress d'un dump complet n'est pas trivial : préférer un dump par base,
# ou restaurer le dump complet sur un environnement de test et exporter la base voulue.
gunzip -c /var/backups/mariadb/wordpress-<DATE>.sql.gz | sudo mariadb wordpress
```

#### Restaurer tout le cluster (dump complet)

1. **SUR bdd-01** : `gunzip -c <FICHIER>.sql.gz | sudo mariadb`
2. La restauration est répliquée sur bdd-02 et bdd-03.
3. Valider : `check-galera.sh` sur chaque nœud, puis WordPress et GLPI.

#### Restauration après perte totale des 3 nœuds

1. Réinstaller **un** nœud, le bootstrapper (cluster vide).
2. Restaurer le dump sur ce nœud.
3. Démarrer les deux autres nœuds : ils reçoivent les données par SST.

### Vérification d'une sauvegarde (sans restaurer en production)

```bash
# SUR UNE VM DE TEST
gunzip -t <FICHIER>.sql.gz
gunzip -c <FICHIER>.sql.gz | grep -c 'CREATE TABLE'
gunzip -c <FICHIER>.sql.gz | head -n 20
```

---

## Sauvegarde et restauration — WordPress

Une sauvegarde WordPress complète = **base** (mariadb.md) + **fichiers** (ci-dessous). L'une sans l'autre ne suffit pas : la base référence des médias présents seulement sur disque.

### Sauvegarde des fichiers

web-01 étant le serveur de référence des fichiers, c'est lui qui est sauvegardé.

**SUR web-01**

```bash
sudo ./scripts/backup/backup-wordpress.sh
ls -lh /var/backups/wordpress/
```

L'archive contient `wp-config.php` (mot de passe SQL, clés) : droits `600`, stockage chiffré hors du lab, **jamais** dans Git.

### Restauration

#### Restaurer les fichiers sur web-01

```bash
# SUR web-01
sha256sum -c /var/backups/wordpress/<FICHIER>.tar.gz.sha256
sudo mv /var/www/wordpress /var/www/wordpress.before-restore-$(date +%F)
sudo tar -xzf /var/backups/wordpress/<FICHIER>.tar.gz -C /var/www/
sudo chown -R www-data:www-data /var/www/wordpress
sudo chown root:www-data /var/www/wordpress/wp-config.php && sudo chmod 640 /var/www/wordpress/wp-config.php
```

#### Propager vers web-02

Synchronisation habituelle : [MO-3-WordPress-HA.md](/procedure?id=mo-03-wordpress-ha).

#### Cohérence base / fichiers

Restaurer la base et les fichiers **de la même date**. Sinon : médias manquants (fichiers plus anciens que la base) ou orphelins (fichiers plus récents).

### Reconstruire un serveur web perdu

Grâce à la redondance, la perte de web-02 ne nécessite **aucune sauvegarde** :

1. Recréer la VM (Debian, IP `10.0.10.4`, VLAN 301).
2. [MO-3-WordPress-HA.md](/procedure?id=mo-03-wordpress-ha) : dépendances, vhost, copie des fichiers depuis web-01.
3. HAProxy le réintègre automatiquement dès que le health-check réussit.

---

## Sauvegarde et restauration — GLPI

GLPI n'étant **pas redondé**, sa sauvegarde est la seule protection contre la perte de glpi.

### Données à sauvegarder

| Donnée | Emplacement | Contenu |
|--------|-------------|---------|
| Base `glpi` | Galera | Tickets, parc, utilisateurs, paramètres |
| Documents joints | `/var/www/glpi/files/` | Pièces jointes, images, exports |
| Configuration | `/var/www/glpi/config/` | `config_db.php` (identifiants SQL), clé de chiffrement `glpicrypt.key` |
| Extensions | `/var/www/glpi/plugins/`, `/var/www/glpi/marketplace/` | Plugins installés |

> `glpicrypt.key` chiffre certains secrets stockés en base (mots de passe LDAP, SMTP…). Sans elle, ces secrets sont **irrécupérables** après restauration. Elle doit être sauvegardée avec la même protection qu'un mot de passe.

### Sauvegarde

**SUR bdd-03** — base :

```bash
sudo mariadb-dump --single-transaction --routines --triggers glpi | gzip > /var/backups/mariadb/glpi-$(date +%F).sql.gz
sudo chmod 600 /var/backups/mariadb/glpi-*.sql.gz
```

**SUR glpi** — fichiers :

```bash
sudo install -d -m 700 /var/backups/glpi
sudo tar -czf /var/backups/glpi/glpi-files-$(date +%F).tar.gz -C /var/www glpi/files glpi/config glpi/plugins glpi/marketplace
sudo chmod 600 /var/backups/glpi/*.tar.gz
```

### Restauration (glpi reconstruit)

1. [MO-4-GLPI.md](/procedure?id=mo-04-glpi) : dépendances, **même version** de GLPI, vhost.
2. Restaurer `files/`, `config/`, `plugins/`, `marketplace/` depuis l'archive ; `chown -R www-data:www-data /var/www/glpi`.
3. Si la base a été perdue : la restaurer sur Galera (`gunzip -c glpi-<DATE>.sql.gz | sudo mariadb glpi`).
4. Vérifier : `sudo -u www-data php /var/www/glpi/bin/console database:check_schema_integrity`.
5. `./scripts/validation/check-glpi.sh` depuis adm-01.

---

## Sauvegarde et restauration — Proxmox et pfSense

### Snapshots ou sauvegardes ?

| | Snapshot Proxmox | Sauvegarde `vzdump` |
|---|------------------|---------------------|
| Emplacement | Même stockage que la VM | Fichier indépendant (`.vma.zst`) |
| Survit à la perte du disque | **Non** | Oui, si stocké ailleurs |
| Usage | Retour arrière rapide avant une manipulation | Restauration après sinistre |
| Durée de conservation | Courte (heures, jours) | Longue (semaines) |

**Snapshot** avant toute opération risquée (bootstrap Galera, mise à jour, changement de règles pfSense). **Sauvegarde** pour la protection réelle.

### Snapshots

**SUR L'HÔTE PROXMOX**

```bash
# Avant une campagne de tests de panne (exemple avec les VMID 105, 106, 107 = bdd-01/02/03)
for id in 105 106 107; do qm snapshot "$id" avant-tests-$(date +%Y%m%d) --description "Avant tests T20"; done
qm listsnapshot 105
# Retour arrière si nécessaire
qm rollback 105 avant-tests-AAAAMMJJ
```

> Snapshot d'un nœud Galera **en marche** : à la restauration, le nœud revient avec un état ancien et se resynchronise par IST/SST — c'est sans danger tant qu'on ne restaure pas **les trois** à des instants différents.

### Sauvegardes vzdump

**SUR L'HÔTE PROXMOX** (*Datacenter → Backup → Add*, ou en ligne de commande)

```bash
vzdump 105 --mode snapshot --compress zstd --storage <STOCKAGE_BACKUP>
```

| Paramètre | Recommandation |
|-----------|----------------|
| Mode | `snapshot` (sans arrêt de la VM) |
| Stockage | **Distinct** du stockage des VM : NFS, Proxmox Backup Server, disque externe |
| Fréquence | Hebdomadaire (lab) |
| Rétention | 4 sauvegardes |

Restauration : *Storage → Backups → Restore*, ou `qmrestore <fichier> <vmid>`.

### pfSense

**SUR PFSENSE** (*Diagnostics → Backup & Restore*)

- **Backup area** : All.
- Cocher **Encrypt this configuration file** et choisir une phrase de passe forte (stockée dans le gestionnaire de mots de passe).
- Télécharger le fichier XML **chiffré** et le stocker hors du lab.

> L'export contient hash de mots de passe, clés et certificats : **jamais** dans ce dépôt (`.gitignore` bloque `config-*.xml`). Les règles sont documentées sous forme de tableaux dans configs/pfsense/.

Restauration : même menu, *Restore configuration*, en fournissant la phrase de passe.
