import { MultiSelectDropdown } from "./MultiSelectDropdown";
import type { MultiSelectOption } from "./MultiSelectDropdown";
import { SegmentedControl } from "./SegmentedControl";
import type { TeachingMode } from "../../types/document";

type DocumentFiltersProps = {
  semesters: MultiSelectOption[];
  selectedSemesters: string[];
  onSemestersChange: (selected: string[]) => void;
  careers: MultiSelectOption[];
  selectedCareers: string[];
  onCareersChange: (selected: string[]) => void;
  trails: MultiSelectOption[];
  selectedTrails: string[];
  onTrailsChange: (selected: string[]) => void;
  teachingMode: TeachingMode | null;
  onTeachingModeChange: (mode: TeachingMode | null) => void;
};

const TEACHING_MODE_OPTIONS = [
  { label: "Híbrido", value: "Híbrido", icon: "apartment" },
  { label: "Assíncrono", value: "Assíncrono", icon: "computer" },
];

export function DocumentFilters({
  semesters,
  selectedSemesters,
  onSemestersChange,
  careers,
  selectedCareers,
  onCareersChange,
  trails,
  selectedTrails,
  onTrailsChange,
  teachingMode,
  onTeachingModeChange,
}: DocumentFiltersProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <MultiSelectDropdown
        label="Semestre"
        icon="hourglass_bottom"
        options={semesters}
        selected={selectedSemesters}
        onChange={onSemestersChange}
      />
      <div className="min-w-0 flex-1">
        <MultiSelectDropdown
          label="Carreira"
          icon="flowchart"
          options={careers}
          selected={selectedCareers}
          onChange={onCareersChange}
        />
      </div>
      <div className="min-w-0 flex-1">
        <MultiSelectDropdown
          label="Trilha"
          icon="route"
          options={trails}
          selected={selectedTrails}
          onChange={onTrailsChange}
        />
      </div>
      <SegmentedControl
        options={TEACHING_MODE_OPTIONS}
        value={teachingMode}
        onChange={(value) => {
          const mode = value as TeachingMode;
          onTeachingModeChange(teachingMode === mode ? null : mode);
        }}
      />
    </div>
  );
}
