// Hook to determine the type of user (admin/shop/collector)
import { useAccount } from 'wagmi';
import { useWatchfanContract } from './useWatchfanContract';

export function useUserType() {
  const { address, isConnected } = useAccount();
  const { useIsAuthorizedShop, useIsAdmin } = useWatchfanContract();
  const { data: isAuthorizedShop, isLoadingShop } = useIsAuthorizedShop(address);
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin(address);
  
  const getUserType = () => {
    if (!isConnected || !address) {
      return { type: 'disconnected', label: 'Not connected' };
    }
    
    if (isLoadingShop || isLoadingAdmin) {
      return { type: 'loading', label: 'Checking...' };
    }
    
    if (isAdmin) {
      return { type: 'admin', label: 'Administrator' };
    }

    if (isAuthorizedShop) {
      return { type: 'shop', label: 'Authorised shop' };
    }
    
    return { type: 'collector', label: 'Watch collector' };
  };
  
  return {
    ...getUserType(),
    isConnected,
    address,
    isLoading: isLoadingShop || isLoadingAdmin,
    isAdmin,
    isAuthorizedShop
  };
}