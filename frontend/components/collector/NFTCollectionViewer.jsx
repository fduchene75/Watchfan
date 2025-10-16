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
  const { useTokensByOwner, useTokenMetadata, useHasPendingTransfer, useTransferHistory } = useWatchfanContract();
  
  // Fetch user tokens
  const { data: userTokens, isLoading: tokensLoading, error: tokensError } = useTokensByOwner(address);
  
  const [nftDetails, setNftDetails] = useState([]);

  // Display each NFT individually
  const NFTCard = ({ tokenId }) => {
    const { data: contractData, isLoading: metadataLoading } = useTokenMetadata(tokenId);
    const { data: hasPendingTransfer } = useHasPendingTransfer(tokenId);
    const { data: transferHistory } = useTransferHistory(tokenId);
    
    if (metadataLoading) {
      return (
        <Card>
          <CardContent className="p-6">
            <p>Loading NFT #{tokenId}...</p>
          </CardContent>
        </Card>
      );
    }
    
    if (!contractData) {
      return (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading NFT #{tokenId}</p>
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
            Watch #{tokenId}
            {hasPendingTransfer && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                🕐 Transfer in progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div><strong>Token ID:</strong> {tokenId}</div>
            <div><strong>Certification date:</strong> {mintDate}</div>
            <div><strong>Shop:</strong> <span className="font-mono text-xs">{originalShop}</span></div>
            <div><strong>Serial number hash:</strong> <span className="font-mono text-xs">{serialHash}</span></div>
            <div><strong>IPFS URI:</strong> <span className="font-mono text-xs">{uri}</span></div>
          </div>
          
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600 italic">
              📦 Métadonnées à récupérer dans IPFS
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">✅ Watchfan certified</Badge>
            </div>
            
            {/* Transfer button - if not already in progress */}
            <RequestTransferDialog 
              tokenId={tokenId} 
              disabled={hasPendingTransfer}
            />
          </div>

          {/* Transfers history */}
          <div className="mt-4 border-t border-gray-200 pt-3">
            <h4 className="text-sm font-medium mb-2 text-gray-700">History</h4>
            {transferHistory && transferHistory.length > 0 ? (
              <div className="space-y-1">
                {transferHistory.map((transfer, index) => (
                  <div key={index} className="text-xs text-gray-600">

                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {transfer.from === '0x0000000000000000000000000000000000000000' ? 'Mint' : 'Transfer'}
                      </span>
                      <span>
                        {transfer.from === '0x0000000000000000000000000000000000000000' 
                          ? `Created for ${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)}`
                          : `${transfer.from.slice(0, 6)}...${transfer.from.slice(-4)} → ${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)}`
                        }
                      </span>
                      <span className="text-gray-400">
                        {new Date(Number(transfer.timestamp) * 1000).toLocaleDateString()}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No history</p>
            )}
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

    // Créer une liste avec les tokenIds
    const details = userTokens.map((tokenId) => ({
      tokenId: tokenId.toString()
    }));
    
    setNftDetails(details);
  }, [userTokens]);

  if (tokensLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading your NFTs...</p>
        </CardContent>
      </Card>
    );
  }

  if (tokensError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Loading error: {tokensError.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* My collection */}
      <Card>
        <CardContent className="p-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">My NFT collection</h3>
            <Badge variant="outline">
              {userTokens?.length || 0} NFT{(userTokens?.length || 0) > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Liste des NFTs */}
      {nftDetails.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No NFT in your collection</p>
            <p className="text-sm text-gray-500 mt-2">
              NFTs sent to you will appear here
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

      {/* Link to transfer management */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Transfer management</h3>
              <p className="text-sm text-gray-600">Manage your transfer requests</p>
            </div>
            <Link href="/transfers">
              <Button>
                <ArrowRightLeft className="h-4 w-4" />
                View pending transfers
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default NFTCollectionViewer;