import { createExpressEndpoints, initServer } from '@ts-rest/express';
import express from 'express';
import * as bodyParser from 'body-parser';
import { initContract } from '@ts-rest/core';
import { z } from 'zod/v4';
import { generateOpenApi } from '@ts-rest/open-api';

const c = initContract();

const PokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const contract = c.router({
  getPokemon: {
    method: 'GET',
    path: '/pokemon/:id',
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: PokemonSchema,
    },
  },
  deletePokemon: {
    method: 'DELETE',
    path: '/pokemon/:id',
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    responses: {
      200: c.noBody(),
    },
  },
  updatePokemon: {
    method: 'PATCH',
    path: '/pokemon/:id',
    pathParams: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({
      name: z.string(),
    }),
    responses: {
      200: z.object({ message: z.string() }),
      403: z.object({ message: z.string() }),
    },
  },
});

console.log(z.toJSONSchema(contract.updatePokemon.responses[200]));

export const openApiSchema = generateOpenApi(contract, {
  info: {
    title: 'Pokemon API',
    version: '1.0.0',
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
