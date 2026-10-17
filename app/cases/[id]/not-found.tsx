import Link from "next/link";

export default function CaseNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <section className="max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="text-2xl font-semibold">Devolución no disponible</h1>
        <p className="mt-3 text-zinc-400">
          Este caso no existe o tu cuenta no tiene permiso para consultarlo.
        </p>
        <Link href="/cases" className="mt-6 inline-block rounded-lg border border-zinc-600 px-4 py-2 hover:bg-zinc-800">
          Volver a devoluciones
        </Link>
      </section>
    </main>
  );
}
