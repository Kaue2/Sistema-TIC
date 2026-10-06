export type AccentTheme = "blue" | "green" | "purple";

const STORAGE_KEY = "@SistemaTIC:accent-theme";

export const ACCENT_THEMES: Record<
  AccentTheme,
  { label: string; primary: string; medium: string; light: string }
> = {
  blue: {
    label: "Azul",
    primary: "#002688",
    medium: "#00268899",
    light: "#00268866",
  },
  green: {
    label: "Verde",
    primary: "#006B3C",
    medium: "#006B3C99",
    light: "#006B3C66",
  },
  purple: {
    label: "Roxo",
    primary: "#5B2A86",
    medium: "#5B2A8699",
    light: "#5B2A8666",
  },
};

function isAccentTheme(value: string | null): value is AccentTheme {
  return value === "blue" || value === "green" || value === "purple";
}

export function getAccentTheme(): AccentTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isAccentTheme(stored) ? stored : "blue";
}

export function applyAccentTheme(theme: AccentTheme): void {
  const colors = ACCENT_THEMES[theme];
  const root = document.documentElement;

  root.style.setProperty("--color-blue-100", colors.primary);
  root.style.setProperty("--color-blue-60", colors.medium);
  root.style.setProperty("--color-blue-40", colors.light);
}

export function setAccentTheme(theme: AccentTheme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyAccentTheme(theme);
}

export function initializePersonalization(): void {
  applyAccentTheme(getAccentTheme());
}
