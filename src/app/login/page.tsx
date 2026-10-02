import { LockKeyhole } from "lucide-react";
import { str } from "@/lib/util";
import { login } from "./actions";

export default async function Login(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const failed = str(sp.error) === "1";

  return (
    <div className="mx-auto mt-6 w-full max-w-sm rounded-[24px] border border-line bg-surface p-6 shadow-sm sm:mt-12 sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-lime/20 text-forest ring-1 ring-lime/30">
          <LockKeyhole aria-hidden className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-forest">Masuk Dashboard</h1>
          <p className="text-xs font-semibold text-muted">AI Operations &amp; Analytics</p>
        </div>
      </div>

      <form action={login} className="grid gap-3">
        <input type="hidden" name="next" value={str(sp.next)} />
        <label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-wider text-forest">
          Kata sandi
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            aria-invalid={failed || undefined}
            aria-describedby={failed ? "login-error" : undefined}
            className="h-11 rounded-2xl border border-line bg-surface px-4 text-sm font-semibold normal-case tracking-normal text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-lime"
          />
        </label>
        {failed && (
          <p id="login-error" role="alert" className="text-xs font-bold text-red-700 dark:text-red-400">
            Kata sandi salah. Coba lagi.
          </p>
        )}
        <button
          type="submit"
          className="mt-1 h-11 cursor-pointer rounded-full bg-forest text-sm font-black text-lime shadow-sm transition-colors hover:bg-forest-dark"
        >
          Masuk
        </button>
      </form>
    </div>
  );
}
