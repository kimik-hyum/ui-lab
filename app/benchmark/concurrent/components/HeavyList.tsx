import React, { memo } from 'react';
import { slowDown } from '../utils';

interface HeavyListProps {
  items: { id: number; text: string }[];
  query: string;
}

const HeavyList = memo(function HeavyList({ items, query }: HeavyListProps) {
  // Filter items based on query
  // Filtering 10,000 items is fast, but rendering them is slow.
  const filteredItems = items.filter(item => 
    item.text.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ul className="space-y-1">
      {filteredItems.length === 0 ? (
        <li className="text-gray-500 p-2">No matches found</li>
      ) : (
        filteredItems.map((item) => (
          <ExpensiveItem key={item.id} text={item.text} />
        ))
      )}
    </ul>
  );
});

// A component that is "naturally" expensive to render
// It performs some math operations and renders multiple DOM nodes
function ExpensiveItem({ text }: { text: string }) {
    // Artificial computational load that simulates complex business logic
    // e.g., cryptographic formatting, heavy date manipulation, etc.
    const seed = text.charCodeAt(0);
    
    // Perform some heavy math per item (Natural CPU load)
    // 5000 items * 500 iterations = 2.5 million operations per render
    let calculatedValue = 0;
    for (let i = 0; i < 500; i++) {
        calculatedValue += Math.sqrt(i * seed) * Math.tan(i);
    }

    return (
        <li className="p-2 bg-gray-900 border border-gray-800 rounded text-sm text-gray-300 flex justify-between">
            <span>{text}</span>
            <span className="text-[10px] text-gray-600 font-mono">
                {calculatedValue.toFixed(2).slice(-4)}
            </span>
        </li>
    );
}

export default HeavyList;
