// à défaut d'API constructeur pour récupérer les données des montres via le QR code, on utilise des données factices

import { keccak256, toBytes } from 'viem';

// Données factices des montres
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
  },
  {
  brand: "Breitling",
  model: "Navitimer", 
  reference: "AB0121211B1P1",
  serialNumber: "B246810121"
 }
];

// Fonction pour générer les métadonnées IPFS avec serialHash inclus
export const generateIPFSMetadata = (watch) => {
  // Générer le hash du numéro de série
  const serialHash = keccak256(toBytes(watch.serialNumber));
  
  return {
    name: `${watch.brand} ${watch.model}`,
    description: `Certificat NFT pour ${watch.brand} ${watch.model} ${watch.reference}`,
    attributes: [
      { trait_type: "Brand", value: watch.brand },
      { trait_type: "Model", value: watch.model },
      { trait_type: "Reference", value: watch.reference }
    ],
    // Et les données nécessaires pour le contrat
    serialNumber: watch.serialNumber,
    serialHash: serialHash
  };
};