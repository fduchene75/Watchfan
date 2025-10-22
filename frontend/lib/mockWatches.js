// Instead of a manufacturer API to retrieve watch data via QR code, we use mock data

import { keccak256, toBytes } from 'viem';

// Mock watch data
export const mockWatches = [
  {
    brand: "Rolex",
    model: "Submariner", 
    reference: "116610LN",
    serialNumber: "R123456789",
    imagePath: "/watches/RolexSubmariner.png"
  },
  {
    brand: "Omega",
    model: "Speedmaster", 
    reference: "311.30.42.30",
    serialNumber: "O987654321",
    imagePath: "/watches/OmegaSpeedmaster.png"
  },
  {
    brand: "TAG Heuer",
    model: "Monaco", 
    reference: "CAW2111",
    serialNumber: "T456789123",
    imagePath: "/watches/TagHeuerMonaco.png"
  },
  {
    brand: "Patek Philippe",
    model: "Nautilus", 
    reference: "5711/1A",
    serialNumber: "P789123456",
    imagePath: "/watches/PatekPhilippeNautilus.png"
  },
  {
    brand: "Breitling",
    model: "Navitimer", 
    reference: "AB0121211B1P1",
    serialNumber: "B246810121",
    imagePath: "/watches/BreitlingNavitimer.png"
  },
  {
    brand: "Audemars Piguet",
    model: "Royal Oak", 
    reference: "15202ST.OO.1240ST.01",
    serialNumber: "A654321987",
    imagePath: "/watches/AudemarsPiguetRoyalOak.png"
  },
  {
    brand: "Cartier",
    model: "Santos", 
    reference: "WSSA0009",
    serialNumber: "C135792468",
    imagePath: "/watches/CartierSantos.png"
  },
  {
    brand: "Jaeger-LeCoultre",
    model: "Reverso", 
    reference: "Q3978480",
    serialNumber: "J369258147",
    imagePath: "/watches/JaegerLecoultreReverso.png"
  },
  {
    brand: "Vacheron Constantin",
    model: "Overseas", 
    reference: "4500V/110A-B126",
    serialNumber: "V852741963",
    imagePath: "/watches/VacheronConstantinOverseas.png"
  },
  {
    brand: "IWC",
    model: "Pilot's Watch", 
    reference: "IW377709",
    serialNumber: "I741852963",
    imagePath: "/watches/IWCPilotWatch.png"
  }
];

/**
 * Generate IPFS metadata with serialHash included
 * @param {Object} watch - Watch object from mockWatches
 * @returns {Object} Metadata object (image will be added during IPFS upload)
 */
export const generateIPFSMetadata = (watch) => {
  // Generate the serial number hash
  const serialHash = keccak256(toBytes(watch.serialNumber));
  
  return {
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
};