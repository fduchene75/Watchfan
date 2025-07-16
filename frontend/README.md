# Frontend Watchfan

Interface web pour interagir avec les NFT Watchfan sur la blockchain.

## 🌐 Démo en ligne

**Application déployée :** [watchfan.vercel.app](https://votre-url-vercel.app)  
**Réseau :** Sepolia Testnet  
**Contrat :** [0x4c1C44baB17Fb56433685c74f4713b7B3ACc6e0f](https://sepolia.etherscan.io/address/0x4c1C44baB17Fb56433685c74f4713b7B3ACc6e0f)

### Test rapide
1. Connecter MetaMask sur Sepolia
2. Obtenir des ETH de test : [Sepolia Faucet](https://sepoliafaucet.com/)
3. Tester selon votre type d'utilisateur (boutique/collectionneur)

## 🔧 Technologies

- **Next.js 15.3.5** - Framework React avec App Router
- **RainbowKit 2.2.8** - Interface de connexion Web3
- **Wagmi 2.15.6** - Hooks React pour Ethereum 
- **Viem 2.31.7** - Bibliothèque Ethereum JavaScript
- **Shadcn/ui** - Composants UI avec Radix
- **TailwindCSS 4** - Framework CSS avec PostCSS
- **IPFS client 60.0.1** - Interaction IPFS (simulé en MVP)

## 🚀 Installation

```bash
npm install
```

## ⚡ Démarrage

### Développement local
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build de production
```bash
npm run build
npm start
```

## 📁 Structure

```
frontend/
├── app/                    # App Router Next.js 15
│   ├── page.js            # Page d'accueil
│   ├── transfers/page.js  # Gestion des transferts
│   ├── layout.js          # Layout principal
│   ├── globals.css        # Styles globaux Tailwind
│   └── RainbowKitAndWagmiProvider.jsx
├── components/
│   ├── ui/               # Composants Shadcn (dialog, card, etc.)
│   ├── shared/           # Composants partagés
│   │   ├── Layout.jsx    # Layout avec couleurs contextuelles
│   │   ├── Header.jsx    # Navigation principale  
│   │   ├── Footer.jsx    # Pied de page
│   │   └── UserTypeBadge.jsx
│   ├── shop/             # Interface boutique
│   │   └── WatchSelector.jsx
│   └── collector/        # Interface collectionneur
│       ├── NFTCollectionViewer.jsx
│       └── PendingTransfers.jsx
├── hooks/                # Hooks personnalisés
│   ├── useWatchfanContract.js
│   ├── useUserType.js
│   ├── useSerialValidation.js
│   ├── useMintService.js
│   └── useTransfers.js
├── lib/                  # Utilitaires et config
├── constants/            # Constantes du projet
│   └── index.js          # Adresses et ABI contrats
├── components.json       # Config Shadcn
├── jsconfig.json         # Alias de chemin JavaScript
├── next.config.mjs       # Config Next.js et polyfills Web3
├── postcss.config.mjs    # Config PostCSS pour Tailwind
└── package.json          # Dépendances et scripts
```

## ✨ Fonctionnalités

### Interface adaptative par type d'utilisateur
- **🟠 Fond orange** pour les boutiques autorisées
- **🟢 Fond vert** pour la collection des collectionneurs  
- **🔵 Fond bleu** pour la page des transferts
- **🏷️ Badge visuel** indiquant le type d'utilisateur

### Pour les boutiques autorisées
- Sélection de montres depuis une base simulée (QR code + import données fabricant)
- Génération automatique de métadonnées pour IPFS
- Validation des numéros de série uniques
- Mint de NFT avec destinataire personnalisé

### Pour les collectionneurs
- Visualisation de la collection personnelle
- Gestion des transferts avec double validation
- Interface de demande et d'approbation
- Historique des transferts

## 🌐 Configuration technique

### Réseaux supportés

| Réseau | Chain ID | RPC | Usage |
|--------|----------|-----|-------|
| **Sepolia** | 11155111 | Public testnet | Production/Recette |
| **Hardhat Local** | 31337 | http://localhost:8545 | Développement |

### Variables d'environnement

| Variable | Développement | Production |
|----------|---------------|------------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Défini par défaut | Configuré sur Vercel |
| `NEXT_PUBLIC_NETWORK_NAME` | `hardhat` | `sepolia` |
| `NEXT_PUBLIC_CHAIN_ID` | `31337` | `11155111` |

### Hooks personnalisés
- `useWatchfanContract` - Toutes les interactions avec le smart contract
- `useUserType` - Détection automatique boutique/collectionneur
- `useSerialValidation` - Validation des numéros de série uniques
- `useMintService` - Service de mint avec gestion d'erreurs complète
- `useTransfers` - Gestion des transferts avec double validation

### Simulation IPFS
Les métadonnées de montres sont générées localement via `mockWatches.js` avec structure compatible IPFS pour le MVP.

## 🛠️ Développement

```bash
# Mode développement
npm run dev

# Build production  
npm run build

# Lancer production
npm start

# Linting
npm run lint
```

## 🚀 Déploiement

### Déploiement automatique (Vercel)
```bash
# Push sur GitHub déclenche le déploiement
git push origin main
```

### Variables d'environnement Vercel
Configurées dans le dashboard Vercel :
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_NETWORK_NAME=sepolia`
- `NEXT_PUBLIC_CHAIN_ID=11155111`

## 🎨 Configuration Shadcn

Le projet utilise la configuration "new-york" de Shadcn avec :
- **Style** : new-york (moderne et épuré)
- **RSC** : Support React Server Components  
- **JSX** : Pas de TypeScript (tsx: false)
- **Base color** : neutral
- **CSS Variables** : Activées pour thèmes
- **Icônes** : Lucide React
- **Alias** : Chemins configurés dans jsconfig.json

## 🔗 Liens utiles

- **Faucet Sepolia** : https://sepoliafaucet.com/
- **Etherscan Sepolia** : https://sepolia.etherscan.io/
- **Contrat sur Sepolia** : https://sepolia.etherscan.io/address/0x4c1C44baB17Fb56433685c74f4713b7B3ACc6e0f
- **Documentation Backend** : [../backend/README.md](../backend/README.md)

## 🧪 Tests

### Tests en local
- Interface responsive sur différents écrans
- Connexion wallet (MetaMask, WalletConnect)
- Fonctionnalités selon le type d'utilisateur

### Tests sur Sepolia
- Mint de NFT (boutiques autorisées)
- Transferts avec double validation
- Visualisation de la collection

## 🐛 Debugging

### Problèmes courants
- **Wallet non connecté** : Vérifier MetaMask sur Sepolia
- **Pas d'ETH** : Utiliser le faucet Sepolia
- **Erreur de réseau** : Vérifier Chain ID dans MetaMask
- **Erreur de build** : Vérifier `npm run build` en local

### Logs utiles
- Console navigateur pour erreurs Web3
- Vercel dashboard pour erreurs de déploiement
- Etherscan pour vérifier les transactions