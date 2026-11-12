# MO-4 — GLPI (gestion des incidents)

> 📁 Document de mon dossier E6 (BTS SIO SISR), tel que je l'ai rédigé pendant la mise en place de mon laboratoire. Version du 10/10/2026. Les adresses sont celles de mon laboratoire : adapte-les au tien.

Installation, Apache, base de données et publication derrière HAProxy.

> 🔐 Aucun mot de passe ni clé dans ce document : les secrets sont remplacés par des marque-places.

> ⚠️ **Écarts avec le labo réel** (configuration relevée le 01/10/2026, voir le DAT §7.2) :
> HAProxy contrôle ses serveurs **toutes les 2 s** (`inter 2s fall 3 rise 2`), le contrôle SQL est un simple
> test de port (`tcp-check`, pas `mysql-check`), et il n'y a **ni page de statistiques (8404) ni en-tête
> `X-Served-By`** : les passages qui les citent décrivent une cible, pas l'existant. adm-01 est le contrôleur
> de domaine Windows : les commandes notées « sur adm-01 » se jouent depuis une session du bastion Guacamole.

## Sommaire

- GLPI — Installation
- GLPI — Apache
- GLPI — Base de données
- GLPI — Intégration HAProxy

---

## GLPI — Installation

### Fiche

| Élément | Valeur |
|---------|--------|
| VM | glpi |
| IP | 10.0.10.3/24, passerelle 10.0.10.254 |
| VLAN | 301 — vWEB |
| OS | Debian 12 |
| Logiciels | Apache 2.4, PHP 8.2, GLPI 10.x |
| Racine | `/var/www/glpi` — **DocumentRoot** `/var/www/glpi/public` |
| Base | `glpi` via `10.0.10.2:3306` (HAProxy → Galera) |
| Publication | `http://10.0.10.2:8080/` |
| Redondance | **Aucune** (SPOF assumé, voir DAT-Infrastructure.md) |

### 1. Dépendances

**SUR glpi**

```bash
sudo ./scripts/install/install-glpi-deps.sh            # simulation
sudo ./scripts/install/install-glpi-deps.sh --apply
```

### 2. Téléchargement de GLPI

Récupérer l'archive de la **dernière version stable 10.x** sur la page officielle des releases (`github.com/glpi-project/glpi/releases`) et noter son empreinte publiée.

**SUR glpi**

```bash
cd /tmp
wget https://github.com/glpi-project/glpi/releases/download/<VERSION>/glpi-<VERSION>.tgz
sha256sum glpi-<VERSION>.tgz          # comparer avec l'empreinte publiée
sudo tar -xzf glpi-<VERSION>.tgz -C /var/www/
sudo chown -R www-data:www-data /var/www/glpi
```

### 3. Base de données

Voir database.md : base `glpi`, compte `glpi`@`10.0.10.2`.

### 4. Apache

Voir apache.md : vhost avec `DocumentRoot /var/www/glpi/public` et réécritures.

### 5. Assistant d'installation

**SUR adm-01** (navigateur) : `http://10.0.10.3/`

| Écran | Valeur |
|-------|--------|
| Serveur SQL | `10.0.10.2` (HAProxy) — port 3306 par défaut |
| Utilisateur SQL | `glpi` |
| Mot de passe SQL | `<PASSWORD>` |
| Base | `glpi` (existante) |

L'assistant vérifie les prérequis PHP : tout doit être vert (les avertissements de sécurité sont traités ci-dessous).

### 6. Après l'installation (obligatoire)

**SUR adm-01** (interface GLPI)

- Changer les mots de passe des comptes par défaut `glpi`, `tech`, `normal`, `post-only` (ou désactiver ceux qui sont inutiles).

**SUR glpi**

```bash
sudo rm /var/www/glpi/install/install.php
```

### 7. Vérification

```bash
# SUR adm-01
./scripts/validation/check-glpi.sh
```

Capture attendue : `evidence/screenshots/10-glpi.png`

---

## GLPI — Apache

Configuration : `configs/apache/glpi.conf.example` (dépôt GitHub)

### Déploiement

**SUR glpi**

```bash
sudo a2enmod rewrite remoteip
sudo cp configs/apache/glpi.conf.example /etc/apache2/sites-available/glpi.conf
sudo a2ensite glpi
sudo a2dissite 000-default
sudo apachectl configtest
sudo systemctl reload apache2
```

### Pourquoi `DocumentRoot /var/www/glpi/public` ?

Depuis GLPI 10.0.7, seul le dossier `public/` doit être exposé. Les dossiers `config/` (identifiants SQL), `files/` (documents joints) et `vendor/` restent **hors** de la racine web : ils ne peuvent pas être téléchargés par URL.

### Pourquoi des règles de réécriture ?

Toutes les pages de GLPI 10 passent par un **routeur** unique (`public/index.php`). Une URL comme `/front/ticket.php` ne correspond à aucun fichier dans `public/` : sans réécriture, Apache renvoie **404**.

