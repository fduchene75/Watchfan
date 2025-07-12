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

  // Seuls les collectionneurs peuvent accéder aux transferts
  if (userType === 'shop') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6 text-red-600">Accès refusé</h1>
        <p>Cette page est réservée aux collectionneurs.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Bouton de retour */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Retour à ma collection
          </Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Gestion des transferts</h1>
      <p className="text-gray-600 mb-6">
        Gérez vos demandes de transfert : approuvez les transferts reçus, annulez vos demandes envoyées.
      </p>
      <PendingTransfers />
    </div>
  );
}