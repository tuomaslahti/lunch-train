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
    const [isFocused, setIsFocused] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [destinationValue, setDestinationValue] = useState(value);

    useEffect(() => {
        setDestinationValue(value);
    }, [value]);

    useEffect(() => {
        setIsDropdownOpen(isFocused && destinationValue.length === 0);
        onChange(destinationValue);
    }, [destinationValue]);

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
        setIsFocused(true);
        setIsDropdownOpen(true);
    };

    const handleDestinationSelect = (destination: string) => {
        setDestinationValue(destination);
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
                    value={destinationValue}
                    onChange={(e) => setDestinationValue(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={() => setIsFocused(false)}
                    className="w-full p-3 rounded bg-gray-700 text-white text-lg font-bold"
                    required
                />
                {isDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-gray-700 rounded-lg shadow-lg overflow-hidden z-50 mt-2">
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