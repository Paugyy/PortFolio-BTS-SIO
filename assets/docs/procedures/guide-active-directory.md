# Active Directory sur Windows Server

AD DS, DNS, unités d'organisation, utilisateurs et GPO.

## Dans l'interface graphique

1. Donner une **IP fixe** au serveur et le renommer (ex : `SRV-AD01`), puis redémarrer.
2. *Gestionnaire de serveur → Ajouter des rôles* : cocher **AD DS** (et DNS).
3. Cliquer sur le drapeau → *Promouvoir ce serveur en contrôleur de domaine* → nouvelle forêt (ex : `entreprise.local`).
4. Après redémarrage : *Utilisateurs et ordinateurs Active Directory* → créer des OU (Direction, Compta, Informatique…).
5. Créer utilisateurs et groupes dans les OU.
6. *Gestion des stratégies de groupe* : créer une GPO, la lier à une OU, puis `gpupdate /force` sur le client.
7. Sur le poste client : DNS = IP du contrôleur de domaine, puis joindre le domaine.

## La même chose en PowerShell

```powershell
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName "entreprise.local"
New-ADOrganizationalUnit -Name "Informatique"
New-ADUser -Name "Jean Dupont" -SamAccountName jdupont -Path "OU=Informatique,DC=entreprise,DC=local" -AccountPassword (Read-Host -AsSecureString) -Enabled $true
Add-Computer -DomainName entreprise.local -Restart   # sur le client
```
