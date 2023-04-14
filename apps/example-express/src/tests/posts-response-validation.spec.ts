import * as supertest from 'supertest';
import app from '../main';

const superTestApp = supertest(app);

describe('Posts Endpoints w/ Response Validation', () => {
  it('should include default value and removes extra field', async () => {
    const res = await superTestApp
      .get('/validate-response/123/name?field=foo')
      .set('x-api-key', 'foo');

    expect(res.status).toStrictEqual(200);
    expect(res.body).toStrictEqual({
      id: 123,
      name: 'name',
      defaultValue: 'hello world',
    });
  });

  it('fails with invalid field', async () => {
    const res = await superTestApp
      .get('/validate-response/2000/name')
      .set('x-api-key', 'foo');

    expect(res.status).toStrictEqual(500);
    expect(res.body).toStrictEqual({});
  });
});
