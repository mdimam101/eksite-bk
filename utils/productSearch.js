const SEARCH_FIELDS = [
  'productName',
  'description',
  'category',
  'subCategory',
  'brandName',
];

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function searchTokens(query) {
  return [...new Set(normalizeSearchText(query).split(' ').filter(Boolean))];
}

function phraseRegex(query) {
  const words = searchTokens(query).map(escapeRegex);
  return new RegExp(words.join('\\s+'), 'i');
}

function tokenFilter(query) {
  const tokens = searchTokens(query);
  return {
    $or: tokens.flatMap((token) => {
      const regex = new RegExp(escapeRegex(token), 'i');
      return SEARCH_FIELDS.map((field) => ({ [field]: regex }));
    }),
  };
}

function relevanceScore(product, query) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = searchTokens(query);
  const title = normalizeSearchText(product.productName);
  const description = normalizeSearchText(product.description);
  const other = normalizeSearchText([
    product.category,
    product.subCategory,
    product.brandName,
  ].filter(Boolean).join(' '));

  let score = 0;
  if (title === normalizedQuery) score += 1000;
  if (title.startsWith(normalizedQuery)) score += 500;
  if (title.includes(normalizedQuery)) score += 300;
  if (description.includes(normalizedQuery)) score += 150;

  for (const token of tokens) {
    if (title.startsWith(token)) score += 100;
    else if (title.includes(token)) score += 70;
    if (description.includes(token)) score += 25;
    if (other.includes(token)) score += 10;
  }

  return score;
}

function rankProducts(products, query) {
  return products.sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query));
}

module.exports = {
  SEARCH_FIELDS,
  normalizeSearchText,
  phraseRegex,
  tokenFilter,
  relevanceScore,
  rankProducts,
};
