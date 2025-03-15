import { NextResponse } from 'next/server';
import { getActiveLunchTrains, createLunchTrain } from '@/lib/lunch-train-service';
import { CreateLunchTrainInput } from '@/types/lunch-train';

export async function GET() {
  try {
    const trains = await getActiveLunchTrains();
    return NextResponse.json(trains);
  } catch (error) {
    console.error('Error fetching trains:', error);
    return NextResponse.json({ error: 'Failed to fetch trains' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { train, userId } = body as { train: CreateLunchTrainInput; userId: string };

    if (!train || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert the departureTime string back to a Date object
    const trainWithDate = {
      ...train,
      departureTime: new Date(train.departureTime),
    };

    const newTrain = await createLunchTrain(trainWithDate, userId);
    return NextResponse.json(newTrain);
  } catch (error) {
    console.error('Error creating train:', error);
    return NextResponse.json({ error: 'Failed to create train' }, { status: 500 });
  }
}
