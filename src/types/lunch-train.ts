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
    status: 'active' | 'completed' | 'cancelled';
}

export interface CreateLunchTrainInput {
    destination: string;
    departurePlace: string;
    departureTime: Date;
    nickname: string;
} 