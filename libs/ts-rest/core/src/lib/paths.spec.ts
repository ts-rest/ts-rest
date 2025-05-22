import { expectType } from 'tsd';
import { insertParamsIntoPath, ParamsFromUrl } from './paths';

const type = <T>() => '' as unknown as T;

const url = '/post/:id/comments/:commentId';
expectType<{ id: string; commentId: string }>(
  type<ParamsFromUrl<typeof url>>(),
);

const url2 = '/post/:id/comments';
expectType<{ id: string }>(type<ParamsFromUrl<typeof url2>>());

const url3 = '/post/:id';
expectType<{ id: string }>(type<ParamsFromUrl<typeof url3>>());

const urlNoParams = '/posts';
expectType<{}>(type<ParamsFromUrl<typeof urlNoParams>>());

const urlManyParams = '/post/:id/comments/:commentId/:commentId2';
expectType<{ id: string; commentId: string; commentId2: string }>(
  type<ParamsFromUrl<typeof urlManyParams>>(),
);

const urlOptional = '/post/:id?';
expectType<{
  id?: string;
}>(type<ParamsFromUrl<typeof urlOptional>>());

const urlManyOptional = '/post/:id?/comments/:commentId?';
expectType<{
  id?: string;
  commentId?: string;
}>(type<ParamsFromUrl<typeof urlManyOptional>>());

const urlMixedOptional = '/post/:id/comments/:commentId?';
expectType<{
  id: string;
  commentId?: string;
}>(type<ParamsFromUrl<typeof urlMixedOptional>>());

const urlMixedOptional2 = '/post/:id?/comments/:commentId';
expectType<{
  id?: string;
  commentId: string;
}>(type<ParamsFromUrl<typeof urlMixedOptional2>>());

describe('insertParamsIntoPath', () => {
  it('should insert params into path', () => {
    expect(
      insertParamsIntoPath({
        path: '/post/:id/comments/:commentId',
        params: { commentId: '2', id: '1' },
      }),
    ).toBe('/post/1/comments/2');
  });

  it('should insert params into path with no params', () => {
    expect(
      insertParamsIntoPath({
        path: '/posts',
        params: { a: '1' },
      }),
    ).toBe('/posts');
  });

  it('should insert params into path with many params', () => {
    expect(
      insertParamsIntoPath({
        path: '/post/:id/comments/:commentId/:commentId2',
        params: { commentId: '2', commentId2: '3', id: '1' },
      }),
    ).toBe('/post/1/comments/2/3');
  });

  it('should insert into paths with only one param', () => {
    expect(
      insertParamsIntoPath({
        path: '/:id',
        params: { id: '1' },
      }),
    ).toBe('/1');
  });

  it('should insert optional params into path with many params', () => {
    expect(
      insertParamsIntoPath({
        path: '/post/:id?/comments/:commentId?/:commentId2?',
        params: { commentId: '2', commentId2: '3', id: '1' },
      }),
    ).toBe('/post/1/comments/2/3');
  });

  it('should insert optional params into path with no params', () => {
    expect(
      insertParamsIntoPath({
        path: '/post/:id?/comments/:commentId?/:commentId2?',
        params: {},
      }),
    ).toBe('/post/comments');
  });

  it('should insert not have trailing slashes', () => {
    expect(
      insertParamsIntoPath({
        path: '/post/:id?/comments/:commentId?/:commentId2?/:commentId3?',
        params: {},
      }),
    ).toBe('/post/comments');
  });

  it('should insert optional params into paths with only one param', () => {
    expect(
      insertParamsIntoPath({
        path: '/:id?',
        params: { id: '1' },
      }),
    ).toBe('/1');
  });

  it('should preserve trailing slashes in path', () => {
    expect(
      insertParamsIntoPath({
        path: '/:id/',
        params: { id: '1' },
      }),
    ).toBe('/1/');
  });

  it('should preserve trailing slashes in path with optional params', () => {
    expect(
      insertParamsIntoPath({
        path: '/post/:id?/comments/:commentId?/:commentId2?/:commentId3?/',
        params: {},
      }),
    ).toBe('/post/comments/');
  });
});
