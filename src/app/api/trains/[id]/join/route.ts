import { NextResponse } from 'next/server';
import { joinLunchTrain } from '@/lib/lunch-train-service';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    const { userId, nickname } = body as { userId: string; nickname: string };

    if (!userId || !nickname) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await joinLunchTrain(id, userId, nickname);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error joining train:', error);
    return NextResponse.json({ error: 'Failed to join train' }, { status: 500 });
  }
}
