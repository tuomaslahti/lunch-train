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
                    backgroundRepeat: 'no-repeat'
                }}
            />

            {/* Semi-transparent overlay */}
            <div
                className="absolute inset-0 w-full h-[700px] bg-black opacity-40"
                aria-hidden="true"
            />

            {/* Content */}
            <div className="relative h-[700px] container mx-auto flex flex-col items-center justify-center px-4 pt-20">
                <h1 className="text-6xl font-bold mb-12 text-center text-white drop-shadow-lg">
                    Lunch Train
                </h1>

                <div className="w-full pb-8">
                    <CreateTrainForm
                        onSubmit={onSubmit}
                        newTrain={newTrain}
                        setNewTrain={setNewTrain}
                    />
                </div>
            </div>
        </div>
    );
} 