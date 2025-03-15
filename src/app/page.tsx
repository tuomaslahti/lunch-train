'use client';

import { useState, useEffect, Fragment } from 'react';
import { LunchTrain, CreateLunchTrainInput } from '@/types/lunch-train';
import { getUserInfo, saveNickname } from '@/lib/user-id';
import Header from '@/components/Header';
import CreateTrainForm from '@/components/CreateTrainForm';
import TrainCard from '@/components/TrainCard';
import { getTrains, createTrain, joinTrain, leaveTrain } from '@/lib/api';
import { PlusCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import HeroSection from '@/components/HeroSection';

export default function Home() {
  const [trains, setTrains] = useState<LunchTrain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [joiningTrainId, setJoiningTrainId] = useState<string | null>(null);
  const [joinNickname, setJoinNickname] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editingNickname, setEditingNickname] = useState('');

  useEffect(() => {
    const { userId, nickname } = getUserInfo();
    setUserId(userId);
    setSavedNickname(nickname);
    if (nickname) {
      setJoinNickname(nickname);
      setNewTrain((prev) => ({ ...prev, nickname }));
      setEditingNickname(nickname);
    }
  }, []);

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
    nickname: '',
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
      setNewTrain({
        destination: '',
        departurePlace: '',
        departureTime: getDefaultTime(),
        nickname: newTrain.nickname,
      });
      loadTrains();
    } catch (error) {
      console.error('Failed to create train:', error);
      alert('Failed to create train. Please try again.');
    }
  };

  const getCurrentTrain = (): LunchTrain | null => {
    return (
      trains
        .filter((train) => new Date(train.departureTime) > new Date())
        .find((train) => isParticipant(train)) || null
    );
  };

  const handleJoinTrain = async (trainId: string) => {
    if (!userId) {
      setJoiningTrainId(trainId);
      return;
    }

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
    setTrains((prevTrains) => {
      const updatedTrains = prevTrains.map((train) => {
        if (train.id === currentTrain?.id) {
          // If user is the last participant, remove the entire train
          if (train.participants.length === 1) {
            return null;
          }
          // Otherwise just remove the user from participants
          return { ...train, participants: train.participants.filter((p) => p.userId !== userId) };
        }
        if (train.id === trainId) {
          // Add to new train
          return {
            ...train,
            participants: [...train.participants, { userId, nickname: nicknameToUse }],
          };
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
      setNewTrain((prev) => ({ ...prev, nickname: nicknameToUse }));
      setJoiningTrainId(null);
      // Reload trains to ensure we have the latest state
      loadTrains();
    } catch (error) {
      // Revert both changes on failure
      setTrains((prevTrains) => {
        const updatedTrains = prevTrains.map((train) => {
          if (train.id === currentTrain?.id) {
            // Restore to current train
            return {
              ...train,
              participants: [...train.participants, { userId, nickname: savedNickname || '' }],
            };
          }
          if (train.id === trainId) {
            // Remove from new train
            return {
              ...train,
              participants: train.participants.filter((p) => p.userId !== userId),
            };
          }
          return train;
        });
        // If current train was removed, add it back
        if (currentTrain && !updatedTrains.find((train) => train.id === currentTrain.id)) {
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
    const trainToLeave = trains.find((train) => train.id === trainId);
    if (!trainToLeave) return;

    // Optimistically leave train
    setTrains((prevTrains) => {
      // If user is the last participant, remove the entire train
      if (trainToLeave.participants.length === 1) {
        return prevTrains.filter((train) => train.id !== trainId);
      }
      // Otherwise just remove the user from participants
      return prevTrains.map((train) =>
        train.id === trainId
          ? { ...train, participants: train.participants.filter((p) => p.userId !== userId) }
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
      setTrains((prevTrains) => {
        // If the train was removed, add it back with the user
        if (!prevTrains.find((train) => train.id === trainId)) {
          return [...prevTrains, trainToLeave];
        }
        // Otherwise restore the user to participants
        return prevTrains.map((train) =>
          train.id === trainId
            ? {
                ...train,
                participants: [...train.participants, { userId, nickname: savedNickname || '' }],
              }
            : train
        );
      });
      alert('Failed to leave the train. Please try again.');
    }
  };

  const isParticipant = (train: LunchTrain) => {
    return train.participants.some((p) => p.userId === userId);
  };

  const activeTrains = trains
    .filter((train) => new Date(train.departureTime) > new Date())
    .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

  return (
    <main className="mb-32">
      <div className="container mx-auto">
        <Header
          savedNickname={savedNickname}
          onNicknameUpdate={(nickname) => {
            setSavedNickname(nickname);
            setEditingNickname(nickname);
            setNewTrain((prev) => ({ ...prev, nickname }));
            loadTrains();
          }}
          currentTrain={getCurrentTrain()}
          userId={userId}
          editingNickname={editingNickname}
          setEditingNickname={setEditingNickname}
        />
      </div>

      <HeroSection onSubmit={handleCreateTrain} newTrain={newTrain} setNewTrain={setNewTrain} />

      <div className="container mx-auto px-4 mt-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl pb-8">
          <h2 className="text-2xl font-semibold mb-4">Seuraavat lähdöt</h2>
          <div className="grid gap-4">
            {isLoading && isInitialLoad ? (
              <div className="flex justify-center py-8">
                <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : activeTrains.length === 0 ? (
              <div className="text-gray-400 text-center py-8">Ei tulevia lähtöjä</div>
            ) : (
              activeTrains.map((train) => (
                <Fragment key={train.id}>
                  <TrainCard
                    train={train}
                    isParticipant={isParticipant(train)}
                    onJoin={() => handleJoinTrain(train.id)}
                    onLeave={() => handleLeaveTrain(train.id)}
                    joiningTrainId={joiningTrainId}
                    savedNickname={savedNickname}
                    joinNickname={joinNickname}
                    setJoinNickname={setJoinNickname}
                    setJoiningTrainId={setJoiningTrainId}
                  />
                </Fragment>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
