'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { useSerialValidation } from '@/hooks/useSerialValidation';
import { useMintService } from '@/hooks/useMintService';
import { mockWatches, generateIPFSMetadata } from '@/lib/mockWatches';
import Image from 'next/image';

// ============================================
// PINATA DEBUG COMPONENT - TEMPORARY
// ============================================
function PinataDebug() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkEnv = () => {
    const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
    
    console.log('🔍 Environment check:');
    console.log('JWT exists:', !!jwt);
    console.log('JWT length:', jwt?.length || 0);
    console.log('JWT preview:', jwt?.substring(0, 20) + '...');
    console.log('Gateway:', gateway);
    
    setResult({
      jwtExists: !!jwt,
      jwtLength: jwt?.length || 0,
      jwtPreview: jwt ? jwt.substring(0, 20) + '...' : 'UNDEFINED',
      gateway: gateway || 'UNDEFINED'
    });
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const { testPinataConnection } = await import('@/lib/ipfsService');
      const success = await testPinataConnection();
      setResult(prev => ({ ...prev, connectionSuccess: success }));
    } catch (error) {
      console.error('Connection test error:', error);
      setResult(prev => ({ 
        ...prev, 
        connectionSuccess: false, 
        error: error.message 
      }));
    }
    setLoading(false);
  };

  return (
    <div className="mb-6 p-4 border-2 border-red-500 rounded-lg space-y-4 bg-red-50">
      <h3 className="text-lg font-bold text-red-700">🔧 Pinata Debug Panel (Remove in production)</h3>
      
      <div className="flex gap-2">
        <button
          onClick={checkEnv}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Check Environment
        </button>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-sm"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {result && (
        <div className="bg-white p-4 rounded text-xs font-mono border">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN WATCH SELECTOR COMPONENT
// ============================================
const WatchSelector = () => {
 
  // State
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [ipfsMetadata, setIpfsMetadata] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [currentSerialHash, setCurrentSerialHash] = useState(null);
  const [selectValue, setSelectValue] = useState("");
  const [selectKey, setSelectKey] = useState(0);

  // Hooks
  const { mintWfNFT, isPending, isConfirming, isConfirmed, hash, error, useTotalSupply } = useWatchfanContract();
  const totalSupplyQuery = useTotalSupply();
  const totalSupply = totalSupplyQuery?.data;
  const refreshTotalSupply = totalSupplyQuery?.refetch;
  const { mintNFT, resetMint, isProcessing, mintResult } = useMintService(mintWfNFT);
  const { checkSerialHash, resetValidation, isChecking, exists, error: validationError } = useSerialValidation();

  // Handle watch selection
  const handleWatchSelect = useCallback((watchIndex) => {
    setSelectValue(watchIndex);
    const watch = mockWatches[parseInt(watchIndex)];
    setSelectedWatch(watch);
    
    // Generate IPFS metadata (image will be uploaded during mint)
    const metadata = generateIPFSMetadata(watch);
    setIpfsMetadata(metadata);
    
    // Check serial hash if changed
    if (metadata.serialHash !== currentSerialHash) {
      setCurrentSerialHash(metadata.serialHash);
      checkSerialHash(metadata.serialHash);
    }
  }, []);

  // Check serial hash when it changes - prevent infinite loops
  const lastCheckedHash = useRef(null);

  useEffect(() => {
    if (currentSerialHash && currentSerialHash !== lastCheckedHash.current) {
      lastCheckedHash.current = currentSerialHash;
      checkSerialHash(currentSerialHash);
    }
  }, [currentSerialHash, checkSerialHash]);

  // Handle mint
  const handleMintNFT = useCallback(async () => {
    await mintNFT({
      selectedWatch,
      recipientAddress,
      ipfsMetadata,
      exists
    });
  }, [mintNFT, selectedWatch, recipientAddress, ipfsMetadata, exists]);

  // Can mint conditions
  const canMint = selectedWatch && 
    ipfsMetadata && 
    recipientAddress && 
    !isProcessing && 
    !isPending && 
    !isConfirming && 
    !exists && 
    !isChecking &&
    currentSerialHash;

  // Button text
  const getButtonText = () => {
    if (isProcessing) return 'Uploading to IPFS...';
    if (isPending) return 'Preparing transaction...';
    if (isConfirming) return 'Confirming...';
    if (isChecking) return 'Checking serial...';
    if (exists) return 'NFT already minted'; 
    return 'Mint NFT';
  };

  // Reset after success
  useEffect(() => {
    if (isConfirmed) {
      setSelectedWatch(null);
      setSelectValue("");
      setIpfsMetadata(null);
      setRecipientAddress('');
      setCurrentSerialHash(null);
      lastCheckedHash.current = null;
      resetMint();
      resetValidation();
      totalSupplyQuery?.refetch();
      setSelectKey(prev => prev + 1); // Force Select component remount
    }
  }, [isConfirmed, resetMint, resetValidation]);

  return (
    <div className="space-y-4">
      
      {/* ============================================ */}
      {/* DEBUG PANEL - REMOVE IN PRODUCTION */}
      {/* ============================================ */}
      <PinataDebug />

      {/* Total Supply Badge */}
      <Badge variant="outline" className="text-lg p-3">
        NFTs minted: {totalSupply?.toString() || "0"}
      </Badge>

      {/* Watch Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Watch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select key={selectKey} value={selectValue} onValueChange={handleWatchSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a watch" />
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
            <div className="border rounded-lg p-4 bg-gray-50">
              {/* Watch Image */}
              <div className="mb-4 relative w-full h-48">
                <Image
                  src={selectedWatch.imagePath}
                  alt={`${selectedWatch.brand} ${selectedWatch.model}`}
                  fill
                  className="object-contain rounded"
                />
              </div>
              
              {/* Watch Details */}
              <h3 className="font-bold text-lg mb-2">
                {selectedWatch.brand} {selectedWatch.model}
              </h3>
              <div className="flex gap-2 mb-2">
                <Badge>{selectedWatch.reference}</Badge>
                <Badge variant="outline">{selectedWatch.serialNumber}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Preview */}
      {ipfsMetadata && (
        <Card>
          <CardHeader>
            <CardTitle>NFT Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-64">
              {JSON.stringify({
                name: ipfsMetadata.name,
                description: ipfsMetadata.description,
                image: 'Will be uploaded to IPFS during mint',
                attributes: ipfsMetadata.attributes
              }, null, 2)}
            </pre>
            
            {/* Serial Hash Status */}
            {currentSerialHash && (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Serial Hash:</strong>
                  <div className="font-mono text-xs bg-white p-2 rounded border mt-1 break-all">
                    {currentSerialHash}
                  </div>
                </div>
                
                {isChecking && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Checking if watch already exists...</AlertDescription>
                  </Alert>
                )}
                
                {!isChecking && exists && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      ⚠️ This watch serial number is already minted!
                    </AlertDescription>
                  </Alert>
                )}
                
                {!isChecking && !exists && currentSerialHash && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-700">
                      ✅ Watch serial number is available
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Mint Section */}
            <div className="border-t pt-4 space-y-2">
              <h4 className="font-semibold mb-2">Mint NFT</h4>
              <Input
                type="text"
                placeholder="Recipient address (0x...)"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                disabled={isProcessing || isPending || isConfirming}
                className="font-mono"
              />
              <Button 
                onClick={handleMintNFT}
                disabled={!canMint}
                className="w-full text-lg py-6"
                size="lg"
              >
                {getButtonText()}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction States */}
      {isConfirming && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>⏳ Awaiting confirmation...</AlertDescription>
        </Alert>
      )}

      {isConfirmed && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ NFT minted successfully! 
            {hash && (
              <div className="text-xs font-mono mt-1 break-all">
                Transaction: {hash}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Errors */}
      {(error || validationError || (mintResult && !mintResult.success)) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ❌ {error?.message || validationError?.message || mintResult?.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Mint Result Success */}
      {mintResult && mintResult.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-bold">✅ NFT Minted Successfully!</div>
              {mintResult.ipfsUri && (
                <div className="text-xs font-mono break-all bg-white p-2 rounded border">
                  IPFS URI: {mintResult.ipfsUri}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default WatchSelector;