import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { SearchInput } from "../components/molecules/SearchInput";
import { FilterDropdown } from "../components/molecules/FilterDropdown";
import { ViewToggle } from "../components/molecules/ViewToggle";
import { MemberListItem } from "../components/molecules/MemberListItem";
import { MemberCard } from "../components/organisms/MemberRow";
import { Empty } from "../components/molecules/Empty";
import { EmptySearch } from "../components/molecules/EmptySearch";
import type { ScheduleItem } from "../components/organisms/JourneySchedule";

export type Member = {
  id: string;
  avatar?: string;
  fullName: string;
  role: string;
  institutionalEmail: string;
  administrativeEmail?: string;
  journeys: ScheduleItem[];
  location: string;
  type: string;
};

const filterOptions = [
  { label: "Ordem Alfabética", value: "alfabetica" },
  { label: "Coordenação", value: "coordenação" },
  { label: "Administração", value: "administração" },
  { label: "Mentoria", value: "mentoria" },
  { label: "Monitoria", value: "monitoria" },
];

const mockMembers: Member[] = [
  {
    id: "1",
    fullName: "Ana Beatriz Costa",
    role: "Coordenadora Geral",
    institutionalEmail: "ana.costa@senac.com.br",
    administrativeEmail: "ana.admin@senac.com.br",
    journeys: [
      { day: "Segunda", start: "08:00", end: "12:00" },
      { day: "Terça", start: "08:00", end: "12:00" },
      { day: "Quarta", start: "08:00", end: "12:00" },
      { day: "Quinta", start: "08:00", end: "12:00" },
      { day: "Sexta", start: "08:00", end: "12:00" },
    ],
    location: "E101",
    type: "coordenação",
  },
  {
    id: "2",
    fullName: "Carlos Eduardo Lima",
    role: "Administrador",
    institutionalEmail: "carlos.lima@senac.com.br",
    journeys: [
      { day: "Segunda", start: "09:00", end: "18:00" },
      { day: "Terça", start: "09:00", end: "18:00" },
      { day: "Quarta", start: "09:00", end: "18:00" },
      { day: "Quinta", start: "09:00", end: "18:00" },
      { day: "Sexta", start: "09:00", end: "18:00" },
    ],
    location: "E102",
    type: "administração",
  },
  {
    id: "3",
    fullName: "Daniela Oliveira Santos",
    role: "Mentora de Carreira",
    institutionalEmail: "daniela.santos@senac.com.br",
    journeys: [
      { day: "Segunda", start: "13:00", end: "19:00" },
      { day: "Terça", start: "13:00", end: "19:00" },
      { day: "Quarta", start: "13:00", end: "19:00" },
      { day: "Quinta", start: "13:00", end: "19:00" },
    ],
    location: "E103",
    type: "mentoria",
  },
  {
    id: "4",
    fullName: "Eduardo Almeida Neto",
    role: "Monitor de Algoritmos",
    institutionalEmail: "eduardo.neto@senac.com.br",
    journeys: [
      { day: "Segunda", start: "14:00", end: "20:00" },
      { day: "Quarta", start: "14:00", end: "20:00" },
      { day: "Sexta", start: "14:00", end: "20:00" },
    ],
    location: "E104",
    type: "monitoria",
  },
  {
    id: "5",
    fullName: "Fernanda Martins Rocha",
    role: "Mentora de UX",
    institutionalEmail: "fernanda.rocha@senac.com.br",
    journeys: [
      { day: "Terça", start: "10:00", end: "16:00" },
      { day: "Quinta", start: "10:00", end: "16:00" },
    ],
    location: "E105",
    type: "mentoria",
  },
  {
    id: "6",
    fullName: "Gabriel Souza Pereira",
    role: "Monitor de Python",
    institutionalEmail: "gabriel.pereira@senac.com.br",
    journeys: [
      { day: "Segunda", start: "13:00", end: "19:00" },
      { day: "Terça", start: "13:00", end: "19:00" },
      { day: "Quarta", start: "13:00", end: "19:00" },
      { day: "Quinta", start: "13:00", end: "19:00" },
      { day: "Sexta", start: "13:00", end: "19:00" },
    ],
    location: "E106",
    type: "monitoria",
  },
];

export function MembersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "cards">(() => {
    const saved = localStorage.getItem("members-view");
    return saved === "cards" ? "cards" : "list";
  });

  useEffect(() => {
    localStorage.setItem("members-view", view);
  }, [view]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, 300);
  }

  function handleClearSearch() {
    setSearch("");
    setDebouncedSearch("");
  }

  const filteredMembers = useMemo(() => {
    let result = [...mockMembers];

    if (debouncedSearch.trim()) {
      const term = debouncedSearch.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.fullName.toLowerCase().includes(term) ||
          m.role.toLowerCase().includes(term) ||
          m.institutionalEmail.toLowerCase().includes(term)
      );
    }

    const typeFilters = filters.filter((f) => f !== "alfabetica");
    if (typeFilters.length > 0) {
      result = result.filter((m) => typeFilters.includes(m.type));
    }

    if (filters.includes("alfabetica")) {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    return result;
  }, [debouncedSearch, filters]);

  const hasActiveFilters = debouncedSearch.trim().length > 0 || filters.length > 0;
  const showEmpty = mockMembers.length === 0;
  const showEmptySearch = !showEmpty && filteredMembers.length === 0 && hasActiveFilters;
  const showMembers = !showEmpty && !showEmptySearch;

  function handleClearAll() {
    setSearch("");
    setDebouncedSearch("");
    setFilters([]);
  }

  return (
    <div className="relative min-h-screen bg-background">
      <FixedNavigation
        position="left"
        items={[
          { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
          { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
          { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
          { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: true },
          { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true },
        ]}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-350 flex-col items-center px-6 pb-16 pt-12">
        <h1 className="text-[52px] font-normal leading-none text-blue-100">
          Nossa equipe, TIC em Trilhas Senac
        </h1>

        <div className="mt-12 flex w-full flex-wrap items-center justify-center gap-3">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
          />
          <FilterDropdown
            selected={filters}
            onChange={setFilters}
            options={filterOptions}
          />
          <ViewToggle view={view} onChange={setView} />
          <button
            type="button"
            onClick={() => navigate("/members/new")}
            className="flex h-10 items-center gap-2 rounded-lg border border-blue-100 px-4 text-sm text-blue-100 transition-all duration-200 hover:bg-blue-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              add_circle
            </span>
            Adicionar membro
          </button>
        </div>

        <div className="mt-8 flex w-full justify-center">
          {showEmpty && (
            <Empty
              actionLabel="Adicionar membro"
              onAction={() => navigate("/members/new")}
            />
          )}

          {showEmptySearch && (
            <EmptySearch onClear={handleClearAll} />
          )}

          {showMembers && view === "list" && (
            <div className="flex w-full max-w-225 flex-col items-center gap-3">
              {filteredMembers.map((member) => (
                <MemberListItem key={member.id} member={member} />
              ))}
            </div>
          )}

          {showMembers && view === "cards" && (
            <div className="flex w-full max-w-240 flex-col items-center gap-3">
              {filteredMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
