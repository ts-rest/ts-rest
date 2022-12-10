import { convertQueryParamsToUrlString } from './query';

describe('convertQueryParamsToUrlString', () => {
  it('should convert query params to url string', () => {
    const query = {
      id: '1',
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe('?id=1');
  });

  it('should convert query params to url string with no params', () => {
    const query = {};

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe('');
  });

  it('should convert query params to url string with many params', () => {
    const query = {
      id: '1',
      commentId: '2',
      commentId2: '3',
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe('?id=1&commentId=2&commentId2=3');
  });

  it('should convert query params to url string with array params', () => {
    const query = {
      colors: ['blue', 'green'],
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe('?colors=blue&colors=green');
  });

  it('should convert query params to url string with array objects', () => {
    const query = {
      colors: [{ foo: 'blue' }, { foo: 'green' }],
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe(encodeURI('?colors[foo]=blue&colors[foo]=green'));
  });

  it('should convert query params to url string with nested object', () => {
    const query = {
      color: {
        r: 100,
        g: 150,
        b: 200,
      },
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe(encodeURI(`?color[r]=100&color[g]=150&color[b]=200`));
  });

  it('should convert query params to url string with deeply nested null', () => {
    const query = {
      colors: {
        blue: {
          r: null,
          g: 0,
          b: 255,
        },
      },
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe(
      encodeURI(`?colors[blue][r]=&colors[blue][g]=0&colors[blue][b]=255`)
    );
  });

  it('should convert query params to url string with null values', () => {
    const query = {
      foo: null,
      bar: 'baz',
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe(encodeURI(`?foo=&bar=baz`));
  });

  it('should convert query params to url string with undefined values', () => {
    const query = {
      foo: undefined,
      bar: 'baz',
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe(encodeURI(`?bar=baz`));
  });

  it('should convert query params to url string with NaN values', () => {
    const query = {
      foo: NaN,
      bar: 'baz',
    };

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe(encodeURI(`?foo=NaN&bar=baz`));
  });

  it('should convert query params to url string with array query', () => {
    const query = ['foo', 'bar'];

    const result = convertQueryParamsToUrlString(query);

    expect(result).toBe(encodeURI(`?0=foo&1=bar`));
  });

  it('should convert query params to url string with primitives', () => {
    expect(convertQueryParamsToUrlString(null)).toBe('');
    expect(convertQueryParamsToUrlString(undefined)).toBe('');
    expect(convertQueryParamsToUrlString(true)).toBe('');
    expect(convertQueryParamsToUrlString(123)).toBe('');
  });
});
