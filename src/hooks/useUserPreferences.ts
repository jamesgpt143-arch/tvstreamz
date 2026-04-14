import { useUserPreferencesContext } from '@/contexts/UserPreferencesContext';

export type { MyListItem } from '@/contexts/UserPreferencesContext';

export function useUserPreferences() {
  return useUserPreferencesContext();
}
