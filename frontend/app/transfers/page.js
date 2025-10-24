'use client';
import { useAccount } from 'wagmi';
import { useUserType } from '@/hooks/useUserType';
import NotConnected from '@/components/shared/NotConnected';
import PendingTransfers from '@/components/collector/PendingTransfers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TransfersPage() {
  const { isConnected } = useAccount();
  const { type: userType } = useUserType();

  if (!isConnected) {
    return <NotConnected />;
  }

  // Only collectors can access transfers
  if (userType === 'shop') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6 text-red-600">Access Denied</h1>
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
            <ArrowLeft className="h-4 w-4" />
            Back to My Collection
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Transfer Management</h1>
      <p className="text-gray-600 mb-6">
        Manage your transfer requests: approve received transfers, cancel sent requests.
      </p>
      <PendingTransfers />
    </div>
  );
}