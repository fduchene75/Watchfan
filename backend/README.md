# Backend Watchfan

Smart contract for watch NFT certification.

## 🚀 Setup

```bash
npm install
```

## 🔧 Start

### Local Development
```bash
# Terminal 1 - Local network
npx hardhat node

# Terminal 2 - Deploy
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network localhost
```

### Sepolia Deployment
```bash
# Configure .env with SEPOLIA_RPC_URL and PRIVATE_KEY
npx hardhat ignition deploy ./ignition/modules/Watchfan.js --network sepolia

# Verify contract (optional)
npx hardhat ignition verify deployments/chain-11155111
```

## 🧪 Tests

```bash
npx hardhat test            # Full tests
npx hardhat coverage        # Coverage
npx hardhat test --grep "mint"  # Specific tests
```

## 📋 Contract

**Watchfan.sol** - ERC721 NFT with:
- Minting reserved for authorized shops
- Dual validation transfers (sender + recipient)
- Unique serial numbers (anti-counterfeiting)
- Complete transfer history
- Enhanced security (no direct transfers)

## 🛠️ Main Functions

### Shop Management (Owner only)
- `setShopAddress(address, bool)` - Authorize/revoke shop
- `getAuthorizedShops()` - List authorized shops

### Minting (Authorized shops)
- `mintWfNFT(address, string, string)` - Create NFT with recipient
- `isSerialUnique(string)` - Check serial uniqueness

### Transfers (Dual validation system)
- `requestTransfer(uint256, address)` - Request transfer
- `approveOwnerTransfer(uint256)` - Approve as owner
- `approveReceive(uint256)` - Accept as recipient
- `cancelTransfer(uint256)` - Cancel transfer

### Query
- `getTokensByOwner(address)` - Owner's NFTs
- `getTransferHistory(uint256)` - Token history
- `tokenURI(uint256)` - Token metadata

## 🌐 Configuration

### Networks

| Network | Chain ID | Usage |
|---------|----------|-------|
| **Hardhat Local** | 31337 | Development |
| **Sepolia Testnet** | 11155111 | Staging |

### Environment Variables

Create `.env` file:
```bash
# For Sepolia deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here

# For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🔧 Stack

- Solidity 0.8.28, Hardhat 2.25.0, OpenZeppelin 5.3.0
- Tests: Mocha + Chai, Coverage: Solidity-coverage

## 📊 Security

- Reentrancy Guard on critical functions
- Access Control with roles (Owner, Shops)
- Input validation on all parameters
- Complete events for traceability
- No direct transfers (enhanced security)

## 🔗 Deployment

### Sepolia Testnet
- **Address:** [See constants/index.js](../frontend/constants/index.js)
- **Explorer:** [Sepolia Etherscan](https://sepolia.etherscan.io/)

### Useful Scripts
```bash
npx hardhat compile      # Compile contract
npx hardhat clean        # Clean artifacts
npx hardhat check        # Check syntax
```

## 📝 Documentation

- **Tests:** See `/test/` for usage examples
- **Frontend:** See [../frontend/README.md](../frontend/README.md)