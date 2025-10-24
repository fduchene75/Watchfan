'use client';
import { useAccount } from 'wagmi';
import { useUserType } from '@/hooks/useUserType';
import NotConnected from '@/components/shared/NotConnected';
import AdminDashboard from '@/components/admin/AdminDashboard';
import WatchSelector from '@/components/shop/WatchSelector';
import NFTCollectionViewer from '@/components/collector/NFTCollectionViewer';

export default function Home() {
  const { isConnected } = useAccount();
  const { type: userType, isLoading } = useUserType();

  if (!isConnected) {
    return <NotConnected />;
  }

  // Show loading state while determining user type
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Admin interface
  if (userType === 'admin') {
    return <AdminDashboard />;
  }

  // Custom interface for authorized shops
  if (userType === 'shop') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Limited access - Authorized shop</h1>
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