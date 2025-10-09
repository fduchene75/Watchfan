'use client';

import { useState, useEffect } from 'react';
import { useWatchfanContract } from '@/hooks/useWatchfanContract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { 
    useGetAuthorizedShops, 
    setShopAddress,
    isPending,
    isConfirming,
    isConfirmed,
    error 
  } = useWatchfanContract();

  const { data: authorizedShops, isLoading, refetch } = useGetAuthorizedShops();
  const [newShopAddress, setNewShopAddress] = useState('');
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Refetch shops list after transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetch();
      setNewShopAddress('');
      setSuccessMessage('Operation completed successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [isConfirmed, refetch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setActionError(error.message || 'Transaction failed');
      setTimeout(() => setActionError(null), 8000);
    }
  }, [error]);

  const handleAddShop = async () => {
    if (!newShopAddress || !newShopAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setActionError('Please enter a valid Ethereum address');
      setTimeout(() => setActionError(null), 5000);
      return;
    }

    try {
      setActionError(null);
      await setShopAddress(newShopAddress, true);
    } catch (err) {
      console.error('Error authorizing shop:', err);
    }
  };

  const handleToggleShop = async (shopAddress) => {
    try {
      setActionError(null);
      await setShopAddress(shopAddress, false);
    } catch (err) {
      console.error('Error revoking shop:', err);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Administrator Panel</h1>

      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {actionError && (
        <Alert className="mb-6 border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {actionError}
          </AlertDescription>
        </Alert>
      )}

      {/* Transaction Status */}
      {(isPending || isConfirming) && (
        <Alert className="mb-6 border-blue-500 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            {isPending && 'Waiting for wallet confirmation...'}
            {isConfirming && 'Transaction confirming on blockchain...'}
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Shop */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add Authorized Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Shop address (0x...)"
              value={newShopAddress}
              onChange={(e) => setNewShopAddress(e.target.value)}
              className="flex-1"
              disabled={isPending || isConfirming}
            />
            <Button 
              onClick={handleAddShop}
              disabled={isPending || isConfirming || !newShopAddress}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Add Shop'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Shops List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Authorized Shops</span>
            <Badge variant="outline" className="text-lg">
              {isLoading ? '...' : authorizedShops?.length || 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !authorizedShops || authorizedShops.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No authorized shops yet. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {authorizedShops.map((shop) => (
                <div 
                  key={shop}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-mono text-sm">{shop}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatAddress(shop)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleShop(shop)}
                    disabled={isPending || isConfirming}
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}