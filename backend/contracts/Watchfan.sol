// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Watchfan is ERC721, Ownable, ERC721URIStorage {

    // ERRORS
    error WatchfanInvalidRecipient(address recipient);
    error WatchfanTransferNotFound(uint256 tokenId);
    error WatchfanTransferAlreadyExists(uint256 tokenId);
    error WatchfanNotOwner(uint256 tokenId);
    error WatchfanNotRecipient(uint256 tokenId);
    error WatchfanAlreadyApproved(uint256 tokenId);
    error WatchfanDirectTransferDisabled(uint256 tokenId);
    error WatchfanUnauthorizedCancellation(uint256 tokenId);
    // Erreurs pour la gestion des boutiques
    error WatchfanInvalidShopAddress(address shop);
    error WatchfanShopAlreadyAuthorized(address shop);
    error WatchfanShopNotAuthorized(address shop);
    error WatchfanUnauthorizedMinting(address sender);
    // Erreurs pour les numéros de série
    error WatchfanInvalidSerialHash(bytes32 serialHash);
    error WatchfanSerialHashAlreadyExists(bytes32 serialHash);
    error WatchfanSerialNumberAlreadySet(uint256 tokenId);
    error WatchfanSerialNumberNotSet(uint256 tokenId);

    // EVENTS
    // Événement émis lors de la création d'un NFT
    event WatchfanMintedTo(address indexed recipient, uint256 tokenId);
    // Événement émis lors du transfert d'un NFT
    event WatchfanTransferred(address indexed from, address indexed to, uint256 tokenId);
    // Evénements pour la double validation
    event TransferRequested(uint256 indexed tokenId, address indexed from, address indexed to);
    event TransferApprovedByOwner(uint256 indexed tokenId, address indexed owner);
    event TransferApprovedByRecipient(uint256 indexed tokenId, address indexed recipient);
    event TransferExecuted(uint256 indexed tokenId, address indexed from, address indexed to);
    event TransferCancelled(uint256 indexed tokenId, address indexed from, address indexed to); 
    // Événements pour la gestion des boutiques
    event ShopAuthorized(address indexed shop, address indexed authorizedBy);
    event ShopRevoked(address indexed shop, address indexed revokedBy);       
    // Événements pour les numéros de série
    event SerialNumberSet(uint256 indexed tokenId, bytes32 indexed serialHash);

    // TYPES
    // Structure pour stocker les transferts en attente
    struct PendingTransfer {
        address from;
        address to;
        bool ownerApproved;
        bool recipientApproved;
        uint256 timestamp;
    }

    // STATE VARIABLES
    uint256 private _nextTokenId = 1; // Au lieu de 0 par défaut (pour éviter les confusions avec le token 0)
    mapping(uint256 => PendingTransfer) public pendingTransfers; // Mapping pour les transferts en attente
    // Gestion des boutiques autorisées
    mapping(address => bool) public authorizedShops;
    address[] public shopAddresses;
    // Gestion des numéros de série hashés
    mapping(uint256 => bytes32) private _tokenSerialHashes; // tokenId => hash du numéro de série
    mapping(bytes32 => uint256) private _serialHashToToken; // hash => tokenId
    mapping(uint256 => bool) private _serialNumberSet; // tokenId => bool

    // CONSTRUCTOR
    constructor(address initialOwner) ERC721("Watchfan NFT Collection", "WFC") Ownable(initialOwner) {}

    // MODIFIERS
    // not used yet

    // FUNCTIONS
    //

    // Fonction pour autoriser une boutique à minter
    function setShopAddress(address shop, bool authorized) public onlyOwner {
        // Vérifier que l'adresse est valide
        require(shop != address(0), WatchfanInvalidShopAddress(shop));
        
        // Vérifier que l'adresse n'est pas un contrat
        require(shop.code.length == 0, WatchfanInvalidShopAddress(shop));
        
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

    // Fonction interne pour retirer une boutique de la liste
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

    // Fonction pour vérifier si une adresse est une boutique autorisée
    function isAuthorizedShop(address shop) public view returns (bool) {
        return authorizedShops[shop];
    }

    // Fonction pour obtenir la liste des boutiques autorisées
    function getAuthorizedShops() public view returns (address[] memory) {
        // Filtrer les boutiques encore actives
        uint256 activeCount = 0;
        for (uint256 i = 0; i < shopAddresses.length; i++) {
            if (authorizedShops[shopAddresses[i]]) {
                activeCount++;
            }
        }
        
        address[] memory activeShops = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < shopAddresses.length; i++) {
            if (authorizedShops[shopAddresses[i]]) {
                activeShops[currentIndex] = shopAddresses[i];
                currentIndex++;
            }
        }
        
        return activeShops;
    }

    // Fonction pour mint un NFT : seul le propriétaire du contrat ou une boutique peut mint
    function mintWfNFT (address recipient, string memory uri) public {
        // Vérifier que l'appelant est autorisé
        if (msg.sender != owner()) {
            require(authorizedShops[msg.sender], WatchfanUnauthorizedMinting(msg.sender));
        }        
        require(recipient != address(0), WatchfanInvalidRecipient(recipient)); // pas d'adresse zéro
        require(recipient.code.length == 0, WatchfanInvalidRecipient(recipient)); // pas de contrat, seulement des EOA
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);
        emit WatchfanMintedTo(recipient, tokenId);
    }

    // Mint avec hash de numéro de série
    function mintWfNFTWithSerialHash(address recipient, string memory uri, bytes32 serialHash) public {
        // Vérifier que l'appelant est autorisé
        if (msg.sender != owner()) {
            require(authorizedShops[msg.sender], WatchfanUnauthorizedMinting(msg.sender));
        }
        
        require(recipient != address(0), WatchfanInvalidRecipient(recipient));
        require(recipient.code.length == 0, WatchfanInvalidRecipient(recipient));
        require(serialHash != bytes32(0), WatchfanInvalidSerialHash(serialHash));
        require(!serialHashExists(serialHash), WatchfanSerialHashAlreadyExists(serialHash));
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Associer le hash immédiatement
        _tokenSerialHashes[tokenId] = serialHash;
        _serialHashToToken[serialHash] = tokenId;
        _serialNumberSet[tokenId] = true;
        
        emit WatchfanMintedTo(recipient, tokenId);
        emit SerialNumberSet(tokenId, serialHash);
    }

    // Fonction pour associer un hash de numéro de série à un NFT
    function setSerialNumberHash(uint256 tokenId, bytes32 serialHash) public onlyOwner {
        // Vérifier que le token existe
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        
        // Vérifier que le hash est valide (non-zéro)
        require(serialHash != bytes32(0), WatchfanInvalidSerialHash(serialHash));
        
        // Vérifier que le token n'a pas déjà un numéro de série
        require(!_serialNumberSet[tokenId], WatchfanSerialNumberAlreadySet(tokenId));
        
        // Vérifier que ce hash n'est pas déjà utilisé
        require(_serialHashToToken[serialHash] == 0, WatchfanSerialHashAlreadyExists(serialHash));
        
        // Stocker les associations
        _tokenSerialHashes[tokenId] = serialHash;
        _serialHashToToken[serialHash] = tokenId;
        _serialNumberSet[tokenId] = true;
        
        emit SerialNumberSet(tokenId, serialHash);
    }

    // Fonction pour retrouver un token via le hash de son numéro de série
    function getTokenBySerialHash(bytes32 serialHash) public view returns (uint256) {
        require(serialHash != bytes32(0), WatchfanInvalidSerialHash(serialHash));
        
        uint256 tokenId = _serialHashToToken[serialHash];
        
        // Vérifier que le token existe
        require(tokenId != 0, WatchfanSerialNumberNotSet(0));
        
        return tokenId;
    }

    // Fonction pour vérifier si un token a un numéro de série
    function hasSerialNumber(uint256 tokenId) public view returns (bool) {
        return _serialNumberSet[tokenId];
    }

    // Fonction pour vérifier un hash de numéro de série
    function verifySerialNumberHash(uint256 tokenId, bytes32 serialHash) public view returns (bool) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        require(_serialNumberSet[tokenId], WatchfanSerialNumberNotSet(tokenId));
        
        return _tokenSerialHashes[tokenId] == serialHash;
    }

    // Fonction pour obtenir le hash du numéro de série
    function getSerialNumberHash(uint256 tokenId) public view returns (bytes32) {
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        require(_serialNumberSet[tokenId], WatchfanSerialNumberNotSet(tokenId));
        
        return _tokenSerialHashes[tokenId];
    }

    // Fonction pour vérifier si un hash existe déjà
    function serialHashExists(bytes32 serialHash) public view returns (bool) {
        if (serialHash == bytes32(0)) return false;
        return _serialHashToToken[serialHash] != 0;
    }

    // Override pour résoudre l'ambiguïté entre ERC721 et ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    // Override pour la compatibilité des interfaces
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Fonction pour obtenir le nombre total de tokens mintés
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
    
    // Fonction pour vérifier si un token existe
    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    // Fonction pour demander un transfert (seul le propriétaire du token peut l'initier)
    function requestTransfer(uint256 tokenId, address to) public {
        // Vérifier que le token existe
        require(exists(tokenId), WatchfanTransferNotFound(tokenId));
        
        // Vérifier que l'appelant est le propriétaire
        require(ownerOf(tokenId) == msg.sender, WatchfanNotOwner(tokenId));
        
        // Vérifier qu'il n'y a pas déjà une demande en cours
        require(pendingTransfers[tokenId].from == address(0), WatchfanTransferAlreadyExists(tokenId));
        
        // Vérifier que le destinataire est valide
        require(to != address(0), WatchfanInvalidRecipient(to));
        require(to.code.length == 0, WatchfanInvalidRecipient(to)); // EOA seulement
        require(to != msg.sender, WatchfanInvalidRecipient(to)); // Pas de transfert à soi-même
        
        // Créer la demande de transfert
        pendingTransfers[tokenId] = PendingTransfer({
            from: msg.sender,
            to: to,
            ownerApproved: true, // Le propriétaire approuve automatiquement en créant la demande
            recipientApproved: false,
            timestamp: block.timestamp
        });
        
        emit TransferRequested(tokenId, msg.sender, to);
        emit TransferApprovedByOwner(tokenId, msg.sender);
    }

    // Fonction pour que le destinataire accepte le transfert
    function approveReceive(uint256 tokenId) public {
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
            _executeTransfer(tokenId);
        }
    }
    
    // Fonction pour annuler une demande de transfert (propriétaire OU destinataire peuvent annuler)
    function cancelTransfer(uint256 tokenId) public {
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

    // Fonction interne pour exécuter le transfert
    function _executeTransfer(uint256 tokenId) internal {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        
        address from = transfer.from;
        address to = transfer.to;
        
        // Vérifier que le propriétaire actuel est toujours le même
        require(ownerOf(tokenId) == from, WatchfanNotOwner(tokenId));
        
        // Effectuer le transfert AVANT de supprimer la demande
        // pour que _update() puisse encore vérifier les permissions
        _transfer(from, to, tokenId);
        
        // Supprimer la demande de transfert APRÈS le transfert
        delete pendingTransfers[tokenId];
        
        emit TransferExecuted(tokenId, from, to);
        emit WatchfanTransferred(from, to, tokenId);
    }
    
    // Fonction publique pour exécuter manuellement un transfert approuvé
    function executeTransfer(uint256 tokenId) public {
        PendingTransfer storage transfer = pendingTransfers[tokenId];
        
        // Vérifier qu'une demande existe
        require(transfer.from != address(0), WatchfanTransferNotFound(tokenId));
        
        // Vérifier que les deux parties ont approuvé
        require(transfer.ownerApproved && transfer.recipientApproved, "Transfer not fully approved");
        
        _executeTransfer(tokenId);
    }

    // Override pour bloquer les transferts directs et forcer la double validation
    // Méthode recommandée : utiliser le hook _update pour contrôler tous les transferts
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Permettre les mint (from == address(0))
        if (from == address(0)) {
            return super._update(to, tokenId, auth);
        }
        
        // Permettre les transferts par le propriétaire du contrat
        if (_msgSender() == owner()) {
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
        revert WatchfanDirectTransferDisabled(tokenId);
    }
    
    // Fonction d'urgence pour le propriétaire du contrat
    function emergencyTransfer(address from, address to, uint256 tokenId) public onlyOwner {
        // Nettoyer toute demande de transfert en attente
        if (pendingTransfers[tokenId].from != address(0)) {
            delete pendingTransfers[tokenId];
        }
        _transfer(from, to, tokenId);
        emit WatchfanTransferred(from, to, tokenId);
    }

    // Fonction pour vérifier si un transfert est en attente
    function hasPendingTransfer(uint256 tokenId) public view returns (bool) {
        return pendingTransfers[tokenId].from != address(0);
    }
    
    // Fonction pour obtenir les détails d'un transfert en attente
    function getPendingTransfer(uint256 tokenId) public view returns (
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

}
