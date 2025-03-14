export interface LunchTrain {
    id: string;
    createdBy: string;
    createdAt: Date;
    destination: string;
    departurePlace: string;
    departureTime: Date;
    participants: Array<{
        userId: string;
        nickname: string;
    }>;
    description?: string;
    status: 'active' | 'completed' | 'cancelled';
}

export interface CreateLunchTrainInput {
    destination: string;
    departurePlace: string;
    departureTime: Date;
    description?: string;
    nickname: string;
} 