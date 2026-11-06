'use client';

import { useEffect } from 'react';
import { GOOGLE_FONTS } from '@/components/agent-editor/agent-editor-defaults';

export default function ChatFont({ family = 'Inter' }) {
  useEffect(() => {
    if (!GOOGLE_FONTS.includes(family)) return;
    const id = `qlynk-font-${family.replaceAll(' ', '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [family]);
  return null;
}
