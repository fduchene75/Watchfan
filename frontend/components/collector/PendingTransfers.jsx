'use client';

import { useAccount } from 'wagmi';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { useTransfers } from '@/hooks/useTransfers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, X, Clock, AlertCircle } from 'lucide-react';

const PendingTransfers = () => {
  const { address } = useAccount();
  const { useTokensByOwner } = useWatchfanContract();
  const { handleApproveReceive, handleCancelTransfer, isProcessing, error, success } = useTransfers();

  // Récupérer tous les tokens de l'utilisateur
  const { data: userTokens, isLoading: tokensLoading } = useTokensByOwner(address);

  // Composant pour chaque transfert individuel
  const TransferCard = ({ tokenId }) => {
    const { useHasPendingTransfer, usePendingTransfer } = useWatchfanContract();
    const { data: hasPending } = useHasPendingTransfer(tokenId);
    const { data: pendingData } = usePendingTransfer(tokenId);

    // Ne pas afficher si pas de transfert en cours
    if (!hasPending || !pendingData) {
      return null;
    }

    const [from, to, ownerApproved, recipientApproved, timestamp] = pendingData;
    
    // Ne montrer que si l'utilisateur connecté est concerné
    if (from !== address && to !== address) {
      return null;
    }

    const isRecipient = to === address;
    const formatDate = (timestamp) => new Date(Number(timestamp) * 1000).toLocaleString();

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">NFT #{tokenId.toString()}</CardTitle>
            <Badge variant={isRecipient ? "default" : "secondary"}>
              {isRecipient ? "📥 Reçu" : "📤 Envoyé"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div><strong>De:</strong> <span className="font-mono text-xs">{from}</span></div>
            <div><strong>Vers:</strong> <span className="font-mono text-xs">{to}</span></div>
            <div><strong>Demandé le:</strong> {formatDate(timestamp)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {ownerApproved ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm">
                Expéditeur {ownerApproved ? 'a approuvé' : 'doit approuver'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {recipientApproved ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm">
                Destinataire {recipientApproved ? 'a approuvé' : 'doit approuver'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {isRecipient && !recipientApproved && (
              <Button 
                onClick={() => handleApproveReceive(tokenId)}
                disabled={isProcessing}
                size="sm"
              >
                <CheckCircle className="h-4 w-4" />
                Accepter
              </Button>
            )}
            
            <Button 
              variant="destructive"
              onClick={() => handleCancelTransfer(tokenId)}
              disabled={isProcessing}
              size="sm"
            >
              <X className="h-4 w-4" />
              {isRecipient ? 'Refuser' : 'Annuler'}
            </Button>
          </div>

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
          <p>Chargement des transferts en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (!userTokens || userTokens.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Transferts en cours</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Aucun transfert en cours</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Transferts en cours</CardTitle>
        </CardHeader>
      </Card>

      {userTokens.map((tokenId) => (
        <TransferCard key={tokenId.toString()} tokenId={tokenId} />
      ))}
    </div>
  );
};

export default PendingTransfers;