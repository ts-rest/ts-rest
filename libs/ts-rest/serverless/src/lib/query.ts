export interface ParsedQuery {
  [key: string]: string | string[] | ParsedQuery | ParsedQuery[];
}

export const parseQueryString = (queryString: string): ParsedQuery => {
  if (queryString === '') {
    return {};
  }

  const query: Record<string, string | string[]> = {};
  const pairs = (
    queryString[0] === '?' ? queryString.substr(1) : queryString
  ).split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');

    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value ?? '');

    if (query[decodedKey] === undefined) {
      query[decodedKey] = decodedValue;
    } else {
      if (Array.isArray(query[decodedKey])) {
        (query[decodedKey] as string[]).push(decodedValue);
      } else {
        query[decodedKey] = [query[decodedKey] as string, decodedValue];
      }
    }
  }

  const convertKeysToObject = (obj: Record<string, unknown>) => {
    const result: any = {};

    Object.entries(obj).forEach(([key, value]) => {
      const keys = key.split('[').map((k) => k.replace(']', ''));

      keys.reduce((acc, k, i) => {
        if (i === keys.length - 1) {
          acc[k] = value;
        } else {
          acc[k] = acc[k] ?? {};
        }

        return acc[k];
      }, result);
    });

    return result;
  };

  const queryObject = convertKeysToObject(query);

  // convert any deeply nested objects with numerical keys to arrays
  const convertNumericalKeysToArray = (obj: Record<string, unknown>) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object') {
        convertNumericalKeysToArray(value as Record<string, unknown>);
      }

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const keys = Object.keys(value);

        if (keys.every((k) => !isNaN(Number(k)))) {
          obj[key] = Object.values(value);
        }
      }
    });

    return obj;
  };

  return convertNumericalKeysToArray({ ...queryObject }) as ParsedQuery;
};
