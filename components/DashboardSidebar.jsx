'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Bot, 
  FileText, 
  X, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Palette,
  CreditCard,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navGroups = [
  {
    title: 'General',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    ]
  },
  {
    title: 'AI Clone',
    items: [
      { href: '/dashboard/agent', icon: Palette, label: 'Visual Style' },
      { href: '/dashboard/knowledge', icon: Database, label: 'Knowledge Base' },
      { href: '/dashboard/conversations', icon: MessageSquare, label: 'Conversations' },
    ]
  },
  {
    title: 'Insights',
    items: [
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

export default function DashboardSidebar({ onSignOut, isOpen, onClose, username, isCollapsed, onCollapseToggle, tier }) {
  const pathname = usePathname();

  const NavItem = ({ item, collapsed }) => {
    const isActive = pathname === item.href || 
      (item.href !== '/dashboard' && pathname.startsWith(item.href));
    
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group relative ${
          isActive
            ? 'bg-[#f46530] text-white shadow-lg shadow-[#f46530]/20'
            : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
        }`}
      >
        <div className="flex-shrink-0">
          <item.icon size={20} className={isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
        </div>
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-gray-800">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

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

      <aside className={`
        fixed inset-y-0 left-0 z-[70] bg-[#0a0a0f] border-r border-gray-800/50 flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64 w-64'}
      `}>
        {/* Logo Section */}
        <div className={`p-6 border-b border-gray-800/30 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <Link href="/" className="group flex items-center gap-2" onClick={onClose}>
              <div className="w-8 h-8 bg-gradient-to-br from-[#f46530] to-[#ff8c5a] rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles size={18} className="text-white" />
              </div>
              <Image 
                src="/logoWhite.svg" 
                alt="qlynk logo" 
                width={90} 
                height={26} 
                priority
                className="h-auto"
              />
            </Link>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-[#f46530] to-[#ff8c5a] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={22} className="text-white" />
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-4 space-y-8 custom-scrollbar">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {!isCollapsed && (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                  {group.title}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item, iIdx) => (
                  <NavItem key={iIdx} item={item} collapsed={isCollapsed} />
                ))}
              </div>
              {!isCollapsed && gIdx < navGroups.length - 1 && (
                <div className="mx-3 h-px bg-gray-800/30 my-6" />
              )}
            </div>
          ))}

          {/* Quick Links */}
          <div className="space-y-2 pt-4">
            {!isCollapsed && (
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                External
              </h4>
            )}
            <div className="space-y-1">
              {username && (
                <Link
                  href={`/${username}`}
                  target="_blank"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-blue-400 hover:bg-blue-500/10 transition-all group relative"
                >
                  <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                  {!isCollapsed && <span>View Agent</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-gray-800">
                      View Public Agent
                    </div>
                  )}
                </Link>
              )}
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all group relative"
              >
                <Home size={20} className="group-hover:scale-110 transition-transform" />
                {!isCollapsed && <span>Exit Dashboard</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-gray-800">
                    Exit to Homepage
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Area - Logout & Toggle */}
        <div className="p-4 bg-black/20 border-t border-gray-800/50 space-y-2">
          {/* User Profile Summary */}
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-3 py-4 bg-white/5 rounded-2xl border border-white/5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden border border-white/10">
                {username ? (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
                ) : (
                  '?'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate capitalize">{username || 'User'}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{tier || 'Pro'} Member</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-4 relative group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden border border-white/10 group-hover:scale-110 transition-transform cursor-help">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt={username} className="w-full h-full object-cover" />
              </div>
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-gray-800 font-bold uppercase tracking-widest">
                Account: @{username}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onClose?.();
              onSignOut();
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-red-500/5 text-red-400/80 font-medium hover:bg-red-500 hover:text-white transition-all group relative ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span>Log Out</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                Log Out
              </div>
            )}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onCollapseToggle}
            className="hidden lg:flex w-full items-center justify-center py-2 text-gray-500 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : (
              <div className="flex items-center gap-2">
                <ChevronLeft size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Collapse Sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

