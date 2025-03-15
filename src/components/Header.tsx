import { useState, useRef, useEffect } from 'react';
import { saveNickname } from '@/lib/user-id';
import { getInitials } from '@/lib/utils';
import { updateLunchTrain } from '@/lib/lunch-train-service';

interface HeaderProps {
    savedNickname: string | null;
    onNicknameUpdate: (nickname: string) => void;
    currentTrain: { id: string; participants: Array<{ userId: string; nickname: string }> } | null;
    userId: string;
    editingNickname: string;
    setEditingNickname: (nickname: string) => void;
}

export default function Header({ savedNickname, onNicknameUpdate, currentTrain, userId, editingNickname, setEditingNickname }: HeaderProps) {
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdateNickname = async () => {
        if (!editingNickname.trim()) {
            alert('Please enter a nickname');
            return;
        }

        // Update nickname in the current train if user is in one
        if (currentTrain) {
            const updatedParticipants = currentTrain.participants.map(p =>
                p.userId === userId ? { ...p, nickname: editingNickname } : p
            );
            await updateLunchTrain(currentTrain.id, { participants: updatedParticipants });
        }

        saveNickname(editingNickname);
        onNicknameUpdate(editingNickname);
        setIsEditingNickname(false);
        setIsDropdownOpen(false);
    };

    return (
        <header className="container mx-auto px-4 h-16 flex items-center justify-end max-w-4xl" >
            <div className="flex items-center gap-4">
                {savedNickname && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            {getInitials(savedNickname)}
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-4 z-50">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                                        {getInitials(savedNickname)}
                                    </div>
                                    <p className="text-white">Kirjautunut: {savedNickname}</p>
                                </div>
                                {isEditingNickname ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={editingNickname}
                                            onChange={(e) => setEditingNickname(e.target.value)}
                                            className="w-full p-2 rounded bg-gray-700 text-white text-lg font-bold"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdateNickname}
                                                className="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 font-bold"
                                            >
                                                Tallenna
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingNickname(false);
                                                    setEditingNickname(savedNickname);
                                                }}
                                                className="flex-1 bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 font-bold"
                                            >
                                                Peruuta
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingNickname(true)}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-600 font-bold"
                                    >
                                        Muokkaa nimimerkkiä
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
} 