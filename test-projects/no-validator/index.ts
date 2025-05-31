import { createExpressEndpoints, initServer } from '@ts-rest/express';
import express from 'express';
import * as bodyParser from 'body-parser';
import { initClient, initContract } from '@ts-rest/core';

export type Equal<a, b> = (<T>() => T extends a ? 1 : 2) extends <
  T,
>() => T extends b ? 1 : 2
  ? true
  : false;

export type Expect<a extends true> = a;

const c = initContract();

type Pokemon = {
  id: number;
  name: string;
};

const contract = c.router({
  getPokemon: {
    method: 'GET',
    path: '/pokemon/:id',
    pathParams: c.type<{ id: number }>(),
    responses: {
      200: c.type<Pokemon>(),
    },
  },
  deletePokemon: {
    method: 'DELETE',
    path: '/pokemon/:id',
    pathParams: c.type<{ id: number }>(),
    responses: {
      200: c.noBody(),
    },
  },
  updatePokemon: {
    method: 'PATCH',
    path: '/pokemon/:id',
    pathParams: c.type<{ id: number }>(),
    body: c.type<{ name: string }>(),
    responses: {
      200: c.type<{ message: string }>(),
      403: c.type<{ message: string }>(),
    },
  },
});

const client = initClient(contract, {
  baseUrl: 'http://localhost:8000',
});

const testClient = async () => {
  const res = await client.getPokemon({ params: { id: 1 } });
  if (res.status === 200) {
    return res;
  } else {
    throw new Error('Failed to get pokemon');
  }
};

type ClientReturnType = Awaited<ReturnType<typeof testClient>>['body'];

/**
 * Little test to ensure our types still work without zod installed at all
 */
type TestClientReturnType = Expect<
  Equal<ClientReturnType, { id: number; name: string }>
>;

export const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const s = initServer();

const router = s.router(contract, {
  getPokemon: async ({ params }) => {
    return {
      status: 200,
      body: {
        id: params.id,
        name: 'Charizard',
      },
    };
  },
  deletePokemon: async () => {
    return {
      status: 200,
      body: undefined,
    };
  },
  updatePokemon: async ({ body, params }) => {
    return {
      status: 200,
      body: {
        message: `updated ${params.id} to ${body.name}`,
      },
    };
  },
});

createExpressEndpoints(contract, router, app);

// app.listen(8000, () => {
//   console.log(`Listening on port 8000...`);
// });
