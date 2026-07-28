type ContactInformationProps = {
  institutionalEmail: string;
  administrativeEmail?: string;
};

export function ContactInformation({
  institutionalEmail,
  administrativeEmail,
}: ContactInformationProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-2xl font-medium text-black-80">
        E-mails
      </h2>

      <div className="flex flex-row gap-2 flex-wrap">
        <span className="text-base text-black-80">Email institucional:</span>
        <a
          href={`mailto:${institutionalEmail}`}
          className="text-base text-blue-100 underline decoration-blue-100 underline-offset-2 transition-colors hover:decoration-2"
        >
          {institutionalEmail || "-"}
        </a>
      </div>

      <div className="flex flex-row gap-2 flex-wrap">
        <span className="text-base text-black-80">Email administrativo:</span>
        <a
          href={`mailto:${administrativeEmail}`}
          className="text-base text-blue-100 underline decoration-blue-100 underline-offset-2 transition-colors hover:decoration-2"
        >
          {administrativeEmail || "-"}
        </a>
      </div>
    </section>
  );
}
