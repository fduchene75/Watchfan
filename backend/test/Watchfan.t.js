// Tests du contrat Watchfan NFT
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

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

describe("Watchfan NFT Contract", function () {
  // Variables partagées pour tous les tests
  let watchfan, owner, addr1, addr2, addr3, defaultURI;

  // Fixture : déploie le contrat une fois et le réutilise pour chaque test
  async function deployWatchfanFixture() {
    // Récupère les comptes de test
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    // Déploie le contrat avec l'owner
    const Watchfan = await ethers.getContractFactory("Watchfan");
    const watchfan = await Watchfan.deploy(owner.address);
    // URI par défaut pour les tests
    const defaultURI = "ipfs://bafkreihooe6yb7hyjrluimzpeqklzdwkbvzx6fr73rvvnqh3zzuedk4aym";
    // Retourne les éléments nécessaires aux tests
    return { watchfan, owner, addr1, addr2, addr3, defaultURI };
  }

  // beforeEach : charge le fixture avant chaque test individuel
  beforeEach(async function () {
    ({ watchfan, owner, addr1, addr2, addr3, defaultURI } = await loadFixture(deployWatchfanFixture));
  });

  describe("Déploiement et état initial", function () {
    it("Should deploy correctly", async function () {

      // Vérifie que le contrat est déployé correctement
      expect(await watchfan.name()).to.equal("Watchfan NFT Collection");
      expect(await watchfan.symbol()).to.equal("WFC");
      expect(await watchfan.owner()).to.equal(owner.address);

      // Vérifie l'état initial
      expect(await watchfan.totalSupply()).to.equal(1);
      expect(await watchfan.exists(0)).to.be.false;
      expect(await watchfan.exists(1)).to.be.false;
      await expect(watchfan.ownerOf(1)).to.be.revertedWithCustomError(watchfan, 'ERC721NonexistentToken');
    });
  });

  describe("Cas simples de mint", function () {
    it("Should reject unallowed mint", async function () {
      await expect(watchfan.connect(addr1).mintWfNFT(addr1, defaultURI)).to.be.revertedWithCustomError(watchfan, 'WatchfanUnauthorizedMinting');
    });
    it("Should allow owner to mint for user1", async function () {
      await watchfan.mintWfNFT(addr1.address, defaultURI);
      expect(await watchfan.totalSupply()).to.equal(2);
      expect(await watchfan.exists(1)).to.be.true;
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
    });
    it("Should increment when multiple minting", async function () {
      await watchfan.mintWfNFT(addr1.address, defaultURI);
      await watchfan.mintWfNFT(addr2.address, defaultURI);
      expect(await watchfan.totalSupply()).to.equal(3);
      expect(await watchfan.exists(1)).to.be.true;
      expect(await watchfan.exists(2)).to.be.true;
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.ownerOf(2)).to.equal(addr2.address);
    });
    it("Should emit an event after minting", async function () {
      await expect(watchfan.mintWfNFT(addr1.address, defaultURI))
      .to.emit(watchfan, "WatchfanMintedTo")
      .withArgs(addr1.address, 1);
    });
  });

  describe("Contrôle de l'adresse destinataire", function () {
    it("Should reject zero address", async function () {
      await expect(watchfan.mintWfNFT(ethers.ZeroAddress, defaultURI)).to.be.revertedWithCustomError(watchfan, 'WatchfanInvalidRecipient');
    });
    it("Should reject a contract address", async function () {
      await expect(watchfan.mintWfNFT(await watchfan.getAddress(), defaultURI)).to.be.revertedWithCustomError(watchfan, 'WatchfanInvalidRecipient');
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
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidShopAddress");

      // Adresse de contrat
      await expect(
        watchfan.connect(owner).setShopAddress(await watchfan.getAddress(), true)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidShopAddress");
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
      await expect(watchfan.connect(addr1).mintWfNFT(addr2.address, defaultURI))
        .to.emit(watchfan, "WatchfanMintedTo")
        .withArgs(addr2.address, 1);
      
      expect(await watchfan.totalSupply()).to.equal(2);
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should still allow owner to mint", async function () {
      await expect(watchfan.connect(owner).mintWfNFT(addr2.address, defaultURI))
        .to.emit(watchfan, "WatchfanMintedTo")
        .withArgs(addr2.address, 1);
      
      expect(await watchfan.totalSupply()).to.equal(2);
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should reject minting from unauthorized address", async function () {
      await expect(
        watchfan.connect(addr2).mintWfNFT(addr3.address, defaultURI)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });

    it("Should reject minting from revoked shop", async function () {
      // Révoquer l'autorisation
      await watchfan.connect(owner).setShopAddress(addr1.address, false);
      
      await expect(
        watchfan.connect(addr1).mintWfNFT(addr2.address, defaultURI)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });

    it("Should allow multiple shops to mint", async function () {
      // Autoriser une deuxième boutique
      await watchfan.connect(owner).setShopAddress(addr2.address, true);
      
      // Les deux boutiques peuvent minter
      await watchfan.connect(addr1).mintWfNFT(addr3.address, defaultURI); // tokenId 1
      await watchfan.connect(addr2).mintWfNFT(addr3.address, defaultURI); // tokenId 2
      
      expect(await watchfan.totalSupply()).to.equal(3);
      expect(await watchfan.ownerOf(1)).to.equal(addr3.address);
      expect(await watchfan.ownerOf(2)).to.equal(addr3.address);
    });

    it("Should maintain same validation rules for shop minting", async function () {
      // Adresse zéro
      await expect(
        watchfan.connect(addr1).mintWfNFT(ethers.ZeroAddress, defaultURI)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidRecipient");

      // Adresse de contrat
      await expect(
        watchfan.connect(addr1).mintWfNFT(await watchfan.getAddress(), defaultURI)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidRecipient");
    });
  });

  describe("Intégration boutiques et transferts", function () {
    beforeEach(async function () {
      // Autoriser addr1 comme boutique et minter un NFT
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr2.address, defaultURI);
    });

    it("Should allow normal transfer workflow after shop minting", async function () {
      // Vérifier que le NFT minté par la boutique peut être transféré normalement
      await watchfan.connect(addr2).requestTransfer(1, addr3.address);
      await watchfan.connect(addr3).approveReceive(1);
      
      expect(await watchfan.ownerOf(1)).to.equal(addr3.address);
    });

    it("Should allow owner emergency transfer on shop-minted NFT", async function () {
      await expect(
        watchfan.connect(owner).emergencyTransfer(addr2.address, addr3.address, 1)
      ).to.emit(watchfan, "WatchfanTransferred");
      
      expect(await watchfan.ownerOf(1)).to.equal(addr3.address);
    });

    it("Should maintain transfer restrictions for shop-minted NFTs", async function () {
      // Même avec une boutique autorisée, les transferts directs restent bloqués
      await expect(
        watchfan.connect(addr2).transferFrom(addr2.address, addr3.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });

    it("Should block shop from making unauthorized transfers", async function () {
      // Une boutique ne peut pas faire de transferts d'urgence
      await expect(
        watchfan.connect(addr1).emergencyTransfer(addr2.address, addr3.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "OwnableUnauthorizedAccount");
    });
  });

  describe("Cas limites et edge cases pour boutiques", function () {
    it("Should handle shop authorization state changes correctly", async function () {
      // Autoriser, minter, puis révoquer
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr2.address, defaultURI);
      await watchfan.connect(owner).setShopAddress(addr1.address, false);
      
      // L'ancien NFT existe toujours
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      
      // Mais la boutique ne peut plus minter
      await expect(
        watchfan.connect(addr1).mintWfNFT(addr2.address, defaultURI)
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

  describe("Gestion des numéros de série (setSerialNumberHash)", function () {
    let serialHash, serialNumber;

    beforeEach(async function () {
      // Créer un hash de test cohérent
      serialNumber = "ROLEX-123456";
      serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
      
      // Mint un NFT pour les tests
      await watchfan.mintWfNFT(addr1.address, defaultURI);
    });

    it("Should allow owner to set serial number hash", async function () {
      await expect(watchfan.connect(owner).setSerialNumberHash(1, serialHash))
        .to.emit(watchfan, "SerialNumberSet")
        .withArgs(1, serialHash);
      
      expect(await watchfan.hasSerialNumber(1)).to.be.true;
      expect(await watchfan.getSerialNumberHash(1)).to.equal(serialHash);
    });

    it("Should reject setting serial hash from non-owner", async function () {
      await expect(
        watchfan.connect(addr1).setSerialNumberHash(1, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "OwnableUnauthorizedAccount");
    });

    it("Should reject invalid serial hash", async function () {
      const zeroHash = ethers.ZeroHash;
      
      await expect(
        watchfan.connect(owner).setSerialNumberHash(1, zeroHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidSerialHash");
    });

    it("Should reject setting serial for non-existent token", async function () {
      await expect(
        watchfan.connect(owner).setSerialNumberHash(999, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });

    it("Should reject duplicate serial hash assignment", async function () {
      // Assigner le hash au premier token
      await watchfan.connect(owner).setSerialNumberHash(1, serialHash);
      
      // Mint un deuxième token
      await watchfan.mintWfNFT(addr2.address, defaultURI);
      
      // Tenter d'assigner le même hash
      await expect(
        watchfan.connect(owner).setSerialNumberHash(2, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanSerialHashAlreadyExists");
    });

    it("Should reject setting serial twice for same token", async function () {
      await watchfan.connect(owner).setSerialNumberHash(1, serialHash);
      
      const newSerialHash = ethers.keccak256(ethers.toUtf8Bytes("OMEGA-789"));
      
      await expect(
        watchfan.connect(owner).setSerialNumberHash(1, newSerialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanSerialNumberAlreadySet");
    });
  });

  describe("Recherche par hash de numéro de série (getTokenBySerialHash)", function () {
    let serialHash1, serialHash2, serialNumber1, serialNumber2;

    beforeEach(async function () {
      serialNumber1 = "ROLEX-123456";
      serialNumber2 = "OMEGA-789012";
      serialHash1 = ethers.keccak256(ethers.toUtf8Bytes(serialNumber1));
      serialHash2 = ethers.keccak256(ethers.toUtf8Bytes(serialNumber2));
      
      // Mint et assigner des numéros de série
      await watchfan.mintWfNFT(addr1.address, defaultURI); // tokenId 1
      await watchfan.mintWfNFT(addr2.address, defaultURI); // tokenId 2
      await watchfan.connect(owner).setSerialNumberHash(1, serialHash1);
      await watchfan.connect(owner).setSerialNumberHash(2, serialHash2);
    });

    it("Should find correct token by serial hash", async function () {
      expect(await watchfan.getTokenBySerialHash(serialHash1)).to.equal(1);
      expect(await watchfan.getTokenBySerialHash(serialHash2)).to.equal(2);
    });

    it("Should reject search with invalid hash", async function () {
      const zeroHash = ethers.ZeroHash;
      
      await expect(
        watchfan.getTokenBySerialHash(zeroHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidSerialHash");
    });

    it("Should reject search for non-existent hash", async function () {
      const unknownHash = ethers.keccak256(ethers.toUtf8Bytes("UNKNOWN-999"));
      
      await expect(
        watchfan.getTokenBySerialHash(unknownHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanSerialNumberNotSet");
    });

    it("Should handle multiple tokens correctly", async function () {
      // Mint un nouveau NFT qui sera tokenId 3
      await watchfan.mintWfNFT(addr3.address, defaultURI);
      
      // Les anciens tokens devraient toujours être trouvables
      expect(await watchfan.getTokenBySerialHash(serialHash1)).to.equal(1);
      expect(await watchfan.getTokenBySerialHash(serialHash2)).to.equal(2);
    });
  });

  describe("Fonctions utilitaires de numéro de série", function () {
    let serialHash, serialNumber;

    beforeEach(async function () {
      serialNumber = "PATEK-456789";
      serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
      await watchfan.mintWfNFT(addr1.address, defaultURI);
    });

    it("Should correctly report serial number status", async function () {
      // Avant d'assigner
      expect(await watchfan.hasSerialNumber(1)).to.be.false;
      expect(await watchfan.serialHashExists(serialHash)).to.be.false;
      
      // Après assignation
      await watchfan.connect(owner).setSerialNumberHash(1, serialHash);
      expect(await watchfan.hasSerialNumber(1)).to.be.true;
      expect(await watchfan.serialHashExists(serialHash)).to.be.true;
    });

    it("Should verify serial number hash correctly", async function () {
      await watchfan.connect(owner).setSerialNumberHash(1, serialHash);
      
      // Hash correct
      expect(await watchfan.verifySerialNumberHash(1, serialHash)).to.be.true;
      
      // Hash incorrect
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("WRONG-SERIAL"));
      expect(await watchfan.verifySerialNumberHash(1, wrongHash)).to.be.false;
    });

    it("Should reject operations on tokens without serial", async function () {
      // getSerialNumberHash sans numéro de série
      await expect(
        watchfan.getSerialNumberHash(1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanSerialNumberNotSet");
      
      // verifySerialNumberHash sans numéro de série
      await expect(
        watchfan.verifySerialNumberHash(1, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanSerialNumberNotSet");
    });

    it("Should handle zero hash in serialHashExists", async function () {
      const zeroHash = ethers.ZeroHash;
      expect(await watchfan.serialHashExists(zeroHash)).to.be.false;
    });
  });

  describe("Mint avec numéro de série (mintWfNFTWithSerialHash)", function () {
    let serialHash, serialNumber;

    beforeEach(async function () {
      serialNumber = "CARTIER-987654";
      serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
      
      // Autoriser addr1 comme boutique
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
    });

    it("Should mint with serial hash in one transaction", async function () {
      await expect(
        watchfan.connect(owner).mintWfNFTWithSerialHash(addr2.address, defaultURI, serialHash)
      )
        .to.emit(watchfan, "WatchfanMintedTo")
        .withArgs(addr2.address, 1)
        .and.to.emit(watchfan, "SerialNumberSet")
        .withArgs(1, serialHash);
      
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.hasSerialNumber(1)).to.be.true;
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
    });

    it("Should allow authorized shop to mint with serial", async function () {
      await expect(
        watchfan.connect(addr1).mintWfNFTWithSerialHash(addr2.address, defaultURI, serialHash)
      )
        .to.emit(watchfan, "WatchfanMintedTo")
        .and.to.emit(watchfan, "SerialNumberSet");
      
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should reject unauthorized minting with serial", async function () {
      await expect(
        watchfan.connect(addr2).mintWfNFTWithSerialHash(addr3.address, defaultURI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });

    it("Should reject duplicate serial hash during mint", async function () {
      // Premier mint
      await watchfan.connect(owner).mintWfNFTWithSerialHash(addr1.address, defaultURI, serialHash);
      
      // Deuxième mint avec le même hash
      await expect(
        watchfan.connect(owner).mintWfNFTWithSerialHash(addr2.address, defaultURI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanSerialHashAlreadyExists");
    });

    it("Should reject invalid parameters during mint with serial", async function () {
      const zeroHash = ethers.ZeroHash;
      
      // Hash invalide
      await expect(
        watchfan.connect(owner).mintWfNFTWithSerialHash(addr1.address, defaultURI, zeroHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidSerialHash");
      
      // Adresse invalide (même validation que mint normal)
      await expect(
        watchfan.connect(owner).mintWfNFTWithSerialHash(ethers.ZeroAddress, defaultURI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidRecipient");
    });
  });

  describe("Intégration numéros de série et transferts", function () {
    let serialHash, serialNumber;

    beforeEach(async function () {
      serialNumber = "BREITLING-555666";
      serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
      
      // Mint avec numéro de série
      await watchfan.connect(owner).mintWfNFTWithSerialHash(addr1.address, defaultURI, serialHash);
    });

    it("Should maintain serial number after transfer", async function () {
      // Transfert normal
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);
      
      // Le numéro de série reste attaché
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.hasSerialNumber(1)).to.be.true;
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
      expect(await watchfan.verifySerialNumberHash(1, serialHash)).to.be.true;
    });

    it("Should maintain serial number after emergency transfer", async function () {
      // Transfert d'urgence
      await watchfan.connect(owner).emergencyTransfer(addr1.address, addr3.address, 1);
      
      // Le numéro de série reste attaché
      expect(await watchfan.ownerOf(1)).to.equal(addr3.address);
      expect(await watchfan.hasSerialNumber(1)).to.be.true;
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
    });

    it("Should handle multiple tokens with different serials", async function () {
      const serial2 = "TAG-HEUER-777888";
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes(serial2));
      
      // Mint un deuxième token
      await watchfan.connect(owner).mintWfNFTWithSerialHash(addr2.address, defaultURI, hash2);
      
      // Vérifications croisées
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
      expect(await watchfan.getTokenBySerialHash(hash2)).to.equal(2);
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.ownerOf(2)).to.equal(addr2.address);
    });
  });
  
  describe("Système de double validation - Setup", function () {
    beforeEach(async function () {
      // Mint un NFT pour addr1 pour les tests de transfert
      await watchfan.mintWfNFT(addr1.address, defaultURI);
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
      await watchfan.mintWfNFT(addr1.address, defaultURI);
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
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidRecipient");

      // Adresse de contrat
      await expect(
        watchfan.connect(addr1).requestTransfer(1, await watchfan.getAddress())
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidRecipient");

      // Transfert à soi-même
      await expect(
        watchfan.connect(addr1).requestTransfer(1, addr1.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidRecipient");
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
      await watchfan.mintWfNFT(addr1.address, defaultURI);
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
      await watchfan.mintWfNFT(addr1.address, defaultURI);
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
      await watchfan.mintWfNFT(addr1.address, defaultURI);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      await expect(watchfan.connect(addr1).cancelTransfer(1))
        .to.emit(watchfan, "TransferCancelled")
        .withArgs(1, addr1.address, addr2.address);

      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should allow recipient to cancel transfer", async function () {
      // Setup spécifique
      await watchfan.mintWfNFT(addr1.address, defaultURI);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      await expect(watchfan.connect(addr2).cancelTransfer(1))
        .to.emit(watchfan, "TransferCancelled")
        .withArgs(1, addr1.address, addr2.address);

      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should reject cancellation from unauthorized user", async function () {
      // Setup spécifique
      await watchfan.mintWfNFT(addr1.address, defaultURI);
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
      await watchfan.mintWfNFT(addr1.address, defaultURI);
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
      await watchfan.mintWfNFT(addr1.address, defaultURI);
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

  describe("Fonctions d'urgence et cas limites", function () {
    beforeEach(async function () {
      await watchfan.mintWfNFT(addr1.address, defaultURI);
    });

    it("Should allow owner to emergency transfer", async function () {
      await expect(watchfan.connect(owner).emergencyTransfer(addr1.address, addr2.address, 1))
        .to.emit(watchfan, "WatchfanTransferred")
        .withArgs(addr1.address, addr2.address, 1);

      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should reject emergency transfer from non-owner", async function () {
      await expect(
        watchfan.connect(addr1).emergencyTransfer(addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "OwnableUnauthorizedAccount");
    });

    it("Should clean pending transfer during emergency", async function () {
      // Créer une demande en attente
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.true;

      // Transfert d'urgence devrait nettoyer la demande
      await watchfan.connect(owner).emergencyTransfer(addr1.address, addr2.address, 1);
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
    });

    it("Should handle ownership change during pending transfer", async function () {
      // Créer une demande
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      
      // Le propriétaire du contrat fait un transfert d'urgence vers quelqu'un d'autre
      await watchfan.connect(owner).emergencyTransfer(addr1.address, addr3.address, 1);
      
      // Le destinataire original ne devrait plus pouvoir approuver
      await expect(
        watchfan.connect(addr2).approveReceive(1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });

    it("Should handle multiple pending transfers correctly", async function () {
      // Mint plusieurs NFTs
      await watchfan.mintWfNFT(addr1.address, defaultURI); // tokenId 2
      await watchfan.mintWfNFT(addr2.address, defaultURI); // tokenId 3
      
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
      await watchfan.mintWfNFT(addr1.address, defaultURI);
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
      await watchfan.connect(owner).mintWfNFTWithSerialHash(addr1.address, defaultURI, serialHash);
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
      
      // Workflow de transfert complet
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);
      
      // Vérifications finales
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.hasSerialNumber(1)).to.be.true;
      expect(await watchfan.verifySerialNumberHash(1, serialHash)).to.be.true;
    });
  });

});