import {
  convertQueryParamsToUrlString,
  encodeQueryParams,
  encodeQueryParamsJson,
  parseJsonQueryObject,
} from './query';
import { parse as qsParse, stringify as qsStringify } from 'qs';

describe('convertQueryParamsToUrlString', () => {
  it('should convert query params to url string', () => {
    const query = {
      id: 'abc',
    };

    expect(convertQueryParamsToUrlString(query)).toBe('?id=abc');
    expect(convertQueryParamsToUrlString(query, true)).toBe(`?id=abc`);
  });

  it('should convert query params to url string with no params', () => {
    const query = {};

    expect(convertQueryParamsToUrlString(query)).toBe('');
    expect(convertQueryParamsToUrlString(query, true)).toBe('');
  });

  it('should convert query params to url string with primitives', () => {
    expect(convertQueryParamsToUrlString(null)).toBe('');
    expect(convertQueryParamsToUrlString(undefined)).toBe('');
    expect(convertQueryParamsToUrlString(true)).toBe('');
    expect(convertQueryParamsToUrlString(123)).toBe('');

    expect(convertQueryParamsToUrlString(null, true)).toBe('');
    expect(convertQueryParamsToUrlString(undefined, true)).toBe('');
    expect(convertQueryParamsToUrlString(true, true)).toBe('');
    expect(convertQueryParamsToUrlString(123, true)).toBe('');
  });
});

