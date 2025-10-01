const fs = require('fs');
const path = require('path');

// File paths
const DEPLOYED_ADDRESSES_PATH = path.join(__dirname, '../ignition/deployments/chain-11155111/deployed_addresses.json');
const FRONTEND_CONSTANTS_PATH = path.join(__dirname, '../../frontend/constants/index.js');

// Main function
function extractAndUpdateAddress() {
  try {
    // 1. Read the deployed_addresses.json file
    console.log('📖 Reading deployment file...');
    const deployedData = JSON.parse(fs.readFileSync(DEPLOYED_ADDRESSES_PATH, 'utf8'));
    
    // 2. Extract contract address
    const contractAddress = deployedData['WatchfanModule#Watchfan'];
    
    if (!contractAddress) {
      throw new Error('Contract address not found in deployed_addresses.json');
    }
    
    console.log('✅ Contract address extracted:', contractAddress);
    
    // 3. Read current constants file
    console.log('📖 Reading constants file...');
    let constantsContent = fs.readFileSync(FRONTEND_CONSTANTS_PATH, 'utf8');
    
    // 4. Replace Sepolia address using regex
    const sepoliaAddressRegex = /(case 11155111:[\s\S]*?return\s+)"0x[a-fA-F0-9]{40}"/;
    const replacement = `$1"${contractAddress}"`;
    
    constantsContent = constantsContent.replace(sepoliaAddressRegex, replacement);
    
    // 5. Write updated file
    fs.writeFileSync(FRONTEND_CONSTANTS_PATH, constantsContent, 'utf8');
    
    console.log('✅ constants/index.js file updated successfully!');
    console.log('🎯 New Sepolia address:', contractAddress);
    
    return contractAddress;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Execute
if (require.main === module) {
  extractAndUpdateAddress();
}

module.exports = { extractAndUpdateAddress };