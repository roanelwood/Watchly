import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

type ThemePreference = "system" | "light" | "dark";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  colorScheme: "light" | "dark";
};

const ThemePreferenceContext = createContext<
  ThemePreferenceContextValue | undefined
>(undefined);

export function ThemePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [preference, setPreference] = useState<ThemePreference>("system");

  const colorScheme = preference === "system" ? systemScheme : preference;

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      colorScheme,
    }),
    [preference, systemScheme],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider",
    );
  }
  return context;
}
