// Custom hook for the contract (groups all possible interactions)
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { getContractAddress, contractABI } from '@/constants';
import { useQueryClient } from '@tanstack/react-query';

export function useWatchfanContract() {
  // Hook for writes (transactions)
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  // Hook to wait for transaction confirmations
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // For token refresh bug after transfer
  const queryClient = useQueryClient();

  // Gets the current network ID
  const chainId = useChainId();

  // Gets the contract address based on the network
  let contractAddress;
  let networkError = false;
  try {
    contractAddress = getContractAddress(chainId);
  } catch (error) {
    networkError = true;
  }

  // Contract read functions
  const useReadContractData = (functionName, args = []) => {
    return useReadContract({
      address: contractAddress,
      abi: contractABI,
      functionName,
      args,
    });
  };

  // Check if user is owner (for admin purposes)
  const useOwner = () => useReadContractData('owner');

  const useIsAdmin = (address) => {
    const { data: ownerAddress, isLoading } = useOwner();

    // Compare addresses only when both exist
    const isAdmin = address && ownerAddress &&
      address.toLowerCase() === ownerAddress.toLowerCase();

    return {
      data: isAdmin,
      isLoading,
      ownerAddress
    };
  };

  // Utility read functions (to cover all getters)
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

  const useGetAuthorizedShops = () => useReadContractData('getAuthorizedShops');

  // Write functions (transactions)
  const mintWfNFT = async (recipient, uri, serialHash) => {
    const result = await writeContractAsync({
      address: contractAddress,
      abi: contractABI,
      functionName: 'mintWfNFT',
      args: [recipient, uri, serialHash],
    });

    // Force refresh (for token display bug)
    await queryClient.invalidateQueries({
      queryKey: ['readContract']
    });

    return result;
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
    // Read hooks
    useIsAdmin,
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
    useGetAuthorizedShops,

    // Write functions
    mintWfNFT,
    requestTransfer,
    approveReceive,
    cancelTransfer,
    setShopAddress,

    // Transaction states
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}