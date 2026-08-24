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
import { getMembers } from "../services/user-services";

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

const ROLE_LABELS: Record<string, string> = {
  coordinator: "Coordenação",
  administrator: "Administração",
  mentor: "Mentoria",
  monitor: "Monitoria",
};

const WEEKDAY_NAMES = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
];

const filterOptions = [
  { label: "Ordem Alfabética", value: "alfabetica" },
  { label: "Coordenação", value: "coordinator" },
  { label: "Administração", value: "administrator" },
  { label: "Mentoria", value: "mentor" },
  { label: "Monitoria", value: "monitor" },
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
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    localStorage.setItem("members-view", view);
  }, [view]);

  useEffect(() => {
    getMembers().then((summaries) => {
      setMembers(
        summaries.map((m) => ({
          id: m.id,
          fullName: m.fullName,
          role: ROLE_LABELS[m.roleCode] ?? m.roleCode,
          institutionalEmail: m.institutionalEmail,
          administrativeEmail: m.administrativeEmail ?? undefined,
          location: m.workLocation ?? "",
          type: m.roleCode,
          journeys: m.availability.map((a) => ({
            day: WEEKDAY_NAMES[a.weekday],
            start: a.startsAt.slice(0, 5),
            end: a.endsAt.slice(0, 5),
          })),
        }))
      );
    });
  }, []);

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
    let result = [...members];

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
  }, [members, debouncedSearch, filters]);

  const hasActiveFilters = debouncedSearch.trim().length > 0 || filters.length > 0;
  const showEmpty = members.length === 0;
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
              iconTinted
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
