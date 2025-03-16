import { useState, useRef, useEffect } from 'react';
import { getInitials } from '@/lib/utils';
import { updateLunchTrain } from '@/lib/lunch-train-service';
import { useUserStore } from '@/state/user';
import { UserIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  currentTrain: { id: string; participants: Array<{ userId: string; nickname: string }> } | null;
  loadTrains: () => Promise<void>;
}

export default function Header({ currentTrain, loadTrains }: HeaderProps) {
  const { userId, nickname, setNickname } = useUserStore();
  const [editingNickname, setEditingNickname] = useState(nickname || '');
  const [isEditingNickname, setIsEditingNickname] = useState(!nickname);
  const [isDropdownOpen, setIsDropdownOpen] = useState(!nickname);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update editing state when nickname changes
  useEffect(() => {
    if (!nickname) {
      setIsEditingNickname(true);
      setIsDropdownOpen(true);
    } else {
      setEditingNickname(nickname);
      setIsDropdownOpen(false);
      setIsEditingNickname(false);
    }
  }, [nickname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Only close dropdown if we have a nickname
        if (nickname) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [nickname]);

  const handleUpdateNickname = async () => {
    if (!editingNickname.trim()) {
      alert('Please enter a nickname');
      return;
    }

    setNickname(editingNickname);
    setIsEditingNickname(false);
    setIsDropdownOpen(false);

    // Update nickname in the current train if user is in one
    if (currentTrain) {
      const updatedParticipants = currentTrain.participants.map(p =>
        p.userId === userId ? { ...p, nickname: editingNickname } : p
      );
      await updateLunchTrain(currentTrain.id, { participants: updatedParticipants });
      await loadTrains();
    }


  };

  return (
    <header className="container mx-auto px-4 h-16 flex items-center justify-end w-full max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium hover:bg-gray-500/20"
          >
            {nickname ? (
              getInitials(nickname)
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-4 z-50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full border-2 border-white text-white flex items-center justify-center text-sm font-medium hover:bg-gray-500/20">
                  {nickname ? (
                    getInitials(nickname)
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                </div>
                <p className="text-white">
                  {nickname ? `Kirjautunut: ${nickname}` : 'Aseta nimimerkki'}
                </p>
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
                        setEditingNickname(nickname || '');
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
                  {nickname ? 'Muokkaa nimimerkkiä' : 'Aseta nimimerkki'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
