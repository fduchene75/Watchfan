# Backend Watchfan

Smart contract pour la certification NFT de montres de collection.

## 🚀 Installation

```bash
npm install
```

## 🔧 Démarrage

### Développement local
```bash
# Terminal 1 - Lancer le réseau local
npx hardhat node

# Terminal 2 - Déployer le contrat
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network localhost
```

### Déploiement Sepolia (testnet)
```bash
# Configurer .env avec SEPOLIA_RPC_URL et PRIVATE_KEY
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network sepolia

# Vérifier le contrat (optionnel)
npx hardhat ignition verify deployments/chain-11155111
```

## 🧪 Tests

```bash
# Tests complets
npx hardhat test

# Tests avec couverture
npx hardhat coverage

# Tests spécifiques
npx hardhat test --grep "mint"
```

## 📋 Le contrat

**Watchfan.sol** - NFT ERC721 pour montres avec :
- **Minting réservé** aux boutiques autorisées
- **Transferts à double validation** (expéditeur + destinataire)
- **Numéros de série uniques** anti-contrefaçon
- **Historique complet** des transferts
- **Sécurité renforcée** (pas de transferts directs)

## 🛠️ Fonctions principales

### Gestion des boutiques (Owner seulement)
- `setShopAddress(address, bool)` - Autoriser/révoquer une boutique
- `getAuthorizedShops()` - Liste des boutiques autorisées

### Minting (Boutiques autorisées)
- `mintWfNFT(address, string, string)` - Créer un NFT avec destinataire
- `isSerialUnique(string)` - Vérifier l'unicité d'un numéro de série

### Transferts (Système de double validation)
- `requestTransfer(uint256, address)` - Demander un transfert
- `approveOwnerTransfer(uint256)` - Approuver côté propriétaire
- `approveReceive(uint256)` - Accepter côté destinataire
- `cancelTransfer(uint256)` - Annuler un transfert

### Consultation
- `getTokensByOwner(address)` - NFT d'un propriétaire
- `getTransferHistory(uint256)` - Historique d'un token
- `tokenURI(uint256)` - Métadonnées d'un token

## 🌐 Configuration

### Réseaux supportés

| Réseau | Chain ID | RPC | Usage |
|--------|----------|-----|-------|
| **Hardhat Local** | 31337 | http://localhost:8545 | Développement |
| **Sepolia Testnet** | 11155111 | https://sepolia.infura.io/v3/... | Recette |

### Variables d'environnement

Créer un fichier `.env` :
```bash
# Pour déploiement Sepolia
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here

# Pour vérification de contrat
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Technologies utilisées
- **Solidity** : 0.8.28
- **Hardhat** : 2.25.0
- **OpenZeppelin** : 5.3.0
- **Tests** : Mocha + Chai
- **Coverage** : Solidity-coverage

## 📊 Sécurité

### Mesures implémentées
- ✅ **Reentrancy Guard** sur les fonctions critiques
- ✅ **Access Control** avec rôles (Owner, Boutiques)
- ✅ **Validation des entrées** sur tous les paramètres
- ✅ **Événements complets** pour traçabilité
- ✅ **Pas de transferts directs** (sécurité renforcée)

### Audits
- Tests unitaires complets (90%+ couverture)
- Validation des patterns OpenZeppelin
- Vérification des vulnérabilités communes

## 🔗 Déploiements

### Sepolia Testnet
- **Adresse :** [Voir constants/index.js](../frontend/constants/index.js)
- **Explorateur :** [Sepolia Etherscan](https://sepolia.etherscan.io/)
- **Propriétaire :** Défini lors du déploiement

### Scripts utiles
```bash
# Compiler le contrat
npx hardhat compile

# Nettoyer les artifacts
npx hardhat clean

# Vérifier la syntaxe
npx hardhat check

# Analyser la taille des contrats
npx hardhat size-contracts
```

## 📝 Documentation

- **Tests :** Voir `/test/` pour exemples d'utilisation
- **Scripts :** Voir `/scripts/` pour déploiement
- **Configuration :** Voir `hardhat.config.js`
- **Frontend :** Voir [../frontend/README.md](../frontend/README.md)