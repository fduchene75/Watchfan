# Frontend Watchfan

Web interface to interact with Watchfan NFTs on blockchain.

## 🌐 Live Demo

**App:** [watchfan.vercel.app](https://votre-url-vercel.app)  
**Network:** Sepolia Testnet  
**Contract:** [See constants/index.js]

## 🔧 Stack

- Next.js 15.3.5, RainbowKit 2.2.8, Wagmi 2.15.6, Viem 2.31.7
- Shadcn/ui, TailwindCSS 4, IPFS client 60.0.1 (simulated)

## 🚀 Setup & Start

```bash
npm install
npm run dev  # http://localhost:3000

# Production
npm run build && npm start
```

## 📁 Structure

```
frontend/
├── app/                  # Next.js 15 App Router
├── components/
│   ├── ui/              # Shadcn components
│   ├── shared/          # Shared (Layout, Header, Footer, Badge)
│   ├── shop/            # Shop interface
│   └── collector/       # Collector interface
├── hooks/               # Custom hooks
├── lib/                 # Utils and config
└── constants/           # Contract addresses and ABI
```

## ✨ Features

### Adaptive UI
- 🟠 Orange for authorized shops
- 🟢 Green for collectors
- 🔵 Blue for transfers

### For Shops
- Watch selection, metadata generation, serial validation, NFT minting

### For Collectors
- Collection viewing, transfer management with dual validation

## 🌐 Configuration

### Networks

| Network | Chain ID | Usage |
|---------|----------|-------|
| **Sepolia** | 11155111 | Production/Staging |
| **Hardhat Local** | 31337 | Development |

### Environment Variables

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_NETWORK_NAME` (hardhat/sepolia)
- `NEXT_PUBLIC_CHAIN_ID` (31337/11155111)

### Custom Hooks
- `useWatchfanContract` - Contract interactions
- `useUserType` - Auto shop/collector detection
- `useSerialValidation` - Serial validation
- `useMintService` - Minting service
- `useTransfers` - Transfer management

## 🚀 Deployment

```bash
# Auto-deploy to Vercel
git push origin main
```

Configure env vars in Vercel dashboard.

## 🔗 Links

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)
- [Backend Docs](../backend/README.md)