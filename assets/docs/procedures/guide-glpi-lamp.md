# GLPI sur Debian (LAMP)

Gestion de parc et tickets sur un seul serveur.

## Étapes

```bash
sudo apt install -y apache2 mariadb-server php php-{mysql,curl,gd,intl,xml,mbstring,zip,bz2,ldap,bcmath}
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE glpi; CREATE USER 'glpi'@'localhost' IDENTIFIED BY 'MotDePasse'; GRANT ALL ON glpi.* TO 'glpi'@'localhost';"
# Télécharger la dernière version sur github.com/glpi-project/glpi/releases
sudo tar -xzf glpi-*.tgz -C /var/www/html/
sudo chown -R www-data:www-data /var/www/html/glpi
```

1. Ouvrir `http://IP/glpi` et suivre l'assistant (base `glpi`).
2. Comptes par défaut : `glpi/glpi` (admin) — **changer tous les mots de passe** et supprimer `install/install.php`.
3. Installer l'agent GLPI sur les postes pour l'inventaire automatique.
