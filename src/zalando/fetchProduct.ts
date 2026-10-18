
export async function fetchProductComposition(
  url: string
): Promise<string | null> {
  const parsedUrl = new URL(url);

  if (
    parsedUrl.origin !== "https://www.zalando.pl" ||
    !parsedUrl.pathname.endsWith(".html")
  ) {
    throw new Error("Nieprawidłowy adres produktu Zalando");
  }

  const response = await fetch(parsedUrl.href);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const html = await response.text();

  const doc = new DOMParser().parseFromString(
    html,
    "text/html"
  );

  const elements = [...doc.querySelectorAll("dd")];

  const composition = elements
    .map((element) => element.textContent?.trim() ?? "")
    .find((text) =>
      /\d+(?:[,.]\d+)?\s*%\s*(wełna|bawełna|poliamid|akryl|poliester|wiskoza|elastan|jedwab|len|kaszmir)/i.test(text)
    );

  return composition ?? null;
}
