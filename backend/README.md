# Backend Watchfan

Smart contract pour la certification NFT de montres de collection.

## Installation

```bash
npm install
```

## Démarrage

```bash
# Lancer le réseau local
npx hardhat node

# Dans un autre terminal - Déployer le contrat
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network localhost
```

## Tests

```bash
npx hardhat test
```

## Le contrat

**Watchfan.sol** - NFT ERC721 pour montres avec :
- Minting réservé aux boutiques autorisées
- Transferts à double validation (expéditeur + destinataire)
- Numéros de série uniques
- Historique des transferts

## Fonctions principales

- `setShopAddress()` - Autoriser une boutique (owner seulement)
- `mintWfNFT()` - Créer un NFT (boutiques seulement)
- `requestTransfer()` - Demander un transfert
- `approveReceive()` - Accepter un transfert
- `getTokensByOwner()` - Voir ses NFT

Le contrat bloque les transferts directs ERC721 classiques.

## Configuration

- Réseau : Hardhat local (port 8545)
- Chain ID : 31337
- Solidity : 0.8.28
- OpenZeppelin : 5.3.0