// Watchfan NFT Contract Tests
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const DEFAULT_URI = "ipfs://bafkreihooe6yb7hyjrluimzpeqklzdwkbvzx6fr73rvvnqh3zzuedk4aym";
// Utility function to create serial number hashes
function createSerialHash(serialNumber) {
  return ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
}
// Helper to create tests with consistent data
function createTestSerial(base = "TEST") {
  const random = Math.floor(Math.random() * 1000000);
  const serialNumber = `${base}-${random}`;
  const serialHash = createSerialHash(serialNumber);
  return { serialNumber, serialHash };
}
// Helper to facilitate minting with a serial number
async function mintToAddress(contract, recipient, uri = DEFAULT_URI) {
  const { serialHash } = createTestSerial();
  await contract.mintWfNFT(recipient, uri, serialHash);
  return serialHash;
}

describe("Watchfan NFT Contract", function () {
  // Shared variables for all tests
  let watchfan, owner, addr1, addr2, addr3;
  // Fixture: deploys the contract once and reuses it for each test
  async function deployWatchfanFixture() {
    // Get test accounts
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    // Deploy the contract with the owner
    const Watchfan = await ethers.getContractFactory("Watchfan");
    const watchfan = await Watchfan.deploy(owner.address);
    // Return elements needed for tests
    return { watchfan, owner, addr1, addr2, addr3 };
  }
  // beforeEach: load the fixture before each individual test
  beforeEach(async function () {
    ({ watchfan, owner, addr1, addr2, addr3 } = await loadFixture(deployWatchfanFixture));
  });
  describe("Deployment and initial state", function () {
    it("Should deploy correctly", async function () {
      // Check that the contract is deployed correctly
      expect(await watchfan.name()).to.equal("Watchfan NFT Collection");
      expect(await watchfan.symbol()).to.equal("WFC");
      expect(await watchfan.owner()).to.equal(owner.address);
      // Check initial state
      expect(await watchfan.totalSupply()).to.equal(0);
      expect(await watchfan.exists(0)).to.be.false;
      expect(await watchfan.exists(1)).to.be.false;
      await expect(watchfan.ownerOf(1)).to.be.revertedWithCustomError(watchfan, 'ERC721NonexistentToken');
    });
  });
  describe("Recipient address control", function () {
    beforeEach(async function () {
      // Authorize addr1 as a shop for tests
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
  describe("Authorized shops management (setShopAddress)", function () {
    it("Should allow owner to authorize a shop", async function () {
      await expect(watchfan.connect(owner).setShopAddress(addr1.address, true))
        .to.emit(watchfan, "ShopAuthorized")
        .withArgs(addr1.address, owner.address);

      expect(await watchfan.isAuthorizedShop(addr1.address)).to.be.true;
    });
    it("Should allow owner to revoke shop authorization", async function () {
      // Authorize first
      await watchfan.connect(owner).setShopAddress(addr1.address, true);

      // Then revoke
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
      // Zero address
      await expect(
        watchfan.connect(owner).setShopAddress(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
      // Contract address
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
      // Authorize multiple shops
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(owner).setShopAddress(addr2.address, true);
      await watchfan.connect(owner).setShopAddress(addr3.address, true);

      const shops = await watchfan.getAuthorizedShops();
      expect(shops).to.include(addr1.address);
      expect(shops).to.include(addr2.address);
      expect(shops).to.include(addr3.address);

      // Revoke a shop
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
  describe("Minting by authorized shops", function () {
    beforeEach(async function () {
      // Authorize addr1 as a shop for tests
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
      // Revoke authorization
      await watchfan.connect(owner).setShopAddress(addr1.address, false);

      await expect(
        mintToAddress(watchfan.connect(addr1),addr2.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });
    it("Should allow multiple shops to mint", async function () {
      // Authorize a second shop
      await watchfan.connect(owner).setShopAddress(addr2.address, true);

      // Both shops can mint
      await mintToAddress(watchfan.connect(addr1),addr3.address); // tokenId 1
      await mintToAddress(watchfan.connect(addr2),addr3.address); // tokenId 2

      expect(await watchfan.totalSupply()).to.equal(2);
      expect(await watchfan.ownerOf(1)).to.equal(addr3.address);
      expect(await watchfan.ownerOf(2)).to.equal(addr3.address);
    });
    it("Should maintain same validation rules for shop minting", async function () {
      // Zero address
      await expect(
        mintToAddress(watchfan.connect(addr1),ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
      // Contract address
      await expect(
        mintToAddress(watchfan.connect(addr1),await watchfan.getAddress())
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
    });
  });
  describe("Shop and transfer integration", function () {
    beforeEach(async function () {
      // Authorize addr1 as a shop and mint an NFT
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr2.address);
    });
    it("Should allow normal transfer workflow after shop minting", async function () {
      // Check that the NFT minted by the shop can be transferred normally
      await watchfan.connect(addr2).requestTransfer(1, addr3.address);
      await watchfan.connect(addr3).approveReceive(1);

      expect(await watchfan.ownerOf(1)).to.equal(addr3.address);
    });
    it("Should maintain transfer restrictions for shop-minted NFTs", async function () {
      // Even with an authorized shop, direct transfers remain blocked
      await expect(
        watchfan.connect(addr2).transferFrom(addr2.address, addr3.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });
  });
  describe("Edge cases for shops", function () {
    it("Should handle shop authorization state changes correctly", async function () {
      // Authorize, mint, then revoke
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1),addr2.address);
      await watchfan.connect(owner).setShopAddress(addr1.address, false);

      // The old NFT still exists
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);

      // But the shop can no longer mint
      await expect(
        mintToAddress(watchfan.connect(addr1),addr2.address)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanUnauthorizedMinting");
    });
    it("Should handle owner address changes", async function () {
      // Authorize a shop
      await watchfan.connect(owner).setShopAddress(addr1.address, true);

      // Transfer contract ownership
      await watchfan.connect(owner).transferOwnership(addr2.address);

      // The old owner can no longer manage shops
      await expect(
        watchfan.connect(owner).setShopAddress(addr3.address, true)
      ).to.be.revertedWithCustomError(watchfan, "OwnableUnauthorizedAccount");

      // The new owner can manage shops
      await expect(
        watchfan.connect(addr2).setShopAddress(addr3.address, true)
      ).to.emit(watchfan, "ShopAuthorized");
    });
  });
  describe("Mint with serial number (mintWfNFT)", function () {
    let serialHash, serialNumber;
    beforeEach(async function () {
      serialNumber = "CARTIER-987654";
      serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));

      // Authorize addr1 as a shop
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
      // First mint
      await watchfan.connect(addr1).mintWfNFT(addr1.address, DEFAULT_URI, serialHash);

      // Second mint with the same hash
      await expect(
        watchfan.connect(addr1).mintWfNFT(addr2.address, DEFAULT_URI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanSerialHashAlreadyExists");
    });
    it("Should reject invalid parameters during mint with serial", async function () {
      const zeroHash = ethers.ZeroHash;

      // Invalid hash
      await expect(
        watchfan.connect(addr1).mintWfNFT(addr1.address, DEFAULT_URI, zeroHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidSerialHash");

      // Invalid address (same validation as normal mint)
      await expect(
        watchfan.connect(addr1).mintWfNFT(ethers.ZeroAddress, DEFAULT_URI, serialHash)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
    });
  });
  describe("Serial number and transfer integration", function () {
    let serialHash, serialNumber;
    beforeEach(async function () {
      serialNumber = "BREITLING-555666";
      serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));

      // Mint with serial number
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr1.address, DEFAULT_URI, serialHash);
    });
    it("Should maintain serial number after transfer", async function () {
      // Normal transfer
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);

      // The serial number remains attached
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
      expect(await watchfan.verifySerialNumberHash(1, serialHash)).to.be.true;
    });
    it("Should handle multiple tokens with different serials", async function () {
      const serial2 = "TAG-HEUER-777888";
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes(serial2));

      // Mint a second token
      await watchfan.connect(addr1).mintWfNFT(addr2.address, DEFAULT_URI, hash2);

      // Cross-checks
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);
      expect(await watchfan.getTokenBySerialHash(hash2)).to.equal(2);
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.ownerOf(2)).to.equal(addr2.address);
    });
  });

  describe("getTokensByOwner function", function () {
    it("Should return correct tokens for owner", async function () {
      // Mint several NFTs for different owners
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 1
      await mintToAddress(watchfan.connect(addr1), addr2.address); // tokenId 2
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 3
      await mintToAddress(watchfan.connect(addr1), addr3.address); // tokenId 4
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 5
      // Check addr1's tokens
      const addr1Tokens = await watchfan.getTokensByOwner(addr1.address);
      expect(addr1Tokens.length).to.equal(3);
      expect(addr1Tokens).to.include(1n);
      expect(addr1Tokens).to.include(3n);
      expect(addr1Tokens).to.include(5n);
      // Check addr2's tokens
      const addr2Tokens = await watchfan.getTokensByOwner(addr2.address);
      expect(addr2Tokens.length).to.equal(1);
      expect(addr2Tokens[0]).to.equal(2n);
      // Check addr3's tokens
      const addr3Tokens = await watchfan.getTokensByOwner(addr3.address);
      expect(addr3Tokens.length).to.equal(1);
      expect(addr3Tokens[0]).to.equal(4n);
    });
    it("Should return empty array for owner with no tokens", async function () {
      // Mint an NFT only for addr1
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);

      // addr2 has no tokens
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

      // Check before transfer
      let addr1Tokens = await watchfan.getTokensByOwner(addr1.address);
      let addr2Tokens = await watchfan.getTokensByOwner(addr2.address);
      expect(addr1Tokens.length).to.equal(2);
      expect(addr2Tokens.length).to.equal(0);

      // Perform a transfer
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);

      // Check after transfer
      addr1Tokens = await watchfan.getTokensByOwner(addr1.address);
      addr2Tokens = await watchfan.getTokensByOwner(addr2.address);
      expect(addr1Tokens.length).to.equal(1);
      expect(addr1Tokens[0]).to.equal(2n);
      expect(addr2Tokens.length).to.equal(1);
      expect(addr2Tokens[0]).to.equal(1n);
    });
  });
  describe("getTokenMetadata function", function () {
    it("Should return correct metadata for token with serial number", async function () {
      // Create a serial hash
      const serialNumber = "ROLEX-123456";
      const serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));

      // Authorize a shop and mint with serial number
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
  describe("getTransferHistory function", function () {
    it("Should return transfer history for token", async function () {
      // Create a token with serial number (to have an initial history)
      const serialHash = ethers.keccak256(ethers.toUtf8Bytes("ROLEX-123"));
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr2.address, DEFAULT_URI, serialHash);

      // Perform a transfer
      await watchfan.connect(addr2).requestTransfer(1, addr3.address);
      await watchfan.connect(addr3).approveReceive(1);

      const history = await watchfan.getTransferHistory(1);

      expect(history.length).to.equal(2);
      // First transfer (mint)
      expect(history[0].from).to.equal(ethers.ZeroAddress);
      expect(history[0].to).to.equal(addr2.address);
      // Second transfer
      expect(history[1].from).to.equal(addr2.address);
      expect(history[1].to).to.equal(addr3.address);
    });
    it("Should reject query for non-existent token", async function () {
      await expect(
        watchfan.getTransferHistory(999)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });
  });
  describe("Double validation system - Setup", function () {
    beforeEach(async function () {
      // Mint an NFT for addr1 for transfer tests
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
    });
    it("Should block direct transfers", async function () {
      // Attempting a direct transfer should fail
      await expect(
        watchfan.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });
    it("Should block direct safeTransferFrom", async function () {
      // Attempting a direct transfer with safeTransferFrom should fail
      await expect(
        watchfan.connect(addr1)["safeTransferFrom(address,address,uint256)"](addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });
    it("Should block approve + transferFrom pattern", async function () {
      // Even with approval, the transfer should fail
      await watchfan.connect(addr1).approve(addr2.address, 1);
      await expect(
        watchfan.connect(addr2).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanDirectTransferDisabled");
    });
  });
  describe("Transfer request (requestTransfer)", function () {
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
      // Zero address
      await expect(
        watchfan.connect(addr1).requestTransfer(1, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
      // Contract address
      await expect(
        watchfan.connect(addr1).requestTransfer(1, await watchfan.getAddress())
      ).to.be.revertedWithCustomError(watchfan, "WatchfanInvalidAddress");
      // Transfer to self
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
  describe("Recipient approval (approveReceive)", function () {
    it("Should allow recipient to approve and auto-execute transfer", async function () {
      // Specific setup for this test
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);

      // Check state before
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.true;
      // Approval should trigger automatic execution
      await expect(watchfan.connect(addr2).approveReceive(1))
        .to.emit(watchfan, "TransferApprovedByRecipient")
        .withArgs(1, addr2.address)
        .and.to.emit(watchfan, "TransferExecuted")
        .withArgs(1, addr1.address, addr2.address)
        .and.to.emit(watchfan, "WatchfanTransferred")
        .withArgs(addr1.address, addr2.address, 1);
      // Check state after
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
    });
    it("Should reject approval from non-recipient", async function () {
      // Specific setup for this test
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);

      // Use addr3 from the fixture
      await expect(
        watchfan.connect(addr3).approveReceive(1)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanNotRecipient");
    });
    it("Should reject approval for non-existent request", async function () {
      // No setup needed for this test as we are testing a non-existent token
      await expect(
        watchfan.connect(addr2).approveReceive(999)
      ).to.be.revertedWithCustomError(watchfan, "WatchfanTransferNotFound");
    });
  });
  describe("Transfer cancellation (cancelTransfer)", function () {
    it("Should allow owner to cancel transfer", async function () {
      // Specific setup
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
      // Specific setup
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
      // Specific setup
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
      // Specific setup
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);

      // Cancel
      await watchfan.connect(addr1).cancelTransfer(1);

      // Create a new request
      await expect(watchfan.connect(addr1).requestTransfer(1, addr2.address))
        .to.emit(watchfan, "TransferRequested");
    });
  });
  describe("Utility functions", function () {
    beforeEach(async function () {
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
    });
    it("Should correctly report pending transfer status", async function () {
      // No pending transfer initially
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;

      // Create a request
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.true;

      // After execution
      await watchfan.connect(addr2).approveReceive(1);
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
    });
    it("Should return correct pending transfer details", async function () {
      // No pending transfer
      const [from1, to1, ownerApproved1, recipientApproved1, timestamp1] =
        await watchfan.getPendingTransfer(1);
      expect(from1).to.equal(ethers.ZeroAddress);

      // Create a request
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
  describe("Multiple transfers cases", function () {
    beforeEach(async function () {
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
    });
    it("Should handle multiple pending transfers correctly", async function () {
      // Mint several NFTs
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 2
      await mintToAddress(watchfan.connect(addr1), addr2.address); // tokenId 3

      // Create multiple requests
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr1).requestTransfer(2, addr2.address);
      await watchfan.connect(addr2).requestTransfer(3, addr1.address);

      expect(await watchfan.hasPendingTransfer(1)).to.be.true;
      expect(await watchfan.hasPendingTransfer(2)).to.be.true;
      expect(await watchfan.hasPendingTransfer(3)).to.be.true;

      // Execute one request
      await watchfan.connect(addr2).approveReceive(1);

      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
      expect(await watchfan.hasPendingTransfer(2)).to.be.true;
      expect(await watchfan.hasPendingTransfer(3)).to.be.true;
    });
  });
  describe("getTransfersForUser function", function () {
    beforeEach(async function () {
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      // Mint several NFTs for different owners
      await mintToAddress(watchfan.connect(addr1), addr1.address); // tokenId 1 (addr1)
      await mintToAddress(watchfan.connect(addr1), addr2.address); // tokenId 2 (addr2)
      await mintToAddress(watchfan.connect(addr1), addr3.address); // tokenId 3 (addr3)
    });
    it("Should return empty array when user has no pending transfers", async function () {
      const transfers = await watchfan.getTransfersForUser(addr1.address);
      expect(transfers.length).to.equal(0);
    });
    it("Should return transfers where user is sender", async function () {
      // addr1 requests a transfer to addr2
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);

      const transfers = await watchfan.getTransfersForUser(addr1.address);
      expect(transfers.length).to.equal(1);
      expect(transfers[0]).to.equal(1);
    });
    it("Should return transfers where user is recipient", async function () {
      // addr2 will receive a transfer from addr1
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);

      const transfers = await watchfan.getTransfersForUser(addr2.address);
      expect(transfers.length).to.equal(1);
      expect(transfers[0]).to.equal(1);
    });
    it("Should return multiple transfers for active user", async function () {
      // addr2 is involved in multiple transfers
      await watchfan.connect(addr1).requestTransfer(1, addr2.address); // addr2 receives
      await watchfan.connect(addr2).requestTransfer(2, addr3.address); // addr2 sends

      const transfers = await watchfan.getTransfersForUser(addr2.address);
      expect(transfers.length).to.equal(2);
      expect(transfers).to.include(1n);
      expect(transfers).to.include(2n);
    });
    it("Should not return completed transfers", async function () {
      // Create and complete a transfer
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);

      // Check that it no longer appears in pending transfers
      const addr1Transfers = await watchfan.getTransfersForUser(addr1.address);
      const addr2Transfers = await watchfan.getTransfersForUser(addr2.address);

      expect(addr1Transfers.length).to.equal(0);
      expect(addr2Transfers.length).to.equal(0);
    });
    it("Should not return cancelled transfers", async function () {
      // Create and cancel a transfer
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr1).cancelTransfer(1);

      const transfers = await watchfan.getTransfersForUser(addr1.address);
      expect(transfers.length).to.equal(0);
    });
  });
  // End-to-end full test scenario
  describe("Full transfer scenario", function () {
    it("Should complete full transfer workflow", async function () {
      // Setup: Mint NFT
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await mintToAddress(watchfan.connect(addr1), addr1.address);
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);

      // Step 1: Transfer request
      await expect(watchfan.connect(addr1).requestTransfer(1, addr2.address))
        .to.emit(watchfan, "TransferRequested");

      // Step 2: Check intermediate state
      expect(await watchfan.hasPendingTransfer(1)).to.be.true;
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address); // Not yet transferred

      // Step 3: Approval and execution
      await expect(watchfan.connect(addr2).approveReceive(1))
        .to.emit(watchfan, "TransferExecuted");

      // Step 4: Final check
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.hasPendingTransfer(1)).to.be.false;
    });
  });
  describe("Full scenario with serial number", function () {
    it("Should complete full workflow with serial number", async function () {
      const { serialNumber, serialHash } = createTestSerial("ROLEX");

      // Setup: Mint NFT with serial number
      await watchfan.connect(owner).setShopAddress(addr1.address, true);
      await watchfan.connect(addr1).mintWfNFT(addr1.address, DEFAULT_URI, serialHash);
      expect(await watchfan.ownerOf(1)).to.equal(addr1.address);
      expect(await watchfan.getTokenBySerialHash(serialHash)).to.equal(1);

      // Full transfer workflow
      await watchfan.connect(addr1).requestTransfer(1, addr2.address);
      await watchfan.connect(addr2).approveReceive(1);

      // Final checks
      expect(await watchfan.ownerOf(1)).to.equal(addr2.address);
      expect(await watchfan.verifySerialNumberHash(1, serialHash)).to.be.true;
    });
  });
});
