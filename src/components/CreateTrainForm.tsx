import { useRef, useEffect } from 'react';
import { CreateLunchTrainInput } from '@/types/lunch-train';
import { MapPinIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import DestinationInput from './DestinationInput';

interface CreateTrainFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  newTrain: CreateLunchTrainInput;
  setNewTrain: (train: CreateLunchTrainInput) => void;
}

export default function CreateTrainForm({ onSubmit, newTrain, setNewTrain }: CreateTrainFormProps) {
  const departurePlaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (departurePlaceInputRef.current) {
      departurePlaceInputRef.current.focus();
    }
  }, []);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':');
    const newDate = new Date();
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    newDate.setSeconds(0);
    setNewTrain({ ...newTrain, departureTime: newDate });
  };

  const formatTimeForInput = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={onSubmit} className="mb-8 p-4 rounded bg-gray-800 shadow-lg">
      <h2 className="text-3xl font-semibold mb-4 text-white text-center">Luo uusi lounasjuna</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-white flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              Mistä
            </label>
            <input
              ref={departurePlaceInputRef}
              type="text"
              value={newTrain.departurePlace}
              onChange={(e) => setNewTrain({ ...newTrain, departurePlace: e.target.value })}
              className="w-full p-3 rounded bg-gray-700 text-white text-lg font-bold"
              required
            />
          </div>
          <DestinationInput
            value={newTrain.destination}
            onChange={(value) => setNewTrain({ ...newTrain, destination: value })}
          />
        </div>
        <div>
          <label className="block mb-1 text-white flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            Lähtöaika
          </label>
          <input
            type="time"
            value={formatTimeForInput(newTrain.departureTime)}
            onChange={handleTimeChange}
            className="w-full p-3 rounded bg-gray-700 text-white text-lg font-bold"
            step="300"
            required
            lang="fi"
          />
        </div>
        <div>
          <label className="block mb-1 text-white flex items-center gap-1">
            <UserIcon className="w-4 h-4" />
            Nimimerkki
          </label>
          <input
            type="text"
            value={newTrain.nickname}
            onChange={(e) => setNewTrain({ ...newTrain, nickname: e.target.value })}
            className="w-full p-3 rounded bg-gray-700 text-white text-lg font-bold"
            required
          />
        </div>
      </div>

      <div className="relative -mb-11 flex justify-center mt-8">
        <button
          type="submit"
          className="bg-green-500 text-white px-12 py-3 rounded hover:bg-green-600 text-lg font-bold"
        >
          Luo
        </button>
      </div>
    </form>
  );
}
