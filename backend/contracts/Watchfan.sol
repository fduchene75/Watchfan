// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Watchfan NFT Contract
/// @author François Duchêne
/// @notice This contract manages Watchfan NFT shops, token minting and transfers
/// @dev Implements ERC721 with strict limitations via _update override (no direct transfers or marketplace sales)
contract Watchfan is ERC721Enumerable, Ownable, ERC721URIStorage, ReentrancyGuard {

    // ERRORS
    error WatchfanInvalidAddress(address addr);
    error WatchfanTransferNotFound(uint32 tokenId);
    error WatchfanTransferAlreadyExists(uint32 tokenId);
    error WatchfanNotOwner(uint32 tokenId);
    error WatchfanNotRecipient(uint32 tokenId);
    error WatchfanAlreadyApproved(uint32 tokenId);
    error WatchfanDirectTransferDisabled(uint32 tokenId);
    error WatchfanUnauthorizedCancellation(uint32 tokenId);
    // Shop management errors
    error WatchfanShopAlreadyAuthorized(address shop);
    error WatchfanShopNotAuthorized(address shop);
    error WatchfanUnauthorizedMinting(address sender);
    // Serial number errors
    error WatchfanInvalidSerialHash(bytes32 serialHash);
    error WatchfanSerialHashAlreadyExists(bytes32 serialHash);

    // EVENTS
    /// @notice Event emitted when an NFT is created
    event WatchfanMintedTo(address indexed recipient, uint32 tokenId);
    /// @notice Event emitted when an NFT is transferred
    event WatchfanTransferred(address indexed from, address indexed to, uint32 tokenId);
    /// @notice Event for dual validation (transfer requested)
    event TransferRequested(uint32 indexed tokenId, address indexed from, address indexed to);
    /// @notice Event for dual validation (transfer approved by owner)
    event TransferApprovedByOwner(uint32 indexed tokenId, address indexed owner);
    /// @notice Event for dual validation (transfer approved by recipient)
    event TransferApprovedByRecipient(uint32 indexed tokenId, address indexed recipient);
    /// @notice Event for dual validation (transfer finalized)
    event TransferExecuted(uint32 indexed tokenId, address indexed from, address indexed to);
    /// @notice Event for dual validation (transfer cancelled)
    event TransferCancelled(uint32 indexed tokenId, address indexed from, address indexed to); 
    /// @notice Event for shop management (whitelisting)
    event ShopAuthorized(address indexed shop, address indexed authorizedBy);
    /// @notice Event for shop management (blacklisting)
    event ShopRevoked(address indexed shop, address indexed revokedBy);       

    // TYPES
    /// @notice Structure to store pending transfers
    struct PendingTransfer {
        address from;
        address to;
        bool ownerApproved;
        bool recipientApproved;
        uint64 timestamp;
    }
    /// @notice Structure to store main token metadata (others are in IPFS)
    struct TokenMetadata {
        uint64 purchaseDate;
        address originalShop;
    }
    /// @notice Structure to record completed transfers (for history)
    struct TransferRecord {
        address from;
        address to;
        uint64 timestamp;
    }

    // STATE VARIABLES
    /// @dev Next tokenId to mint (starts at 1 to avoid confusion with token 0)
    uint32 private _nextTokenId = 1;
    /// @notice Mapping for pending transfers (by tokenId)
    mapping(uint256 => PendingTransfer) public pendingTransfers;
    /// @notice Authorized shop management (by address)
    mapping(address => bool) public authorizedShops;
    /// @notice Authorized shop management (full list)
    address[] public shopAddresses;
    /// @dev Hashed serial number management (tokenId => serial number hash)
    mapping(uint256 => bytes32) private _tokenSerialHashes;
    /// @dev Hashed serial number management (serial number hash => tokenId)
    mapping(bytes32 => uint32) private _serialHashToToken;
    /// @dev Metadata mapping (by tokenId)
    mapping(uint256 => TokenMetadata) private _tokenMetadata;
    /// @dev Transfer history mapping (by tokenId)
    mapping(uint256 => TransferRecord[]) private _transferHistory;

    // CONSTRUCTOR
    constructor(address initialOwner) ERC721("Watchfan NFT Collection", "WFC") Ownable(initialOwner) {}

    // MODIFIERS
    modifier validAddress(address addr) {
        require(addr != address(0), WatchfanInvalidAddress(addr));
        require(addr.code.length == 0, WatchfanInvalidAddress(addr));
        _;
    }

    // FUNCTIONS
    //

    /// @notice Function to authorize a shop to mint
    function setShopAddress(address shop, bool authorized) public onlyOwner validAddress(shop) {
        
        // If authorizing the shop
        if (authorized) {
            // Check it's not already authorized
            require(!authorizedShops[shop], WatchfanShopAlreadyAuthorized(shop));
            
            // Authorize the shop
            authorizedShops[shop] = true;
            shopAddresses.push(shop);
            
            emit ShopAuthorized(shop, msg.sender);
        } 
        // If revoking authorization
        else {
            // Check it was authorized
            require(authorizedShops[shop], WatchfanShopNotAuthorized(shop));
            
            // Revoke authorization
            authorizedShops[shop] = false;
            _removeFromShopList(shop);
            
            emit ShopRevoked(shop, msg.sender);
        }
    }

    /// @dev Internal function to remove a shop from the list
    function _removeFromShopList(address shop) internal {
        for (uint256 i = 0; i < shopAddresses.length; i++) {
            if (shopAddresses[i] == shop) {
                // Replace with last element
                shopAddresses[i] = shopAddresses[shopAddresses.length - 1];
                // Remove last element
                shopAddresses.pop();
                break;
            }
        }
    }

    /// @notice Function to check if an address is an authorized shop
    function isAuthorizedShop(address shop) public view returns (bool) {
        return authorizedShops[shop];
    }

    /// @notice Function to get the list of authorized shops
    /// @dev Check both mapping AND array (in case of desynchronization)
    function getAuthorizedShops() public view returns (address[] memory) {
        uint256 length = shopAddresses.length;
        address[] memory temp = new address[](length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < length; ++i) {
            address shop = shopAddresses[i];
            if (authorizedShops[shop]) {
                temp[count] = shop;
                ++count;
            }
        }
        
        // Resize array to reduce gas cost as it may contain empty addresses
        assembly {
            mstore(temp, count)
        }
        
        return temp;
    }

    /// @notice Function to mint an NFT: only a shop can mint
    function mintWfNFT(address recipient, string memory uri, bytes32 serialHash) public validAddress(recipient) nonReentrant {
        // Check that caller is authorized
        require(authorizedShops[msg.sender], WatchfanUnauthorizedMinting(msg.sender));
        
        require(serialHash != bytes32(0), WatchfanInvalidSerialHash(serialHash));
        require(!serialHashExists(serialHash), WatchfanSerialHashAlreadyExists(serialHash));
        
        uint32 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Associate hash immediately
        _tokenSerialHashes[tokenId] = serialHash;
        _serialHashToToken[serialHash] = tokenId;

        // Store main metadata on-chain
        _tokenMetadata[tokenId] = TokenMetadata({
            purchaseDate: uint64(block.timestamp),
            originalShop: msg.sender
        });
        
        // Initialize history with first "transfer" (mint)
        _transferHistory[tokenId].push(TransferRecord({
            from: address(0),
            to: recipient,
            timestamp: uint64(block.timestamp)
        }));

        emit WatchfanMintedTo(recipient, tokenId);
    }

    /// @notice Function to find a token via its serial number hash
    function getTokenBySerialHash(bytes32 serialHash) public view returns (uint256) {
        require(serialHash != bytes32(0), WatchfanInvalidSerialHash(serialHash));
        
        uint32 tokenId = _serialHashToToken[serialHash];
        
        // Check that token exists
        require(tokenId != 0, WatchfanInvalidSerialHash(serialHash));
        
        return tokenId;
    }

    /// @notice Function to verify a serial number hash
    function verifySerialNumberHash(uint32 tokenId, bytes32 serialHash) public view returns (bool) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        return _tokenSerialHashes[tokenId] == serialHash;
    }

    /// @notice Function to get serial number hash
    function getSerialNumberHash(uint32 tokenId) public view returns (bytes32) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        return _tokenSerialHashes[tokenId];
    }

    /// @notice Function to check if a hash already exists
    function serialHashExists(bytes32 serialHash) public view returns (bool) {
        if (serialHash == bytes32(0)) return false;
        return _serialHashToToken[serialHash] != 0;
    }

    /// @notice List of NFTs owned by a collector
    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        require(owner != address(0), "Invalid owner address");
        
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        
        // Direct access via ERC721Enumerable
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokens;
    }

    /// @notice Function to get token metadata
    function getTokenMetadata(uint32 tokenId) external view returns (
        string memory uri,
        uint64 purchaseDate,
        address originalShop,
        bytes32 serialHash
    ) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        
        TokenMetadata memory metadata = _tokenMetadata[tokenId];
        
        return (
            tokenURI(uint256(tokenId)),           // IPFS URI
            metadata.purchaseDate,       // Mint timestamp
            metadata.originalShop,       // Shop that minted
            getSerialNumberHash(tokenId) // Serial number hash
        );
    }

    /// @notice Function to get transfer history of a token
    function getTransferHistory(uint32 tokenId) external view returns (TransferRecord[] memory) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        return _transferHistory[tokenId];
    }

    /// @notice Function to get token URI
    /// @dev Override to resolve ambiguity between ERC721 and ERC721URIStorage
    function tokenURI(uint256 tokenId) public view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    /// @notice Returns if true/false an interface standard is implemented
    /// @dev Override required for compilation and clarity
    function supportsInterface(bytes4 interfaceId) public view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Useless function (simply use inherited from Enumerable)
    //function totalSupply() public view returns (uint256) {
    //    return _nextTokenId - 1; // Subtract 1 because _nextTokenId starts at 1
    //}
    
    /// @notice Function to check if a token exists
    function exists(uint32 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /// @notice Function to request a transfer (only token owner can initiate)
    function requestTransfer(uint32 tokenId, address to) public validAddress(to) {
        // Check that token exists
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        
        // Check that caller is the owner
        require(ownerOf(tokenId) == msg.sender, WatchfanNotOwner(tokenId));
        
        // Check there's no request already in progress
        require(pendingTransfers[tokenId].from == address(0), WatchfanTransferAlreadyExists(tokenId));
        
        // No transfer to self
        require(to != msg.sender, WatchfanInvalidAddress(to)); 
        
        // Create transfer request
        pendingTransfers[tokenId] = PendingTransfer({
            from: msg.sender,
            to: to,
            ownerApproved: true, // Owner automatically approves by creating request
            recipientApproved: false,
            timestamp: uint64(block.timestamp)
        });
        
        emit TransferRequested(tokenId, msg.sender, to);
        emit TransferApprovedByOwner(tokenId, msg.sender);
    }

    /// @notice Function for recipient to accept transfer
    function approveReceive(uint32 tokenId) public nonReentrant {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        
        // Check that request exists
        require(transfer.from != address(0), WatchfanTransferNotFound(tokenId));
        
        // Check that caller is the recipient
        require(transfer.to == msg.sender, WatchfanNotRecipient(tokenId));
        
        // Check that recipient hasn't already approved
        require(!transfer.recipientApproved, WatchfanAlreadyApproved(tokenId));
        
        // Mark recipient approval
        transfer.recipientApproved = true;
        
        emit TransferApprovedByRecipient(tokenId, msg.sender);
        
        // If both parties approved, execute transfer automatically
        if (transfer.ownerApproved && transfer.recipientApproved) {
            _executeTransfer(uint256(tokenId));
        }
    }
    
    /// @notice Function to cancel a transfer request (owner OR recipient can cancel)
    function cancelTransfer(uint32 tokenId) public {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        
        // Check that request exists
        require(transfer.from != address(0), WatchfanTransferNotFound(tokenId));
        
        // Check that caller is either owner or recipient
        if (transfer.from != msg.sender && transfer.to != msg.sender) {
            revert WatchfanUnauthorizedCancellation(tokenId);
        }
        
        address from = transfer.from;
        address to = transfer.to;
        
        // Delete request
        delete pendingTransfers[tokenId];
        
        emit TransferCancelled(tokenId, from, to);
    }

    /// @dev Internal function to execute transfer
    function _executeTransfer(uint256 tokenId) internal {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        
        address from = transfer.from;
        address to = transfer.to;
        
        uint32 tokenId32 = uint32(tokenId);

        // Check that current owner is still the same
        require(ownerOf(tokenId) == from, WatchfanNotOwner(tokenId32));
        
        // Record in history BEFORE transfer
        _transferHistory[tokenId].push(TransferRecord({
            from: from,
            to: to,
            timestamp: uint64(block.timestamp)
        }));

        // Perform transfer BEFORE deleting request
        // so _update() can still check permissions
        _transfer(from, to, tokenId);
        
        // Delete transfer request AFTER transfer
        delete pendingTransfers[tokenId];
        
        emit TransferExecuted(tokenId32, from, to);
        emit WatchfanTransferred(from, to, tokenId32);
    }

    /// @dev Override to block direct transfers and enforce dual validation
    function _update(address to, uint256 tokenId, address auth) internal 
    override (ERC721, ERC721Enumerable)
    returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow mints (from == address(0))
        if (from == address(0)) {
            return super._update(to, tokenId, auth);
        }
        
        // Allow internal transfers: check if we're in _executeTransfer
        // by checking if there's a validated pending transfer
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        if (transfer.from == from && 
            transfer.to == to && 
            transfer.ownerApproved && 
            transfer.recipientApproved) {
            return super._update(to, tokenId, auth);
        }
        
        // Block all other direct transfers
        revert WatchfanDirectTransferDisabled(uint32(tokenId));
    }

    /// @dev Override _increaseBalance for ERC721Enumerable compatibility
    function _increaseBalance(address account, uint128 value) 
        internal 
        override(ERC721, ERC721Enumerable) 
    {
        super._increaseBalance(account, value);
    }

    /// @notice Function to check if transfer is pending
    function hasPendingTransfer(uint32 tokenId) public view returns (bool) {
        return pendingTransfers[tokenId].from != address(0);
    }
    
    /// @notice Function to get pending transfer details
    function getPendingTransfer(uint32 tokenId) public view returns (
        address from,
        address to,
        bool ownerApproved,
        bool recipientApproved,
        uint256 timestamp
    ) {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        return (
            transfer.from,
            transfer.to,
            transfer.ownerApproved,
            transfer.recipientApproved,
            transfer.timestamp
        );
    }

    /// @notice Function to get all ongoing transfers concerning an address
    function getTransfersForUser(address user) external view returns (uint32[] memory) {
        uint256 count = 0;
        
        // First pass: count transfers concerning the user
        for (uint32 tokenId = 1; tokenId < _nextTokenId; tokenId++) {
            PendingTransfer storage transfer = pendingTransfers[tokenId];
            if (transfer.from == user || transfer.to == user) {
                count++;
            }
        }
        
        // Create array of correct size
        uint32[] memory userTransfers = new uint32[](count);
        uint256 currentIndex = 0;
        
        // Second pass: fill array
        for (uint32 tokenId = 1; tokenId < _nextTokenId; tokenId++) {
            PendingTransfer storage transfer = pendingTransfers[tokenId];
            if (transfer.from == user || transfer.to == user) {
                userTransfers[currentIndex] = tokenId;
                currentIndex++;
            }
        }
        
        return userTransfers;
    }

}