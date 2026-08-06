'use client';

import Link from 'next/link';

export default function DriverPage() {
  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.05)] space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Ruta de compatibilidad</h1>
        <p className="text-sm text-slate-600">Esta vista es una ruta de compatibilidad del proyecto.</p>
        <Link href="/drive" className="inline-flex text-sm font-semibold text-[#006492] underline">
          Ir al Drive de evaluaciones →
        </Link>
      </div>
    </main>
  );
}
