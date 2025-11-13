import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata-web3';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY
});

export async function POST(request: NextRequest) {
  try {
    const metadata = await request.json();

    if (!metadata || !metadata.name) {
      return NextResponse.json(
        { error: 'Invalid metadata provided' },
        { status: 400 }
      );
    }

    console.log('📤 Uploading metadata to IPFS:', metadata.name);

    // Upload metadata JSON to IPFS via Pinata
    const result = await pinata.upload.json(metadata);

    console.log('✅ Metadata uploaded to IPFS:', result.IpfsHash);

    return NextResponse.json({
      success: true,
      ipfsHash: result.IpfsHash,
      ipfsUri: `ipfs://${result.IpfsHash}`,
      pinataUrl: `${process.env.PINATA_GATEWAY}/ipfs/${result.IpfsHash}`
    });

  } catch (error) {
    console.error('❌ Error uploading metadata to IPFS:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}