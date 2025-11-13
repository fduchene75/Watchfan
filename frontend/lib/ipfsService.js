// IPFS Service - Secure implementation using Next.js API routes
// API keys are kept secure on the server side

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

// ============================================
// Upload image file to IPFS via API route
// ============================================
export const uploadImageToIPFS = async (file) => {
  try {
    console.log("📤 Uploading image to IPFS via API route...");
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    console.log("✅ Image uploaded successfully:", data.ipfsHash);

    return {
      success: true,
      ipfsHash: data.ipfsHash,
      ipfsUrl: data.ipfsUrl
    };
  } catch (error) {
    console.error("❌ Failed to upload image:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// Helper function to convert image path to File object
// ============================================
export const fetchImageAsFile = async (imagePath) => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const filename = imagePath.split('/').pop();
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error("❌ Failed to fetch image:", error);
    throw error;
  }
};

// ============================================
// Upload metadata JSON to IPFS via API route
// This now handles the image upload automatically
// ============================================
export const uploadMetadataToIPFS = async (metadata, watchData) => {
  try {
    console.log("📤 Starting full IPFS upload process...");
    
    let enrichedMetadata = { ...metadata };
    
    // 1. Upload image first if watch has imagePath
    if (watchData.imagePath) {
      console.log("📸 Uploading watch image first...");
      const imageFile = await fetchImageAsFile(watchData.imagePath);
      const imageResult = await uploadImageToIPFS(imageFile);
      
      if (imageResult.success) {
        enrichedMetadata.image = `ipfs://${imageResult.ipfsHash}`;
        console.log("✅ Image uploaded:", imageResult.ipfsHash);
      } else {
        console.warn("⚠️ Image upload failed, continuing without image");
      }
    }
    
    // 2. Add timestamp and serial hash
    enrichedMetadata.uploaded_at = new Date().toISOString();
    enrichedMetadata.serial_hash = watchData.serialHash;
    
    // 3. Upload metadata JSON via API route
    console.log("📤 Uploading metadata JSON to IPFS...");
    
    const response = await fetch('/api/upload-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enrichedMetadata)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Metadata upload failed');
    }

    console.log("✅ Metadata uploaded successfully:", data.ipfsHash);

    return {
      success: true,
      ipfsHash: data.ipfsHash,
      ipfsUri: data.ipfsUri,
      pinataUrl: data.pinataUrl
    };
    
  } catch (error) {
    console.error("❌ Failed to upload metadata:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// Retrieve metadata from IPFS via Pinata gateway
// ============================================
export const getMetadataFromIPFS = async (ipfsHash) => {
  try {
    console.log("📥 Getting metadata from IPFS via Pinata gateway:", ipfsHash);
    
    // Remove ipfs:// prefix if present
    const hash = ipfsHash.replace('ipfs://', '');
    
    const response = await fetch(`${PINATA_GATEWAY}/ipfs/${hash}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const metadata = await response.json();
    
    console.log("✅ Metadata retrieved successfully");
    
    return {
      success: true,
      metadata
    };
  } catch (error) {
    console.error("❌ Failed to get metadata:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// Test Pinata connection (via API route)
// ============================================
export const testPinataConnection = async () => {
  try {
    console.log("🔌 Testing Pinata connection via API route...");
    
    // Test by uploading a minimal JSON
    const testData = { test: true, timestamp: Date.now() };
    
    const response = await fetch('/api/upload-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'connection-test', ...testData })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log("✅ Pinata connection successful");
      return true;
    }
    
    console.error("❌ Pinata connection failed:", data.error);
    return false;
  } catch (error) {
    console.error("❌ Pinata connection test failed:", error);
    return false;
  }
};