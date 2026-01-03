import React from 'react';

interface SyncInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: () => void; // Used for latency measurement
}

export function SyncInput({ value, onChange, onKeyDown }: SyncInputProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Direct state update -> Triggers HeavyList Render -> Blocks Browser -> Laggy Input
    onChange(e.target.value);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder="Type here (Blocking)..."
      className="w-full p-3 bg-gray-800 border border-red-900/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all font-mono"
    />
  );
}
