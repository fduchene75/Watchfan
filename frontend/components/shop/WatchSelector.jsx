// A défaut d'API constructeur pour récupérer les données des montres via le QR code, on sélectionne parmi des données factices
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import { mockWatches, generateIPFSMetadata } from '@/lib/mockWatches';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { useSerialValidation } from '@/hooks/useSerialValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { uploadMetadataToIPFS } from '@/lib/ipfsService';

const WatchSelector = () => {
  const { address } = useAccount();
  const { mintWfNFT, isPending, isConfirming, isConfirmed, hash, error, useTotalSupply } = useWatchfanContract();
  const { data: totalSupply } = useTotalSupply();
  const { checkSerialHash, resetValidation, isChecking, exists, error: validationError } = useSerialValidation();
  
  const [mintError, setMintError] = useState(null);
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');

  const [currentSerialHash, setCurrentSerialHash] = useState(null);

  const handleWatchSelect = (watchIndex) => {
    const watch = mockWatches[parseInt(watchIndex)];
    setSelectedWatch(watch);
    setMintError(null);
    
    // Générer automatiquement les metadonnées
    if (watch) {
        const metadata = generateIPFSMetadata(watch);
        setIpfsMetadata(metadata);
        // On ajouter le Serial Number (qui n'ira pas dans IPFS)
        const serialHash = keccak256(toBytes(watch.serialNumber));
        const enrichedMetadata = {
            ...metadata,
            serialNumber: watch.serialNumber,
            serialHash
        };
        setIpfsMetadata(enrichedMetadata);   
        // Vérifier si ce numéro de série existe déjà
        checkSerialHash(serialHash);     
    }

  };

  const handleMintNFT = async () => {
    if (!selectedWatch || !recipientAddress || !ipfsMetadata) return;

    // Vérification Serial avant mint
    if (exists) {
      setMintError("Ce numéro de série est déjà minté");
      return;
    }

    try {
        // Upload vers IPFS au moment du mint
        const { serialNumber, serialHash, ...metadataForIPFS } = ipfsMetadata;
        
        const ipfsResult = await uploadMetadataToIPFS(metadataForIPFS, selectedWatch);
        
        if (!ipfsResult.success) {
        throw new Error("Échec upload IPFS: " + ipfsResult.error);
        }

        // Mint avec l'URI IPFS fraîchement généré et le hash du serial
        await mintWfNFT(recipientAddress, ipfsResult.ipfsUri, serialHash);
        
    } catch (error) {
        console.error("❌ Erreur lors du mint:", error);
        // Gestion spécifique des erreurs de contrat
        if (error.message?.includes('WatchfanSerialHashAlreadyExists')) {
            setMintError("Ce numéro de série existe déjà dans la blockchain. Impossible de minter deux fois la même montre.");
        } else if (error.message?.includes('WatchfanUnauthorizedMinting')) {
            setMintError("Vous n'êtes pas autorisé à minter des NFTs. Contactez l'administrateur.");
        } else if (error.message?.includes('WatchfanInvalidAddress')) {
            setMintError("Adresse du destinataire invalide.");
        } else if (error.message?.includes('WatchfanInvalidSerialHash')) {
            setMintError("Numéro de série invalide.");
        } else {
            setMintError(error.message);
        }
    }
 };

  const canMint = selectedWatch && ipfsMetadata && recipientAddress && !isPending && !isConfirming && !exists && !isChecking;

  const getButtonText = () => {
    if (isPending) return 'Préparation...';
    if (isConfirming) return 'Confirmation...';
    if (isChecking) return 'Vérification...';
    if (exists) return 'Le NFT de cette montre existe déjà';
    return 'Mint NFT';
  };

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
            </div>
          )}
        </CardContent>
      </Card>

      {ipfsMetadata && (
        <Card>
          <CardHeader>
            <CardTitle>Métadonnées IPFS</CardTitle>
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
                variant={exists ? "destructive" : "default"}
                >
                {getButtonText()}
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
            {isConfirming && <p>⏳ En attente de confirmation...</p>}
            {isConfirmed && <p className="text-green-600">✅ NFT minté avec succès !</p>}
            {error && <p className="text-red-600">❌ Erreur blockchain: {error.message}</p>}
            {mintError && <p className="text-red-600">❌ Erreur: {mintError}</p>}
            {hash && <p className="text-sm text-gray-600">Hash: {hash}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WatchSelector;