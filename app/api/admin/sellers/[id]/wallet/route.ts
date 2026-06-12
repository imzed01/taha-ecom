import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Wallet from '@/models/Wallet';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const wallet = await Wallet.findOne({ sellerId: params.id });
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await Wallet.create({
        sellerId: params.id,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
      });
      return NextResponse.json(newWallet);
    }
    
    return NextResponse.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}
