import { LunchTrain, CreateLunchTrainInput } from '@/types/lunch-train';

export async function getTrains(): Promise<LunchTrain[]> {
    const response = await fetch('/api/trains');
    if (!response.ok) {
        throw new Error('Failed to fetch trains');
    }
    return response.json();
}

export async function createTrain(train: CreateLunchTrainInput, userId: string): Promise<LunchTrain> {
    const response = await fetch('/api/trains', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ train, userId }),
    });
    if (!response.ok) {
        throw new Error('Failed to create train');
    }
    return response.json();
}

export async function joinTrain(trainId: string, userId: string, nickname: string): Promise<void> {
    const response = await fetch(`/api/trains/${trainId}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, nickname }),
    });
    if (!response.ok) {
        throw new Error('Failed to join train');
    }
}

export async function leaveTrain(trainId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/trains/${trainId}/leave`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
        const error = new Error('Failed to leave train');
        (error as any).response = { status: response.status };
        throw error;
    }
} 