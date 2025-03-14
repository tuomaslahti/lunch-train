'use client';

import { useState, useEffect } from 'react';
import { LunchTrain, CreateLunchTrainInput } from '@/types/lunch-train';
import {
  createLunchTrain,
  getActiveLunchTrains,
  joinLunchTrain,
  leaveLunchTrain
} from '@/lib/lunch-train-service';
import { getUserInfo, saveNickname } from '@/lib/user-id';

export default function Home() {
  const [trains, setTrains] = useState<LunchTrain[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [joiningTrainId, setJoiningTrainId] = useState<string | null>(null);
  const [joinNickname, setJoinNickname] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [savedNickname, setSavedNickname] = useState<string | null>(null);

  useEffect(() => {
    const { userId, nickname } = getUserInfo();
    setUserId(userId);
    setSavedNickname(nickname);
    if (nickname) {
      setJoinNickname(nickname);
    }
  }, []);

  const getDefaultTime = () => {
    const date = new Date();
    date.setHours(11, 0, 0);
    return date;
  };

  const [newTrain, setNewTrain] = useState<CreateLunchTrainInput>({
    destination: '',
    departurePlace: '',
    departureTime: getDefaultTime(),
    description: '',
    nickname: savedNickname || ''
  });

  useEffect(() => {
    if (userId) {
      loadTrains();
    }
  }, [userId]);

  const loadTrains = async () => {
    const activeTrains = await getActiveLunchTrains();
    setTrains(activeTrains);
  };

  const handleCreateTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    await createLunchTrain(newTrain, userId);
    saveNickname(newTrain.nickname);
    setIsCreating(false);
    setNewTrain({
      destination: '',
      departurePlace: '',
      departureTime: getDefaultTime(),
      description: '',
      nickname: savedNickname || ''
    });
    loadTrains();
  };

  const getCurrentTrain = (): LunchTrain | null => {
    return trains.find(train => isParticipant(train)) || null;
  };

  const handleJoinTrain = async (trainId: string) => {
    if (!userId || !joinNickname.trim()) {
      alert('Please enter your nickname');
      return;
    }

    const currentTrain = getCurrentTrain();
    if (currentTrain) {
      const confirmSwitch = window.confirm(
        `You are already in a train to ${currentTrain.destination}. Do you want to switch to this train?`
      );
      if (!confirmSwitch) {
        return;
      }
      await leaveLunchTrain(currentTrain.id, userId);
    }

    await joinLunchTrain(trainId, userId, joinNickname);
    saveNickname(joinNickname);
    setJoiningTrainId(null);
    loadTrains();
  };

  const handleLeaveTrain = async (trainId: string) => {
    if (!userId) return;
    await leaveLunchTrain(trainId, userId);
    loadTrains();
  };

  const isParticipant = (train: LunchTrain) => {
    return train.participants.some(p => p.userId === userId);
  };

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

  const getInitials = (nickname: string): string => {
    return nickname
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Lunch Train</h1>

      <button
        onClick={() => setIsCreating(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-6 hover:bg-blue-600"
      >
        Create New Lunch Train
      </button>

      {isCreating && (
        <form onSubmit={handleCreateTrain} className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Create New Lunch Train</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Your Nickname</label>
              <input
                type="text"
                value={newTrain.nickname}
                onChange={(e) => setNewTrain({ ...newTrain, nickname: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Enter your nickname"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Destination</label>
              <input
                type="text"
                value={newTrain.destination}
                onChange={(e) => setNewTrain({ ...newTrain, destination: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Departure Place</label>
              <input
                type="text"
                value={newTrain.departurePlace}
                onChange={(e) => setNewTrain({ ...newTrain, departurePlace: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="e.g., Main lobby, Coffee corner, etc."
                required
              />
            </div>
            <div>
              <label className="block mb-1">Departure Time</label>
              <input
                type="time"
                value={formatTimeForInput(newTrain.departureTime)}
                onChange={handleTimeChange}
                className="w-full p-2 border rounded"
                step="300"
                required
                lang="fi"
              />
            </div>
            <div>
              <label className="block mb-1">Description</label>
              <textarea
                value={newTrain.description}
                onChange={(e) => setNewTrain({ ...newTrain, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {trains.map((train) => (
          <div key={train.id} className="border rounded p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {train.departurePlace} → {train.destination}
                </h3>
                <p className="text-gray-600">
                  Created by: {train.participants.find(p => p.userId === train.createdBy)?.nickname}
                </p>
                <p className="text-gray-600">
                  Departure: {new Date(train.departureTime).toLocaleTimeString('fi-FI', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-gray-600">
                  Participants: {train.participants.length}
                </p>
                {train.description && (
                  <p className="text-gray-600 mt-2">{train.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
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
              <div className="flex-shrink-0 w-full sm:w-auto">
                {isParticipant(train) ? (
                  <button
                    onClick={() => handleLeaveTrain(train.id)}
                    className="w-full sm:w-auto bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Leave Train
                  </button>
                ) : (
                  <div>
                    {joiningTrainId === train.id ? (
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                        <input
                          type="text"
                          value={joinNickname}
                          onChange={(e) => setJoinNickname(e.target.value)}
                          className="p-2 border rounded"
                          placeholder="Enter your nickname"
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleJoinTrain(train.id)}
                            className="flex-1 sm:flex-none bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                          >
                            Join
                          </button>
                          <button
                            onClick={() => setJoiningTrainId(null)}
                            className="flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setJoiningTrainId(train.id)}
                        className="w-full sm:w-auto bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Join Train
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
