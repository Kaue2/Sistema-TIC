import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-black-80">
      <section className="text-center">
        <p className="text-7xl font-medium text-blue-100">404</p>

        <h1 className="mt-4 text-3xl font-medium">
          Página não encontrada
        </h1>

        <p className="mt-3 text-black-60">
          A página que você tentou acessar não existe.
        </p>

        <Link
          to="/"
          className="mt-8 inline-block rounded bg-blue-100 px-6 py-2 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:bg-blue-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
        >
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
