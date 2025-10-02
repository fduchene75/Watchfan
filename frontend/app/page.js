'use client';
import { useAccount } from 'wagmi';
import { useUserType } from '@/hooks/useUserType';
import NotConnected from '@/components/shared/NotConnected';
import WatchSelector from '@/components/shop/WatchSelector';
import NFTCollectionViewer from '@/components/collector/NFTCollectionViewer';

export default function Home() {
  const { isConnected } = useAccount();
  const { type: userType } = useUserType();

  if (!isConnected) {
    return <NotConnected />;
  }  

  // Custom interface for authorised shops
  if (userType === 'shop') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Limited access to authorised shops</h1>
        <WatchSelector />
      </div>
    );
  }

  // Standard interface for collectors
  return (
    <div className="p-8 pt-2">
      <NFTCollectionViewer />
    </div>
  );
}