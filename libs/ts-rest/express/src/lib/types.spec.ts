import { z } from 'zod';
import { initContract } from '@ts-rest/core';
import { AppRouteImplementation } from './types';
import { IncomingHttpHeaders } from 'http';

export type Equal<a, b> = (<T>() => T extends a ? 1 : 2) extends <
  T
>() => T extends b ? 1 : 2
  ? true
  : false;

export type Expect<a extends true> = a;

const c = initContract();

const contract = c.router({
  postIndex: {
    method: 'POST',
    path: `/index.html`,
    body: z.object({
      echoHtml: z.string(),
    }),
    query: z.object({
      extraPath: z.string().optional(),
    }),
    headers: z.object({
      'x-application-index': z.literal('index'),
    }),
    responses: {
      200: c.otherResponse({
        contentType: 'text/html',
        body: z.string().regex(/^<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>$/im),
      }),
    },
  },
});

it('should have type inference on req', () => {
  type PostIndexImplementation = AppRouteImplementation<
    typeof contract.postIndex
  >;

  type PostIndexParam = Parameters<PostIndexImplementation>[0];

  type PostIndexReq = PostIndexParam['req'];

  type PostIndexBod = PostIndexReq['body'];

  type ShouldHaveReq = Expect<
    Equal<
      PostIndexBod,
      {
        echoHtml: string;
      }
    >
  >;

  type PostIndexHeaders = PostIndexReq['headers'];

  type ShouldHaveHeaders = Expect<
    Equal<
      PostIndexHeaders,
      {
        'x-application-index': 'index';
      } & IncomingHttpHeaders
    >
  >;

  type PostIndexQuery = PostIndexReq['query'];

  type ShouldHaveQuery = Expect<
    Equal<
      PostIndexQuery,
      {
        extraPath?: string;
      }
    >
  >;
});
