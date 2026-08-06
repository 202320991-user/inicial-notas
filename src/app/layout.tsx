import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { FolderOpen, Users, BarChart3 } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Ficha de Registro de Observación - Inicial',
  description: 'Evaluación de competencias para Educación Inicial',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50/70 text-slate-800 min-h-screen antialiased`}>
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="px-4 md:px-8 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#006492] to-[#004d70] flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
                FR
              </div>
              <span className="font-bold text-[#006492] text-sm md:text-base tracking-tight">
                Ficha de Registro
              </span>
            </Link>

            {/* Menú de navegación táctil para móviles */}
            <nav className="flex md:hidden items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Link href="/" className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#006492] transition-colors">
                Inicio
              </Link>
              <Link href="/drive" className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#006492] transition-colors flex items-center gap-1">
                <FolderOpen size={15} /> Drive
              </Link>
              <Link href="/alumnos" className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#006492] transition-colors flex items-center gap-1">
                <Users size={15} /> Alumnos
              </Link>
              <Link href="/reportes" className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-[#006492] transition-colors flex items-center gap-1">
                <BarChart3 size={15} /> Reportes
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex">
          <Sidebar />
          <div className="flex-1 md:ml-72 min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}