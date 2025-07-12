'use client';

import { useAccount } from 'wagmi';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import RequestTransferDialog from './RequestTransferDialog';

const NFTCollectionViewer = () => {
  const { address } = useAccount();
  const { useTokensByOwner, useTokenMetadata, useHasPendingTransfer } = useWatchfanContract();
  
  // Récupérer les tokens de l'utilisateur connecté
  const { data: userTokens, isLoading: tokensLoading, error: tokensError } = useTokensByOwner(address);
  
  const [nftDetails, setNftDetails] = useState([]);

  // Composant pour afficher chaque NFT individuellement
  const NFTCard = ({ tokenId }) => {
    const { data: contractData, isLoading: metadataLoading } = useTokenMetadata(tokenId);
    const { data: hasPendingTransfer } = useHasPendingTransfer(tokenId);
    
    if (metadataLoading) {
      return (
        <Card>
          <CardContent className="p-6">
            <p>Chargement NFT #{tokenId}...</p>
          </CardContent>
        </Card>
      );
    }
    
    if (!contractData) {
      return (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Erreur chargement NFT #{tokenId}</p>
          </CardContent>
        </Card>
      );
    }
    
    const [uri, purchaseDate, originalShop, serialHash] = contractData;
    const mintDate = new Date(Number(purchaseDate) * 1000).toLocaleDateString();
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            Montre #{tokenId}
            {hasPendingTransfer && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                🕐 Transfert en cours
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div><strong>Token ID:</strong> {tokenId}</div>
            <div><strong>Date de certification:</strong> {mintDate}</div>
            <div><strong>Boutique:</strong> <span className="font-mono text-xs">{originalShop}</span></div>
            <div><strong>Hash série:</strong> <span className="font-mono text-xs">{serialHash}</span></div>
            <div><strong>URI IPFS:</strong> <span className="font-mono text-xs">{uri}</span></div>
          </div>
          
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600 italic">
              📦 Métadonnées à récupérer dans IPFS
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">✅ Certifiée Watchfan</Badge>
            </div>
            
            {/* Bouton de transfert - désactivé si transfert en cours */}
            <RequestTransferDialog 
              tokenId={tokenId} 
              disabled={hasPendingTransfer}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Charger les détails des NFTs quand on a les tokens
  useEffect(() => {
    if (!userTokens || userTokens.length === 0) {
      setNftDetails([]);
      return;
    }

    // Créer une liste simple avec juste les tokenIds
    const details = userTokens.map((tokenId) => ({
      tokenId: tokenId.toString()
    }));
    
    setNftDetails(details);
  }, [userTokens]);

  if (tokensLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Chargement de vos NFTs...</p>
        </CardContent>
      </Card>
    );
  }

  if (tokensError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Erreur lors du chargement: {tokensError.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lien vers la gestion des transferts */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Gestion des transferts</h3>
              <p className="text-sm text-gray-600">Gérez vos demandes de transfert</p>
            </div>
            <Link href="/transfers">
              <Button>
                <ArrowRightLeft className="h-4 w-4" />
                Voir les transferts
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Ma collection */}
      <Card>
        <CardHeader>
          <CardTitle>Ma collection NFT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Badge variant="outline">
              Mes NFTs: {userTokens?.length || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Liste des NFTs */}
      {nftDetails.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Aucun NFT dans votre collection</p>
            <p className="text-sm text-gray-500 mt-2">
              Les NFTs qui vous sont envoyés apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {nftDetails.map((nft) => (
            <NFTCard key={nft.tokenId} tokenId={nft.tokenId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTCollectionViewer;