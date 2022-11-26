import * as supertest from 'supertest';
import app from '../main';

const superTestApp = supertest(app);

describe('Posts Endpoints', () => {
  it('GET /posts should return an array of posts', async () => {
    const res = await superTestApp.get('/posts?skip=0&take=10');

    expect(res.status).toStrictEqual(200);
  });

  it('should transform skip and take into numbers', async () => {
    const res = await superTestApp.get('/posts?skip=0&take=10');

    expect(res.status).toStrictEqual(200);
    expect(res.body.skip).toStrictEqual(0);
    expect(res.body.take).toStrictEqual(10);
  });

  it('should error if a required query param is missing', async () => {
    const res = await superTestApp.get('/posts?skip=0');

    expect(res.status).toStrictEqual(400);
    expect(res.body).toStrictEqual({
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Required',
          path: ['take'],
          received: 'undefined',
        },
      ],
      name: 'ZodError',
    });
  });

  it('should error if body is incorrect', async () => {
    const res = await superTestApp.post('/posts').send({
      title: 'Good title',
      content: 123,
    });

    expect(res.status).toStrictEqual(400);
    expect(res.body).toStrictEqual({
      issues: [
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Expected string, received number',
          path: ['content'],
          received: 'number',
        },
      ],
      name: 'ZodError',
    });
  });

  it('should transform body correctly', async () => {
    const res = await superTestApp.post('/posts').send({
      title: 'Title with extra spaces     ',
      content: 'content',
    });

    expect(res.status).toStrictEqual(201);
    expect(res.body.title).toStrictEqual('Title with extra spaces');
  });

  it('should format params using pathParams correctly', async () => {
    const res = await superTestApp.get('/test/123/name');

    expect(res.status).toStrictEqual(200);
    expect(res.body).toStrictEqual({
      id: 123,
      name: 'name',
    });
  });
});
