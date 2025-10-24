// Component to display a single minted NFT in the shop inventory
import { Badge } from '@/components/ui/badge';
import { useIPFSMetadata } from '@/hooks/useIPFSMetadata';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function MintedNFTItem({ nft }) {
  const { tokenId, owner, purchaseDate, originalShop, tokenURI, serialHash, transferHistory } = nft;
  
  // Fetch IPFS metadata
  const { metadata, isLoading: metadataLoading, error: metadataError } = useIPFSMetadata(tokenURI);

  // Format purchase date
  const formattedDate = new Date(Number(purchaseDate) * 1000).toLocaleDateString();
  
  // Format address - handle both string and potential object types
  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    const addrStr = typeof address === 'string' ? address : address.toString();
    return `${addrStr.slice(0, 6)}...${addrStr.slice(-4)}`;
  };
  
  // Get image URL from metadata
  const getImageUrl = () => {
    if (!metadata?.image) return null;
    
    if (metadata.image.startsWith('ipfs://')) {
      const hash = metadata.image.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }
    
    return metadata.image;
  };

  return (
    <div className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex gap-4">
        
        {/* NFT Image */}
        <div className="flex-shrink-0">
          {metadataLoading ? (
            <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : metadata && getImageUrl() ? (
            <div className="w-24 h-24 relative rounded overflow-hidden">
              <Image
                src={getImageUrl()}
                alt={metadata.name || `NFT #${tokenId}`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>

        {/* NFT Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold text-lg">
                {metadata?.name || `NFT #${tokenId}`}
              </h4>
              <Badge variant="outline" className="mt-1">
                Token ID: {tokenId.toString()}
              </Badge>
            </div>
            <Badge className="bg-green-100 text-green-800">
              ✅ Certified
            </Badge>
          </div>

          {/* Metadata Status */}
          {metadataLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading metadata...</span>
            </div>
          )}
          
          {metadataError && (
            <div className="text-sm text-orange-600 mb-2">
              ⚠️ Metadata unavailable
            </div>
          )}

          {metadata && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {metadata.description || 'No description available'}
            </p>
          )}

          {/* NFT Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <div><strong>Owner:</strong> {formatAddress(owner)}</div>
            <div><strong>Minted:</strong> {formattedDate}</div>
            <div><strong>Original Shop:</strong> {formatAddress(originalShop)}</div>
            
            {/* Serial Hash (optional - can be hidden or shown on demand) */}
            {serialHash && (
              <div className="mt-2">
                <strong>Serial Hash:</strong> 
                <span className="font-mono text-xs break-all ml-1">
                  {serialHash.slice(0, 10)}...{serialHash.slice(-8)}
                </span>
              </div>
            )}
            
            {metadata?.attributes && metadata.attributes.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {metadata.attributes.map((attr, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {attr.trait_type}: {attr.value}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Transfer Count */}
          {transferHistory && transferHistory.length > 1 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {transferHistory.length - 1} transfer{transferHistory.length - 1 > 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}