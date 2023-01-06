import * as supertest from 'supertest';
import app from '../main';

const superTestApp = supertest(app);

describe('TS Posts Endpoints', () => {
  it('GET /posts/1 should return a post', async () => {
    const res = await superTestApp.get('/ts/posts/123');

    expect(res.status).toStrictEqual(200);
    expect(res.body.id).toStrictEqual('123'); // Not "123" as a number, because no Zod transform
  });

  it('GET /posts should return posts with typed query params', async () => {
    const res = await superTestApp.get('/ts/posts?skip=42&take=100');

    expect(res.status).toStrictEqual(200);
    expect(res.body.skip).toStrictEqual(42);
    expect(res.body.take).toStrictEqual(100);
  });
});
