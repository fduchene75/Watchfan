// frontend/components/shop/ImageUploader.jsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadImageToIPFS } from '@/lib/ipfsService';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ImageUploader({ onImageUploaded, disabled = false }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadResult({
          success: false,
          message: 'Please select an image file'
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadResult({
          success: false,
          message: 'Image must be less than 10MB'
        });
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadImageToIPFS(selectedFile);
      
      if (result.success) {
        setUploadResult({
          success: true,
          message: 'Image uploaded successfully to IPFS!',
          ipfsHash: result.ipfsHash,
          url: result.ipfsUrl
        });
        
        // Callback to parent component
        if (onImageUploaded) {
          onImageUploaded(result.ipfsHash, result.ipfsUrl);
        }
      } else {
        setUploadResult({
          success: false,
          message: `Upload failed: ${result.error}`
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    if (onImageUploaded) {
      onImageUploaded(null, null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Watch Image</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || disabled || uploadResult?.success}
            className="cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max size: 10MB. Formats: JPG, PNG, WebP
          </p>
        </div>
        
        {previewUrl && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-full h-64 object-contain mx-auto rounded"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || uploading || disabled || uploadResult?.success}
            className="flex-1"
          >
            {uploading ? 'Uploading to IPFS...' : 'Upload to IPFS'}
          </Button>

          {uploadResult?.success && (
            <Button 
              onClick={handleClear}
              variant="outline"
              disabled={disabled}
            >
              Clear
            </Button>
          )}
        </div>

        {uploadResult && (
          <Alert variant={uploadResult.success ? 'default' : 'destructive'}>
            <AlertDescription>
              {uploadResult.message}
              {uploadResult.success && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs font-mono break-all bg-white p-2 rounded border">
                    <strong>Hash:</strong> {uploadResult.ipfsHash}
                  </div>
                  <div className="text-xs">
                    <a 
                      href={uploadResult.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View on IPFS Gateway →
                    </a>
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}