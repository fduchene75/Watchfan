import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { getContractAddress } from '@/constants';
import { contractABI } from '@/constants';

export const useMintedNFTs = (totalSupply) => {
  const [mintedNFTs, setMintedNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const publicClient = usePublicClient();

  const fetchMintedNFTs = async () => {
    if (!publicClient) return;
    
    // Get contract address based on current chain
    const chainId = await publicClient.getChainId();
    const contractAddress = getContractAddress(chainId);
    
    if (!totalSupply || parseInt(totalSupply.toString()) === 0) {
      setMintedNFTs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supply = parseInt(totalSupply.toString());
      
      // Prepare multicall contracts
      const contracts = [];
      for (let tokenId = 1; tokenId <= supply; tokenId++) {
        contracts.push(
          {
            address: contractAddress,
            abi: contractABI,
            functionName: 'tokenURI',
            args: [BigInt(tokenId)]
          },
          {
            address: contractAddress,
            abi: contractABI,
            functionName: 'ownerOf',
            args: [BigInt(tokenId)]
          }
        );
      }

      // Execute multicall for better performance
      const results = await publicClient.multicall({ contracts });

      // Parse results
      const nfts = [];
      for (let i = 0; i < supply; i++) {
        const tokenId = i + 1;
        const tokenURIResult = results[i * 2];
        const ownerResult = results[i * 2 + 1];

        if (tokenURIResult.status === 'success' && ownerResult.status === 'success') {
          nfts.push({
            tokenId: tokenId.toString(),
            owner: ownerResult.result,
            tokenURI: tokenURIResult.result
          });
        }
      }

      // Sort by tokenId descending (most recent first)
      nfts.sort((a, b) => parseInt(b.tokenId) - parseInt(a.tokenId));

      setMintedNFTs(nfts);
    } catch (err) {
      console.error('Error fetching minted NFTs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicClient && totalSupply !== undefined) {
      fetchMintedNFTs();
    }
  }, [publicClient, totalSupply]);

  return {
    mintedNFTs,
    isLoading,
    error,
    refetch: fetchMintedNFTs
  };
};