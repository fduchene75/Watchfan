// Pour le MVP on simule l'upload IPFS

export const uploadMetadataToIPFS = async (metadata, watchData) => {
  try {
    console.log("📤 [MVP SIMULATION] Uploading metadata to IPFS...", metadata);
    
    // Simulation d'un délai d'upload réaliste
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enrichir les métadonnées avec timestamp et hash
    const enrichedMetadata = {
      ...metadata,
      uploaded_at: new Date().toISOString(),
      serial_hash: watchData.serialHash
    };
    
    // Générer un hash IPFS simulé mais réaliste
    const simulatedHash = generateRealisticHash(enrichedMetadata, watchData);
    const ipfsUri = `ipfs://${simulatedHash}`;
    
    console.log("✅ [MVP] Metadata uploaded to simulated IPFS:", ipfsUri);
    console.log("📄 Final metadata:", enrichedMetadata);
    
    return {
      success: true,
      ipfsHash: simulatedHash,
      ipfsUri: ipfsUri,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${simulatedHash}` // URL réaliste
    };
    
  } catch (error) {
    console.error("❌ Failed to upload metadata:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Générer un hash IPFS réaliste (format Qm...)
const generateRealisticHash = (metadata, watchData) => {
  const data = JSON.stringify(metadata) + watchData.serialNumber;
  
  // Format IPFS réaliste : Qm + 44 caractères
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let hash = 'Qm';
  
  // Créer un hash déterministe pour la même montre
  for (let i = 0; i < 44; i++) {
    const charIndex = (data.charCodeAt(i % data.length) * (i + 1)) % chars.length;
    hash += chars[charIndex];
  }
  
  return hash;
};

// Récupérer des métadonnées depuis IPFS (simulation)
export const getMetadataFromIPFS = async (ipfsHash) => {
  try {
    console.log("📥 [MVP] Getting metadata from simulated IPFS:", ipfsHash);
    
    // Simulation d'un délai de récupération
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Simuler des métadonnées récupérées
    const metadata = {
      name: "Certificat récupéré",
      description: "Métadonnées récupérées depuis IPFS simulé",
      attributes: [
        { trait_type: "Status", value: "Retrieved" },
        { trait_type: "Hash Preview", value: ipfsHash.slice(0, 10) + "..." }
      ],
      uploaded_at: new Date().toISOString()
    };
    
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

// Test de connexion simulé
export const testPinataConnection = async () => {
  console.log("🔌 [MVP] Testing simulated IPFS connection...");
  
  // Simulation du test
  await new Promise(resolve => setTimeout(resolve, 800));
  
  console.log("✅ [MVP] Simulated connection successful");
  return true;
};