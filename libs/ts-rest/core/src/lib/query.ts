/**
 *
 * @param query - Any JSON object
 * @param json - Use JSON.stringify to encode the query values
 * @returns - The query url segment, using explode array syntax, and deep object syntax
 */
export const convertQueryParamsToUrlString = (query: unknown, json = false) => {
  const queryString = json
    ? encodeQueryParamsJson(query)
    : encodeQueryParams(query);
  return queryString?.length > 0 ? '?' + queryString : '';
};

export const encodeQueryParamsJson = (query: unknown) => {
  if (!query) {
    return '';
  }

  return Object.entries(query)
    .map(([key, value]) => {
      let encodedValue;

      // if value is a string and is not a reserved JSON value or a number, pass it without encoding
      // this makes strings look nicer in the URL (e.g. ?name=John instead of ?name=%22John%22)
      // this is also how OpenAPI will pass strings even if they are marked as application/json types
      if (
        typeof value === 'string' &&
        !['true', 'false', 'null'].includes(value.trim()) &&
        isNaN(Number(value))
      ) {
        encodedValue = value;
      } else {
        encodedValue = JSON.stringify(value);
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(encodedValue)}`;
    })
    .join('&');
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

/**
 * A recursive function to convert an object/string/number/Date/whatever into an array of key=value pairs
 *
 * The output of this should be flatMap-able to a string of key=value pairs which can be
 * joined with & to form a query string
 *
 * This should be fully compatible with the "qs" library, but without the need to add a dependency
 */
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

/**
 *
 * @param query - A server-side query object where values have been encoded as JSON strings
 * @returns - The same object with the JSON strings decoded. Objects that were encoded using toJSON such as Dates will remain as strings
 */
export const parseJsonQueryObject = (query: Record<string, string>) => {
  return Object.fromEntries(
    Object.entries(query).map(([key, value]) => {
      let parsedValue: any;
      // if json parse fails, treat the value as a string
      // this allows us to pass strings without having to surround them with quotes
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }
      return [key, parsedValue];
    })
  );
};
