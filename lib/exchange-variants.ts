export type ExchangeVariantOption = {
  id: string;
  availableForSale: boolean;
  title: string;
  options: { name: string; value: string }[];
};

export function isValidExchangeDestination(
  variant: ExchangeVariantOption | undefined,
  originalId: string,
) {
  return Boolean(
    variant && variant.availableForSale &&
    variant.id !== originalId &&
    /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variant.id),
  );
}

export function formatExchangeVariant(variant: ExchangeVariantOption) {
  return variant.options.map(option => `${option.name}: ${option.value}`)
    .join(" / ") || variant.title;
}
