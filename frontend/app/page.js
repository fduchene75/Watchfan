'use client';
import { useAccount } from 'wagmi';
import NotConnected from '@/components/shared/NotConnected';

export default function Home() {

  const { isConnected } = useAccount();

  if (!isConnected) {
    return <NotConnected />;
  }  

  return (
    <div className="p-8">
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded border">
          <h3 className="text-lg font-bold mb-2">Certification NFT</h3>
        </div>

        <div className="bg-white p-6 rounded border">
          <h3 className="text-lg font-bold mb-2">Transfert Sécurisé</h3>
        </div>

        <div className="bg-white p-6 rounded border">
          <h3 className="text-lg font-bold mb-2">Blockchain</h3>
        </div>
      </div>

      <div className="bg-white rounded border p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm">Montres</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm">Utilisateurs</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm">Transferts</div>
          </div>
        </div>
      </div>
    </div>
  );
}