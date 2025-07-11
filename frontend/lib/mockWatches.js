// à défaut d'API constructeur pour récupérer les données des montres via le QR code, on utilise des données factices

export const mockWatches = [
  {
    brand: "Rolex",
    model: "Submariner", 
    reference: "116610LN",
    serialNumber: "R123456789"
  },
  {
    brand: "Omega",
    model: "Speedmaster", 
    reference: "311.30.42.30",
    serialNumber: "O987654321"
  },
  {
    brand: "TAG Heuer",
    model: "Monaco", 
    reference: "CAW2111",
    serialNumber: "T456789123"
  },
  {
    brand: "Patek Philippe",
    model: "Nautilus", 
    reference: "5711/1A",
    serialNumber: "P789123456"
  }
];

// Fonction pour générer les métadonnées IPFS (JSON standard NFT)
export const generateIPFSMetadata = (watch) => {
  return {
    name: `${watch.brand} ${watch.model}`,
    description: `Certificat NFT pour ${watch.brand} ${watch.model} ${watch.reference}`,
    attributes: [
      { trait_type: "Brand", value: watch.brand },
      { trait_type: "Model", value: watch.model },
      { trait_type: "Reference", value: watch.reference }
    ]
  };
};
