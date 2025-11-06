'use client';
import { useAccount } from 'wagmi';
import { useUserType } from '@/hooks/useUserType';
import NotConnected from '@/components/shared/NotConnected';
import PendingTransfers from '@/components/collector/PendingTransfers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TransfersPage() {
  const { isConnected } = useAccount();
  const { type: userType, isLoading } = useUserType();
  const [isMounted, setIsMounted] = useState(false);

  // Wait for component to mount on client side before checking connection
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading while component is mounting (prevents hydration mismatch)
  if (!isMounted) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Now we're mounted, check wallet connection
  if (!isConnected) {
    return <NotConnected />;
  }

  // Show loading state while user type is being determined
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only shops cannot access transfers
  if (userType === 'shop') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6 text-red-600">Access denied</h1>
        <p>This page is reserved for collectors.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline">
            <>
              <ArrowLeft className="h-4 w-4" />
              <span>Back to my collection</span>
            </>
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Transfer management</h1>
      <p className="text-gray-600 mb-6">
        Manage your transfer requests: approve received transfers, cancel your sent requests.
      </p>
      <PendingTransfers />
    </div>
  );
}