/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
import { expectType } from 'tsd';
import { ColonDelimitedPath, ParamsFromUrl } from './paths';

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

const invalidPathTest = 'cat';
expectType<never>(type<ColonDelimitedPath<typeof invalidPathTest>>());

const validPathTest = '/cat';
expectType<{}>(type<ColonDelimitedPath<typeof validPathTest>>());

it('ParamsFromUrl', () => {
  expect(true);
});
