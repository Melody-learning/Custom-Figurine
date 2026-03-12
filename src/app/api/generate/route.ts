import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required for generation' },
        { status: 400 }
      );
    }

    // 1. Simulate the aggressive 3-second backend locking time for AI Model generation
    // This provides the user with the realistic latency of Replicate/Stability APIs
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 2. Return the fixed static high-quality 3D mock image
    // In Phase 2, this will be replaced with the actual webhook result from the cloud AI
    return NextResponse.json({
      status: 'success',
      resultUrl: '/images/mock-3d-result.png',
    });
  } catch (error) {
    console.error('Error in mock AI generation:', error);
    return NextResponse.json(
      { error: 'Failed to process AI generation request' },
      { status: 500 }
    );
  }
}
