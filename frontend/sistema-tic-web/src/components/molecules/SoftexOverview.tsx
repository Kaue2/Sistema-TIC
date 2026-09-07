import { Input } from "../atoms/Input";
import { Textarea } from "../atoms/Textarea";
import { FormField } from "./FormField";
import { TrailSection } from "./TrailSection";
import { TrailProgressRing } from "./TrailProgressRing";
import type { SoftexProgressIndicator } from "../../data/softexIntroFields";
import type { SoftexIntro } from "../../types/document";

type SoftexOverviewProps = {
  intro: SoftexIntro;
  disabled: boolean;
  onIntroChange: (field: keyof SoftexIntro, value: string) => void;
  indicators: SoftexProgressIndicator[];
  onSelectIndicator: (id: string) => void;
};

const FIELD_IDS: Record<keyof SoftexIntro, string> = {
  trailName: "softex-intro-trail-name",
  level: "softex-intro-level",
  modality: "softex-intro-modality",
  summary: "softex-intro-summary",
  presentialHours: "softex-intro-presential-hours",
  remoteHours: "softex-intro-remote-hours",
  totalHours: "softex-intro-total-hours",
  prerequisites: "softex-intro-prerequisites",
  mentor: "softex-intro-mentor",
  firstMonitor: "softex-intro-first-monitor",
  secondMonitor: "softex-intro-second-monitor",
  location: "softex-intro-location",
  address: "softex-intro-address",
  building: "softex-intro-building",
  room: "softex-intro-room",
  enrollmentForm: "softex-intro-enrollment-form",
  enrollmentStart: "softex-intro-enrollment-start",
  enrollmentEnd: "softex-intro-enrollment-end",
  vacancies: "softex-intro-vacancies",
  contact: "softex-intro-contact",
};

