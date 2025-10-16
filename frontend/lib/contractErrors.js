// Centralized function to parse all Watchfan contract errors
export const parseContractError = (error) => {
  // Mint errors
  if (error.message?.includes('WatchfanSerialHashAlreadyExists')) {
    return "This serial number already exists. Cannot mint the same watch twice.";
  }
  if (error.message?.includes('WatchfanUnauthorizedMinting')) {
    return "You are not authorized to mint NFTs. Contact the administrator.";
  }
  
  // Transfer errors
  if (error.message?.includes('WatchfanNotOwner')) {
    return "You are not the owner of this NFT.";
  }
  if (error.message?.includes('WatchfanNotRecipient')) {
    return "You are not the recipient of this transfer.";
  }
  if (error.message?.includes('WatchfanTransferNotFound')) {
    return "No pending transfer found for this NFT.";
  }
  if (error.message?.includes('WatchfanTransferAlreadyExists')) {
    return "A transfer is already in progress for this NFT.";
  }
  if (error.message?.includes('WatchfanAlreadyApproved')) {
    return "You have already approved this transfer.";
  }
  if (error.message?.includes('WatchfanUnauthorizedCancellation')) {
    return "You are not authorized to cancel this transfer.";
  }
  if (error.message?.includes('WatchfanDirectTransferDisabled')) {
    return "Direct transfers are disabled. Use the dual validation system.";
  }
  
  // General errors
  if (error.message?.includes('WatchfanInvalidAddress')) {
    return "Invalid address.";
  }
  if (error.message?.includes('User rejected')) {
    return "Transaction cancelled by user.";
  }
  if (error.message?.includes('Internal JSON-RPC error')) {
    return "MetaMask connection error. Check your network and try again.";
  }
  
  return error.message || "Unknown error";
};