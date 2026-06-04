import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPreferences } from '../api/userPreferences';
import { useAuth } from './useAuth';
import { ALLERGY_SAFE_TAG } from '../utils/constants';

/**
 * Returns a function `warningsFor(item)` that maps a menu item's dietary tags
 * to the set of user-declared allergies that should trigger a warning.
 * "Warning" is conservative — we only suppress when there's a positive
 * safe-tag match. A peanut-allergic user sees a warning on any dish unless
 * it carries "Nut-Free options". Allergies without a corresponding safe tag
 * (Shellfish, Fish, Eggs, Soy, Sesame) always warn — better safe than sorry.
 */
export function useAllergyWarnings() {
  const { user } = useAuth();
  const { data: prefs } = useQuery({
    queryKey: ['prefs', user?.id],
    queryFn: () => (user ? fetchPreferences(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const allergies = prefs?.allergies ?? [];

  return React.useCallback(
    (itemDietaryTags: string[] | null | undefined): string[] => {
      if (!allergies.length) return [];
      const tags = new Set(itemDietaryTags ?? []);
      return allergies.filter((a) => {
        const safe = ALLERGY_SAFE_TAG[a];
        if (safe === null) return true; // no safe tag exists → always warn
        return !tags.has(safe);
      });
    },
    [allergies],
  );
}
