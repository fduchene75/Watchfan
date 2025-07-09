// Tests du contrat Watchfan NFT
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const DEFAULT_URI = "ipfs://bafkreihooe6yb7hyjrluimzpeqklzdwkbvzx6fr73rvvnqh3zzuedk4aym";

// Fonction utilitaire pour créer des hashs de numéros de série
function createSerialHash(serialNumber) {
  return ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
}

// Helper pour créer des tests avec données cohérentes
function createTestSerial(base = "TEST") {
  const random = Math.floor(Math.random() * 1000000);
  const serialNumber = `${base}-${random}`;
  const serialHash = createSerialHash(serialNumber);
  return { serialNumber, serialHash };
}

// Helper pour faciliter le minting avec un numéro de série
async function mintToAddress(contract, recipient, uri = DEFAULT_URI) {
  const { serialHash } = createTestSerial();
  await contract.mintWfNFT(recipient, uri, serialHash);
  return serialHash;
}

describe("Watchfan NFT Contract", function () {
  // Variables partagées pour tous les tests
  let watchfan, owner, addr1, addr2, addr3;

  // Fixture : déploie le contrat une fois et le réutilise pour chaque test
  async function deployWatchfanFixture() {
    // Récupère les comptes de test
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    // Déploie le contrat avec l'owner
    const Watchfan = await ethers.getContractFactory("Watchfan");
    const watchfan = await Watchfan.deploy(owner.address);
    // Retourne les éléments nécessaires aux tests
    return { watchfan, owner, addr1, addr2, addr3 };
  }

  // beforeEach : charge le fixture avant chaque test individuel
  beforeEach(async function () {
    ({ watchfan, owner, addr1, addr2, addr3 } = await loadFixture(deployWatchfanFixture));
  });

  describe("Déploiement et état initial", function () {
    it("Should deploy correctly", async function () {

      // Vérifie que le contrat est déployé correctement
      expect(await watchfan.name()).to.equal("Watchfan NFT Collection");
      expect(await watchfan.symbol()).to.equal("WFC");
      expect(await watchfan.owner()).to.equal(owner.address);

      // Vérifie l'état initial
      expect(await watchfan.totalSupply()).to.equal(0);
      expect(await watchfan.exists(0)).to.be.false;
      expect(await watchfan.exists(1)).to.be.false;
      await expect(watchfan.ownerOf(1)).to.be.revertedWithCustomError(watchfan, 'ERC721NonexistentToken');
    });
  });

  describe("Contrôle de l'adresse destinataire", function () {

    beforeEach(async function () {
      // Autoriser addr1 comme boutique pour les tests
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
    });

    it("Should reject zero address", async function () {
      const { serialHash } = createTestSerial();
      await expect(
        watchfan.connect(addr1).mintWfNFT(ethers.ZeroAddress, DEFAULT_URI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
    });
    it("Should reject a contract address", async function () {
      const { serialHash: serialHash2 } = createTestSerial();
      await expect(
        watchfan.connect(addr1).mintWfNFT(await watchfan.getAddress(), DEFAULT_URI, serialHash2)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
    });    
  });

  describe("Gestion des boutiques autorisées (setShopAddress)", function () {
    it("Should allow owner to authorize a shop", async function () {
      await expect(watchfan.connect(owner).setShopAddress(addr1.address, true))
        .to.emit(watchfan, "ShopAuthorized")
        .withArgs(addr1.address, owner.address);
      
      expect(await watchfan.isAuthorizedShop(addr1.address)).to.be.true;
    });

    it("Should allow owner to revoke shop authorization", async function () {
      // Autoriser d'abord
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      
      // Puis révoquer
      await expect(watchfan.connect(owner).setShopAddress(addr1.address, false))
        .to.emit(watchfan, "ShopRevoked")
        .withArgs(addr1.address, owner.address);
      
      expect(await watchfan.isAuthorizedShop(addr1.address)).to.be.false;
    });

    it("Should reject shop authorization from non-owner", async function () {
      await expect(
        watchfan.connect(addr1).setShopAddress(addr2.address, true)
      ).to.be.revertedWithCustomError(watchfan, "OwnableUnauthorizedAccount");
    });

    it("Should reject invalid shop addresses", async function () {
      // Adresse zéro
      await expect(
        watchfan.connect(owner).setShopAddress(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");

      // Adresse de contrat
      await expect(
        watchfan.connect(owner).setShopAddress(await watchfan.getAddress(), true)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
    });

    it("Should reject duplicate authorization", async function () {
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      
      await expect(
        watchfan.connect(owner).setShopAddress(addr1.address, true)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanShopAlreadyAuthorized");
    });

    it("Should reject revocation of non-authorized shop", async function () {
      await expect(
        watchfan.connect(owner).setShopAddress(addr1.address, false)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanShopNotAuthorized");
    });

    it("Should handle multiple shops correctly", async function () {
      // Autoriser plusieurs boutiques
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(owner).setShopAddress(addr2.address, true);
      await watchfan.connect(owner).setShopAddress(addr3.address, true);
      
      const shops = await watchfan.getAuthorizedShops();
      expect(shops).to.include(addr1.address);
      expect(shops).to.include(addr2.address);
      expect(shops).to.include(addr3.address);
      
      // Révoquer une boutique
      await watchfan.connect(owner).setShopAddress(addr2.address, false);
      
      const remainingShops = await watchfan.getAuthorizedShops();
      expect(remainingShops).to.include(addr1.address);
      expect(remainingShops).to.include(addr3.address);
      expect(remainingShops).to.not.include(addr2.address);
    });

    it("Should return empty array when no shops authorized", async function () {
      const shops = await watchfan.getAuthorizedShops();
      expect(shops.length).to.equal(0);
    });
  });

  describe("Minting par les boutiques autorisées", function () {
    beforeEach(async function () {
      // Autoriser addr1 comme boutique pour les tests
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
    });

    it("Should allow authorized shop to mint", async function () {
      const serialHash = await mintToAddress(watchfan.connect(addr1), addr2.address);
      
      expect(await watchfan.totalSupply()).to.equal(1);
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
    });

    it("Should reject minting from unauthorized address", async function () {
      await expect(
        mintToAddress(watchfan.connect(addr2),addr3.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });

    it("Should reject minting from revoked shop", async function () {
      // Révoquer l'autorisation
      await watchfan.connect(owner).setShopAddress(addr1.address, false);
      
      await expect(
        mintToAddress(watchfan.connect(addr1),addr2.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });

    it("Should allow multiple shops to mint", async function () {
      // Autoriser une deuxième boutique
      await watchfan.connect(owner).setShopAddress(addr2.address, true);
      
      // Les deux boutiques peuvent minter
      await mintToAddress(watchfan.connect(addr1),addr3.address); // tokenId 1
      await mintToAddress(watchfan.connect(addr2),addr3.address); // tokenId 2
      
      expect(await watchfan.totalSupply()).to.equal(2);
      expect(await watchfan.ownerOf(1)).to.equal(addr3.address);
      expect(await watchfan.ownerOf(2)).to.equal(addr3.address);
    });

    it("Should maintain same validation rules for shop minting", async function () {
      // Adresse zéro
      await expect(
        mintToAddress(watchfan.connect(addr1),ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");

      // Adresse de contrat
      await expect(
        mintToAddress(watchfan.connect(addr1),await watchfan.getAddress())
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
    });
  });

  describe("Intégration boutiques et transferts", function () {
    beforeEach(async function () {
      // Autoriser addr1 comme boutique et minter un NFT
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1),addr2.address);
    });

    it("Should allow normal transfer workflow after shop minting", async function () {
      // Vérifier que le NFT minté par la boutique peut être transféré normalement
      await watchfan.connect(addr2).requestTransfer(1, addr3.address);
      await watchfan.connect(addr3).approveReceive(1);
      
      expect(await watchfan.ownerOf(1)).to.equal(addr3.address);
    });

    it("Should maintain transfer restrictions for shop-minted NFTs", async function () {
      // Même avec une boutique autorisée, les transferts directs restent bloqués
      await expect(
        watchfan.connect(addr2).transferFrom(addr2.address, addr3.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });

  });

  describe("Cas limites et edge cases pour boutiques", function () {
    it("Should handle shop authorization state changes correctly", async function () {
      // Autoriser, minter, puis révoquer
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1),addr2.address);
      await watchfan.connect(owner).setShopAddress(addr1.address, false);
      
      // L'ancien NFT existe toujours
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      
      // Mais la boutique ne peut plus minter
      await expect(
        mintToAddress(watchfan.connect(addr1),addr2.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });

    it("Should handle owner address changes", async function () {
      // Autoriser une boutique
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      
      // Transférer la propriété du contrat
      await watchfan.connect(owner).transferOwnership(addr2.address);
      
      // L'ancien owner ne peut plus gérer les boutiques
      await expect(
        watchfan.connect(owner).setShopAddress(addr3.address, true)
      ).to.be.revertedWithCustomError(watchfan, "OwnableUnauthorizedAccount");
      
      // Le nouveau owner peut gérer les boutiques
      await expect(
        watchfan.connect(addr2).setShopAddress(addr3.address, true)
      ).to.emit(watchfan, "ShopAuthorized");
    });

  });

  describe("Mint avec numéro de série (mintWfNFT)", function () {
    let serialHash, serialNumber;

    beforeEach(async function () {
      serialNumber = "CARTIER-987654";
      serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
      
      // Autoriser addr1 comme boutique
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
    });

    it("Should reject minting from owner if not authorized shop", async function () {
      await expect(
        watchfan.connect(owner).mintWfNFT(addr2.address, DEFAULT_URI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });

    it("Should allow authorized shop to mint with serial", async function () {
      await expect(
        watchfan.connect(addr1).mintWfNFT(addr2.address, DEFAULT_URI, serialHash)
      )
        .to.emit(watchfan, "WatchfanMintedTo");
      
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should reject unauthorized minting with serial", async function () {
      await expect(
        watchfan.connect(addr2).mintWfNFT(addr3.address, DEFAULT_URI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });

    it("Should reject duplicate serial hash during mint", async function () {
      // Premier mint
      await watchfan.connect(addr1).mintWfNFT(addr1.address, DEFAULT_URI, serialHash);
      
      // Deuxième mint avec le même hash
      await expect(
        watchfan.connect(addr1).mintWfNFT(addr2.address, DEFAULT_URI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanSerialHashAlreadyExists");
    });

    it("Should reject invalid parameters during mint with serial", async function () {
      const zeroHash = ethers.ZeroHash;
      
      // Hash invalide
      await expect(
        watchfan.connect(addr1).mintWfNFT(addr1.address, DEFAULT_URI, zeroHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidSerialHash");
      
      // Adresse invalide (même validation que mint normal)
      await expect(
        watchfan.connect(addr1).mintWfNFT(ethers.ZeroAddress, DEFAULT_URI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
    });
  });

  describe("Intégration numéros de série et transferts", function () {
    let serialHash, serialNumber;

    beforeEach(async function () {
      serialNumber = "BREITLING-555666";
      serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
      
      // Mint avec numéro de série
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr1.address, DEFAULT_URI, serialHash);
    });

    it("Should maintain serial number after transfer", async function () {
      // Transfert normal
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);
      
      // Le numéro de série reste attaché
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
      expect(await watchfan.verifySerialNumberHash(1, serialHash)).to.be.true;
    });

    it("Should handle multiple tokens with different serials", async function () {
      const serial2 = "TAG-HEUER-777888";
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes(serial2));
      
      // Mint un deuxième token
      await watchfan.connect(addr1).mintWfNFT(addr2.address, DEFAULT_URI, hash2);
      
      // Vérifications croisées
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
      expect(await watchfan.getTokenBySerialHash(hash2)).to.equal(2);
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.ownerOf(2)).to.equal(addr2.address);
    });
  });
  
  describe("Fonction getTokensByOwner", function () {
    it("Should return correct tokens for owner", async function () {
      // Mint plusieurs NFTs pour différents propriétaires
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 1
      await mintToAddress(watchfan.connect(addr1), addr2.address); // tokenId 2
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 3
      await mintToAddress(watchfan.connect(addr1), addr3.address); // tokenId 4
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 5

      // Vérifier les tokens d'addr1
      const addr1Tokens = await watchfan.getTokensByOwner(addr1.address);
      expect(addr1Tokens.length).to.equal(3);
      expect(addr1Tokens).to.include(1n);
      expect(addr1Tokens).to.include(3n);
      expect(addr1Tokens).to.include(5n);

      // Vérifier les tokens d'addr2
      const addr2Tokens = await watchfan.getTokensByOwner(addr2.address);
      expect(addr2Tokens.length).to.equal(1);
      expect(addr2Tokens[0]).to.equal(2n);

      // Vérifier les tokens d'addr3
      const addr3Tokens = await watchfan.getTokensByOwner(addr3.address);
      expect(addr3Tokens.length).to.equal(1);
      expect(addr3Tokens[0]).to.equal(4n);
    });

    it("Should return empty array for owner with no tokens", async function () {
      // Mint un NFT pour addr1 seulement
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      
      // addr2 n'a pas de tokens
      const addr2Tokens = await watchfan.getTokensByOwner(addr2.address);
      expect(addr2Tokens.length).to.equal(0);
    });

    it("Should reject invalid owner address", async function () {
      await expect(
        watchfan.getTokensByOwner(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid owner address");
    });

    it("Should update correctly after transfer", async function () {
      // Mint NFTs
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 1
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 2
      
      // Vérifier avant transfert
      let addr1Tokens = await watchfan.getTokensByOwner(addr1.address);
      let addr2Tokens = await watchfan.getTokensByOwner(addr2.address);
      expect(addr1Tokens.length).to.equal(2);
      expect(addr2Tokens.length).to.equal(0);
      
      // Effectuer un transfert
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);
      
      // Vérifier après transfert
      addr1Tokens = await watchfan.getTokensByOwner(addr1.address);
      addr2Tokens = await watchfan.getTokensByOwner(addr2.address);
      expect(addr1Tokens.length).to.equal(1);
      expect(addr1Tokens[0]).to.equal(2n);
      expect(addr2Tokens.length).to.equal(1);
      expect(addr2Tokens[0]).to.equal(1n);
    });
  });

  describe("Fonction getTokenMetadata", function () {
    it("Should return correct metadata for token with serial number", async function () {
      // Créer un hash de série
      const serialNumber = "ROLEX-123456";
      const serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
      
      // Autoriser une boutique et mint avec numéro de série
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr2.address, DEFAULT_URI, serialHash);
      
      const [uri, purchaseDate, originalShop, returnedSerialHash] = await watchfan.getTokenMetadata(1);
      
      expect(uri).to.equal(DEFAULT_URI);
      expect(purchaseDate).to.be.greaterThan(0);
      expect(originalShop).to.equal(addr1.address);
      expect(returnedSerialHash).to.equal(serialHash);
    });

    it("Should reject query for non-existent token", async function () {
      await expect(
        watchfan.getTokenMetadata(999)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });
  });

  describe("Fonction getTransferHistory", function () {
    it("Should return transfer history for token", async function () {
      // Créer un token avec numéro de série (pour avoir un historique initial)
      const serialHash = ethers.keccak256(ethers.toUtf8Bytes("ROLEX-123"));
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr2.address, DEFAULT_URI, serialHash);
      
      // Effectuer un transfert
      await watchfan.connect(addr2).requestTransfer(1, addr3.address);
      await watchfan.connect(addr3).approveReceive(1);
      
      const history = await watchfan.getTransferHistory(1);
      
      expect(history.length).to.equal(2);
      // Premier transfert (mint)
      expect(history[0].from).to.equal(ethers.ZeroAddress);
      expect(history[0].to).to.equal(addr2.address);
      // Deuxième transfert
      expect(history[1].from).to.equal(addr2.address);
      expect(history[1].to).to.equal(addr3.address);
    });

    it("Should reject query for non-existent token", async function () {
      await expect(
        watchfan.getTransferHistory(999)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });
  });

  describe("Système de double validation - Setup", function () {
    beforeEach(async function () {
      // Mint un NFT pour addr1 pour les tests de transfert
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
    });

    it("Should block direct transfers", async function () {
      // Tenter un transfert direct devrait échouer
      await expect(
        watchfan.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });

    it("Should block direct safeTransferFrom", async function () {
      // Tenter un transfert direct avec safeTransferFrom devrait échouer
      await expect(
        watchfan.connect(addr1)["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });

    it("Should block approve + transferFrom pattern", async function () {
      // Même avec une approbation, le transfert devrait échouer
      await watchfan.connect(addr1).approve(addr2.address, 1);
      await expect(
        watchfan.connect(addr2).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });
  });

  describe("Demande de transfert (requestTransfer)", function () {
    beforeEach(async function () {
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
    });

    it("Should allow owner to request transfer", async function () {
      await expect(watchfan.connect(addr1).requestTransfer(1, addr2.address))
        .to.emit(watchfan, "TransferRequested")
        .withArgs(1, addr1.address, addr2.address)
        .and.to.emit(watchfan, "TransferApprovedByOwner")
        .withArgs(1, addr1.address);
    });

    it("Should reject request from non-owner", async function () {
      await expect(
        watchfan.connect(addr2).requestTransfer(1, addr1.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanNotOwner");
    });

    it("Should reject request for non-existent token", async function () {
      await expect(
        watchfan.connect(addr1).requestTransfer(999, addr2.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });

    it("Should reject invalid recipients", async function () {
      // Adresse zéro
      await expect(
        watchfan.connect(addr1).requestTransfer(1, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");

      // Adresse de contrat
      await expect(
        watchfan.connect(addr1).requestTransfer(1, await watchfan.getAddress())
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");

      // Transfert à soi-même
      await expect(
        watchfan.connect(addr1).requestTransfer(1, addr1.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
    });

    it("Should reject duplicate requests", async function () {
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await expect(
        watchfan.connect(addr1).requestTransfer(1, addr2.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferAlreadyExists");
    });

    it("Should store pending transfer correctly", async function () {
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      const [from, to, ownerApproved, recipientApproved, timestamp] = 
        await watchfan.getPendingTransfer(1);
      
      expect(from).to.equal(addr1.address);
      expect(to).to.equal(addr2.address);
      expect(ownerApproved).to.be.true;
      expect(recipientApproved).to.be.false;
      expect(timestamp).to.be.greaterThan(0);
    });
  });

  describe("Approbation par le destinataire (approveReceive)", function () {
    it("Should allow recipient to approve and auto-execute transfer", async function () {
      // Setup spécifique pour ce test
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      // Vérifier l'état avant
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.true;

      // L'approbation devrait déclencher l'exécution automatique
      await expect(watchfan.connect(addr2).approveReceive(1))
        .to.emit(watchfan, "TransferApprovedByRecipient")
        .withArgs(1, addr2.address)
        .and.to.emit(watchfan, "TransferExecuted")
        .withArgs(1, addr1.address, addr2.address)
        .and.to.emit(watchfan, "WatchfanTransferred")
        .withArgs(addr1.address, addr2.address, 1);

      // Vérifier l'état après
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
    });

    it("Should reject approval from non-recipient", async function () {
      // Setup spécifique pour ce test
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      // Utiliser addr3 depuis la fixture
      await expect(
        watchfan.connect(addr3).approveReceive(1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanNotRecipient");
    });

    it("Should reject approval for non-existent request", async function () {
      // Pas besoin de setup pour ce test car on teste un token inexistant
      await expect(
        watchfan.connect(addr2).approveReceive(999)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });

  });

  describe("Annulation de transfert (cancelTransfer)", function () {
    it("Should allow owner to cancel transfer", async function () {
      // Setup spécifique
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      await expect(watchfan.connect(addr1).cancelTransfer(1))
        .to.emit(watchfan, "TransferCancelled")
        .withArgs(1, addr1.address, addr2.address);

      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should allow recipient to cancel transfer", async function () {
      // Setup spécifique
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      await expect(watchfan.connect(addr2).cancelTransfer(1))
        .to.emit(watchfan, "TransferCancelled")
        .withArgs(1, addr1.address, addr2.address);

      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should reject cancellation from unauthorized user", async function () {
      // Setup spécifique
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      await expect(
        watchfan.connect(addr3).cancelTransfer(1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedCancellation");
    });

    it("Should reject cancellation for non-existent request", async function () {
      await expect(
        watchfan.connect(addr1).cancelTransfer(999)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });

    it("Should allow new request after cancellation", async function () {
      // Setup spécifique
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      // Annuler
      await watchfan.connect(addr1).cancelTransfer(1);
      
      // Créer une nouvelle demande
      await expect(watchfan.connect(addr1).requestTransfer(1, addr2.address))
        .to.emit(watchfan, "TransferRequested");
    });
  });

  describe("Fonctions utilitaires", function () {
    beforeEach(async function () {
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
    });

    it("Should correctly report pending transfer status", async function () {
      // Pas de transfert en attente initialement
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
      
      // Créer une demande
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.true;
      
      // Après exécution
      await watchfan.connect(addr2).approveReceive(1);
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
    });

    it("Should return correct pending transfer details", async function () {
      // Pas de transfert en attente
      const [from1, to1, ownerApproved1, recipientApproved1, timestamp1] = 
        await watchfan.getPendingTransfer(1);
      expect(from1).to.equal(ethers.ZeroAddress);
      
      // Créer une demande
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      const [from2, to2, ownerApproved2, recipientApproved2, timestamp2] = 
        await watchfan.getPendingTransfer(1);
      
      expect(from2).to.equal(addr1.address);
      expect(to2).to.equal(addr2.address);
      expect(ownerApproved2).to.be.true;
      expect(recipientApproved2).to.be.false;
      expect(timestamp2).to.be.greaterThan(0);
    });

  });

  describe("Cas des transferts multiples", function () {
    beforeEach(async function () {
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
    });

    it("Should handle multiple pending transfers correctly", async function () {
      // Mint plusieurs NFTs
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 2
      await mintToAddress(watchfan.connect(addr1), addr2.address); // tokenId 3
      
      // Créer plusieurs demandes
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr1).requestTransfer(2, addr2.address);
      await watchfan.connect(addr2).requestTransfer(3, addr1.address);
      
      expect(await watchfan.hasPendingTransfer(1)).to.be.true;
      expect(await watchfan.hasPendingTransfer(2)).to.be.true;
      expect(await watchfan.hasPendingTransfer(3)).to.be.true;
      
      // Exécuter une seule demande
      await watchfan.connect(addr2).approveReceive(1);
      
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
      expect(await watchfan.hasPendingTransfer(2)).to.be.true;
      expect(await watchfan.hasPendingTransfer(3)).to.be.true;
    });
  });

  // Test final de bout en bout
  describe("Scénario complet de transfert", function () {
    it("Should complete full transfer workflow", async function () {
      // Setup: Mint NFT
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      
      // Étape 1: Demande de transfert
      await expect(watchfan.connect(addr1).requestTransfer(1, addr2.address))
        .to.emit(watchfan, "TransferRequested");
      
      // Étape 2: Vérification de l'état intermédiaire
      expect(await watchfan.hasPendingTransfer(1)).to.be.true;
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address); // Pas encore transféré
      
      // Étape 3: Approbation et exécution
      await expect(watchfan.connect(addr2).approveReceive(1))
        .to.emit(watchfan, "TransferExecuted");
      
      // Étape 4: Vérification finale
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
    });
  });

  describe("Scénario complet avec numéro de série", function () {
    it("Should complete full workflow with serial number", async function () {
      const { serialNumber, serialHash } = createTestSerial("ROLEX");
      
      // Setup: Mint NFT avec numéro de série
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr1.address, DEFAULT_URI, serialHash);
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
      
      // Workflow de transfert complet
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);
      
      // Vérifications finales
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.verifySerialNumberHash(1, serialHash)).to.be.true;
    });
  });

});