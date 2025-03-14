'use client';

import { useState, useEffect, useRef } from 'react';
import { LunchTrain, CreateLunchTrainInput } from '@/types/lunch-train';
import { getUserInfo, saveNickname } from '@/lib/user-id';
import Header from '@/components/Header';
import { getInitials } from '@/lib/utils';
import { getTrains, createTrain, joinTrain, leaveTrain } from '@/lib/api';
import {
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PlusCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const [trains, setTrains] = useState<LunchTrain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [joiningTrainId, setJoiningTrainId] = useState<string | null>(null);
  const [joinNickname, setJoinNickname] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editingNickname, setEditingNickname] = useState('');
  const departurePlaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { userId, nickname } = getUserInfo();
    setUserId(userId);
    setSavedNickname(nickname);
    if (nickname) {
      setJoinNickname(nickname);
      setNewTrain(prev => ({ ...prev, nickname }));
      setEditingNickname(nickname);
    }
  }, []);

  useEffect(() => {
    if (isCreating && departurePlaceInputRef.current) {
      departurePlaceInputRef.current.focus();
    }
  }, [isCreating]);

  const getDefaultTime = () => {
    const date = new Date();
    const minutes = date.getMinutes();
    const nextHalfHour = minutes < 30 ? 30 : 60;
    date.setMinutes(nextHalfHour);
    date.setSeconds(0);
    return date;
  };

  const [newTrain, setNewTrain] = useState<CreateLunchTrainInput>({
    destination: '',
    departurePlace: '',
    departureTime: getDefaultTime(),
    nickname: ''
  });

  useEffect(() => {
    if (userId) {
      loadTrains();
    }
  }, [userId]);

  const loadTrains = async () => {
    setIsLoading(true);
    try {
      const activeTrains = await getTrains();
      setTrains(activeTrains);
    } catch (error) {
      console.error('Failed to load trains:', error);
      alert('Failed to load trains. Please refresh the page.');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const handleCreateTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const currentTrain = getCurrentTrain();
    if (currentTrain) {
      const confirmSwitch = window.confirm(
        `You are already in a train to ${currentTrain.destination}. Do you want to leave it and create a new train?`
      );
      if (!confirmSwitch) {
        return;
      }
      await leaveTrain(currentTrain.id, userId);
    }

    try {
      await createTrain(newTrain, userId);
      saveNickname(newTrain.nickname);
      setSavedNickname(newTrain.nickname);
      setEditingNickname(newTrain.nickname);
      setIsCreating(false);
      setNewTrain({
        destination: '',
        departurePlace: '',
        departureTime: getDefaultTime(),
        nickname: newTrain.nickname
      });
      loadTrains();
    } catch (error) {
      console.error('Failed to create train:', error);
      alert('Failed to create train. Please try again.');
    }
  };

  const getCurrentTrain = (): LunchTrain | null => {
    return trains
      .filter(train => new Date(train.departureTime) > new Date())
      .find(train => isParticipant(train)) || null;
  };

  const handleJoinTrain = async (trainId: string) => {
    if (!userId) return;

    // If we have a saved nickname, use it directly
    const nicknameToUse = savedNickname || joinNickname;
    if (!nicknameToUse.trim()) {
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
    }

    // Optimistically update both trains at once
    setTrains(prevTrains => {
      const updatedTrains = prevTrains.map(train => {
        if (train.id === currentTrain?.id) {
          // If user is the last participant, remove the entire train
          if (train.participants.length === 1) {
            return null;
          }
          // Otherwise just remove the user from participants
          return { ...train, participants: train.participants.filter(p => p.userId !== userId) };
        }
        if (train.id === trainId) {
          // Add to new train
          return { ...train, participants: [...train.participants, { userId, nickname: nicknameToUse }] };
        }
        return train;
      });
      // Filter out null values (removed trains)
      return updatedTrains.filter((train): train is LunchTrain => train !== null);
    });

    try {
      // If switching trains, leave the current one first
      if (currentTrain) {
        await leaveTrain(currentTrain.id, userId);
      }

      // Join the new train
      await joinTrain(trainId, userId, nicknameToUse);
      saveNickname(nicknameToUse);
      setSavedNickname(nicknameToUse);
      setEditingNickname(nicknameToUse);
      setNewTrain(prev => ({ ...prev, nickname: nicknameToUse }));
      setJoiningTrainId(null);
      // Reload trains to ensure we have the latest state
      loadTrains();
    } catch (error) {
      // Revert both changes on failure
      setTrains(prevTrains => {
        const updatedTrains = prevTrains.map(train => {
          if (train.id === currentTrain?.id) {
            // Restore to current train
            return { ...train, participants: [...train.participants, { userId, nickname: savedNickname || '' }] };
          }
          if (train.id === trainId) {
            // Remove from new train
            return { ...train, participants: train.participants.filter(p => p.userId !== userId) };
          }
          return train;
        });
        // If current train was removed, add it back
        if (currentTrain && !updatedTrains.find(train => train.id === currentTrain.id)) {
          return [...updatedTrains, currentTrain];
        }
        return updatedTrains;
      });
      alert('Failed to update train. Please try again.');
    }
  };

  const handleLeaveTrain = async (trainId: string) => {
    if (!userId) return;

    // Find the train to check if user is the last participant
    const trainToLeave = trains.find(train => train.id === trainId);
    if (!trainToLeave) return;

    // Optimistically leave train
    setTrains(prevTrains => {
      // If user is the last participant, remove the entire train
      if (trainToLeave.participants.length === 1) {
        return prevTrains.filter(train => train.id !== trainId);
      }
      // Otherwise just remove the user from participants
      return prevTrains.map(train =>
        train.id === trainId
          ? { ...train, participants: train.participants.filter(p => p.userId !== userId) }
          : train
      );
    });

    try {
      await leaveTrain(trainId, userId);
      // Keep the savedNickname state up to date
      const { nickname } = getUserInfo();
      setSavedNickname(nickname);
      // Reload trains to ensure we have the latest state
      loadTrains();
    } catch (error: any) {
      // If the error is 404 (train not found), it means the train was deleted
      // In this case, we want to keep the train removed from the state
      if (error?.response?.status === 404) {
        // Reload trains to ensure we have the latest state
        loadTrains();
        return;
      }

      // For other errors, revert the changes
      setTrains(prevTrains => {
        // If the train was removed, add it back with the user
        if (!prevTrains.find(train => train.id === trainId)) {
          return [...prevTrains, trainToLeave];
        }
        // Otherwise restore the user to participants
        return prevTrains.map(train =>
          train.id === trainId
            ? { ...train, participants: [...train.participants, { userId, nickname: savedNickname || '' }] }
            : train
        );
      });
      alert('Failed to leave the train. Please try again.');
    }
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

  const isDepartingSoon = (departureTime: Date) => {
    const now = new Date();
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
    return new Date(departureTime).getTime() - now.getTime() <= fifteenMinutes;
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <Header
        savedNickname={savedNickname}
        onNicknameUpdate={(nickname) => {
          setSavedNickname(nickname);
          setEditingNickname(nickname);
          setNewTrain(prev => ({ ...prev, nickname }));
          loadTrains();
        }}
        currentTrain={getCurrentTrain()}
        userId={userId}
        editingNickname={editingNickname}
        setEditingNickname={setEditingNickname}
      />
      <h1 className="text-6xl font-bold mb-8 text-center">Lunch Train</h1>

      {!isCreating && (
        <div className="rounded p-4 bg-gray-800 shadow-lg mb-6">
          <div className="flex justify-center">
            <button
              onClick={() => setIsCreating(true)}
              className="bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 text-lg flex items-center gap-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Create New Lunch Train
            </button>
          </div>
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreateTrain} className="mb-8 p-4 rounded bg-gray-800 shadow-lg">
          <h2 className="text-3xl font-semibold mb-4 text-white text-center">Create New Lunch Train</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-white flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  From
                </label>
                <input
                  ref={departurePlaceInputRef}
                  type="text"
                  value={newTrain.departurePlace}
                  onChange={(e) => setNewTrain({ ...newTrain, departurePlace: e.target.value })}
                  className="w-full p-3 rounded bg-gray-700 text-white text-lg"
                  placeholder="e.g., Main lobby, Coffee corner, etc."
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-white flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  To
                </label>
                <input
                  type="text"
                  value={newTrain.destination}
                  onChange={(e) => setNewTrain({ ...newTrain, destination: e.target.value })}
                  className="w-full p-3 rounded bg-gray-700 text-white text-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-white flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                Departure Time
              </label>
              <input
                type="time"
                value={formatTimeForInput(newTrain.departureTime)}
                onChange={handleTimeChange}
                className="w-full p-3 rounded bg-gray-700 text-white text-lg"
                step="300"
                required
                lang="fi"
              />
            </div>
            <div>
              <label className="block mb-1 text-white flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                Your Nickname
              </label>
              <input
                type="text"
                value={newTrain.nickname}
                onChange={(e) => setNewTrain(prev => ({ ...prev, nickname: e.target.value }))}
                className="w-full p-3 rounded bg-gray-700 text-white text-lg"
                placeholder="Enter your nickname"
                required
              />
            </div>
            <div className="flex gap-2 justify-center">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600 text-lg"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-gray-500 text-white px-4 py-3 rounded hover:bg-gray-600 text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <h2 className="text-2xl font-semibold mb-4">Next departures</h2>
      <div className="grid gap-4">
        {isLoading && isInitialLoad ? (
          <div className="flex justify-center py-8">
            <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : trains
          .filter(train => new Date(train.departureTime) > new Date())
          .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
          .length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No upcoming departures
          </div>
        ) : (
          trains
            .filter(train => new Date(train.departureTime) > new Date())
            .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
            .map((train) => (
              <div
                key={train.id}
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
                    {isParticipant(train) ? (
                      <button
                        onClick={() => handleLeaveTrain(train.id)}
                        className="w-full sm:w-auto bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-base"
                      >
                        Leave Train
                      </button>
                    ) : (
                      <div>
                        {joiningTrainId === train.id && !savedNickname ? (
                          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <input
                              type="text"
                              value={joinNickname}
                              onChange={(e) => setJoinNickname(e.target.value)}
                              className="p-2 rounded bg-gray-700 text-white text-base"
                              placeholder="Enter your nickname"
                              required
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleJoinTrain(train.id)}
                                className="flex-1 sm:flex-none bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-base"
                              >
                                Join
                              </button>
                              <button
                                onClick={() => setJoiningTrainId(null)}
                                className="flex-1 sm:flex-none bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-base"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => savedNickname ? handleJoinTrain(train.id) : setJoiningTrainId(train.id)}
                            className="w-full sm:w-auto bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 text-base"
                          >
                            Join Train
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
            ))
        )}
      </div>
    </main>
  );
}
