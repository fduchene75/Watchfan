'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockWatches, generateIPFSMetadata } from '@/lib/mockWatches';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { useSerialValidation } from '@/hooks/useSerialValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useMintService } from '@/hooks/useMintService';

const WatchSelector = () => {
  const { mintWfNFT, isPending, isConfirming, isConfirmed, hash, error, useTotalSupply } = useWatchfanContract();
  const { mintNFT, resetMint, isProcessing, mintResult } = useMintService(mintWfNFT);
  const { data: totalSupply, refetch: refetchTotalSupply } = useTotalSupply();
  const { checkSerialHash, resetValidation, isChecking, exists, error: validationError } = useSerialValidation();
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [currentSerialHash, setCurrentSerialHash] = useState(null);
  const [selectValue, setSelectValue] = useState("");

  const handleWatchSelect = useCallback((watchIndex) => {
    setSelectValue(watchIndex);
    const watch = mockWatches[parseInt(watchIndex)];
    setSelectedWatch(watch);
    
    // Générer les métadonnées IPFS
    const metadata = generateIPFSMetadata(watch);
    setIpfsMetadata(metadata);
    
    // Vérifier si le hash a changé avant de déclencher la validation
    if (metadata.serialHash !== currentSerialHash) {
      setCurrentSerialHash(metadata.serialHash);
      checkSerialHash(metadata.serialHash);
    }
  }, [currentSerialHash, checkSerialHash]);

  const handleMintNFT = useCallback(async () => {
    await mintNFT({
      selectedWatch,
      recipientAddress,
      ipfsMetadata,
      exists
    });
  }, [mintNFT, selectedWatch, recipientAddress, ipfsMetadata, exists]);

  const canMint = selectedWatch && 
    ipfsMetadata && 
    recipientAddress && 
    !isProcessing && 
    !isPending && 
    !isConfirming && 
    !exists && 
    !isChecking &&
    currentSerialHash;

  const getButtonText = () => {
    if (isProcessing) return 'Upload IPFS...';
    if (isPending) return 'Préparation...';
    if (isConfirming) return 'Confirmation...';
    if (isChecking) return 'Vérification...';
    if (exists) return 'NFT déjà minté'; 
    return 'Mint NFT';
  };

  // On doit reset après succès (pour bloquer bouton Mint)
  useEffect(() => {
    if (isConfirmed) {
      // Batch tous les resets ensemble
      setSelectedWatch(null);
      setSelectValue("");
      setIpfsMetadata(null);
      setRecipientAddress('');
      setCurrentSerialHash(null);
      
      // Appellez les fonctions de reset
      resetMint();
      resetValidation();
      refetchTotalSupply();
    }
  }, [isConfirmed]);

  return (
    <div className="space-y-4">

        <Badge variant="outline" className="text-lg p-3">
        NFT mintés: {totalSupply?.toString() || "0"}
        </Badge>

      <Card>
        <CardHeader>
          <CardTitle>Sélection nouvelle montre avec toutes ses données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectValue} onValueChange={handleWatchSelect}>
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
            </div>
          )}
        </CardContent>
      </Card>

      {ipfsMetadata && (
        <Card>
          <CardHeader>
            <CardTitle>Métadonnées liées à cette montre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(ipfsMetadata, null, 2)}
            </pre>
            
            {/* Formulaire de mint */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Mint NFT</h4>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Adresse du destinataire (0x...)"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
                <Button 
                  onClick={handleMintNFT}
                  disabled={!canMint}
                  className="w-full"
                >
                  {getButtonText()}
                </Button>
                
                {/* Message d'erreur si le NFT existe déjà */}
                {exists && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      ❌ Le NFT de cette montre existe déjà
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* États de transaction */}
      {isConfirming && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>⏳ En attente de confirmation...</AlertDescription>
        </Alert>
      )}

      {isConfirmed && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>✅ NFT minté avec succès ! Hash: {hash}</AlertDescription>
        </Alert>
      )}

      {(error || (mintResult && !mintResult.success)) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ❌ {error?.message || mintResult?.error}
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
};

export default WatchSelector;