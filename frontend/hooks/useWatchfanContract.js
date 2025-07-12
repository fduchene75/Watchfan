// Hook personnalisé pour le contrat (on regroupe toutes les interactions possibles)
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractAddress, contractABI } from '@/constants';

export function useWatchfanContract() {
 // Hook pour les écritures (transactions)
 const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
 
 // Hook pour attendre la confirmation des transactions
 const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
   hash,
 });

 // Fonctions de lecture du contrat
 const useReadContractData = (functionName, args = []) => {
   return useReadContract({
     address: contractAddress,
     abi: contractABI,
     functionName,
     args,
   });
 };

 // Fonctions utilitaires de lecture (pour couvrir tous les getters)
 const useTotalSupply = () => useReadContractData('totalSupply');
 
 const useTokensByOwner = (address) => 
   useReadContractData('getTokensByOwner', address ? [address] : undefined);
 
 const useTokenMetadata = (tokenId) => 
   useReadContractData('getTokenMetadata', tokenId ? [tokenId] : undefined);
 
 const useTokenExists = (tokenId) => 
   useReadContractData('exists', tokenId ? [tokenId] : undefined);
 
 const usePendingTransfer = (tokenId) => 
   useReadContractData('getPendingTransfer', tokenId ? [tokenId] : undefined);
 
 const useHasPendingTransfer = (tokenId) => 
   useReadContractData('hasPendingTransfer', tokenId ? [tokenId] : undefined);
 
 const useTransferHistory = (tokenId) => 
   useReadContractData('getTransferHistory', tokenId ? [tokenId] : undefined);
 
 const useIsAuthorizedShop = (address) => 
   useReadContractData('isAuthorizedShop', address ? [address] : undefined);
 
 const useSerialHashExists = (serialHash) => 
   useReadContractData('serialHashExists', serialHash ? [serialHash] : undefined);
 
 const useGetTokenBySerialHash = (serialHash) => 
   useReadContractData('getTokenBySerialHash', serialHash ? [serialHash] : undefined);

 const useTransfersForUser = (userAddress) => 
    useReadContractData('getTransfersForUser', userAddress ? [userAddress] : undefined);

 // Fonctions d'écriture (transactions)
 const mintWfNFT = async (recipient, uri, serialHash) => {
   return await writeContractAsync({
     address: contractAddress,
     abi: contractABI,
     functionName: 'mintWfNFT',
     args: [recipient, uri, serialHash],
   });
 };

 const requestTransfer = async (tokenId, to) => {
   return await writeContractAsync({
     address: contractAddress,
     abi: contractABI,
     functionName: 'requestTransfer',
     args: [tokenId, to],
   });
 };

 const approveReceive = async (tokenId) => {
   return await writeContractAsync({
     address: contractAddress,
     abi: contractABI,
     functionName: 'approveReceive',
     args: [tokenId],
   });
 };

 const cancelTransfer = async (tokenId) => {
   return await writeContractAsync({
     address: contractAddress,
     abi: contractABI,
     functionName: 'cancelTransfer',
     args: [tokenId],
   });
 };

 const setShopAddress = async (shop, authorized) => {
   return await writeContractAsync({
     address: contractAddress,
     abi: contractABI,
     functionName: 'setShopAddress',
     args: [shop, authorized],
   });
 };

 return {
   // Hooks de lecture
   useTotalSupply,
   useTokensByOwner,
   useTokenMetadata,
   useTokenExists,
   usePendingTransfer,
   useHasPendingTransfer,
   useTransferHistory,
   useIsAuthorizedShop,
   useSerialHashExists,
   useGetTokenBySerialHash,
   useTransfersForUser,
   
   // Fonctions d'écriture
   mintWfNFT,
   requestTransfer,
   approveReceive,
   cancelTransfer,
   setShopAddress,
   
   // États des transactions
   isPending,
   isConfirming,
   isConfirmed,
   error,
   hash,
 };
}