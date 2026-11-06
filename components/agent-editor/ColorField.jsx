import { useId } from 'react';

export default function ColorField({
  label,
  value,
  onChange,
  hint,
  placeholder = '#rrggbb or rgba(...)',
}) {
  const id = useId();
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(value || '');
  const rgbHex = rgba ? '#' + rgba.slice(1, 4).map((channel) => Math.min(255, Number(channel)).toString(16).padStart(2, '0')).join('') + (rgba[4] == null ? '' : Math.round(Math.min(1, Number(rgba[4])) * 255).toString(16).padStart(2, '0')) : null;
  const hex = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value || '') ? value : rgbHex || '#000000';
  const opacity = hex.length === 9 ? parseInt(hex.slice(7), 16) : 255;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="flex gap-3 items-center">
        <div className="relative shrink-0">
          <input
            type="color"
            aria-label={`${label} picker`}
            value={hex.substring(0, 7)}
            onChange={(e) => {
              // If the original value had alpha, try to preserve it
              if (hex.length === 9) {
                onChange(e.target.value + hex.substring(7));
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-11 h-11 rounded-xl border border-gray-700/50 bg-gray-900/50 cursor-pointer overflow-hidden p-0.5"
          />
        </div>
        <input
          type="text"
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all font-mono text-sm"
          placeholder={placeholder}
        />
      </div>
      <label className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        Opacity
        <input
          type="range" min="0" max="255" value={opacity}
          aria-label={`${label} opacity`}
          onChange={(event) => onChange(hex.slice(0, 7) + Number(event.target.value).toString(16).padStart(2, '0'))}
          className="min-w-0 flex-1 accent-[#f46530]"
        />
        <span className="w-9 text-right">{Math.round(opacity / 255 * 100)}%</span>
      </label>
    </div>
  );
}
