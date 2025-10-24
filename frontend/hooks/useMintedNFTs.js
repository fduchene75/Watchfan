// Custom hook to fetch all minted NFTs with their complete data
import { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { getContractAddress, contractABI } from '@/constants';

export function useMintedNFTs() {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const fetchMintedNFTs = useCallback(async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const contractAddress = getContractAddress(chainId);

      // 1. Get total supply
      const totalSupply = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'totalSupply',
      });

      const supply = Number(totalSupply);
      
      if (supply === 0) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch NFT data sequentially (compatible with all networks including Hardhat)
      const nftPromises = [];
      
      for (let tokenId = 1; tokenId <= supply; tokenId++) {
        nftPromises.push(
          (async () => {
            try {
              // Check if token exists
              const exists = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'exists',
                args: [tokenId],
              });

              if (!exists) return null;

              // Get owner
              const owner = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'ownerOf',
                args: [tokenId],
              });

              // Get metadata - CRITICAL: getTokenMetadata returns a tuple (uri, purchaseDate, originalShop, serialHash)
              const metadata = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'getTokenMetadata',
                args: [tokenId],
              });

              // Destructure the tuple properly
              const [tokenURI, purchaseDate, originalShop, serialHash] = metadata;

              // Get transfer history
              const history = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'getTransferHistory',
                args: [tokenId],
              });

              return {
                tokenId,
                owner,
                tokenURI,              // String - IPFS URI
                purchaseDate,          // BigInt - timestamp
                originalShop,          // Address - shop that minted
                serialHash,            // Bytes32 - serial number hash
                transferHistory: history.map(transfer => ({
                  from: transfer[0],
                  to: transfer[1],
                  timestamp: transfer[2],
                })),
              };
            } catch (err) {
              console.error(`Error fetching token ${tokenId}:`, err);
              return null;
            }
          })()
        );
      }

      // Wait for all promises
      const results = await Promise.all(nftPromises);
      
      // Filter out null results (non-existent tokens)
      const validNfts = results.filter(nft => nft !== null);
      
      setNfts(validNfts);
      setIsLoading(false);

    } catch (err) {
      console.error('Error fetching minted NFTs:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [publicClient, chainId]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchMintedNFTs();
  }, [fetchMintedNFTs]);

  return {
    nfts,
    isLoading,
    error,
    refetch: fetchMintedNFTs,
  };
}