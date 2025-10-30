// Hook to handle the complete mint workflow with retry mechanism
import { useState, useCallback, useEffect } from 'react';
import { uploadMetadataToIPFS } from '@/lib/ipfsService';
import { parseContractError } from '@/lib/contractErrors';

// Utility function to wait/delay
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const useMintService = (mintWfNFT) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Reset message after a few seconds
  useEffect(() => {
    if (mintResult?.success) {
      const timer = setTimeout(() => {
        setMintResult(null);
        setRetryCount(0);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [mintResult]);

  const mintNFT = useCallback(async ({ selectedWatch, recipientAddress, ipfsMetadata, exists }) => {
    setIsProcessing(true);
    setMintResult(null);

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000; // 2 seconds between retries

    try {
      // 1. Pre-validations
      if (!selectedWatch) throw new Error("No watch selected");
      if (!recipientAddress) throw new Error("Recipient address required");
      if (!ipfsMetadata) throw new Error("Metadata missing");
      if (exists) throw new Error("This serial number is already minted");
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) throw new Error("Invalid address format");

      // 2. Prepare metadata for IPFS
      const { serialNumber, serialHash, ...metadataForIPFS } = ipfsMetadata;
      
      // 3. Upload to IPFS
      console.log("📤 Starting IPFS upload...");
      const ipfsResult = await uploadMetadataToIPFS(metadataForIPFS, selectedWatch);
      
      if (!ipfsResult.success) {
        throw new Error("IPFS upload failed: " + ipfsResult.error);
      }
      
      console.log("✅ IPFS upload complete, starting blockchain transaction...");
      
      // 4. Blockchain transaction with retry mechanism for circuit breaker errors
      let lastError = null;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`🔄 Retry attempt ${attempt + 1}/${MAX_RETRIES}...`);
            setRetryCount(attempt);
            // Progressive backoff: wait longer for each retry
            await wait(RETRY_DELAY_MS * attempt);
          }

          const result = await mintWfNFT(recipientAddress, ipfsResult.ipfsUri, serialHash);
          
          console.log("✅ Transaction successful!");
          const successResult = { success: true, result, ipfsUri: ipfsResult.ipfsUri };
          setMintResult(successResult);
          setRetryCount(0);
          return successResult;
          
        } catch (txError) {
          lastError = txError;
          const errorMessage = txError?.message || txError?.toString() || "Unknown error";
          
          // Check if it's a circuit breaker / rate limit error
          const isCircuitBreakerError = errorMessage.includes("circuit breaker") || 
                                       errorMessage.includes("rate limit") ||
                                       errorMessage.includes("too many requests") ||
                                       errorMessage.includes("429");
          
          // Check if it's a user rejection (don't retry these)
          const isUserRejection = errorMessage.includes("User rejected") || 
                                 errorMessage.includes("user rejected") ||
                                 errorMessage.includes("denied") ||
                                 errorMessage.includes("rejected");
          
          if (isUserRejection) {
            console.log("❌ User rejected transaction");
            throw txError; // Don't retry if user rejected
          }
          
          // If it's not a circuit breaker error, or if it's the last attempt, throw
          if (!isCircuitBreakerError || attempt === MAX_RETRIES - 1) {
            console.error(`❌ Transaction failed (attempt ${attempt + 1}/${MAX_RETRIES}):`, errorMessage);
            throw txError;
          }
          
          // Otherwise, log and retry
          console.warn(`⚠️ Circuit breaker detected, will retry in ${RETRY_DELAY_MS * (attempt + 1)}ms...`);
        }
      }
      
      // If we reach here, all retries failed
      throw lastError;
      
    } catch (error) {
      console.error("❌ Error during mint:", error);
      const errorResult = { success: false, error: parseContractError(error) };
      setMintResult(errorResult);
      setRetryCount(0);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, [mintWfNFT]);

  const resetMint = useCallback(() => {
    setMintResult(null);
    setRetryCount(0);
  }, []);

  return {
    mintNFT,
    resetMint,
    isProcessing,
    mintResult,
    retryCount // Expose retry count for UI feedback
  };
};