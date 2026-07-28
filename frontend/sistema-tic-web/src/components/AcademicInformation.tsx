type AcademicInformationProps = {
  mode: "self" | "user";
  curriculumUrl?: string;
  lattesUrl?: string;
};

export function AcademicInformation({
  mode,
  curriculumUrl,
  lattesUrl,
}: AcademicInformationProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-medium text-black-80">
        Informações Acadêmicas
      </h2>

      {mode === "self" ? (
        <div className="flex flex-wrap gap-3">
          <a
            href={curriculumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-stretch gap-2 rounded-lg border border-blue-100 px-3 text-sm text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            <span
              className="material-symbols-outlined flex items-center justify-center self-center"
              style={{ fontSize: "18px" }}
            >
              add_link
            </span>
            <span className="flex items-center">Mini Currículo</span>
            <span className="border-l border-blue-100" />
            <span
              className="material-symbols-outlined flex items-center justify-center self-center"
              style={{ fontSize: "18px" }}
            >
              link_2
            </span>
          </a>

          <a
            href={lattesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-stretch gap-2 rounded-lg border border-blue-100 px-3 text-sm text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            <span
              className="material-symbols-outlined flex items-center justify-center self-center"
              style={{ fontSize: "18px" }}
            >
              add_link
            </span>
            <span className="flex items-center">Perfil Lattes</span>
            <span className="border-l border-blue-100" />
            <span
              className="material-symbols-outlined flex items-center justify-center self-center"
              style={{ fontSize: "18px" }}
            >
              link_2
            </span>
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-2">
            <span className="text-base text-black-80">Mini Currículo:</span>
            <a
              href={curriculumUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-blue-100 underline decoration-blue-100 underline-offset-2 transition-colors hover:decoration-2"
            >
              Link aqui
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-base text-black-80">Perfil Lattes:</span>
            <a
              href={lattesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-blue-100 underline decoration-blue-100 underline-offset-2 transition-colors hover:decoration-2"
            >
              Link aqui
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
