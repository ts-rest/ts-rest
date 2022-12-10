import { expectType } from 'tsd';
import {
  convertQueryParamsToUrlString,
  encodeQueryParams,
  insertParamsIntoPath,
  ParamsFromUrl,
} from './paths';
import * as qs from 'qs';

const type = <T>() => '' as unknown as T;

const url = '/post/:id/comments/:commentId';
expectType<{ id: string; commentId: string }>(
  type<ParamsFromUrl<typeof url>>()
);

const url2 = '/post/:id/comments';
expectType<{ id: string }>(type<ParamsFromUrl<typeof url2>>());

const url3 = '/post/:id';
expectType<{ id: string }>(type<ParamsFromUrl<typeof url3>>());

const urlNoParams = '/posts';
expectType<undefined>(type<ParamsFromUrl<typeof urlNoParams>>());

const urlManyParams = '/post/:id/comments/:commentId/:commentId2';
expectType<{ id: string; commentId: string; commentId2: string }>(
  type<ParamsFromUrl<typeof urlManyParams>>()
);

describe('insertParamsIntoPath', () => {
  it('should insert params into path', () => {
    const path = '/post/:id/comments/:commentId';

    const params = {
      commentId: '2',
      id: '1',
    };

    const result = insertParamsIntoPath({ path, params });

    expect(result).toBe('/post/1/comments/2');
  });

  it('should insert params into path with no params', () => {
    const path = '/posts';

    const result = insertParamsIntoPath({ path, params: undefined });

    expect(result).toBe('/posts');
  });

  it('should insert params into path with many params', () => {
    const path = '/post/:id/comments/:commentId/:commentId2';

    const params = {
      commentId: '2',
      commentId2: '3',
      id: '1',
    };

    const result = insertParamsIntoPath({ path, params });

    expect(result).toBe('/post/1/comments/2/3');
  });

  it('should insert into paths with only one param', () => {
    const path = '/:id';

    const params = {
      id: '1',
    };

    const result = insertParamsIntoPath({ path, params });

    expect(result).toBe('/1');
  });
});

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
});

describe('encodeQueryParams', () => {
  it('should be empty if no params', () => {
    const query = {};

    const result = encodeQueryParams(query);

    expect(result).toBe('');
  });

  it('should convert query params to url string with many params', () => {
    const query = {
      id: '1',
      commentId: '2',
      commentId2: '3',
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('id=1&commentId=2&commentId2=3');

    expect(qs.parse(result)).toEqual({
      id: '1',
      commentId: '2',
      commentId2: '3',
    });
  });

  it('should explode arrays', () => {
    const query = {
      array: ['1', '2', '3'],
      id: '1',
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('array[0]=1&array[1]=2&array[2]=3&id=1');

    expect(qs.parse(result)).toEqual({
      array: ['1', '2', '3'],
      id: '1',
    });
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
      'nested[array][0]=1&nested[array][1]=2&nested[array][2]=3&nested[id]=1&nested[nestedNested][id]=2'
    );

    expect(qs.parse(result)).toEqual({
      nested: {
        array: ['1', '2', '3'],
        id: '1',
        nestedNested: {
          id: '2',
        },
      },
    });
  });

  it('should work for null, undefined, and NaN', () => {
    const query = {
      null: null,
      undefined: undefined,
      nan: NaN,
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('null=&nan=NaN');

    // qs compatibility
    expect(qs.parse(result)).toEqual({
      null: '',
      nan: 'NaN',
    });
    expect(qs.stringify(query)).toBe(result);
  });

  it('should format dates as ISO strings', () => {
    const query = {
      date: new Date('2020-01-01'),
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('date=2020-01-01T00%3A00%3A00.000Z');
    expect(qs.parse(result)).toEqual({
      date: '2020-01-01T00:00:00.000Z',
    });
    expect(qs.stringify(query)).toBe(result);
  });

  it('should parse booleans', () => {
    const query = {
      bool: true,
      false: false,
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('bool=true&false=false');
    expect(qs.parse(result)).toEqual({
      bool: 'true',
      false: 'false',
    });
  });

  it('should parse numbers', () => {
    const query = {
      number: 1,
      float: 1.1,
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('number=1&float=1.1');
    expect(qs.parse(result)).toEqual({
      number: '1',
      float: '1.1',
    });
  });

  it('should parse objects', () => {
    const query = {
      object: { id: '1' },
    };

    const result = encodeQueryParams(query);
    expect(result).toBe('object[id]=1');
    expect(qs.parse(result)).toEqual(query);
  });

  it('should parse with arrays of objects', () => {
    const query = {
      array: [{ id: '1' }, { id: '2' }],
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('array[0][id]=1&array[1][id]=2');
    expect(qs.parse(result)).toEqual(query);
  });

  it('should parse arrays in arrays', () => {
    const query = {
      array: [['1', '2']],
    };

    const result = encodeQueryParams(query);

    expect(result).toBe('array[0][0]=1&array[0][1]=2');
    expect(qs.parse(result)).toEqual(query);
  });
});
