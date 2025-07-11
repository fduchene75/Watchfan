// Composant pour que les collectionneurs voient leurs NFTs
'use client';

import { useAccount } from 'wagmi';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

const NFTCollectionViewer = () => {
  const { address } = useAccount();
  const { useTokensByOwner, useTotalSupply } = useWatchfanContract();
  
  // Récupérer les tokens de l'utilisateur connecté
  const { data: userTokens, isLoading: tokensLoading, error: tokensError } = useTokensByOwner(address);
  const { data: totalSupply } = useTotalSupply();
  
  const [nftDetails, setNftDetails] = useState([]);

  // Fonction pour récupérer les métadonnées IPFS (simulation)
  const fetchNFTMetadata = async (ipfsUri) => {
    try {
      // Pour le moment, on simule les métadonnées basées sur l'URI mock
      const mockMetadata = {
        name: "Montre certifiée Watchfan",
        image: "https://via.placeholder.com/400x400/000000/FFFFFF?text=Watch+NFT",
        attributes: [
          { trait_type: "Status", value: "Certified" },
          { trait_type: "Type", value: "Luxury Watch" }
        ]
      };
      return mockMetadata;
    } catch (error) {
      console.error('Erreur récupération métadonnées:', error);
      return null;
    }
  };

  // Charger les détails des NFTs quand on a les tokens
  useEffect(() => {
    const loadNFTDetails = async () => {
      if (!userTokens || userTokens.length === 0) {
        setNftDetails([]);
        return;
      }

      const details = await Promise.all(
        userTokens.map(async (tokenId) => {
          try {
            // Récupérer les métadonnées IPFS (simulation)
            const metadata = await fetchNFTMetadata('mock-uri');
            
            return {
              tokenId: tokenId.toString(),
              metadata,
              mintDate: new Date().toLocaleDateString(), // Simulation
            };
          } catch (error) {
            console.error(`Erreur pour token ${tokenId}:`, error);
            return {
              tokenId: tokenId.toString(),
              metadata: null,
              mintDate: 'Unknown'
            };
          }
        })
      );
      
      setNftDetails(details);
    };

    loadNFTDetails();
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
    <div className="space-y-4">
      {/* En-tête */}
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
            <Card key={nft.tokenId}>
              <CardHeader>
                <CardTitle className="text-lg">
                  NFT #{nft.tokenId}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nft.metadata ? (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">{nft.metadata.name}</h4>
                      <p className="text-sm text-gray-600">{nft.metadata.description}</p>
                    </div>
                    
                    <div className="bg-gray-100 p-3 rounded text-center">
                      <div className="text-4xl mb-2">⌚</div>
                      <p className="text-xs">Image NFT</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold mb-1">Attributs:</p>
                      <div className="flex flex-wrap gap-1">
                        {nft.metadata.attributes?.map((attr, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {attr.trait_type}: {attr.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Minté le: {nft.mintDate}
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600">Erreur chargement métadonnées</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTCollectionViewer;