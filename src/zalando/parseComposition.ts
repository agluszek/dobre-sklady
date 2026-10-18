
export type Composition = Record<string, number>;

export function parseComposition(text: string): Composition {
  const result: Composition = {};

  const pattern = /(\d+(?:[,.]\d+)?)\s*%\s*([^,;]+)/g;

  for (const match of text.matchAll(pattern)) {
    const percentageText = match[1];
    const materialText = match[2];

    if (
      percentageText === undefined ||
      materialText === undefined
    ) {
      continue;
    }

    const percentage = Number(
      percentageText.replace(",", ".")
    );

    const material = materialText.trim().toLowerCase();

    if (
      !material ||
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      continue;
    }

    result[material] = percentage;
  }

  return result;
}
