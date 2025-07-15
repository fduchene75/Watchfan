# Watchfan - Certification NFT de Montres

Plateforme de certification blockchain pour montres de collection utilisant des NFT avec système de double validation.

## 🎯 Concept

Watchfan permet aux boutiques horlogères de créer des certificats d'authenticité NFT pour leurs montres. Chaque montre reçoit un NFT unique avec métadonnées IPFS et système de transfert sécurisé.

## 🚀 Démarrage rapide

### 1. Backend (Smart contracts)
```bash
cd backend
npm install

# Terminal 1 - Réseau local
npx hardhat node

# Terminal 2 - Déploiement 
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network localhost
```

👉 **Détails complets :** Voir [backend/README.md](backend/README.md)

### 2. Frontend (Interface utilisateur)
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

📖 **Documentation détaillée :** [backend/README.md](backend/README.md) | [frontend/README.md](frontend/README.md)

## 📝 Utilisation

**Boutiques autorisées :** Connexion → Sélection montre → Mint NFT pour client  
**Collectionneurs :** Connexion → Visualisation collection → Gestion transferts

## 🌐 Configuration

**Réseau local :** http://localhost:8545 (Chain ID: 31337)  
**Tests :** `cd backend && npm test`  
**Linting :** `cd frontend && npm run lint`

📋 **Configuration complète :** [backend/README.md](backend/README.md) | [frontend/README.md](frontend/README.md)
