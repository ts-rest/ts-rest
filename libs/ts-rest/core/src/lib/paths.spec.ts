import { expectType } from 'tsd';
import {
  convertQueryParamsToUrlString,
  insertParamsIntoPath,
  ParamsFromUrl,
} from './paths';

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
});
