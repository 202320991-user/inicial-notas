'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FolderOpen, GraduationCap, Plus, BarChart3 } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Inicio', Icon: Home },
  { href: '/alumnos', label: 'Alumnos', Icon: Users },
  { href: '/reportes', label: 'Reportes', Icon: BarChart3 },
  { href: '/drive', label: 'Drive', Icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-72 flex-col p-4 z-30 bg-[#f5f3f3] border-r border-slate-200">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="w-12 h-12 rounded-xl bg-[#006492] flex items-center justify-center text-white shrink-0">
          <GraduationCap size={26} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#006492] leading-tight">Portal Inicial</h2>
          <p className="text-xs uppercase tracking-wider text-slate-500">Educación Inicial</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        {ITEMS.map(({ href, label, Icon }) => {
          const activo = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-base transition-all border-l-4 ${
                activo
                  ? 'bg-[#e6f2f8] text-[#006492] font-bold border-[#006492]'
                  : 'text-slate-600 hover:bg-slate-200/60 font-medium border-transparent'
              }`}
            >
              <Icon size={24} strokeWidth={activo ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-200">
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 bg-[#006492] text-white py-3.5 rounded-xl font-bold text-base shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={20} /> Nueva Evaluación
        </Link>
      </div>
    </aside>
  );
}