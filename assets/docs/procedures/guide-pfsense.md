# pfSense — installation et configuration de base

Pare-feu et routeur : installation, VLAN, règles, NAT et VPN OpenVPN.

## 1. Prérequis

- Une VM (Proxmox, VirtualBox, VMware) avec **2 cartes réseau** : WAN (vers Internet) et LAN (réseau interne).
- 1 vCPU, 1 à 2 Go de RAM, 16 Go de disque. ISO téléchargée sur `pfsense.org`.

## 2. Installation

1. Démarrer sur l'ISO → *Install* → partitionnement **Auto (ZFS)** → redémarrer.
2. À la console : « Should VLANs be set up now? » → `n` (on les fera plus tard).
3. Assigner les interfaces : WAN = `vtnet0` / `em0`, LAN = `vtnet1` / `em1`.
4. Option `2` du menu console → définir l'IP du LAN (ex : `192.168.10.1/24`) et activer le DHCP.

## 3. Interface web

1. Depuis un poste du LAN : `https://192.168.10.1` — identifiants par défaut `admin` / `pfsense`.
2. Suivre l'assistant : nom d'hôte, DNS, fuseau horaire, **changer le mot de passe admin**.

## 4. Créer des VLAN

1. *Interfaces → Assignments → VLANs → Add* : interface parent = LAN, tag = `10`, `20`…
2. *Interface Assignments* : ajouter chaque VLAN, l'activer, lui donner une IP (ex : `10.0.10.1/24`).
3. *Services → DHCP Server* : activer le DHCP sur chaque VLAN.

## 5. Règles de pare-feu

- *Firewall → Rules* : les règles sont lues **de haut en bas**, la première qui correspond s'applique.
- Par défaut tout est bloqué sur une nouvelle interface : ajouter une règle *Pass* explicite.
- Exemple : bloquer VLAN Invités → LAN, puis autoriser Invités → any (Internet).

## 6. Redirection de port (NAT)

*Firewall → NAT → Port Forward → Add* : interface WAN, port `443` → IP du serveur en DMZ, port `443`. La règle de pare-feu associée est créée automatiquement.

## 7. VPN OpenVPN (accès distant)

1. *System → Cert Manager* : créer une CA puis un certificat serveur.
2. *VPN → OpenVPN → Wizards* : suivre l'assistant (authentification locale).
3. *System → Package Manager* : installer `openvpn-client-export` pour générer les fichiers clients.

> 💡 Toujours faire une sauvegarde : *Diagnostics → Backup & Restore* avant une grosse modification.
