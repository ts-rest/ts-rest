const primitiveToQueryParam = (
  keyParts: string[],
  val: number | boolean | string | null
): string => {
  const paramKey =
    keyParts[0] +
    keyParts
      .slice(1)
      .map((keyPart) => `[${keyPart}]`)
      .join('');

  const paramValue = val === null ? '' : val;

  return `${encodeURIComponent(paramKey)}=${encodeURIComponent(paramValue)}`;
};

const objectEntryToQueryParams = (
  key: string,
  value: any,
  parents: string[]
) => {
  if (value === undefined) {
    return null;
  }

  const paramKeyParts = [...parents, key];

  if (Array.isArray(value)) {
    return value.map((item) => anyToQueryParams(paramKeyParts, item));
  }

  return anyToQueryParams(paramKeyParts, value);
};

const anyToQueryParams = (keyParts: string[], obj: any): any[] => {
  if (typeof obj !== 'object' || obj === null) {
    return [primitiveToQueryParam(keyParts, obj)];
  }

  return Object.entries(obj).map(([key, value]: [string, any]) =>
    objectEntryToQueryParams(key, value, keyParts)
  );
};

/**
 *
 * @param query - The query e.g. { id: string }
 * @returns - The query url segment e.g. ?id=123
 */
export const convertQueryParamsToUrlString = (query: any) => {
  if (typeof query !== 'object' || query === null) {
    return '';
  }

  const queryParams = anyToQueryParams([], query).flat(Infinity);

  return queryParams.length > 0
    ? '?' + queryParams.filter(Boolean).join('&')
    : '';
};
