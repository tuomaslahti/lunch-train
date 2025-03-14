import { NextResponse } from 'next/server';
import { leaveLunchTrain } from '@/lib/lunch-train-service';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { userId } = body as { userId: string };

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const wasDeleted = await leaveLunchTrain(params.id, userId);
        if (wasDeleted) {
            return new NextResponse(null, { status: 204 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error leaving train:', error);
        return NextResponse.json(
            { error: 'Failed to leave train' },
            { status: 500 }
        );
    }
} 