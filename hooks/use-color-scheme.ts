import { useThemePreference } from "@/context/theme-preference";

export function useColorScheme() {
  // Function to read current light or dark mode
  return useThemePreference().colorScheme;
}
