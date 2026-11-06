import { useId } from 'react';

export default function WidgetPreChatForm({
  values = {}, onChange, onSubmit, colors, intro,
  showIntro = true, showEmail = true, requireEmail = false,
  requirePassword = false, showPrivacy = true,
  submitLabel = 'Start chat', error, preview = false,
}) {
  const id = useId();
  const inputStyle = {
    backgroundColor: colors.inputBackgroundColor,
    color: colors.inputTextColor,
    borderColor: colors.inputBorderColor,
    '--tw-ring-color': colors.focusColor,
    '--qlynk-pre-chat-placeholder': colors.placeholderColor,
  };
  const fields = [
    { key: 'name', label: 'Your name', type: 'text', placeholder: 'Your name', autoComplete: 'name', maxLength: 100, required: true },
    ...(showEmail ? [{ key: 'email', label: requireEmail ? 'Email' : 'Email (optional)', type: 'email', placeholder: 'you@example.com', autoComplete: 'email', maxLength: 254, required: requireEmail }] : []),
    ...(requirePassword ? [{ key: 'password', label: 'Access password', type: 'password', placeholder: 'Access password', autoComplete: 'current-password', required: true }] : []),
  ];

  return (
    <form onSubmit={preview ? (event) => event.preventDefault() : onSubmit} className="space-y-3">
      {showIntro && (
        <div className="mb-4">
          <h4 className="text-base font-bold" style={{ color: colors.headingColor }}>Before we start</h4>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: colors.introColor }}>{intro}</p>
        </div>
      )}
      {fields.map(({ key, label, ...attributes }) => (
        <div key={key}>
          <label htmlFor={`${id}-${key}`} className="block text-xs font-semibold mb-1" style={{ color: colors.labelColor }}>{label}</label>
          <input
            {...attributes}
            id={`${id}-${key}`}
            name={key}
            value={values[key] || ''}
            onChange={(event) => onChange?.(key, event.target.value)}
            readOnly={preview}
            tabIndex={preview ? -1 : undefined}
            className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 placeholder:opacity-100 placeholder:text-[color:var(--qlynk-pre-chat-placeholder)]"
            style={inputStyle}
          />
        </div>
      ))}
      {error && <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {showPrivacy && (
        <p className="text-[10px] leading-relaxed" style={{ color: colors.supportingTextColor }}>
          Your details and chat will be shared with the agent owner. <a href="https://www.qlynk.site/privacy" target="_blank" rel="noreferrer" className="underline">Privacy</a>
        </p>
      )}
      <button type="submit" disabled={preview} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ backgroundColor: colors.buttonColor, color: colors.buttonTextColor }}>
        {submitLabel}
      </button>
    </form>
  );
}
