'use client';

import { useState, useEffect, Fragment } from 'react';
import { LunchTrain, CreateLunchTrainInput } from '@/types/lunch-train';
import Header from '@/components/Header';
import TrainCard from '@/components/TrainCard';
import { getTrains, createTrain, joinTrain, leaveTrain } from '@/lib/api';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import HeroSection from '@/components/HeroSection';
import { useUserStore } from '@/state/user';

export default function Home() {
  const [trains, setTrains] = useState<LunchTrain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { userId, nickname, setNickname, loadUserInfo } = useUserStore();

  useEffect(() => {
    loadUserInfo();
    if (nickname) {
      setNewTrain((prev) => ({ ...prev, nickname }));
    }
  }, [loadUserInfo, nickname]);

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
        `Olet jo junassa kohteeseen ${currentTrain.destination}. Haluatko poistua siitä ja luoda uuden junan?`
      );
      if (!confirmSwitch) {
        return;
      }
      // Optimistically remove from current train
      setTrains((prevTrains) => {
        if (currentTrain.participants.length === 1) {
          return prevTrains.filter((train) => train.id !== currentTrain.id);
        }
        return prevTrains.map((train) =>
          train.id === currentTrain.id
            ? { ...train, participants: train.participants.filter((p) => p.userId !== userId) }
            : train
        );
      });
    }

    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTrainData: LunchTrain = {
      ...newTrain,
      id: tempId,
      participants: [{ userId, nickname: newTrain.nickname }],
      createdAt: new Date(),
      createdBy: userId,
      status: 'active'
    };

    // Optimistically add new train
    setTrains((prevTrains) => [...prevTrains, newTrainData]);

    try {
      setIsLoading(true);
      if (currentTrain) {
        await leaveTrain(currentTrain.id, userId);
      }
      await createTrain(newTrain, userId);
      setNewTrain({
        departurePlace: '',
        destination: '',
        departureTime: getDefaultTime(),
        nickname: nickname || '',
      });
      // Reload trains to get the real ID and ensure we have the latest state
      await loadTrains();
      setNickname(newTrain.nickname);
    } catch (error) {
      console.error('Error creating train:', error);
      // Revert optimistic updates on error
      setTrains((prevTrains) => {
        const updatedTrains = prevTrains.filter((train) => train.id !== tempId);
        if (currentTrain) {
          return [
            ...updatedTrains,
            {
              ...currentTrain,
              participants: [...currentTrain.participants, { userId, nickname: nickname || '' }],
            },
          ];
        }
        return updatedTrains;
      });
      alert('Junan luominen epäonnistui. Yritä uudelleen.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTrain = (): LunchTrain | null => {
    return (
      trains
        .filter((train) => new Date(train.departureTime) > new Date())
        .find((train) => isParticipant(train)) || null
    );
  };

  const handleJoinTrain = async (trainId: string, newNickname: string) => {
    if (!userId) return;


    const currentTrain = getCurrentTrain();
    if (currentTrain) {
      const confirmSwitch = window.confirm(
        `Olet jo junassa kohteeseen ${currentTrain.destination}. Haluatko vaihtaa tähän junaan?`
      );
      if (!confirmSwitch) {
        return;
      }
    }

    // Optimistically update both trains
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
            participants: [...train.participants, { userId, nickname: newNickname }],
          };
        }
        return train;
      });
      // Filter out null values (removed trains)
      return updatedTrains.filter((train): train is LunchTrain => train !== null);
    });

    try {
      setIsLoading(true);
      // If switching trains, leave the current one first
      if (currentTrain) {
        await leaveTrain(currentTrain.id, userId);
      }
      await joinTrain(trainId, userId, newNickname);
      setNickname(newNickname);
      setNewTrain((prev) => ({ ...prev, nickname: newNickname }));
      // Reload trains to ensure we have the latest state
      await loadTrains();
    } catch (error) {
      console.error('Error joining train:', error);
      // Revert both changes on failure
      setTrains((prevTrains) => {
        const updatedTrains = prevTrains.map((train) => {
          if (train.id === currentTrain?.id) {
            // Restore to current train
            return {
              ...train,
              participants: [...train.participants, { userId, nickname: nickname || '' }],
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
      alert('Junaan liittyminen epäonnistui. Yritä uudelleen.');
    } finally {
      setIsLoading(false);
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
      // Reload trains to ensure we have the latest state
      await loadTrains();
    } catch (error: any) {
      // If the error is 404 (train not found), it means the train was deleted
      // In this case, we want to keep the train removed from the state
      if (error?.response?.status === 404) {
        // Reload trains to ensure we have the latest state
        await loadTrains();
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
              participants: [...train.participants, { userId, nickname: nickname || '' }],
            }
            : train
        );
      });
      alert('Junasta poistuminen epäonnistui. Yritä uudelleen.');
    }
  };

  const isParticipant = (train: LunchTrain) => {
    return train.participants.some((p) => p.userId === userId);
  };

  // Separate trains into upcoming and recently departed
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const upcomingTrains = trains
    .filter(train => new Date(train.departureTime) > now)
    .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

  const recentlyDepartedTrains = trains
    .filter(train => {
      const departureTime = new Date(train.departureTime);
      return departureTime <= now && departureTime >= tenMinutesAgo;
    })
    .sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());

  return (
    <main className="mb-32">
      <div className="container mx-auto">
        <Header
          currentTrain={getCurrentTrain()}
          loadTrains={loadTrains}
        />
      </div>

      <HeroSection onSubmit={handleCreateTrain} newTrain={newTrain} setNewTrain={setNewTrain} />
      {isLoading && isInitialLoad ? (
        <div className="flex justify-center py-8">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 mt-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl pb-8">
              <h2 className="text-2xl font-semibold mb-4">Seuraavat lähdöt</h2>
              <div className="grid gap-4">
                {upcomingTrains.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">Ei tulevia lähtöjä</div>
                ) : (
                  upcomingTrains.map((train) => (
                    <Fragment key={train.id}>
                      <TrainCard
                        train={train}
                        isParticipant={isParticipant(train)}
                        onJoin={(newNickname: string) => handleJoinTrain(train.id, newNickname)}
                        onLeave={() => handleLeaveTrain(train.id)}
                      />
                    </Fragment>
                  ))
                )}
              </div>
            </div>
          </div>

          {recentlyDepartedTrains.length > 0 && (
            <div className="container mx-auto px-4 mt-8 flex flex-col items-center justify-center">
              <div className="w-full max-w-4xl pb-8">
                <h2 className="text-2xl font-semibold mb-4">Näihin vielä ehtii</h2>
                <div className="grid gap-4">
                  {recentlyDepartedTrains.map((train) => (
                    <Fragment key={train.id}>
                      <TrainCard
                        train={train}
                        isParticipant={isParticipant(train)}
                        onJoin={(newNickname: string) => handleJoinTrain(train.id, newNickname)}
                        onLeave={() => handleLeaveTrain(train.id)}
                      />
                    </Fragment>
                  ))
                  }
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
