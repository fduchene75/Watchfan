'use client';

import { useAccount } from 'wagmi';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { useTransfers } from '@/hooks/useTransfers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, X, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const PendingTransfers = () => {
  const { address } = useAccount();
  const { useTransfersForUser } = useWatchfanContract();
  const { handleApproveReceive, handleCancelTransfer, isProcessing, error, success } = useTransfers();

  // Get all transfers for the user
  const { data: userTokens, isLoading: tokensLoading } = useTransfersForUser(address);

  // State for IPFS metadata
  const [ipfsMetadata, setIpfsMetadata] = useState({});

  // Fetch IPFS metadata for a given URI
  const fetchIPFSMetadata = async (uri) => {
    if (!uri || ipfsMetadata[uri]) return;
    
    try {
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

  // Component for each individual transfer with full details
  const TransferCard = ({ tokenId }) => {
    const { useHasPendingTransfer, usePendingTransfer, useTokenMetadata } = useWatchfanContract();
    const { data: hasPending } = useHasPendingTransfer(tokenId);
    const { data: pendingData } = usePendingTransfer(tokenId);
    const { data: contractData } = useTokenMetadata(tokenId);

    // Fetch IPFS metadata when contract data is available
    useEffect(() => {
      if (contractData && contractData[0]) {
        fetchIPFSMetadata(contractData[0]);
      }
    }, [contractData]);

    // Don't display if no pending transfer
    if (!hasPending || !pendingData) {
      return null;
    }

    const [from, to, ownerApproved, recipientApproved, timestamp] = pendingData;
    
    // Only show if connected user is involved
    if (from !== address && to !== address) {
      return null;
    }

    const isRecipient = to === address;
    const formatDate = (timestamp) => new Date(Number(timestamp) * 1000).toLocaleString();
    
    // Get contract metadata
    let uri, purchaseDate, originalShop, serialHash;
    if (contractData) {
      [uri, purchaseDate, originalShop, serialHash] = contractData;
    }
    
    const metadata = ipfsMetadata[uri];
    const mintDate = purchaseDate ? new Date(Number(purchaseDate) * 1000).toLocaleDateString() : 'N/A';

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {metadata?.name || `NFT #${tokenId.toString()}`}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Token ID: {tokenId.toString()}</p>
            </div>
            <Badge variant={isRecipient ? "default" : "secondary"}>
              {isRecipient ? "📥 Received" : "📤 Sent"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Watch Image */}
          {metadata?.image && (
            <div className="flex justify-center">
              <img 
                src={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                alt={metadata.name}
                className="max-w-full h-auto max-h-48 object-contain rounded"
              />
            </div>
          )}

          {/* Watch Details from IPFS */}
          {metadata && (
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold mb-2 text-sm">Watch Details</h4>
              {metadata.attributes?.map((attr, index) => (
                <div key={index} className="text-xs">
                  <strong>{attr.trait_type}:</strong> {attr.value}
                </div>
              ))}
              {metadata.description && (
                <p className="text-xs mt-2 text-gray-600 italic">{metadata.description}</p>
              )}
            </div>
          )}

          {/* Loading or Error State for Metadata */}
          {!metadata && contractData && (
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-xs text-gray-600 italic">
                {ipfsMetadata[uri] === null 
                  ? '⚠️ Unable to fetch IPFS metadata' 
                  : '🔄 Loading watch details...'}
              </p>
            </div>
          )}

          {/* Transfer Details */}
          <div className="border-t border-gray-200 pt-3">
            <h4 className="font-semibold mb-2 text-sm">Transfer Details</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div><strong>From:</strong> <span className="font-mono">{from}</span></div>
              <div><strong>To:</strong> <span className="font-mono">{to}</span></div>
              <div><strong>Requested on:</strong> {formatDate(timestamp)}</div>
            </div>
          </div>

          {/* Blockchain Data */}
          {contractData && (
            <div className="border-t border-gray-200 pt-3">
              <h4 className="font-semibold mb-2 text-sm">Blockchain Data</h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div><strong>Certification date:</strong> {mintDate}</div>
                <div><strong>Original shop:</strong> <span className="font-mono">{originalShop?.slice(0, 6)}...{originalShop?.slice(-4)}</span></div>
                <div><strong>Serial hash:</strong> <span className="font-mono break-all">{serialHash?.slice(0, 10)}...{serialHash?.slice(-8)}</span></div>
                <div><strong>IPFS URI:</strong> <span className="font-mono break-all">{uri?.slice(0, 20)}...{uri?.slice(-10)}</span></div>
              </div>
            </div>
          )}

          {/* Approval Status */}
          <div className="border-t border-gray-200 pt-3">
            <h4 className="font-semibold mb-2 text-sm">Approval Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {ownerApproved ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-xs">
                  Sender {ownerApproved ? 'has approved' : 'waiting for approval'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {recipientApproved ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-xs">
                  Recipient {recipientApproved ? 'has approved' : 'waiting for approval'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {isRecipient && !recipientApproved && (
              <Button 
                onClick={() => handleApproveReceive(tokenId)}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Approve & Receive'}
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              onClick={() => handleCancelTransfer(tokenId)}
              disabled={isProcessing}
              className="flex-1"
            >
              <X className="h-4 w-4" />
              {isProcessing ? 'Processing...' : isRecipient ? 'Decline' : 'Cancel'}
            </Button>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  if (tokensLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading pending transfers...</p>
        </CardContent>
      </Card>
    );
  }

  if (!userTokens || userTokens.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Transfers</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No pending transfers</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pending Transfers ({userTokens.length})</CardTitle>
        </CardHeader>
      </Card>

      {userTokens.map((tokenId) => (
        <TransferCard key={tokenId.toString()} tokenId={tokenId} />
      ))}
    </div>
  );
};

export default PendingTransfers;