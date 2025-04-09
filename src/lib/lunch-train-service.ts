import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { LunchTrain, CreateLunchTrainInput } from '@/types/lunch-train';

const COLLECTION_NAME = 'lunchTrains';

export const createLunchTrain = async (
  input: CreateLunchTrainInput,
  userId: string
): Promise<LunchTrain> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...input,
    createdBy: userId,
    createdAt: Timestamp.now(),
    participants: [
      {
        userId,
        nickname: input.nickname,
      },
    ],
    status: 'active',
  });

  return {
    id: docRef.id,
    ...input,
    createdBy: userId,
    createdAt: new Date(),
    participants: [
      {
        userId,
        nickname: input.nickname,
      },
    ],
    status: 'active',
  };
};

export const getActiveLunchTrains = async (): Promise<LunchTrain[]> => {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const q = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', 'active'),
    where('departureTime', '>=', Timestamp.fromDate(tenMinutesAgo)),
    where('departureTime', '<', Timestamp.fromDate(endOfDay)),
    orderBy('departureTime', 'asc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    departureTime: doc.data().departureTime.toDate(),
  })) as LunchTrain[];
};

export const joinLunchTrain = async (
  trainId: string,
  userId: string,
  nickname: string
): Promise<void> => {
  const trainRef = doc(db, COLLECTION_NAME, trainId);
  await updateDoc(trainRef, {
    participants: arrayUnion({
      userId,
      nickname,
    }),
  });
};

export const leaveLunchTrain = async (trainId: string, userId: string): Promise<void> => {
  const trainRef = doc(db, COLLECTION_NAME, trainId);
  const trainDoc = await getDoc(trainRef);
  if (!trainDoc.exists()) return;

  const train = trainDoc.data() as LunchTrain;
  const participant = train.participants.find((p) => p.userId === userId);
  if (!participant) return;

  // If this is the last participant, delete the train
  if (train.participants.length === 1) {
    await deleteDoc(trainRef);
  } else {
    await updateDoc(trainRef, {
      participants: arrayRemove(participant),
    });
  }
};

export const completeLunchTrain = async (trainId: string): Promise<void> => {
  const trainRef = doc(db, COLLECTION_NAME, trainId);
  await updateDoc(trainRef, {
    status: 'completed',
  });
};

export const cancelLunchTrain = async (trainId: string): Promise<void> => {
  const trainRef = doc(db, COLLECTION_NAME, trainId);
  await updateDoc(trainRef, {
    status: 'cancelled',
  });
};

export const updateLunchTrain = async (
  trainId: string,
  updates: Partial<LunchTrain>
): Promise<void> => {
  const trainRef = doc(db, COLLECTION_NAME, trainId);
  await updateDoc(trainRef, updates);
};
