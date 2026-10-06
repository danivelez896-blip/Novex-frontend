import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Plataforma de devoluciones
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Novex
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Accede al panel administrativo de tu empresa.
          </p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
