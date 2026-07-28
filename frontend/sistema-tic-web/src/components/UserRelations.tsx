type UserRelationsProps = {
  trails?: string[];
  documents?: string[];
  groups?: string[];
};

export function UserRelations({
  trails,
  documents,
  groups,
}: UserRelationsProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[28px] font-medium text-black-80">
        Acessos e Vínculos
      </h2>

      <div className="flex flex-col gap-4">
        {trails && trails.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-blue-100">
              Trilhas
            </span>
            <ul className="flex flex-col gap-1 pl-5">
              {trails.map((trail) => (
                <li key={trail} className="list-disc text-base text-black-60">
                  {trail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {documents && documents.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-blue-100">
              Documentos
            </span>
            <ul className="flex flex-col gap-1 pl-5">
              {documents.map((doc) => (
                <li key={doc} className="list-disc text-base text-black-60">
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        )}

        {groups && groups.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-blue-100">
              Grupos
            </span>
            <ul className="flex flex-col gap-1 pl-5">
              {groups.map((group) => (
                <li key={group} className="list-disc text-base text-black-60">
                  {group}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
