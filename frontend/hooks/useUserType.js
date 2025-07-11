// Hook pour déterminer le type d'utilisateur connecté
// frontend/hooks/useUserType.js
import { useAccount } from 'wagmi';
import { useWatchfanContract } from './useWatchfanContract';

export function useUserType() {
  const { address, isConnected } = useAccount();
  const { useIsAuthorizedShop } = useWatchfanContract();
  
  // Vérifier si l'adresse connectée est une boutique autorisée
  const { data: isAuthorizedShop, isLoading } = useIsAuthorizedShop(address);
  
  // Déterminer le type d'utilisateur
  const getUserType = () => {
    if (!isConnected || !address) {
      return { type: 'disconnected', label: 'Non connecté' };
    }
    
    if (isLoading) {
      return { type: 'loading', label: 'Vérification...' };
    }
    
    if (isAuthorizedShop) {
      return { type: 'shop', label: 'Boutique' };
    }
    
    return { type: 'collector', label: 'Collectionneur' };
  };
  
  return {
    ...getUserType(),
    isConnected,
    address,
    isLoading
  };
}