export function SoftexOverview({
  intro,
  disabled,
  onIntroChange,
  indicators,
  onSelectIndicator,
}: SoftexOverviewProps) {
  return (
    <>
      <div>
        <h2 className="text-2xl font-normal text-blue-100">Início</h2>
        <p className="mt-1 text-sm text-black-60">Visão Geral da Trilha</p>
      </div>

      <TrailSection title="Informações introdutórias sobre a trilha">
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col gap-6 md:flex-row md:items-start">
            <div className="min-w-0 flex-1">
              <FormField id={FIELD_IDS.trailName} label="Nome da Trilha">
                <Input
                  id={FIELD_IDS.trailName}
                  value={intro.trailName}
                  onChange={(e) => onIntroChange("trailName", e.target.value)}
                  placeholder="Digite o nome da trilha"
                  disabled={disabled}
                />
              </FormField>
            </div>

            <div className="md:w-64">
              <FormField id={FIELD_IDS.level} label="Nível">
                <Input
                  id={FIELD_IDS.level}
                  value={intro.level}
                  onChange={(e) => onIntroChange("level", e.target.value)}
                  placeholder="Digite o nível"
                  disabled={disabled}
                />
              </FormField>
            </div>

            <div className="md:w-64">
              <FormField id={FIELD_IDS.modality} label="Modalidade">
                <Input
                  id={FIELD_IDS.modality}
                  value={intro.modality}
                  onChange={(e) => onIntroChange("modality", e.target.value)}
                  placeholder="Digite a modalidade"
                  disabled={disabled}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-6 max-md:grid-cols-1">
            <div className="col-span-3">
              <FormField id={FIELD_IDS.summary} label="Resumo sobre a Trilha">
                <Textarea
                  id={FIELD_IDS.summary}
                  value={intro.summary}
                  onChange={(value) => onIntroChange("summary", value)}
                  placeholder="Escreva o resumo sobre a trilha..."
                  disabled={disabled}
                  autoGrow
                />
              </FormField>
            </div>

            <FormField id={FIELD_IDS.presentialHours} label="Carga Horária Presencial">
              <Input
                id={FIELD_IDS.presentialHours}
                value={intro.presentialHours}
                onChange={(e) => onIntroChange("presentialHours", e.target.value)}
                placeholder="0"
                disabled={disabled}
              />
            </FormField>

            <FormField id={FIELD_IDS.remoteHours} label="Carga Horária Remota">
              <Input
                id={FIELD_IDS.remoteHours}
                value={intro.remoteHours}
                onChange={(e) => onIntroChange("remoteHours", e.target.value)}
                placeholder="24"
                disabled={disabled}
              />
            </FormField>

            <FormField id={FIELD_IDS.totalHours} label="Carga Horária Total">
              <Input
                id={FIELD_IDS.totalHours}
                value={intro.totalHours}
                onChange={(e) => onIntroChange("totalHours", e.target.value)}
                placeholder="24"
                disabled={disabled}
              />
            </FormField>
          </div>

          <FormField id={FIELD_IDS.prerequisites} label="Pré-Requisitos">
            <Textarea
              id={FIELD_IDS.prerequisites}
              value={intro.prerequisites}
              onChange={(value) => onIntroChange("prerequisites", value)}
              placeholder="Escreva os pré-requisitos..."
              disabled={disabled}
              autoGrow
            />
          </FormField>

          <FormField id={FIELD_IDS.mentor} label="Mentora">
            <Input
              id={FIELD_IDS.mentor}
              value={intro.mentor}
              onChange={(e) => onIntroChange("mentor", e.target.value)}
              placeholder="Digite o nome da mentora"
              disabled={disabled}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
            <FormField id={FIELD_IDS.firstMonitor} label="Primeiro Monitor/a">
              <Input
                id={FIELD_IDS.firstMonitor}
                value={intro.firstMonitor}
                onChange={(e) => onIntroChange("firstMonitor", e.target.value)}
                placeholder="Digite o nome"
                disabled={disabled}
              />
            </FormField>

            <FormField id={FIELD_IDS.secondMonitor} label="Segundo Monitor/a">
              <Input
                id={FIELD_IDS.secondMonitor}
                value={intro.secondMonitor}
                onChange={(e) => onIntroChange("secondMonitor", e.target.value)}
                placeholder="Digite o nome"
                disabled={disabled}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
            <FormField id={FIELD_IDS.location} label="Local">
              <Input
                id={FIELD_IDS.location}
                value={intro.location}
                onChange={(e) => onIntroChange("location", e.target.value)}
                placeholder="Digite o local"
                disabled={disabled}
              />
            </FormField>

            <FormField id={FIELD_IDS.address} label="Endereço">
              <Input
                id={FIELD_IDS.address}
                value={intro.address}
                onChange={(e) => onIntroChange("address", e.target.value)}
                placeholder="Digite o endereço"
                disabled={disabled}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
            <FormField id={FIELD_IDS.building} label="Prédio">
              <Input
                id={FIELD_IDS.building}
                value={intro.building}
                onChange={(e) => onIntroChange("building", e.target.value)}
                placeholder="Digite o prédio"
                disabled={disabled}
              />
            </FormField>

            <FormField id={FIELD_IDS.room} label="Sala">
              <Input
                id={FIELD_IDS.room}
                value={intro.room}
                onChange={(e) => onIntroChange("room", e.target.value)}
                placeholder="Digite a sala"
                disabled={disabled}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-4 gap-6 max-md:grid-cols-1">
            <FormField id={FIELD_IDS.enrollmentForm} label="Formulário de Inscrição">
<Input
              id={FIELD_IDS.enrollmentForm}
              value={intro.enrollmentForm}
              onChange={(e) => onIntroChange("enrollmentForm", e.target.value)}
              placeholder="Digite o link ou código"
              disabled={disabled}
            />
          </FormField>

          <FormField id={FIELD_IDS.enrollmentStart} label="Início das Inscrições">
            <Input
              id={FIELD_IDS.enrollmentStart}
              type="date"
              value={intro.enrollmentStart}
              onChange={(e) => onIntroChange("enrollmentStart", e.target.value)}
              disabled={disabled}
            />
          </FormField>

          <FormField id={FIELD_IDS.enrollmentEnd} label="Término das Inscrições">
            <Input
              id={FIELD_IDS.enrollmentEnd}
              type="date"
              value={intro.enrollmentEnd}
              onChange={(e) => onIntroChange("enrollmentEnd", e.target.value)}
              disabled={disabled}
            />
          </FormField>

            <FormField id={FIELD_IDS.vacancies} label="Quantidade de Vagas">
              <Input
                id={FIELD_IDS.vacancies}
                value={intro.vacancies}
                onChange={(e) => onIntroChange("vacancies", e.target.value)}
                placeholder="Digite a quantidade"
                disabled={disabled}
              />
            </FormField>
          </div>

          <FormField id={FIELD_IDS.contact} label="Contato">
            <Input
              id={FIELD_IDS.contact}
              value={intro.contact}
              onChange={(e) => onIntroChange("contact", e.target.value)}
              placeholder="Digite o e-mail de contato"
              disabled={disabled}
            />
          </FormField>
        </div>
      </TrailSection>

      <TrailSection title="Painel de Acompanhamento">
        <div className="grid grid-cols-2 gap-x-10 gap-y-10 lg:grid-cols-4">
          {indicators.map((indicator) => (
            <button
              key={indicator.id}
              type="button"
              data-indicator-id={indicator.id}
              aria-label={`Abrir ${indicator.label}`}
              onClick={() => onSelectIndicator(indicator.id)}
              className="group flex cursor-pointer flex-col items-center rounded-xl p-2 transition-all duration-200 hover:bg-blue-100/5 active:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
            >
              <TrailProgressRing
                label={indicator.label}
                value={indicator.value}
                featured={indicator.id === "Geral"}
              />
            </button>
          ))}
        </div>
      </TrailSection>
    </>
  );
}