import React, { useTransition, useState } from 'react';

interface ConcurrentInputProps {
  value: string; // This is the "List" query value
  setQuery: (value: string) => void;
  onKeyDown: () => void;
}

export function ConcurrentInput({ value, setQuery, onKeyDown }: ConcurrentInputProps) {
  // Internal state for immediate feedback
  const [inputValue, setInputValue] = useState(value);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 1. High Priority: Update input display immediately
    setInputValue(newValue);

    // 2. Low Priority: Update the Heavy List in background
    startTransition(() => {
      setQuery(newValue);
    });
  };

  return (
    <div className="relative">
        <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder="Type here (Concurrent)..."
        className="w-full p-3 bg-gray-800 border border-emerald-900/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
        />
        {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )}
    </div>
  );
}
