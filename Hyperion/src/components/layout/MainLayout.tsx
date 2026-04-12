import { useThemeStore } from "@/stores/theme";

export default function MainLayout() {
  useThemeStore(); // ensure theme is applied

  return null;
}