describe('encodeQueryParams', () => {
  it('should be empty if no params', () => {
    const query = {};

    const result = encodeQueryParams(query);

    expect(result).toBe('');
    expect(qsStringify(query)).toBe(result);
  });

  it('should convert query params to url string with many params', () => {
    const query = {
      id: '1',
      commentId: '2',
      commentId2: '3',
    };

    const result = encodeQueryParams(query);

    expect(result).toBe(encodeURI('id=1&commentId=2&commentId2=3'));

    expect(qsParse(result)).toEqual({
      id: '1',
      commentId: '2',
      commentId2: '3',
    });
    expect(qsStringify(query)).toBe(result);
  });

  it('should explode arrays', () => {
    const query = {
      array: ['1', '2', '3'],
      id: '1',
    };

    const result = encodeQueryParams(query);

    expect(result).toBe(encodeURI('array[0]=1&array[1]=2&array[2]=3&id=1'));

    expect(qsParse(result)).toEqual({
      array: ['1', '2', '3'],
      id: '1',
    });
    expect(qsStringify(query)).toBe(result);
  });

  it('should explode nested query strings with arrays and other keys', () => {
    const query = {
      nested: {
        array: ['1', '2', '3'],
        id: '1',
        nestedNested: {
          id: '2',
        },
      },
    };

    const result = encodeQueryParams(query);

    expect(result).toBe(
      encodeURI(
        'nested[array][0]=1&nested[array][1]=2&nested[array][2]=3&nested[id]=1&nested[nestedNested][id]=2'
      )
    );

    expect(qsParse(result)).toEqual({
      nested: {
        array: ['1', '2', '3'],
        id: '1',
        nestedNested: {
          id: '2',
        },
      },
    });
    expect(qsStringify(query)).toBe(result);
  });

  it('should work for null, undefined, and NaN', () => {
    const query = {
      null: null,
      undefined: undefined,
      nan: NaN,
    };

    const result = encodeQueryParams(query);

    expect(result).toBe(encodeURI('null=&nan=NaN'));

    // qs compatibility
    expect(qsParse(result)).toEqual({
      null: '',
      nan: 'NaN',
    });
    expect(qsStringify(query)).toBe(result);
  });

  it('should format dates as ISO strings', () => {
    const query = {
      date: new Date('2020-01-01'),
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('date=2020-01-01T00%3A00%3A00.000Z');
    expect(qsParse(result)).toEqual({
      date: '2020-01-01T00:00:00.000Z',
    });
    expect(qsStringify(query)).toBe(result);
  });

  it('should parse booleans', () => {
    const query = {
      bool: true,
      false: false,
    };

    const result = encodeQueryParams(query);

    expect(result).toBe(encodeURI('bool=true&false=false'));
    expect(qsParse(result)).toEqual({
      bool: 'true',
      false: 'false',
    });
    expect(qsStringify(query)).toBe(result);
  });

  it('should parse numbers', () => {
    const query = {
      number: 1,
      float: 1.1,
    };

    const result = encodeQueryParams(query);

    expect(result).toBe(encodeURI('number=1&float=1.1'));
    expect(qsParse(result)).toEqual({
      number: '1',
      float: '1.1',
    });
    expect(qsStringify(query)).toBe(result);
  });

  it('should parse objects', () => {
    const query = {
      object: { id: '1' },
    };

    const result = encodeQueryParams(query);
    expect(result).toBe(encodeURI('object[id]=1'));
    expect(qsParse(result)).toEqual(query);
    expect(qsStringify(query)).toBe(result);
  });

  it('should parse with arrays of objects', () => {
    const query = {
      array: [{ id: '1' }, { id: '2' }],
    };

    const result = encodeQueryParams(query);

    expect(result).toBe(encodeURI('array[0][id]=1&array[1][id]=2'));
    expect(qsParse(result)).toEqual(query);
    expect(qsStringify(query)).toBe(result);
  });

  it('should parse arrays in arrays', () => {
    const query = {
      array: [['1', '2']],
    };

    const result = encodeQueryParams(query);

    expect(result).toBe(encodeURI('array[0][0]=1&array[0][1]=2'));
    expect(qsParse(result)).toEqual(query);
    expect(qsStringify(query)).toBe(result);
  });

  it('should encode values with equals sign in key', () => {
    const query = {
      'foo=bar': 'baz',
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('foo%3Dbar=baz');
    expect(qsParse(result)).toEqual(query);
    expect(qsStringify(query)).toBe(result);
  });

  it('should encode values with equals sign in value', () => {
    const query = {
      foo: 'bar=baz',
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('foo=bar%3Dbaz');
    expect(qsParse(result)).toEqual(query);
    expect(qsStringify(query)).toBe(result);
  });
});

describe('encodeQueryParamsJson', () => {
  it('should be empty if no params', () => {
    const query = {};

    const result = encodeQueryParamsJson(query);

    expect(result).toBe('');
  });

  it('should convert query params to url string with many params', () => {
    const query = {
      id: 123,
      string: 'ABC',
      trueString: 'true',
      falseString: 'false',
      nullString: 'null',
      numberString: '123',
      boolean: true,
      null: null,
      undefined: undefined,
      sorting: {
        by: 'date',
        order: 'asc',
      },
      filter: {
        date: {
          gt: new Date('2020-01-01'),
        },
      },
    };

    const result = encodeQueryParamsJson(query);

    expect(result).toBe(
      `id=123&string=ABC&trueString=%22true%22&falseString=%22false%22&nullString=%22null%22&numberString=%22123%22&boolean=true&null=null&sorting=${encodeURIComponent(
        '{"by":"date","order":"asc"}'
      )}&filter=${encodeURIComponent(
        '{"date":{"gt":"2020-01-01T00:00:00.000Z"}}'
      )}`
    );
  });
});

describe('parseJsonQueryObject', () => {
  it('should be empty if no params', () => {
    const query = {};

    const result = parseJsonQueryObject(query);

    expect(result).toEqual({});
  });

  it('should convert json query object to regular object', () => {
    const query = {
      id: '123',
      string: 'ABC',
      trueString: '"true"',
      falseString: '"false"',
      nullString: '"null"',
      numberString: '"123"',
      boolean: 'true',
      null: 'null',
      sorting: '{"by":"date","order":"asc"}',
      filter: '{"date":{"gt":"2020-01-01T00:00:00.000Z"}}',
    };

    const result = parseJsonQueryObject(query);

    expect(result).toEqual({
      id: 123,
      string: 'ABC',
      trueString: 'true',
      falseString: 'false',
      nullString: 'null',
      numberString: '123',
      boolean: true,
      null: null,
      sorting: {
        by: 'date',
        order: 'asc',
      },
      filter: {
        date: {
          gt: '2020-01-01T00:00:00.000Z',
        },
      },
    });
  });
});
