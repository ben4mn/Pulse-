import { useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ApiKeyManager({ label, value, onChange, placeholder }: Props) {
  const [visible, setVisible] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text.trim());
    } catch {
      // Clipboard denied
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">{label}</label>
      <div className="flex gap-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder={placeholder ?? 'Enter API key'}
          className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-pulse/30"
        />
        <button
          onClick={() => setVisible(!visible)}
          className="px-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
        <button
          onClick={handlePaste}
          className="px-2.5 py-2 bg-pulse text-white rounded-md text-xs font-medium"
        >
          Paste
        </button>
      </div>
    </div>
  );
}
