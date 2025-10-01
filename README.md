# Watchfan - Watch NFT Certification

Blockchain certification platform for collectible watches using NFTs with dual validation system.

## 🎯 Concept

Watch boutiques create NFT authenticity certificates. Each watch receives a unique NFT with IPFS metadata and secure transfers.

## 🌐 Live Demo

**Web App:** [watchfan.vercel.app](https://votre-url-vercel.app)  
**Network:** Sepolia Testnet  
**Contract:** [View on Etherscan](https://sepolia.etherscan.io/address/0x4c1C44baB17Fb56433685c74f4713b7B3ACc6e0f)

### Quick Test
1. Connect MetaMask to Sepolia
2. Get test ETH: [Sepolia Faucet](https://sepoliafaucet.com/)
3. Test features based on your user type

## 🚀 Quick Start

### Backend (Smart Contract)
```bash
cd backend
npm install

# Terminal 1 - Local network
npx hardhat node

# Terminal 2 - Deploy
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network localhost
```

👉 Details: [backend/README.md](backend/README.md)

### Frontend (UI)
```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:3000

👉 Details: [frontend/README.md](frontend/README.md)

## 🔧 Stack

**Backend:** Solidity 0.8.28, Hardhat, OpenZeppelin  
**Frontend:** Next.js 15, RainbowKit, Wagmi, Viem, Shadcn/ui  
**Deployment:** Vercel (frontend), Sepolia (contract)

## 📋 Features

### Smart Contract
- ERC721 NFT with authorized boutiques
- Dual validation transfers (sender + recipient)
- Unique serial numbers (anti-counterfeiting)
- Complete transfer history
- No direct transfers (enhanced security)

### Web Interface
- Multi-wallet connection via RainbowKit
- Adaptive UI (orange=boutiques, green=collection, blue=transfers)
- Automatic user type detection
- Transfer management with dual validation
- IPFS simulation for MVP

## 📝 Usage

**Boutiques:** Connect → Select watch → Mint NFT  
**Collectors:** Connect → View collection → Manage transfers

## 🌐 Configuration

### Local Development
- **Network:** http://localhost:8545 (Chain ID: 31337)
- **Frontend:** http://localhost:3000

### Production
- **Network:** Sepolia (Chain ID: 11155111)
- **Frontend:** Vercel (auto-deploy from GitHub)

### Testing
```bash
cd backend && npm test
cd frontend && npm run lint
cd frontend && npm run build
```

## 🚀 Deployment

**Frontend:** `git push origin main` (auto-deploys to Vercel)  
**Contract:** `cd backend && npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network sepolia`

## 🔗 Links

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)
- [Backend Docs](backend/README.md)
- [Frontend Docs](frontend/README.md)