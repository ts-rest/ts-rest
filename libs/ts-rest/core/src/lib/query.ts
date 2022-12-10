/**
 *
 * @param query - Any JSON object
 * @returns - The query url segment, using explode array syntax, and deep object syntax
 */
export const convertQueryParamsToUrlString = (query: unknown) => {
  const queryString = encodeQueryParams(query);
  return queryString?.length > 0 ? '?' + queryString : '';
};

export const encodeQueryParams = (query: unknown) => {
  if (!query) {
    return '';
  }

  return (
    Object.keys(query)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .flatMap((key) => tokeniseValue(key, query[key]))
      .map((pair) => {
        const [key, ...rhs] = pair.split('=');
        return `${encodeURIComponent(key)}=${rhs
          .map(encodeURIComponent)
          .join('=')}`;
      })
      .join('&')
  );
};

const tokeniseValue = (key: string, value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((v, idx) => tokeniseValue(`${key}[${idx}]`, v));
  }

  if (value instanceof Date) {
    return [`${key}=${value.toISOString()}`];
  }

  if (value === null) {
    return [`${key}=`];
  }

  if (value === undefined) {
    return [];
  }

  if (typeof value === 'object') {
    return Object.keys(value).flatMap((k) =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      tokeniseValue(`${key}[${k}]`, value[k])
    );
  }

  return [`${key}=${value}`];
};
