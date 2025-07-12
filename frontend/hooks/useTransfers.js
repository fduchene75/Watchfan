import { useWatchfanContract } from './useWatchfanContract';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { parseContractError } from '@/lib/contractErrors';

export const useTransfers = () => {
  const { address } = useAccount();
  const { 
    requestTransfer, 
    approveReceive, 
    cancelTransfer,
    useHasPendingTransfer,
    usePendingTransfer,
    useTokensByOwner 
  } = useWatchfanContract();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fonction pour demander un transfert
  const handleRequestTransfer = async (tokenId, recipientAddress) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = await requestTransfer(tokenId, recipientAddress);
      setSuccess(`Demande de transfert envoyée ! Hash: ${tx.hash}`);
      return tx;
    } catch (err) {
      const errorMessage = parseContractError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour approuver un transfert reçu
  const handleApproveReceive = async (tokenId) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = await approveReceive(tokenId);
      setSuccess(`Transfert approuvé et exécuté ! Hash: ${tx.hash}`);
      return tx;
    } catch (err) {
      const errorMessage = parseContractError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour annuler un transfert
  const handleCancelTransfer = async (tokenId) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const tx = await cancelTransfer(tokenId);
      setSuccess(`Transfert annulé ! Hash: ${tx.hash}`);
      return tx;
    } catch (err) {
      const errorMessage = parseContractError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour récupérer tous les transferts concernant l'utilisateur
  const getMyTransfers = () => {
    const { data: myTokens } = useTokensByOwner(address);
    const transfers = [];

    if (myTokens && myTokens.length > 0) {
      myTokens.forEach(tokenId => {
        const { data: hasPending } = useHasPendingTransfer(tokenId);
        if (hasPending) {
          const { data: pendingData } = usePendingTransfer(tokenId);
          if (pendingData) {
            const [from, to, ownerApproved, recipientApproved, timestamp] = pendingData;
            
            // Ajouter seulement si l'utilisateur connecté est concerné
            if (from === address || to === address) {
              transfers.push({
                tokenId: tokenId.toString(),
                from,
                to,
                ownerApproved,
                recipientApproved,
                timestamp: Number(timestamp),
                userRole: from === address ? 'sender' : 'recipient'
              });
            }
          }
        }
      });
    }

    return transfers;
  };

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    // Actions
    handleRequestTransfer,
    handleApproveReceive,
    handleCancelTransfer,
    getMyTransfers,
    resetMessages,
    
    // État
    isProcessing,
    error,
    success
  };
};