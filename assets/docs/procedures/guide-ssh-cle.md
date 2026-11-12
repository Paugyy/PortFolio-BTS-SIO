# SSH par clé (sans mot de passe)

Sécuriser l'accès à un serveur Linux.

## Étapes

```bash
# Sur MON poste : créer une paire de clés
ssh-keygen -t ed25519 -C "yannis@poste"
# Envoyer la clé publique au serveur
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@IP_SERVEUR
# Sur le SERVEUR : désactiver la connexion par mot de passe et root
sudo nano /etc/ssh/sshd_config
  PasswordAuthentication no
  PermitRootLogin no
sudo systemctl restart ssh
```

> ⚠️ Tester la connexion par clé dans un **second terminal** avant de fermer le premier, sinon risque de se bloquer dehors.
