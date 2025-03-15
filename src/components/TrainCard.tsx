import { LunchTrain } from '@/types/lunch-train';
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getInitials } from '@/lib/utils';

interface TrainCardProps {
    train: LunchTrain;
    isParticipant: boolean;
    onJoin: () => void;
    onLeave: () => void;
    joiningTrainId: string | null;
    savedNickname: string | null;
    joinNickname: string;
    setJoinNickname: (nickname: string) => void;
    setJoiningTrainId: (id: string | null) => void;
}

export default function TrainCard({
    train,
    isParticipant,
    onJoin,
    onLeave,
    joiningTrainId,
    savedNickname,
    joinNickname,
    setJoinNickname,
    setJoiningTrainId
}: TrainCardProps) {
    const isDepartingSoon = (departureTime: Date) => {
        const now = new Date();
        const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
        return new Date(departureTime).getTime() - now.getTime() <= fifteenMinutes;
    };

    return (
        <div
            className={`rounded p-4 bg-gray-800 ${isDepartingSoon(new Date(train.departureTime))
                ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'shadow-lg'
                }`}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-2xl font-semibold text-white leading-none flex items-center gap-2">
                            <MapPinIcon className="w-5 h-5" />
                            {train.departurePlace} → {train.destination}
                        </h3>
                        <span className="text-gray-300 text-base flex items-center gap-1">
                            <ClockIcon className="w-5 h-5" />
                            {new Date(train.departureTime).toLocaleTimeString('fi-FI', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                    {isParticipant ? (
                        <button
                            onClick={onLeave}
                            className="w-full sm:w-auto bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-base font-bold"
                        >
                            Poistu junasta
                        </button>
                    ) : (
                        <div>
                            {joiningTrainId === train.id && !savedNickname ? (
                                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                    <input
                                        type="text"
                                        value={joinNickname}
                                        onChange={(e) => setJoinNickname(e.target.value)}
                                        className="p-2 rounded bg-gray-700 text-white text-base font-bold"
                                        placeholder="Kirjoita nimimerkkisi"
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onJoin}
                                            className="flex-1 sm:flex-none bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-base font-bold"
                                        >
                                            Liity
                                        </button>
                                        <button
                                            onClick={() => setJoiningTrainId(null)}
                                            className="flex-1 sm:flex-none bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-base font-bold"
                                        >
                                            Peruuta
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={onJoin}
                                    className="w-full sm:w-auto bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-base font-bold"
                                >
                                    Liity junaan
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {train.participants.map((participant) => (
                        <div
                            key={participant.userId}
                            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium"
                            title={participant.nickname}
                        >
                            {getInitials(participant.nickname)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 