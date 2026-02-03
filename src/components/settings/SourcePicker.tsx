import { useState } from 'react';

interface Props {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder?: string;
}

export function SourcePicker({ label, items, onAdd, onRemove, placeholder }: Props) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim().toLowerCase();
    if (val && !items.includes(val)) {
      onAdd(val);
      setInput('');
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-pulse/30"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-pulse text-white rounded-md text-xs font-medium"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs text-slate-700 dark:text-slate-300"
            >
              {item}
              <button
                onClick={() => onRemove(item)}
                className="text-slate-400 hover:text-red-500 ml-0.5"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
