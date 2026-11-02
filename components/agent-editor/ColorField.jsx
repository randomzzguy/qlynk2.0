export default function ColorField({
  label,
  value,
  onChange,
  hint
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div className="flex gap-3 items-center">
        <div className="relative">
          <input
            type="color"
            value={value?.length === 9 ? value.substring(0, 7) : (value || '#000000')}
            onChange={(e) => {
              // If the original value had alpha, try to preserve it
              if (value?.length === 9) {
                onChange(e.target.value + value.substring(7));
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-11 h-11 rounded-xl border border-gray-700/50 bg-gray-900/50 cursor-pointer overflow-hidden p-0.5"
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f46530]/50 focus:bg-gray-900 transition-all font-mono text-sm"
          placeholder="#rrggbb or rgba(...)"
        />
      </div>
    </div>
  );
}
