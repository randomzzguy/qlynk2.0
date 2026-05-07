'use client';

import { Search } from 'lucide-react';

export default function DashboardSearch() {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Search className="text-muted-foreground" size={20} />
      </div>
      <input
        type="text"
        placeholder="Search pages..."
        className="w-full pl-12 pr-4 py-3 bg-card/80 border-2 border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-bright-orange focus:border-transparent transition-all"
      />
    </div>
  );
}