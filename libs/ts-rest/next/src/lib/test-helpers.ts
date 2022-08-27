import { NextApiRequest } from 'next';

export const mockReq = (
  url: string,
  args: {
    query?: Record<string, string>;
    body?: unknown;
    method: string;
  }
): NextApiRequest => {
  const paramArray = url.split('/').splice(1);

  const req = {
    query: {
      ...args.query,
      ['ts-rest']: paramArray,
    },
    body: args.body,
    method: args.method,
  } as unknown as NextApiRequest;

  return req;
};
