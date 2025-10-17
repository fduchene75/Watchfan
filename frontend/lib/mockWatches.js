// Instead of a manufacturer API to retrieve watch data via QR code, we use mock data

import { keccak256, toBytes } from 'viem';

// Mock watch data
export const mockWatches = [
  {
    brand: "Rolex",
    model: "Submariner", 
    reference: "116610LN",
    serialNumber: "R123456789",
    imageHash: null // will be set after upload
  },
  {
    brand: "Omega",
    model: "Speedmaster", 
    reference: "311.30.42.30",
    serialNumber: "O987654321",
    imageHash: null // will be set after upload
  },
  {
    brand: "TAG Heuer",
    model: "Monaco", 
    reference: "CAW2111",
    serialNumber: "T456789123",
    imageHash: null // will be set after upload
  },
  {
    brand: "Patek Philippe",
    model: "Nautilus", 
    reference: "5711/1A",
    serialNumber: "P789123456",
    imageHash: null // will be set after upload
  },
  {
  brand: "Breitling",
  model: "Navitimer", 
  reference: "AB0121211B1P1",
  serialNumber: "B246810121",
  imageHash: null // will be set after upload
 },
 {
  brand: "Audemars Piguet",
  model: "Royal Oak", 
  reference: "15202ST.OO.1240ST.01",
  serialNumber: "A654321987",
  imageHash: null // will be set after upload
  },
  {
    brand: "Cartier",
    model: "Santos", 
    reference: "WSSA0009",
    serialNumber: "C135792468",
    imageHash: null // will be set after upload
  },
  {
    brand: "Jaeger-LeCoultre",
    model: "Reverso", 
    reference: "Q3978480",
    serialNumber: "J369258147",
    imageHash: null // will be set after upload
  },
  {
    brand: "Vacheron Constantin",
    model: "Overseas", 
    reference: "4500V/110A-B126",
    serialNumber: "V852741963",
    imageHash: null // will be set after upload
  },
  {
    brand: "IWC",
    model: "Pilot's Watch", 
    reference: "IW377709",
    serialNumber: "I741852963",
    imageHash: null // will be set after upload
  }
];

// Function to generate IPFS metadata with serialHash included
export const generateIPFSMetadata = (watch) => {
  // Generate the serial number hash
  const serialHash = keccak256(toBytes(watch.serialNumber));
  
  const metadata = {
    name: `${watch.brand} ${watch.model}`,
    description: `NFT Certificate for ${watch.brand} ${watch.model} ${watch.reference}`,
    attributes: [
      { trait_type: "Brand", value: watch.brand },
      { trait_type: "Model", value: watch.model },
      { trait_type: "Reference", value: watch.reference }
    ],
    // Data needed for the contract
    serialNumber: watch.serialNumber,
    serialHash: serialHash
  };

  // Add image if provided
  if (ipfsImageHash) {
    metadata.image = `ipfs://${ipfsImageHash}`;
  }

  return metadata;
  
};