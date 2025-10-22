// Real IPFS implementation using Pinata API

import axios from 'axios';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

// ============================================
// Upload image file to IPFS via Pinata
// ============================================
export const uploadImageToIPFS = async (file) => {
  try {
    console.log("📤 Uploading image to IPFS via Pinata...");
    
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: { type: 'watch-image' }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append('pinataOptions', options);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );

    console.log("✅ Image uploaded successfully:", response.data.IpfsHash);

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      ipfsUrl: `${PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error("❌ Failed to upload image:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
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
// Upload metadata JSON to IPFS via Pinata
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
    
    // 3. Upload metadata JSON to Pinata
    console.log("📤 Uploading metadata JSON to IPFS...");
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      enrichedMetadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );

    console.log("✅ Metadata uploaded successfully:", response.data.IpfsHash);

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      ipfsUri: `ipfs://${response.data.IpfsHash}`,
      pinataUrl: `${PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`
    };
    
  } catch (error) {
    console.error("❌ Failed to upload metadata:", error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
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
    
    const response = await axios.get(`${PINATA_GATEWAY}/ipfs/${hash}`);
    
    console.log("✅ Metadata retrieved successfully");
    
    return {
      success: true,
      metadata: response.data
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
// Test Pinata connection
// ============================================
export const testPinataConnection = async () => {
  try {
    console.log("🔌 Testing Pinata connection...");
    
    const response = await axios.get(
      'https://api.pinata.cloud/data/testAuthentication',
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );
    
    console.log("✅ Pinata connection successful:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Pinata connection failed:", error);
    return false;
  }
};