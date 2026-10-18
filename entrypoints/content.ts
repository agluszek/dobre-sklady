
import { fetchProductComposition } from "../src/zalando/fetchProduct";
import { parseComposition } from "../src/zalando/parseComposition";

import {
  filterComposition,
  type MaterialFilters,
  type FilterResult,
} from "../src/zalando/filterComposition";

import {
  isProductUrl,
  findProductCard,
  normalizeProductUrl,
} from "../src/zalando/productCards";

// Tymczasowe filtry - później ustawiane w React
const filters: MaterialFilters = {
  minMaterials: {
    wełna: 70,
  },
  excludedMaterials: ["poliester", "akryl"],
};

// Limity wersji testowej
const MAX_PRODUCTS = 10;
const REQUEST_DELAY_MS = 800;

export default defineContentScript({
  matches: ["https://www.zalando.pl/*"],

  main() {
    console.log("🌿 Dobre Składy - rozszerzenie aktywne");

    // Produkty zaplanowane do sprawdzenia
    const scheduled = new Set<string>();

    // Kolejka adresów produktów
    const queue: string[] = [];

    // Wyniki analizy, również nieudane
    const results = new Map<string, FilterResult>();

    let processing = false;
    let discoveryScheduled = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    // Znajdź aktualną kartę produktu w DOM.
    // Nie trzymamy starych referencji do elementów.
    function getCard(url: string): HTMLElement | null {
      const links =
        document.querySelectorAll<HTMLAnchorElement>("a[href]");

      for (const link of links) {
        if (!isProductUrl(link.href)) {
          continue;
        }

        if (normalizeProductUrl(link.href) !== url) {
          continue;
        }

        const card = findProductCard(link);

        if (card) {
          return card;
        }
      }

      return null;
    }

    // Oznacz wynik na karcie
    function updateCard(
      card: HTMLElement,
      result: FilterResult
    ) {
      // Usunięcie poprzednich oznaczeń
      card.style.opacity = "";
      card.style.outline = "";
      card.style.outlineOffset = "";

      if (result === "no-match") {
        card.style.opacity = "0.25";
      }

      if (result === "match") {
        card.style.outline = "3px solid #16a34a";
        card.style.outlineOffset = "-3px";
      }
    }

    // Szukaj produktów na aktualnej stronie
    function discoverProducts() {
      const links =
        document.querySelectorAll<HTMLAnchorElement>("a[href]");

      for (const link of links) {
        if (!isProductUrl(link.href)) {
          continue;
        }

        const card = findProductCard(link);

        if (!card) {
          continue;
        }

        const url = normalizeProductUrl(link.href);

        // Gdy Zalando odtworzy kartę produktu,
        // zastosuj zapamiętany wynik.
        const savedResult = results.get(url);

        if (savedResult !== undefined) {
          updateCard(card, savedResult);
          continue;
        }

        // Nie dodawaj ponownie znanego produktu
        if (scheduled.has(url)) {
          continue;
        }

        // Maksymalnie 10 różnych produktów
        if (scheduled.size >= MAX_PRODUCTS) {
          break;
        }

        scheduled.add(url);
        queue.push(url);
      }

      void processQueue();
    }

    // Pobieraj i analizuj produkty jeden po drugim
    async function processQueue() {
      if (processing) {
        return;
      }

      processing = true;

      try {
        while (queue.length > 0) {
          const url = queue.shift();

          if (!url) {
            continue;
          }

          let result: FilterResult = "unknown";

          try {
            const compositionText =
              await fetchProductComposition(url);

            const composition = compositionText
              ? parseComposition(compositionText)
              : null;

            result = filterComposition(
              composition,
              filters
            );

            console.log("🌿 Dobre Składy:", {
              url,
              composition,
              result,
            });
          } catch (error) {
            console.error(
              "Błąd analizy produktu:",
              url,
              error
            );
          }

          results.set(url, result);

          const card = getCard(url);

          if (card) {
            updateCard(card, result);
          }

          // Zachowaj odstęp pomiędzy żądaniami
          if (queue.length > 0) {
            await sleep(REQUEST_DELAY_MS);
          }
        }
      } finally {
        processing = false;
      }

      console.log(
        `🌿 Dobre Składy: sprawdzono ${results.size} produktów`
      );
    }

    // Ogranicz częstotliwość skanowania DOM
    function scheduleDiscovery() {
      if (discoveryScheduled) {
        return;
      }

      discoveryScheduled = true;

      requestAnimationFrame(() => {
        discoveryScheduled = false;
        discoverProducts();
      });
    }

    // Obserwuj nowe produkty dodawane przez Zalando
    const observer = new MutationObserver(
      scheduleDiscovery
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Pierwsze wyszukiwanie produktów
    discoverProducts();

    console.log(
      "🌿 Dobre Składy - obserwowanie produktów aktywne"
    );
  },
});