```apache
<Directory /var/www/glpi/public>
    Require all granted
    RewriteEngine On
    RewriteCond %{HTTP:Authorization} ^(.+)$
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^(.*)$ index.php [QSA,L]
</Directory>
```

| Ligne | Rôle |
|-------|------|
| `RewriteCond %{REQUEST_FILENAME} !-f` | Si le fichier demandé n'existe pas réellement… |
| `RewriteRule ^(.*)$ index.php [QSA,L]` | …transmettre la requête au routeur, en conservant la query string (`QSA`) |
| Règle `HTTP_AUTHORIZATION` | Transmet l'en-tête d'authentification à PHP (API REST) |

Ces règles doivent être **dans le bloc `<Directory>`** : `%{REQUEST_FILENAME}` n'y contient le chemin complet du fichier qu'à ce niveau. Placées au niveau du `VirtualHost`, elles ne se comportent pas de la même façon — c'était la cause de l'[incident INC-05](/procedure?id=depannage).

### Réglage PHP recommandé

GLPI signale `session.cookie_httponly` désactivé.

**SUR glpi**

```bash
sudo sed -i 's/^;\?session.cookie_httponly.*/session.cookie_httponly = On/' /etc/php/8.2/apache2/php.ini
sudo systemctl reload apache2
```

### Vérification

```bash
# SUR glpi
sudo apache2ctl -S                      # glpi.conf actif sur *:80
curl -sI http://localhost/ | head -n 1  # 200 ou 302
curl -sI http://localhost/front/central.php | head -n 1   # 302 (redirection vers login), pas 404
```

---

## GLPI — Base de données

### Création

**SUR bdd-01** (répliqué sur les 3 nœuds)

```sql
-- sudo mariadb
CREATE DATABASE glpi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'glpi'@'10.0.10.2' IDENTIFIED BY '<PASSWORD>';
GRANT ALL PRIVILEGES ON glpi.* TO 'glpi'@'10.0.10.2';
```

### Fuseaux horaires (recommandé par GLPI)

GLPI peut stocker les dates en UTC si le compte peut lire les fuseaux horaires de MariaDB.

**SUR bdd-01**

```bash
sudo mariadb-tzinfo-to-sql /usr/share/zoneinfo | sudo mariadb mysql
sudo mariadb -e "GRANT SELECT ON mysql.time_zone_name TO 'glpi'@'10.0.10.2';"
```

> Les tables `mysql.time_zone*` sont en **MyISAM** sous MariaDB 10.11 : elles ne sont pas répliquées par Galera. Exécuter `mariadb-tzinfo-to-sql` **sur chacun des trois nœuds** (le `GRANT`, lui, est répliqué).

**SUR glpi** (une fois GLPI installé)

```bash
sudo -u www-data php /var/www/glpi/bin/console database:enable_timezones
```

### Vérification

**SUR glpi**

```bash
mariadb -h 10.0.10.2 -u glpi -p -e 'SELECT @@hostname; SHOW TABLES FROM glpi;' | head
```

**SUR bdd-02** — toutes les tables GLPI doivent être InnoDB :

```sql
SELECT engine, COUNT(*) FROM information_schema.tables WHERE table_schema = 'glpi' GROUP BY engine;
```

### Fichier de connexion de GLPI

L'assistant écrit `/var/www/glpi/config/config_db.php` (hôte, compte, mot de passe). Ce fichier :

- reste hors de la racine web (`public/`) ;
- ne doit **jamais** être copié dans ce dépôt ;
- doit appartenir à `www-data` avec des droits restreints (`640`).

---

## GLPI — Intégration HAProxy

GLPI utilise HAProxy **dans les deux sens** :

```text
Utilisateurs ──► HAProxy :8080 ──► glpi :80          (HTTP, frontend fe_glpi)
glpi      ──► HAProxy :3306 ──► bdd-01/02/03       (SQL, listen galera_cluster)
```

### Côté HTTP

Configuration et justification : [MO-2-HAProxy.md](/procedure?id=mo-02-haproxy)

Points d'attention spécifiques à GLPI :

| Sujet | Effet | Mesure |
|-------|-------|--------|
| URL de l'application | GLPI génère certains liens absolus (notifications, e-mails) à partir de son URL configurée | *Configuration → Générale → URL de l'application* = `http://10.0.10.2:8080` |
| IP des utilisateurs dans l'historique | Sans traitement, GLPI enregistre 10.0.10.2 | `mod_remoteip` dans le vhost (déjà en place) |

### Côté SQL

GLPI ouvre des connexions SQL **courtes** (une par requête HTTP). Elles sont réparties par HAProxy entre les 3 nœuds. Si un nœud tombe pendant une requête, cette requête peut échouer ; la suivante est envoyée sur un nœud sain.

### Test

```bash
# SUR adm-01
curl -sI http://10.0.10.2:8080/ | grep -Ei 'HTTP/|X-Served-By'      # X-Served-By: glpi
./scripts/validation/check-glpi.sh
```

Test T17 de la [matrice de validation](/procedure?id=plan-de-tests).
