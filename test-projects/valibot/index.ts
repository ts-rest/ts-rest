import { createExpressEndpoints, initServer } from '@ts-rest/express';
import express from 'express';
import * as bodyParser from 'body-parser';
import { initContract } from '@ts-rest/core';
import * as v from 'valibot';

const c = initContract();

const PokemonSchema = v.object({
  id: v.number(),
  name: v.string(),
});

const StringToNumberSchema = v.pipe(
  v.string(),
  v.transform((i) => Number(i)),
  v.integer(),
);

const contract = c.router({
  getPokemon: {
    method: 'GET',
    path: '/pokemon/:id',
    pathParams: v.object({
      id: StringToNumberSchema,
    }),
    responses: {
      200: PokemonSchema,
    },
  },
  deletePokemon: {
    method: 'DELETE',
    path: '/pokemon/:id',
    pathParams: v.object({
      id: StringToNumberSchema,
    }),
    responses: {
      200: c.noBody(),
    },
  },
  updatePokemon: {
    method: 'PATCH',
    path: '/pokemon/:id',
    pathParams: v.object({
      id: StringToNumberSchema,
    }),
    body: v.object({
      name: v.string(),
    }),
    responses: {
      200: v.object({ message: v.string() }),
      403: v.object({ message: v.string() }),
    },
  },
});

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
