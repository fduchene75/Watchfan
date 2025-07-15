// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Watchfan NFT Contract
/// @author François Duchêne
/// @notice This contract manages Watchfan NFT shops, token minting and transfers
/// @dev Implements ERC721 with strict limitations via _update override (no direct transfers or marketplace sales)
contract Watchfan is ERC721, Ownable, ERC721URIStorage, ReentrancyGuard {

    // ERRORS
    error WatchfanInvalidAddress(address addr);
    error WatchfanTransferNotFound(uint32 tokenId);
    error WatchfanTransferAlreadyExists(uint32 tokenId);
    error WatchfanNotOwner(uint32 tokenId);
    error WatchfanNotRecipient(uint32 tokenId);
    error WatchfanAlreadyApproved(uint32 tokenId);
    error WatchfanDirectTransferDisabled(uint32 tokenId);
    error WatchfanUnauthorizedCancellation(uint32 tokenId);
    // Erreurs pour la gestion des boutiques
    error WatchfanShopAlreadyAuthorized(address shop);
    error WatchfanShopNotAuthorized(address shop);
    error WatchfanUnauthorizedMinting(address sender);
    // Erreurs pour les numéros de série
    error WatchfanInvalidSerialHash(bytes32 serialHash);
    error WatchfanSerialHashAlreadyExists(bytes32 serialHash);

    // EVENTS
    /// @notice Événement émis lors de la création d'un NFT
    event WatchfanMintedTo(address indexed recipient, uint32 tokenId);
    /// @notice Événement émis lors du transfert d'un NFT
    event WatchfanTransferred(address indexed from, address indexed to, uint32 tokenId);
    /// @notice Evénement pour la double validation (transfert demandé)
    event TransferRequested(uint32 indexed tokenId, address indexed from, address indexed to);
    /// @notice Evénement pour la double validation (transfert approuvé par le propriétaire)
    event TransferApprovedByOwner(uint32 indexed tokenId, address indexed owner);
    /// @notice Evénement pour la double validation (transfert approuvé par l'acheteur)
    event TransferApprovedByRecipient(uint32 indexed tokenId, address indexed recipient);
    /// @notice Evénement pour la double validation (transfert finalisé)
    event TransferExecuted(uint32 indexed tokenId, address indexed from, address indexed to);
    /// @notice Evénement pour la double validation (transfert annulé)
    event TransferCancelled(uint32 indexed tokenId, address indexed from, address indexed to); 
    /// @notice Événement pour la gestion des boutiques (whitelisting)
    event ShopAuthorized(address indexed shop, address indexed authorizedBy);
    /// @notice Événement pour la gestion des boutiques (blacklisting)
    event ShopRevoked(address indexed shop, address indexed revokedBy);       

    // TYPES
    /// @notice Structure pour stocker les transferts en attente
    struct PendingTransfer {
        address from;
        address to;
        bool ownerApproved;
        bool recipientApproved;
        uint64 timestamp;
    }
    /// @notice Structure pour stocker les métadonnées principales des tokens (les autres sont dans IPFS)
    struct TokenMetadata {
        uint64 purchaseDate;
        address originalShop;
    }
    /// @notice Structure pour enregistrer les transferts effectués (pour l'historique)
    struct TransferRecord {
        address from;
        address to;
        uint64 timestamp;
    }

    // STATE VARIABLES
    /// @dev Le prochain tokenId à mint (débute à 1 pour éviter les confusions avec le token 0)
    uint32 private _nextTokenId = 1;
    /// @notice Mapping pour les transferts en attente (par tokenId)
    mapping(uint256 => PendingTransfer) public pendingTransfers;
    /// @notice Gestion des boutiques autorisées (par adresse)
    mapping(address => bool) public authorizedShops;
    /// @notice Gestion des boutiques autorisées (liste complète)
    address[] public shopAddresses;
    /// @dev Gestion des numéros de série hashés (tokenId => hash du numéro de série)
    mapping(uint256 => bytes32) private _tokenSerialHashes;
    /// @dev Gestion des numéros de série hashés (hash du numéro de série => tokenId)
    mapping(bytes32 => uint32) private _serialHashToToken;
    /// @dev Mapping pour les métadonnées (par tokenId)
    mapping(uint256 => TokenMetadata) private _tokenMetadata;
    /// @dev Mapping pour l'historique des transferts (par tokenId)
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

    /// @notice Fonction pour autoriser une boutique à minter
    function setShopAddress(address shop, bool authorized) public onlyOwner validAddress(shop) {
        
        // Si on autorise la boutique
        if (authorized) {
            // Vérifier qu'elle n'est pas déjà autorisée
            require(!authorizedShops[shop], WatchfanShopAlreadyAuthorized(shop));
            
            // Autoriser la boutique
            authorizedShops[shop] = true;
            shopAddresses.push(shop);
            
            emit ShopAuthorized(shop, msg.sender);
        } 
        // Si on révoque l'autorisation
        else {
            // Vérifier qu'elle était autorisée
            require(authorizedShops[shop], WatchfanShopNotAuthorized(shop));
            
            // Révoquer l'autorisation
            authorizedShops[shop] = false;
            _removeFromShopList(shop);
            
            emit ShopRevoked(shop, msg.sender);
        }
    }

    /// @dev Fonction interne pour retirer une boutique de la liste
    function _removeFromShopList(address shop) internal {
        for (uint256 i = 0; i < shopAddresses.length; i++) {
            if (shopAddresses[i] == shop) {
                // Remplacer par le dernier élément
                shopAddresses[i] = shopAddresses[shopAddresses.length - 1];
                // Supprimer le dernier élément
                shopAddresses.pop();
                break;
            }
        }
    }

    /// @notice Fonction pour vérifier si une adresse est une boutique autorisée
    function isAuthorizedShop(address shop) public view returns (bool) {
        return authorizedShops[shop];
    }

    /// @notice Fonction pour obtenir la liste des boutiques autorisées
    /// @dev On vérifie le mapping ET le tableau (en cas de désynchronisation)
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
        
        // Redimensionner le tableau pour réduire le coût en gas car il peut contenir des adresses vides
        assembly {
            mstore(temp, count)
        }
        
        return temp;
    }

    /// @notice Fonction pour mint un NFT : seule une boutique peut mint
    function mintWfNFT(address recipient, string memory uri, bytes32 serialHash) public validAddress(recipient) nonReentrant {
        // Vérifier que l'appelant est autorisé
        require(authorizedShops[msg.sender], WatchfanUnauthorizedMinting(msg.sender));
        
        require(serialHash != bytes32(0), WatchfanInvalidSerialHash(serialHash));
        require(!serialHashExists(serialHash), WatchfanSerialHashAlreadyExists(serialHash));
        
        uint32 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Associer le hash immédiatement
        _tokenSerialHashes[tokenId] = serialHash;
        _serialHashToToken[serialHash] = tokenId;

        // Stocker les principales métadonnées on-chain
        _tokenMetadata[tokenId] = TokenMetadata({
            purchaseDate: uint64(block.timestamp),
            originalShop: msg.sender
        });
        
        // Initialiser l'historique avec le premier "transfert" (mint)
        _transferHistory[tokenId].push(TransferRecord({
            from: address(0),
            to: recipient,
            timestamp: uint64(block.timestamp)
        }));

        emit WatchfanMintedTo(recipient, tokenId);
    }

    /// @notice Fonction pour retrouver un token via le hash de son numéro de série
    function getTokenBySerialHash(bytes32 serialHash) public view returns (uint256) {
        require(serialHash != bytes32(0), WatchfanInvalidSerialHash(serialHash));
        
        uint32 tokenId = _serialHashToToken[serialHash];
        
        // Vérifier que le token existe
        require(tokenId != 0, WatchfanInvalidSerialHash(serialHash));
        
        return tokenId;
    }

    /// @notice Fonction pour vérifier un hash de numéro de série
    function verifySerialNumberHash(uint32 tokenId, bytes32 serialHash) public view returns (bool) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        return _tokenSerialHashes[tokenId] == serialHash;
    }

    /// @notice Fonction pour obtenir le hash du numéro de série
    function getSerialNumberHash(uint32 tokenId) public view returns (bytes32) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        return _tokenSerialHashes[tokenId];
    }

    /// @notice Fonction pour vérifier si un hash existe déjà
    function serialHashExists(bytes32 serialHash) public view returns (bool) {
        if (serialHash == bytes32(0)) return false;
        return _serialHashToToken[serialHash] != 0;
    }

    /// @notice Liste des NFTs d'un collectionneur
    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        require(owner != address(0), "Invalid owner address");
        
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 currentIndex = 0;
        
        // Parcourir tous les tokens mintés
        for (uint32 tokenId = 1; tokenId < _nextTokenId && currentIndex < balance; tokenId++) {
            if (_ownerOf(tokenId) == owner) {
                tokens[currentIndex] = tokenId;
                currentIndex++;
            }
        }
        
        return tokens;
    }

    /// @notice Fonction pour obtenir les métadonnées d'un token
    function getTokenMetadata(uint32 tokenId) external view returns (
        string memory uri,
        uint64 purchaseDate,
        address originalShop,
        bytes32 serialHash
    ) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        
        TokenMetadata memory metadata = _tokenMetadata[tokenId];
        
        return (
            tokenURI(uint256(tokenId)),           // URI IPFS
            metadata.purchaseDate,       // Timestamp du mint
            metadata.originalShop,       // Boutique qui a minté
            getSerialNumberHash(tokenId) // Hash du numéro de série
        );
    }

    /// @notice Fonction pour obtenir l'historique des transferts d'un token
    function getTransferHistory(uint32 tokenId) external view returns (TransferRecord[] memory) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        return _transferHistory[tokenId];
    }

    /// @notice Fonction pour obtenir l'URI d'un token
    /// @dev Override pour résoudre l'ambiguïté entre ERC721 et ERC721URIStorage
    function tokenURI(uint256 tokenId) public view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    /// @notice Renvoie si true/false une norme d'interface est implémentée
    /// @dev Override indispensable pour compilation et clarté
    function supportsInterface(bytes4 interfaceId) public view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Fonction pour obtenir le nombre total de tokens mintés
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1; // Soustraire 1 car _nextTokenId commence à 1
    }
    
    /// @notice Fonction pour vérifier si un token existe
    function exists(uint32 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /// @notice Fonction pour demander un transfert (seul le propriétaire du token peut l'initier)
    function requestTransfer(uint32 tokenId, address to) public validAddress(to) {
        // Vérifier que le token existe
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        
        // Vérifier que l'appelant est le propriétaire
        require(ownerOf(tokenId) == msg.sender, WatchfanNotOwner(tokenId));
        
        // Vérifier qu'il n'y a pas déjà une demande en cours
        require(pendingTransfers[tokenId].from == address(0), WatchfanTransferAlreadyExists(tokenId));
        
        // Pas de transfert à soi-même
        require(to != msg.sender, WatchfanInvalidAddress(to)); 
        
        // Créer la demande de transfert
        pendingTransfers[tokenId] = PendingTransfer({
            from: msg.sender,
            to: to,
            ownerApproved: true, // Le propriétaire approuve automatiquement en créant la demande
            recipientApproved: false,
            timestamp: uint64(block.timestamp)
        });
        
        emit TransferRequested(tokenId, msg.sender, to);
        emit TransferApprovedByOwner(tokenId, msg.sender);
    }

    /// @notice Fonction pour que le destinataire accepte le transfert
    function approveReceive(uint32 tokenId) public nonReentrant {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        
        // Vérifier qu'une demande existe
        require(transfer.from != address(0), WatchfanTransferNotFound(tokenId));
        
        // Vérifier que l'appelant est le destinataire
        require(transfer.to == msg.sender, WatchfanNotRecipient(tokenId));
        
        // Vérifier que le destinataire n'a pas déjà approuvé
        require(!transfer.recipientApproved, WatchfanAlreadyApproved(tokenId));
        
        // Marquer l'approbation du destinataire
        transfer.recipientApproved = true;
        
        emit TransferApprovedByRecipient(tokenId, msg.sender);
        
        // Si les deux parties ont approuvé, exécuter le transfert automatiquement
        if (transfer.ownerApproved && transfer.recipientApproved) {
            _executeTransfer(uint256(tokenId));
        }
    }
    
    /// @notice Fonction pour annuler une demande de transfert (propriétaire OU destinataire peuvent annuler)
    function cancelTransfer(uint32 tokenId) public {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        
        // Vérifier qu'une demande existe
        require(transfer.from != address(0), WatchfanTransferNotFound(tokenId));
        
        // Vérifier que l'appelant est soit le propriétaire soit le destinataire
        if (transfer.from != msg.sender && transfer.to != msg.sender) {
            revert WatchfanUnauthorizedCancellation(tokenId);
        }
        
        address from = transfer.from;
        address to = transfer.to;
        
        // Supprimer la demande
        delete pendingTransfers[tokenId];
        
        emit TransferCancelled(tokenId, from, to);
    }

    /// @dev Fonction interne pour exécuter le transfert
    function _executeTransfer(uint256 tokenId) internal {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        
        address from = transfer.from;
        address to = transfer.to;
        
        uint32 tokenId32 = uint32(tokenId);

        // Vérifier que le propriétaire actuel est toujours le même
        require(ownerOf(tokenId) == from, WatchfanNotOwner(tokenId32));
        
        // Enregistrer dans l'historique AVANT le transfert
        _transferHistory[tokenId].push(TransferRecord({
            from: from,
            to: to,
            timestamp: uint64(block.timestamp)
        }));

        // Effectuer le transfert AVANT de supprimer la demande
        // pour que _update() puisse encore vérifier les permissions
        _transfer(from, to, tokenId);
        
        // Supprimer la demande de transfert APRÈS le transfert
        delete pendingTransfers[tokenId];
        
        emit TransferExecuted(tokenId32, from, to);
        emit WatchfanTransferred(from, to, tokenId32);
    }

    /// @dev Override pour bloquer les transferts directs et forcer la double validation
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Permettre les mint (from == address(0))
        if (from == address(0)) {
            return super._update(to, tokenId, auth);
        }
        
        // Permettre les transferts internes : vérifier si on est dans _executeTransfer
        // en vérifiant qu'il existe un transfert en attente validé
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        if (transfer.from == from && 
            transfer.to == to && 
            transfer.ownerApproved && 
            transfer.recipientApproved) {
            return super._update(to, tokenId, auth);
        }
        
        // Bloquer tous les autres transferts directs
        revert WatchfanDirectTransferDisabled(uint32(tokenId));
    }

    /// @notice Fonction pour vérifier si un transfert est en attente
    function hasPendingTransfer(uint32 tokenId) public view returns (bool) {
        return pendingTransfers[tokenId].from != address(0);
    }
    
    /// @notice Fonction pour obtenir les détails d'un transfert en attente
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

    /// @notice Fonction pour obtenir tous les transferts en cours concernant une adresse
    function getTransfersForUser(address user) external view returns (uint32[] memory) {
        uint256 count = 0;
        
        // Premier passage : compter les transferts concernant l'utilisateur
        for (uint32 tokenId = 1; tokenId < _nextTokenId; tokenId++) {
            PendingTransfer storage transfer = pendingTransfers[tokenId];
            if (transfer.from == user || transfer.to == user) {
                count++;
            }
        }
        
        // Créer le tableau de la bonne taille
        uint32[] memory userTransfers = new uint32[](count);
        uint256 currentIndex = 0;
        
        // Deuxième passage : remplir le tableau
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
