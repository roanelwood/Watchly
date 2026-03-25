import { useThemePreference } from "@/context/theme-preference";

export function useColorScheme() {
  // Use the preference-aware scheme (system/light/dark).
  return useThemePreference().colorScheme;
}
