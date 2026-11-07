'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  X,
  Home,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Palette,
  SlidersHorizontal,
  CreditCard,
  ExternalLink,
  Sparkles,
  Clock,
  Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navGroups = [
  {
    title: 'General',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Overview', tourKey: 'overview' },
    ]
  },
  {
    title: 'Agent Workspace',
    items: [
      { href: '/dashboard/agent?section=general', icon: SlidersHorizontal, label: 'Agent Setup', section: 'general', tourKey: 'agent-setup' },
      { href: '/dashboard/agent?section=visual', icon: Palette, label: 'Visual Style', section: 'visual', tourKey: 'visual-style' },
      { href: '/dashboard/knowledge', icon: Database, label: 'Knowledge Base', tourKey: 'knowledge' },
      { href: '/dashboard/widget', icon: Code2, label: 'Website Widget' },
    ]
  },
  {
    title: 'Insights',
    items: [
      { href: '/dashboard/conversations', icon: MessageSquare, label: 'Conversations' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
      { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
    ]
  }
];

const ITEM_BASE = 'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f46530]/70';

function Tooltip({ children, tone = 'default' }) {
  return (
    <span className={`pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
      tone === 'danger' ? 'border-red-500/30 bg-red-950 text-red-100' : 'border-white/10 bg-[#15151c] text-white'
    }`}>
      {children}
    </span>
  );
}

function NavItem({ item, collapsed, isActive, onNavigate, onClose }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={(event) => {
        if (onNavigate?.(item.href) === false) {
          event.preventDefault();
          return;
        }
        onClose?.();
      }}
      data-tour={item.tourKey}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={`${ITEM_BASE} ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
        isActive
          ? 'bg-[#f46530]/[0.12] text-white'
          : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
      }`}
    >
      {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#f46530]" aria-hidden="true" />}
      <Icon size={18} className={`shrink-0 ${isActive ? 'text-[#ff8a5f]' : 'text-gray-500 transition-colors group-hover:text-gray-200'}`} />
      <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
      {collapsed && <span className="hidden lg:contents"><Tooltip>{item.label}</Tooltip></span>}
    </Link>
  );
}

export default function DashboardSidebar({ onSignOut, onNavigate, isOpen, onClose, username, avatarUrl, isCollapsed, onCollapseToggle, tier, accountDeletionScheduledFor }) {
  const profileInitial = username?.trim()?.charAt(0)?.toUpperCase() || '?';
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDeletionScheduled = Boolean(accountDeletionScheduledFor);
  const currentAgentSection = searchParams.get('section') || 'general';
  const planLabel = tier ? `${tier} plan` : 'Your account';
  const deletionDate = isDeletionScheduled
    ? new Date(accountDeletionScheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const isItemActive = (item) => {
    const itemPath = item.href.split('?')[0];
    if (item.section) return pathname === itemPath && currentAgentSection === item.section;
    return pathname === itemPath || (itemPath !== '/dashboard' && pathname.startsWith(itemPath));
  };

  // Labels only collapse on desktop; the mobile drawer always shows them.
  const hideOnCollapse = isCollapsed ? 'lg:hidden' : '';

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside data-dashboard-tour-background className={`
        fixed inset-y-0 left-0 z-[70] flex w-64 flex-col border-r border-white/[0.07] bg-[#0b0b10] transition-all duration-300 ease-in-out motion-reduce:transition-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        {/* Logo row */}
        <div className={`flex h-16 shrink-0 items-center border-b border-white/[0.06] px-5 ${isCollapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
          <Link href="/" className={`group flex items-center ${isCollapsed ? 'lg:hidden' : ''}`} onClick={onClose} aria-label="Qlynk home">
            <Image
              src="/logoWhite.svg"
              alt="Qlynk AI logo"
              width={104}
              height={30}
              priority
              className="transition-opacity group-hover:opacity-80"
            />
          </Link>
          {isCollapsed && (
            <Link href="/" aria-label="Qlynk home" className="hidden h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f46530] to-[#ff8c5a] shadow-lg shadow-[#f46530]/20 lg:flex">
              <Sparkles size={20} className="text-white" />
            </Link>
          )}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav data-tour-sidebar-scroll aria-label="Dashboard" className={`custom-scrollbar flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-5 ${isCollapsed ? 'lg:overflow-visible' : ''}`}>
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600 ${hideOnCollapse}`}>
                {group.title}
              </p>
              {isCollapsed && <div className="mx-auto mb-2 hidden h-px w-8 bg-white/[0.06] lg:block" aria-hidden="true" />}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    collapsed={isCollapsed}
                    isActive={isItemActive(item)}
                    onNavigate={onNavigate}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600 ${hideOnCollapse}`}>
              Shortcuts
            </p>
            {isCollapsed && <div className="mx-auto mb-2 hidden h-px w-8 bg-white/[0.06] lg:block" aria-hidden="true" />}
            <div className="space-y-0.5">
              {username && (
                <Link
                  href={`/${username}`}
                  target="_blank"
                  data-tour="view-agent"
                  aria-label={isCollapsed ? 'View live agent' : undefined}
                  className={`${ITEM_BASE} text-gray-400 hover:bg-white/[0.05] hover:text-white ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
                >
                  <ExternalLink size={18} className="shrink-0 text-gray-500 transition-colors group-hover:text-gray-200" />
                  <span className={hideOnCollapse}>View live agent</span>
                  {isCollapsed && <span className="hidden lg:contents"><Tooltip>View live agent</Tooltip></span>}
                </Link>
              )}
              <Link
                href="/"
                aria-label={isCollapsed ? 'Exit to homepage' : undefined}
                className={`${ITEM_BASE} text-gray-400 hover:bg-white/[0.05] hover:text-white ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
              >
                <Home size={18} className="shrink-0 text-gray-500 transition-colors group-hover:text-gray-200" />
                <span className={hideOnCollapse}>Exit dashboard</span>
                {isCollapsed && <span className="hidden lg:contents"><Tooltip>Exit to homepage</Tooltip></span>}
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer: account + controls */}
        <div className="shrink-0 space-y-2 border-t border-white/[0.06] p-3">
          {isDeletionScheduled && (
            <div
              className={`group relative flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-100 ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
              title={`Pending deletion: ${deletionDate}`}
            >
              <Clock size={15} className="shrink-0" />
              <div className={`min-w-0 ${hideOnCollapse}`}>
                <p className="text-[10px] font-black uppercase tracking-widest">Pending deletion</p>
                <p className="text-[11px] text-amber-100/80">{deletionDate}</p>
              </div>
            </div>
          )}

          <Link
            href="/dashboard/settings"
            onClick={() => {
              onNavigate?.('/dashboard/settings');
              onClose?.();
            }}
            aria-label="Open account settings"
            className={`group relative flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f46530] ${isCollapsed ? 'lg:justify-center lg:border-transparent lg:bg-transparent lg:p-1' : ''}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#f46530] to-[#b9431b] text-sm font-bold text-white">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={username || 'Profile'} width={36} height={36} className="h-full w-full object-cover" />
              ) : (
                <span aria-label={`${username || 'User'} profile initial`}>{profileInitial}</span>
              )}
            </div>
            <div className={`min-w-0 flex-1 ${hideOnCollapse}`}>
              <p className="truncate text-sm font-bold text-white">{username || 'User'}</p>
              <p className="truncate text-xs capitalize text-gray-500">{planLabel}</p>
            </div>
            {isCollapsed && <span className="hidden lg:contents"><Tooltip>Account settings</Tooltip></span>}
          </Link>

          <div className={`flex items-center gap-1 ${isCollapsed ? 'lg:flex-col' : ''}`}>
            <button
              onClick={() => {
                onClose?.();
                onSignOut();
              }}
              aria-label={isCollapsed ? 'Log out' : undefined}
              className={`${ITEM_BASE} flex-1 py-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300 ${isCollapsed ? 'lg:w-full lg:flex-none lg:justify-center lg:px-0' : ''}`}
            >
              <LogOut size={17} className="shrink-0" />
              <span className={hideOnCollapse}>Log out</span>
              {isCollapsed && <span className="hidden lg:contents"><Tooltip tone="danger">Log out</Tooltip></span>}
            </button>

            <button
              onClick={onCollapseToggle}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f46530]/70 lg:flex ${isCollapsed ? 'lg:w-full' : ''}`}
            >
              {isCollapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
