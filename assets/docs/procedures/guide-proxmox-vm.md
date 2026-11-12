# Proxmox VE — créer une VM Debian

Virtualisation : de l'ISO au modèle (template) réutilisable.

## Étapes

1. Téléverser l'ISO : *local → ISO Images → Upload*.
2. *Create VM* : nom, ISO, disque (VirtIO SCSI), CPU (type `host`), RAM, réseau (`vmbr0`, modèle VirtIO).
3. Installer Debian (sans environnement de bureau, cocher « serveur SSH »).
4. Installer l'agent : `apt install qemu-guest-agent` puis l'activer dans *Options → QEMU Guest Agent*.
5. Transformer une VM propre en **Template** pour cloner rapidement les suivantes.
6. Programmer des sauvegardes : *Datacenter → Backup*.
