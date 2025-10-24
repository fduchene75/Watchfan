// Hook to determine the user type (admin/shop/collector)
import { useAccount } from 'wagmi';
import { useWatchfanContract } from './useWatchfanContract';
import { useEffect, useState } from 'react';

export function useUserType() {
  const { address, isConnected, isConnecting } = useAccount();
  const { useIsAuthorizedShop, useIsAdmin } = useWatchfanContract();
  const [isMounted, setIsMounted] = useState(false);
  
  // Wait for component to mount on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only query contract if connected and mounted
  const { data: isAuthorizedShop, isLoading: isLoadingShop } = useIsAuthorizedShop(address);
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin(address);
  
  const getUserType = () => {
    // Not mounted yet - wait for client hydration
    if (!isMounted) {
      return { 
        type: 'loading', 
        label: 'Loading...',
        isLoading: true 
      };
    }

    // Not connected case
    if (!isConnected || !address) {
      return { 
        type: 'disconnected', 
        label: 'Not connected',
        isLoading: false 
      };
    }
    
    // Still connecting or loading contract data
    if (isConnecting || isLoadingShop || isLoadingAdmin) {
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
    isConnected: isMounted && isConnected,
    address,
    isAdmin,
    isAuthorizedShop
  };
}