'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTransfers } from '@/hooks/useTransfers';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

const RequestTransferDialog = ({ tokenId, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const { handleRequestTransfer, isProcessing, error, success, resetMessages } = useTransfers();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!recipientAddress || !recipientAddress.startsWith('0x')) {
      return;
    }

    try {
      await handleRequestTransfer(tokenId, recipientAddress);
      // Fermer immédiatement après succès
      setOpen(false);
      setRecipientAddress('');
      resetMessages();
    } catch (err) {
      // En cas d'erreur, on garde la modal ouverte pour montrer l'erreur
      console.error('Erreur lors du transfert:', err);
    }
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setRecipientAddress('');
      resetMessages();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
        >
          <Send className="h-4 w-4" />
          Transférer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demander un transfert - NFT #{tokenId}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Adresse du destinataire</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={isProcessing}
            />
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

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              ℹ️ Le destinataire devra approuver le transfert pour qu'il soit effectif.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={!recipientAddress || !recipientAddress.startsWith('0x') || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Envoi...' : 'Demander le transfert'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isProcessing}
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestTransferDialog;