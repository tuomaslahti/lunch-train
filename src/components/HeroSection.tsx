import { CreateLunchTrainInput } from '@/types/lunch-train';
import CreateTrainForm from './CreateTrainForm';

interface HeroSectionProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  newTrain: CreateLunchTrainInput;
  setNewTrain: (train: CreateLunchTrainInput) => void;
}

export default function HeroSection({ onSubmit, newTrain, setNewTrain }: HeroSectionProps) {
  return (
    <div className="relative w-full">
      {/* Hero image container */}
      <div
        className="absolute inset-0 w-full h-[700px]"
        style={{
          backgroundImage: 'url("/hero-train.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 w-full h-[700px] bg-black opacity-40" aria-hidden="true" />

      {/* Content */}
      <div className="relative h-[700px] container mx-auto flex flex-col items-center justify-center px-4 pt-20">
        <div className="relative">
          <h1 className="text-6xl font-bold mb-12 text-center text-white drop-shadow-lg">
            Lounasjunailija
          </h1>
          <span
            className="absolute -top-1 -right-6 text-sm font-medium text-white bg-green-500 px-2 py-0.5 rounded transform rotate-[20deg]"
            style={{ fontSize: '0.875rem' }}
          >
            beta
          </span>
        </div>

        <div className="w-full max-w-4xl pb-8">
          <CreateTrainForm onSubmit={onSubmit} newTrain={newTrain} setNewTrain={setNewTrain} />
        </div>
      </div>
    </div>
  );
}
