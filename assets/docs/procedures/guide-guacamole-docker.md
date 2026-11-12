# Apache Guacamole avec Docker

Bastion d'accès RDP / SSH / VNC depuis un simple navigateur.

Guacamole se compose de 3 briques : **guacd** (le moteur qui parle RDP/SSH), **guacamole** (l'interface web) et une **base de données** (utilisateurs et connexions).

## 1. Préparer le dossier

```bash
mkdir -p ~/guacamole/init && cd ~/guacamole
# Générer le script de création de la base
docker run --rm guacamole/guacamole:1.5.5 /opt/guacamole/bin/initdb.sh --postgresql > init/initdb.sql
```

## 2. Fichier `docker-compose.yml`

```yaml
services:
  guacd:
    image: guacamole/guacd:1.5.5
    restart: unless-stopped

  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: guacamole_db
      POSTGRES_USER: guacamole_user
      POSTGRES_PASSWORD: MotDePasseSolide
    volumes:
      - ./init:/docker-entrypoint-initdb.d:ro
      - ./data:/var/lib/postgresql/data

  guacamole:
    image: guacamole/guacamole:1.5.5
    restart: unless-stopped
    depends_on: [guacd, postgres]
    environment:
      GUACD_HOSTNAME: guacd
      POSTGRESQL_HOSTNAME: postgres
      POSTGRESQL_DATABASE: guacamole_db
      POSTGRESQL_USER: guacamole_user
      POSTGRESQL_PASSWORD: MotDePasseSolide
    ports:
      - "8080:8080"
```

## 3. Lancer et se connecter

```bash
docker compose up -d
docker compose logs -f guacamole   # vérifier qu'il n'y a pas d'erreur
```

1. Ouvrir `http://IP_DU_SERVEUR:8080/guacamole`
2. Identifiants par défaut : `guacadmin` / `guacadmin` → **créer un nouvel admin et supprimer guacadmin**.
3. *Paramètres → Connexions → Nouvelle connexion* : protocole RDP, hôte, port 3389, identifiants, et cocher « Ignorer le certificat du serveur » en lab.

> 🔐 En production : placer Guacamole derrière un reverse proxy HTTPS (Nginx) et activer la double authentification (extension TOTP).
