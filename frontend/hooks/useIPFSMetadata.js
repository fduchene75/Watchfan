// Hook to fetch and cache IPFS metadata
import { useState, useEffect } from 'react';
import axios from 'axios';

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

export function useIPFSMetadata(tokenURI) {
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenURI) {
      setMetadata(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Convert ipfs:// URI to HTTP gateway URL
        let url = tokenURI;
        if (tokenURI.startsWith('ipfs://')) {
          const hash = tokenURI.replace('ipfs://', '');
          url = `${PINATA_GATEWAY}/ipfs/${hash}`;
        }

        console.log('📥 Fetching metadata from:', url);

        // Use axios instead of fetch for better error handling and CORS support
        const response = await axios.get(url, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
          }
        });

        console.log('✅ Metadata fetched successfully:', response.data);
        setMetadata(response.data);
        setIsLoading(false);

      } catch (err) {
        console.error('❌ Failed to fetch IPFS metadata:', err);
        setError(err.message || 'Failed to fetch metadata');
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [tokenURI]);

  return { metadata, isLoading, error };
}