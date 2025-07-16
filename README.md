# Watchfan - Certification NFT de Montres

Plateforme de certification blockchain pour montres de collection utilisant des NFT avec système de double validation.

## 🎯 Concept

Watchfan permet aux boutiques horlogères de créer des certificats d'authenticité NFT pour leurs montres. Chaque montre reçoit un NFT unique avec métadonnées dans IPFS et système de transfert sécurisé.

## 🌐 Démo en ligne

**Application web :** [watchfan.vercel.app](https://votre-url-vercel.app)  
**Réseau :** Sepolia Testnet (ETH gratuit pour tests)  
**Smart contract :** [Voir sur Sepolia Etherscan](https://sepolia.etherscan.io/address/0x4c1C44baB17Fb56433685c74f4713b7B3ACc6e0f)

### Test rapide
1. Connecter MetaMask sur Sepolia
2. Obtenir des ETH de test : [Sepolia Faucet](https://sepoliafaucet.com/)
3. Tester les fonctionnalités selon votre type d'utilisateur

## 🚀 Démarrage rapide

### 1. Backend local (Smart contract)
```bash
cd backend
npm install

# Terminal 1 - Réseau local
npx hardhat node

# Terminal 2 - Déploiement 
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network localhost
```

👉 **Détails complets :** Voir [backend/README.md](backend/README.md)

### 2. Frontend local (Interface utilisateur)
```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur http://localhost:3000

👉 **Détails complets :** Voir [frontend/README.md](frontend/README.md)

## 🔧 Technologies

**Backend :** Solidity 0.8.28, Hardhat, OpenZeppelin, Ignition  
**Frontend :** Next.js 15, RainbowKit, Wagmi, Viem, Shadcn/ui, TailwindCSS  
**Déploiement :** Vercel (frontend), Sepolia Testnet (contrat)

## 📋 Fonctionnalités

### ✅ Smart Contract
- NFT ERC721 avec système de boutiques autorisées
- Double validation pour les transferts (expéditeur + destinataire)
- Numéros de série uniques anti-contrefaçon
- Historique complet des transferts
- Sécurité renforcée (pas de transferts directs)

### ✅ Interface Web
- Connexion multi-wallets via RainbowKit
- Interface adaptative (orange=boutiques, vert=collection, bleu=transferts)
- Détection automatique du type d'utilisateur
- Gestion complète des transferts avec double validation
- Simulation IPFS pour le MVP
- Déploiement continu via GitHub → Vercel

📖 **Documentation détaillée :** [backend/README.md](backend/README.md) | [frontend/README.md](frontend/README.md)

## 📝 Utilisation

**Boutiques autorisées :** Connexion → Sélection montre → Mint NFT pour client  
**Collectionneurs :** Connexion → Visualisation collection → Gestion transferts

## 🌐 Configuration

### Développement local
**Réseau local :** http://localhost:8545 (Chain ID: 31337)  
**Frontend local :** http://localhost:3000

### Production/Recette
**Réseau :** Sepolia Testnet (Chain ID: 11155111)  
**Frontend :** Vercel (déploiement automatique depuis GitHub)  
**IPFS :** Simulation dans la dApp pour le MVP

### Tests et qualité
**Tests :** `cd backend && npm test`  
**Linting :** `cd frontend && npm run lint`  
**Build :** `cd frontend && npm run build`

## 🚀 Déploiement

### Frontend (Vercel)
```bash
# Push automatique vers Vercel
git push origin main
```

### Smart Contract (Sepolia)
```bash
# Déploiement testnet
cd backend
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network sepolia
```

📋 **Configuration complète :** [backend/README.md](backend/README.md) | [frontend/README.md](frontend/README.md)

## 🔗 Liens utiles

- **Faucet Sepolia :** https://sepoliafaucet.com/
- **Etherscan Sepolia :** https://sepolia.etherscan.io/
- **MetaMask :** Configuration réseau Sepolia
- **Documentation :** README détaillés par module