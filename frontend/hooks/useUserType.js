// Hook to determine the user type (admin/shop/collector)
import { useAccount } from 'wagmi';
import { useWatchfanContract } from './useWatchfanContract';

export function useUserType() {
  const { address, isConnected } = useAccount();
  const { useIsAuthorizedShop, useIsAdmin } = useWatchfanContract();
  
  // Only query contract if connected
  const { data: isAuthorizedShop, isLoading: isLoadingShop } = useIsAuthorizedShop(address);
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin(address);
  
  const getUserType = () => {
    // Not connected case
    if (!isConnected || !address) {
      return { 
        type: 'disconnected', 
        label: 'Not connected',
        isLoading: false 
      };
    }
    
    // Loading case - still fetching data from contract
    if (isLoadingShop || isLoadingAdmin) {
      return { 
        type: 'loading', 
        label: 'Checking...',
        isLoading: true 
      };
    }
    
    // Admin has priority
    if (isAdmin) {
      return { 
        type: 'admin', 
        label: 'Administrator',
        isLoading: false 
      };
    }

    // Then check if authorized shop
    if (isAuthorizedShop) {
      return { 
        type: 'shop', 
        label: 'Authorized shop',
        isLoading: false 
      };
    }
    
    // Default to collector
    return { 
      type: 'collector', 
      label: 'Watch collector',
      isLoading: false 
    };
  };
  
  const typeData = getUserType();
  
  return {
    ...typeData,
    isConnected,
    address,
    isAdmin,
    isAuthorizedShop
  };
}