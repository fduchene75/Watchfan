// Hook to manage transfers
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

  // Function to request a transfer
  const handleRequestTransfer = async (tokenId, recipientAddress) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const txHash = await requestTransfer(tokenId, recipientAddress);
      setSuccess(`Transfer request sent! Hash: ${txHash}`);
      
      // Refresh data after success
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

  // Function to approve a received transfer
  const handleApproveReceive = async (tokenId) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const txHash = await approveReceive(tokenId);
      setSuccess(`Transfer approved and executed! Hash: ${txHash}`);
      
      // Refresh data after success
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

  // Function to cancel a transfer
  const handleCancelTransfer = async (tokenId) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const txHash = await cancelTransfer(tokenId);
      setSuccess(`Transfer cancelled! Hash: ${txHash}`);
      
      // Refresh data after success
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

  // Function to reset messages
  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    handleRequestTransfer,
    handleApproveReceive,
    handleCancelTransfer,
    isProcessing,
    error,
    success,
    resetMessages,
    usePendingTransfer,
    useTransfersForUser
  };
};