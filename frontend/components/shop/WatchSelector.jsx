// A défaut d'API constructeur pour récupérer les données des montres via le QR code, on sélectionne parmi des données factices
'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { mockWatches, generateIPFSMetadata, generateMockQRCode } from '@/lib/mockWatches';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const WatchSelector = () => {
  const { address } = useAccount();
  const { mintWfNFT, isPending, isConfirming, isConfirmed, hash, error } = useWatchfanContract();
  
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');

  const handleWatchSelect = (watchIndex) => {
    const watch = mockWatches[watchIndex];
    setSelectedWatch(watch);
    setQrCodeData(null);
    setIpfsMetadata(null);
    setRecipientAddress('');
  };

  const handleGenerateQRCode = () => {
    if (!selectedWatch) return;
    const qrData = generateMockQRCode(selectedWatch);
    setQrCodeData(qrData);
  };

  const handleGenerateMetadata = () => {
    if (!selectedWatch) return;
    const metadata = generateIPFSMetadata(selectedWatch);
    setIpfsMetadata(metadata);
  };

  const handleMintNFT = async () => {
    if (!selectedWatch || !recipientAddress || !ipfsMetadata) return;
    
    // Générer le hash du numéro de série
    const serialHash = keccak256(toBytes(selectedWatch.serialNumber));
    
    // Utiliser l'URI IPFS mock du selectedWatch
    await mintWfNFT(recipientAddress, selectedWatch.ipfsUri, serialHash);
  };

  const canMint = selectedWatch && ipfsMetadata && recipientAddress && !isPending && !isConfirming;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Simuler scan QR code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={handleWatchSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une montre" />
            </SelectTrigger>
            <SelectContent>
              {mockWatches.map((watch, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {watch.brand} {watch.model} {watch.reference}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedWatch && (
            <div className="border rounded p-4">
              <h3 className="font-bold">
                {selectedWatch.brand} {selectedWatch.model}
              </h3>
              <div className="flex gap-2 my-2">
                <Badge>{selectedWatch.reference}</Badge>
                <Badge variant="outline">{selectedWatch.serialNumber}</Badge>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleGenerateQRCode} size="sm">
                  QR Code Mock
                </Button>
                <Button onClick={handleGenerateMetadata} variant="outline" size="sm">
                  Générer métadonnées
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {qrCodeData && (
        <Card>
          <CardHeader>
            <CardTitle>Données QR générées</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-100 p-2 rounded">
              {qrCodeData}
            </pre>
          </CardContent>
        </Card>
      )}

      {ipfsMetadata && (
        <Card>
          <CardHeader>
            <CardTitle>Métadonnées IPFS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge className="mb-2">URI: {selectedWatch.ipfsUri}</Badge>
            <pre className="text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(ipfsMetadata, null, 2)}
            </pre>
            
            {/* Formulaire de mint */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Mint NFT</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Adresse du destinataire (0x...)"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <Button 
                  onClick={handleMintNFT}
                  disabled={!canMint}
                  className="w-full"
                >
                  {isPending && 'Préparation...'}
                  {isConfirming && 'Confirmation...'}
                  {!isPending && !isConfirming && 'Mint NFT'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* États de transaction */}
      {hash && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            {isConfirming && <p>En attente de confirmation...</p>}
            {isConfirmed && <p className="text-green-600">✅ NFT minté avec succès !</p>}
            {error && <p className="text-red-600">❌ Erreur: {error.message}</p>}
            <p className="text-sm text-gray-600">Hash: {hash}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WatchSelector;