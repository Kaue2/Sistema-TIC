import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { SearchInput } from "../components/molecules/SearchInput";
import { FilterDropdown } from "../components/molecules/FilterDropdown";
import { ViewToggle } from "../components/molecules/ViewToggle";
import { MemberListItem } from "../components/molecules/MemberListItem";
import { MemberCard } from "../components/organisms/MemberRow";
import { Empty } from "../components/molecules/Empty";
import { EmptySearch } from "../components/molecules/EmptySearch";
import { Button } from "../components/atoms/Button";
import type { ScheduleItem } from "../components/organisms/JourneySchedule";
import { getMembers, getUserPhotoUrl } from "../services/user-services";
import { getCurrentUserId } from "../services/auth";
import { useUser } from "../contexts/userContext";

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
  const { userData } = useUser();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "cards">(() => {
    const saved = localStorage.getItem("members-view");
    return saved === "cards" ? "cards" : "list";
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // cópia "viva" da foto do próprio usuário (cache do UserProvider). Aplicada dentro do
  // loadMembers para o avatar não ser apagado quando o fetch da lista roda de novo
  const avatarRef = useRef(userData?.avatarUrl);
  useEffect(() => {
    avatarRef.current = userData?.avatarUrl;
  }, [userData?.avatarUrl]);

  useEffect(() => {
    localStorage.setItem("members-view", view);
  }, [view]);

  const loadMembers = useCallback(() => {
    setLoading(true);
    setError(false);

    getMembers()
      .then((summaries) => {
        const currentUserId = getCurrentUserId();

        setMembers(
          summaries.map((m) => ({
            id: m.id,
            avatar: m.id === currentUserId ? (avatarRef.current ?? undefined) : undefined,
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

        summaries.forEach((m) => {
          // o usuário logado já tem a própria foto em cache no contexto (ver UserProvider),
          // então reaproveita em vez de pedir de novo.
          if (m.id === currentUserId) return;

          getUserPhotoUrl(m.id).then((avatarUrl) => {
            if (!avatarUrl) return;
            setMembers((current) =>
              current.map((member) =>
                member.id === m.id ? { ...member, avatar: avatarUrl } : member
              )
            );
          });
        });
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // foto do próprio usuário chega de forma assíncrona pelo UserProvider; quando ela
  // fica disponível, aplica no membro correspondente sem refazer o fetch da lista.
  useEffect(() => {
    if (!userData?.avatarUrl) return;

    const currentUserId = getCurrentUserId();
    setMembers((current) =>
      current.map((member) =>
        member.id === currentUserId
          ? { ...member, avatar: userData.avatarUrl ?? undefined }
          : member
      )
    );
  }, [userData?.avatarUrl]);

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
  const showContent = !loading && !error;

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
          { id: "profile", label: "", icon: "account_circle", enabled: true, visible: true, notification: false, active: false, avatar: true },
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
          {loading && (view === "list" ? <MembersListSkeleton /> : <MembersCardSkeleton />)}

          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="material-symbols-outlined text-[56px] text-blue-100/50">
                error_outline
              </span>
              <p className="max-w-90 text-sm text-blue-100">
                Não foi possível carregar a equipe. Verifique sua conexão e tente novamente.
              </p>
              <Button variant="outline" icon="refresh" onClick={loadMembers}>
                Tentar novamente
              </Button>
            </div>
          )}

          {showContent && showEmpty && (
            <Empty
              iconTinted
              actionLabel="Adicionar membro"
              onAction={() => navigate("/members/new")}
            />
          )}

          {showContent && showEmptySearch && (
            <EmptySearch onClear={handleClearAll} />
          )}

          {showContent && showMembers && view === "list" && (
            <div className="flex w-full max-w-225 flex-col items-center gap-3">
              {filteredMembers.map((member) => (
                <MemberListItem key={member.id} member={member} />
              ))}
            </div>
          )}

          {showContent && showMembers && view === "cards" && (
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

function MembersListSkeleton() {
  return (
    <div className="flex w-full max-w-225 flex-col items-center gap-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex w-full h-20 items-center gap-6 rounded-lg border border-blue-40 bg-card-background px-6"
        >
          <div className="size-12 animate-pulse rounded-full bg-blue-100/10" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-48 animate-pulse rounded bg-blue-100/10" />
            <div className="h-3 w-32 animate-pulse rounded bg-blue-100/10" />
          </div>
          <div className="h-3 w-40 animate-pulse rounded bg-blue-100/10" />
        </div>
      ))}
    </div>
  );
}

function MembersCardSkeleton() {
  return (
    <div className="flex w-full max-w-240 flex-col items-center gap-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex w-full h-87.5 items-stretch gap-6 rounded-2xl border border-blue-40 bg-card-background p-6"
        >
          <div className="flex items-center">
            <div className="size-20 animate-pulse rounded-full bg-blue-100/10" />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-3">
            <div className="h-7 w-56 animate-pulse rounded bg-blue-100/10" />
            <div className="h-4 w-32 animate-pulse rounded bg-blue-100/10" />
            <div className="mt-4 h-3 w-72 animate-pulse rounded bg-blue-100/10" />
            <div className="h-3 w-64 animate-pulse rounded bg-blue-100/10" />
          </div>
          <div className="flex w-80 flex-col justify-center gap-3">
            <div className="h-5 w-24 animate-pulse rounded bg-blue-100/10" />
            <div className="h-3 w-56 animate-pulse rounded bg-blue-100/10" />
            <div className="h-3 w-48 animate-pulse rounded bg-blue-100/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
