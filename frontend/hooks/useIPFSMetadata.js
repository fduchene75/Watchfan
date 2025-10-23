import { useState, useEffect } from 'react';

export const useIPFSMetadata = (tokenURI) => {
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenURI) return;

    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Convert IPFS URI to HTTP gateway URL
        const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
        let url = tokenURI;

        if (tokenURI.startsWith('ipfs://')) {
          const cid = tokenURI.replace('ipfs://', '');
          url = `https://${gateway}/ipfs/${cid}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Error fetching IPFS metadata:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [tokenURI]);

  return { metadata, isLoading, error };
};