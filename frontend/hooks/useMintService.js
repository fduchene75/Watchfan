import { useState, useCallback } from 'react';
import { uploadMetadataToIPFS } from '@/lib/ipfsService';
import { parseContractError } from '@/lib/contractErrors';

export const useMintService = (mintWfNFT) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mintResult, setMintResult] = useState(null);

  const mintNFT = useCallback(async ({ selectedWatch, recipientAddress, ipfsMetadata, exists }) => {
    setIsProcessing(true);
    setMintResult(null);
    
    console.log("🎯 Début du processus de mint...");

    try {
      // 1. Validations préalables
      if (!selectedWatch) throw new Error("Aucune montre sélectionnée");
      if (!recipientAddress) throw new Error("Adresse du destinataire requise");
      if (!ipfsMetadata) throw new Error("Métadonnées manquantes");
      if (exists) throw new Error("Ce numéro de série est déjà minté");
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) throw new Error("Format d'adresse invalide");

      // 2. Préparation des métadonnées pour IPFS
      const { serialNumber, serialHash, ...metadataForIPFS } = ipfsMetadata;
      
      console.log("📤 Upload des métadonnées vers IPFS...");
      
      // 3. Upload vers IPFS
      const ipfsResult = await uploadMetadataToIPFS(metadataForIPFS, selectedWatch);
      
      if (!ipfsResult.success) {
        throw new Error("Échec upload IPFS: " + ipfsResult.error);
      }

      console.log("✅ IPFS upload terminé:", ipfsResult.ipfsUri);
      console.log("🚀 Lancement de la transaction blockchain...");
      
      // 4. Transaction blockchain
      const result = await mintWfNFT(recipientAddress, ipfsResult.ipfsUri, serialHash);
      
      console.log("✅ Transaction blockchain lancée:", result);
      
      const successResult = { success: true, result, ipfsUri: ipfsResult.ipfsUri };
      setMintResult(successResult);
      return successResult;
      
    } catch (error) {
      console.error("❌ Erreur lors du mint:", error);
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