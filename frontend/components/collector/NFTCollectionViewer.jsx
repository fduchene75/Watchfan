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
  const [ipfsMetadata, setIpfsMetadata] = useState({});

  // Fetch IPFS metadata for a given URI
  const fetchIPFSMetadata = async (uri) => {
    if (!uri || ipfsMetadata[uri]) return;
    
    try {
      // Extract IPFS hash from URI (format: ipfs://Qm...)
      const ipfsHash = uri.replace('ipfs://', '');
      const gatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      
      const response = await fetch(gatewayUrl);
      if (!response.ok) throw new Error('Failed to fetch IPFS metadata');
      
      const metadata = await response.json();
      setIpfsMetadata(prev => ({ ...prev, [uri]: metadata }));
    } catch (error) {
      console.error('Error fetching IPFS metadata:', error);
      setIpfsMetadata(prev => ({ ...prev, [uri]: null }));
    }
  };

  // Display each NFT individually
  const NFTCard = ({ tokenId }) => {
    const { data: contractData, isLoading: metadataLoading } = useTokenMetadata(tokenId);
    const { data: hasPendingTransfer } = useHasPendingTransfer(tokenId);
    const { data: transferHistory } = useTransferHistory(tokenId);
    
    // Fetch IPFS metadata when contract data is available
    useEffect(() => {
      if (contractData && contractData[0]) {
        fetchIPFSMetadata(contractData[0]);
      }
    }, [contractData]);
    
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
    const metadata = ipfsMetadata[uri];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            {metadata?.name || `Watch #${tokenId}`}
            {hasPendingTransfer && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                🕐 Transfer in progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Watch Image */}
          {metadata?.image && (
            <div className="flex justify-center">
              <img 
                src={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                alt={metadata.name}
                className="max-w-full h-auto max-h-64 object-contain rounded"
              />
            </div>
          )}

          {/* Watch Details */}
          {metadata && (
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold mb-2">Watch Details</h4>
              {metadata.attributes?.map((attr, index) => (
                <div key={index} className="text-sm">
                  <strong>{attr.trait_type}:</strong> {attr.value}
                </div>
              ))}
              {metadata.description && (
                <p className="text-sm mt-2 text-gray-600 italic">{metadata.description}</p>
              )}
            </div>
          )}

          {/* Blockchain Data */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div><strong>Token ID:</strong> {tokenId}</div>
            <div><strong>Certification date:</strong> {mintDate}</div>
            <div><strong>Authorized shop:</strong> <span className="font-mono text-xs">{originalShop}</span></div>
            <div><strong>Serial number hash:</strong> <span className="font-mono text-xs break-all">{serialHash}</span></div>
            <div><strong>IPFS URI:</strong> <span className="font-mono text-xs break-all">{uri}</span></div>
          </div>
          
          {/* Loading or Error State for Metadata */}
          {!metadata && (
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-600 italic">
                {ipfsMetadata[uri] === null 
                  ? '⚠️ Unable to fetch IPFS metadata' 
                  : '🔄 Loading IPFS metadata...'}
              </p>
            </div>
          )}
          
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

          {/* Transfer History */}
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
                          ? `Minted by ${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)}`
                          : `${transfer.from.slice(0, 6)}...${transfer.from.slice(-4)} → ${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)}`
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No transfer history</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (tokensLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>My Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading your watches...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokensError) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>My Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Error loading collection: {tokensError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userTokens || userTokens.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>My Collection</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-gray-600 mb-4">You don't have any certified watches yet.</p>
            <p className="text-sm text-gray-500">Watches certified by authorized shops will appear here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Collection ({userTokens.length} watch{userTokens.length > 1 ? 'es' : ''})</CardTitle>
            <Link href="/transfers">
              <Button variant="outline" size="sm">
                <ArrowRightLeft className="h-4 w-4" />
                Manage Transfers
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      {userTokens.map((tokenId) => (
        <NFTCard key={tokenId.toString()} tokenId={tokenId} />
      ))}
    </div>
  );
};

export default NFTCollectionViewer;