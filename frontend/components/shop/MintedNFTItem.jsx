import { Badge } from '@/components/ui/badge';
import { useIPFSMetadata } from '@/hooks/useIPFSMetadata';
import { Loader2 } from 'lucide-react';

const MintedNFTItem = ({ nft }) => {
  const { metadata, isLoading } = useIPFSMetadata(nft.tokenURI);

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Token #{nft.tokenId}
        </Badge>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <div className="font-semibold text-sm">NFT #{nft.tokenId}</div>
          <div className="text-xs text-gray-600">Metadata unavailable</div>
        </div>
        <Badge variant="outline" className="text-xs">
          Token #{nft.tokenId}
        </Badge>
      </div>
    );
  }

  // Extract watch details from metadata attributes
  const getAttribute = (traitType) => {
    const attr = metadata.attributes?.find(a => a.trait_type === traitType);
    return attr?.value || 'N/A';
  };

  const brand = getAttribute('Brand');
  const model = getAttribute('Model');
  const reference = getAttribute('Reference');
  const serialNumber = getAttribute('Serial Number');

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">
          {brand} {model}
        </div>
        <div className="text-xs text-gray-600 space-y-0.5">
          <div>Ref: {reference}</div>
          <div className="truncate">S/N: {serialNumber}</div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 ml-2">
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          Token #{nft.tokenId}
        </Badge>
        <div className="text-xs text-gray-500 truncate max-w-[120px]">
          {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
        </div>
      </div>
    </div>
  );
};

export default MintedNFTItem;