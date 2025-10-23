// Hook to manage the complete mint workflow
import { useState, useCallback, useEffect } from 'react';
import { uploadMetadataToIPFS } from '@/lib/ipfsService';
import { parseContractError } from '@/lib/contractErrors';

export const useMintService = (mintWfNFT) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mintResult, setMintResult] = useState(null);

  // Reset message after a few seconds
  useEffect(() => {
    if (mintResult?.success) {
      const timer = setTimeout(() => {
        setMintResult(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [mintResult]);

  const mintNFT = useCallback(async ({ selectedWatch, recipientAddress, ipfsMetadata, exists }) => {
    setIsProcessing(true);
    setMintResult(null);

    try {
      // 1. Pre-validations
      if (!selectedWatch) throw new Error("No watch selected");
      if (!recipientAddress) throw new Error("Recipient address required");
      if (!ipfsMetadata) throw new Error("Missing metadata");
      if (exists) throw new Error("This serial number is already minted");
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) throw new Error("Invalid address format");

      // 2. Prepare metadata for IPFS
      const { serialNumber, serialHash, ...metadataForIPFS } = ipfsMetadata;
      
      // 3. Upload to IPFS
      const ipfsResult = await uploadMetadataToIPFS(metadataForIPFS, selectedWatch);
      
      if (!ipfsResult.success) {
        throw new Error("IPFS upload failed: " + ipfsResult.error);
      }
      
      // 4. Blockchain transaction
      const result = await mintWfNFT(recipientAddress, ipfsResult.ipfsUri, serialHash);
      
      const successResult = { success: true, result, ipfsUri: ipfsResult.ipfsUri };
      setMintResult(successResult);
      return successResult;
      
    } catch (error) {
      console.error("❌ Error during mint:", error);
      const errorResult = { success: false, error: parseContractError(error) };
      setMintResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, [mintWfNFT]);

  const resetMint = useCallback(() => {
    setMintResult(null);
  }, []);

  return {
    mintNFT,
    resetMint,
    isProcessing,
    mintResult
  };
};