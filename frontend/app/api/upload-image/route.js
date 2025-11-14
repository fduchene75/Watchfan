import { NextResponse } from 'next/server';
import { PinataSDK } from 'pinata-web3';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📤 Uploading image to IPFS:', file.name);

    // Upload to IPFS via Pinata
    const result = await pinata.upload.file(file);

    console.log('✅ Image uploaded to IPFS:', result.IpfsHash);

    return NextResponse.json({
      success: true,
      ipfsHash: result.IpfsHash,
      ipfsUrl: `${process.env.PINATA_GATEWAY}/ipfs/${result.IpfsHash}`
    });

  } catch (error) {
    console.error('❌ Error uploading image to IPFS:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}