import * as supertest from 'supertest';
import app from '../main';

const superTestApp = supertest(app);

describe('TS Posts Endpoints', () => {
  it('GET /posts/1 should return a post', async () => {
    const res = await superTestApp.get('/ts/posts/123?skip=0&take=10');

    expect(res.status).toStrictEqual(200);
    expect(res.body.id).toStrictEqual('123'); // Not "123" as a number, because no Zod transform
  });
});
