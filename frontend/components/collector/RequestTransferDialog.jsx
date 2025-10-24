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
      // Close immediately after success
      setOpen(false);
      setRecipientAddress('');
      resetMessages();
    } catch (err) {
      // On error, keep modal open to show error
      console.error('Transfer error:', err);
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
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Transfer - NFT #{tokenId}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
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
              ℹ️ The recipient must approve the transfer for it to be completed.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={!recipientAddress || !recipientAddress.startsWith('0x') || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Sending...' : 'Request Transfer'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestTransferDialog;