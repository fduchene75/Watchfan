// Fonction centralisée pour parser toutes les erreurs du contrat Watchfan
export const parseContractError = (error) => {
  // Erreurs de mint
  if (error.message?.includes('WatchfanSerialHashAlreadyExists')) {
    return "Ce numéro de série existe déjà. Impossible de minter deux fois la même montre.";
  }
  if (error.message?.includes('WatchfanUnauthorizedMinting')) {
    return "Vous n'êtes pas autorisé à minter des NFTs. Contactez l'administrateur.";
  }
  
  // Erreurs de transfert
  if (error.message?.includes('WatchfanNotOwner')) {
    return "Vous n'êtes pas propriétaire de ce NFT.";
  }
  if (error.message?.includes('WatchfanNotRecipient')) {
    return "Vous n'êtes pas le destinataire de ce transfert.";
  }
  if (error.message?.includes('WatchfanTransferNotFound')) {
    return "Aucun transfert en attente trouvé pour ce NFT.";
  }
  if (error.message?.includes('WatchfanTransferAlreadyExists')) {
    return "Un transfert est déjà en cours pour ce NFT.";
  }
  if (error.message?.includes('WatchfanAlreadyApproved')) {
    return "Vous avez déjà approuvé ce transfert.";
  }
  if (error.message?.includes('WatchfanUnauthorizedCancellation')) {
    return "Vous n'êtes pas autorisé à annuler ce transfert.";
  }
  if (error.message?.includes('WatchfanDirectTransferDisabled')) {
    return "Les transferts directs sont désactivés. Utilisez le système de double validation.";
  }
  
  // Erreurs générales
  if (error.message?.includes('WatchfanInvalidAddress')) {
    return "Adresse invalide.";
  }
  if (error.message?.includes('User rejected')) {
    return "Transaction annulée par l'utilisateur.";
  }
  if (error.message?.includes('Internal JSON-RPC error')) {
    return "Erreur de connexion MetaMask. Vérifiez votre réseau et réessayez.";
  }
  
  return error.message || "Erreur inconnue";
};