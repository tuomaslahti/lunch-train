import { useState, useEffect } from 'react';
import { LunchTrain } from '@/types/lunch-train';
import { MapPinIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { getInitials } from '@/lib/utils';
import { useUserStore } from '@/state/user';

interface TrainCardProps {
  train: LunchTrain;
  isParticipant: boolean;
  onJoin: (nickname: string) => void;
  onLeave: () => void;
}

export default function TrainCard({
  train,
  isParticipant,
  onJoin,
  onLeave,
}: TrainCardProps) {
  const { nickname } = useUserStore();
  const [newNickname, setNewNickname] = useState('');
  const [joiningTrainId, setJoiningTrainId] = useState<string | null>(null);
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(false);

  useEffect(() => {
    if (nickname) {
      setNewNickname(nickname);
    }
  }, [nickname]);

  const handleJoin = (newNickname?: string) => {
    if (!nickname && !newNickname && !joiningTrainId) {
      setJoiningTrainId(train.id);
      return;
    }

    if (!nickname && !newNickname?.trim()) {
      alert('Please enter a nickname');
      return;
    }

    onJoin(nickname ?? newNickname!);
    setJoiningTrainId(null);
  };

  return (
    <div
      className={`rounded p-4 bg-gray-800 shadow-lg`}
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
              {joiningTrainId === train.id && !nickname ? (
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="p-2 rounded bg-gray-700 text-white text-base font-bold"
                    placeholder="Kirjoita nimimerkkisi"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoin(newNickname)}
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
                  onClick={() => handleJoin()}
                  className="w-full sm:w-auto bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-base font-bold"
                >
                  Liity junaan
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          <button
            onClick={() => setIsParticipantsExpanded(!isParticipantsExpanded)}
            className="w-full flex items-center justify-between rounded transition-colors"
          >
            <div className="flex flex-wrap gap-2">
              {train.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0"
                    title={participant.nickname}
                  >
                    {getInitials(participant.nickname)}
                  </div>
                </div>
              ))}
            </div>
            {isParticipantsExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-300" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-300" />
            )}
          </button>
          {isParticipantsExpanded && (
            <div className="mt-4 space-y-2">
              {train.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center gap-2 text-white font-medium"
                >
                  <div
                    className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0"
                  >
                    {getInitials(participant.nickname)}
                  </div>
                  {participant.nickname}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
