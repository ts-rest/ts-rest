import { client as clientBig } from '../index-big';
import { client as clientLite } from '../index-lite';
import { contractBig } from '../lib/contractBig';
import { describe, beforeEach, it, expect, beforeAll, afterAll } from 'vitest';
import { createExpressEndpoints } from '@ts-rest/express';
import { server } from './express';

import express from 'express';

const app = express();

app.use(express.json());
app.set('port', 5050);

const startServer = () => app.listen(5050);

createExpressEndpoints(contractBig, server, app);

export type Equal<a, b> = (<T>() => T extends a ? 1 : 2) extends <
  T
>() => T extends b ? 1 : 2
  ? true
  : false;

export type Expect<a extends true> = a;

let listening: ReturnType<typeof startServer>;
beforeAll(() => {
  listening = startServer();
});

afterAll(() => {
  listening.close();
});

describe('contract', () => {
  it('should be typed correctly', () => {
    type ContractBig = typeof clientBig;
    type ContractLite = typeof clientLite;

    type ShouldBeEqual = Expect<Equal<ContractBig, ContractLite>>;
  });

  it('should both be able to get Id', async () => {
    const result = await clientBig.getComputer({
      params: {
        id: '1',
      },
    });

    const result2 = await clientLite.getComputer({
      params: {
        id: '1',
      },
    });

    expect(result.body).toEqual(result2.body);
    expect(result.body).toEqual({
      id: '1',
      name: 'test',
    });
  });

  it('should be able to create Id', async () => {
    const result = await clientLite.createComputer({
      body: {
        name: 'test',
      },
    });
    const result2 = await clientBig.createComputer({
      body: {
        name: 'test',
      },
    });

    expect(result.body).toEqual(result2.body);
    expect(result.body).toEqual({
      id: '1',
    });
  });
});
