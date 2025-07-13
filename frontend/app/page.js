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

  // Interface spéciale pour les boutiques
  if (userType === 'shop') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Interface réservée aux boutiques autorisées</h1>
        <WatchSelector />
      </div>
    );
  }

  // Interface standard pour les collectionneurs avec transferts
  return (
    <div className="p-8 pt-2">
      <NFTCollectionViewer />
    </div>
  );
}