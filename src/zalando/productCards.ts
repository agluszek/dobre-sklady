
export function isProductUrl(url: string): boolean {
  return /^https:\/\/www\.zalando\.pl\/[^/]+\.html(?:[?#].*)?$/.test(
    url
  );
}

export function normalizeProductUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.origin + parsed.pathname;
}

export function findProductCard(
  link: HTMLAnchorElement
): HTMLElement | null {
  const card = link.closest<HTMLElement>("article");

  if (!card) {
    return null;
  }

  const productUrls = new Set(
    [...card.querySelectorAll<HTMLAnchorElement>("a[href]")]
      .map((element) => element.href)
      .filter(isProductUrl)
      .map(normalizeProductUrl)
  );

  if (productUrls.size !== 1) {
    return null;
  }

  return card;
}
