
import type { Composition } from "./parseComposition";

export interface MaterialFilters {
  minMaterials: Record<string, number>;
  excludedMaterials: string[];
}

export type FilterResult = "match" | "no-match" | "unknown";

export function filterComposition(
  composition: Composition | null,
  filters: MaterialFilters
): FilterResult {
  if (
    composition === null ||
    Object.keys(composition).length === 0
  ) {
    return "unknown";
  }

  // Walidacja podstawowa: nie akceptujemy
  // niekompletnych lub nieprawidłowych składów.
  const percentages = Object.values(composition);
  const total = percentages.reduce(
    (sum, value) => sum + value,
    0
  );

  if (
    percentages.some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100
    ) ||
    Math.abs(total - 100) > 0.5
  ) {
    return "unknown";
  }

  for (const [material, minimum] of Object.entries(
    filters.minMaterials
  )) {
    if ((composition[material] ?? 0) < minimum) {
      return "no-match";
    }
  }

  for (const material of filters.excludedMaterials) {
    if ((composition[material] ?? 0) > 0) {
      return "no-match";
    }
  }

  return "match";
}
