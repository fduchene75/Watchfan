// Hook pour gérer les transferts
import { useWatchfanContract } from './useWatchfanContract';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { parseContractError } from '@/lib/contractErrors';
import { useQueryClient } from '@tanstack/react-query';

export const useTransfers = () => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { 
    requestTransfer, 
    approveReceive, 
    cancelTransfer,
    usePendingTransfer,
    useTransfersForUser
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
      const txHash = await requestTransfer(tokenId, recipientAddress);
      setSuccess(`Demande de transfert envoyée ! Hash: ${txHash}`);
      
      // Rafraîchir les données après succès
      await queryClient.invalidateQueries({
        queryKey: ['readContract'],
      });
      
      return txHash;
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
      const txHash = await approveReceive(tokenId);
      setSuccess(`Transfert approuvé et exécuté ! Hash: ${txHash}`);
      
      // Rafraîchir les données après succès
      await queryClient.invalidateQueries({
        queryKey: ['readContract'],
      });
      
      return txHash;
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
      const txHash = await cancelTransfer(tokenId);
      setSuccess(`Transfert annulé ! Hash: ${txHash}`);
      
      // Rafraîchir les données après succès
      await queryClient.invalidateQueries({
        queryKey: ['readContract'],
      });
      
      return txHash;
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
    const { data: tokenIds } = useTransfersForUser(address);
    const transfers = [];

    if (tokenIds && tokenIds.length > 0) {
      tokenIds.forEach(tokenId => {
        const { data: pendingData } = usePendingTransfer(tokenId);
        if (pendingData) {
          const [from, to, ownerApproved, recipientApproved, timestamp] = pendingData;
          
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