import { useState, useRef, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const COMMON_DESTINATIONS = [
    'Huoltamo',
    'Iso paja',
    'Studio 10',
    'Piccolo',
    'Båx',
    'Akseli',
    'Dylan Luft',
    'Dylan Böle',
];

interface DestinationInputProps {
    value: string;
    onChange: (value: string) => void;
}

export default function DestinationInput({ value, onChange }: DestinationInputProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputFocus = () => {
        if (value.length === 0) {
            setIsDropdownOpen(true);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        if (e.target.value.length === 0) {
            setIsDropdownOpen(true);
        } else {
            setIsDropdownOpen(false);
        }
    };

    const handleDestinationSelect = (destination: string) => {
        onChange(destination);
        setIsDropdownOpen(false);
        inputRef.current?.blur();
    };

    return (
        <div>
            <label className="block mb-1 text-white flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                Minne
            </label>
            <div className="relative" ref={dropdownRef}>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    className="w-full p-3 rounded bg-gray-700 text-white text-lg font-bold"
                    required
                />
                {isDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                        {COMMON_DESTINATIONS.map((destination) => (
                            <button
                                key={destination}
                                type="button"
                                onClick={() => handleDestinationSelect(destination)}
                                className="w-full px-4 py-3 text-left text-white hover:bg-gray-600 font-bold"
                            >
                                {destination}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 
