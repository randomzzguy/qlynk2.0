// Shared layout primitives for every dashboard page, so widths, header
// spacing and card styling line up from page to page.

export const DASHBOARD_CARD = 'rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl';
export const DASHBOARD_BUTTON_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#f46530] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#f46530]/20 transition hover:bg-[#e2582a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
export const DASHBOARD_BUTTON_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export function DashboardPage({ children, className = '' }) {
  return (
    <div className={`mx-auto w-full max-w-[1320px] px-5 py-8 sm:px-7 sm:py-10 lg:px-10 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ icon: Icon, title, description, actions, children }) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-white/[0.07] pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#f46530]/20 bg-[#f46530]/10 text-[#ff8a5f]">
            <Icon size={22} aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-black leading-tight tracking-tight text-white sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-[15px]">{description}</p>}
          {children}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0 lg:justify-end">{actions}</div>}
    </header>
  );
}
