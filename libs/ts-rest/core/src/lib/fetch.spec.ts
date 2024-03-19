import * as clientModule from './client';
import { initContract } from './dsl';
const c = initContract();
describe('fetchApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('should not include content-type application/json if body is undefined', async () => {
    const tsRestApiStub = jest
      .spyOn(clientModule, 'tsRestFetchApi')
      .mockResolvedValue({
        status: 200,
        body: { message: 'never gonna give you up, never gonna let you down' },
        headers: new Headers(),
      });
    await clientModule.fetchApi({
      body: undefined,
      headers: {},
      path: '/rick-astley',
      clientArgs: {
        baseUrl: 'https://api.com',
        baseHeaders: {},
      },
      route: {
        method: 'POST',
        body: null,
        path: '/rick-astley',
        responses: {
          200: c.response<{ message: string }>(),
        },
      },
      query: {},
      extraInputArgs: {},
    });
    expect(tsRestApiStub).toHaveBeenCalledWith({
      body: undefined,
      contentType: undefined,
      credentials: undefined,
      headers: {},
      method: 'POST',
      next: undefined,
      path: '/rick-astley',
      rawBody: undefined,
      rawQuery: {},
      route: {
        body: null,
        method: 'POST',
        path: '/rick-astley',
        responses: {
          '200': expect.anything(),
        },
      },
      signal: undefined,
    });
  });

  it('should include content-type application/json if body is defined', async () => {
    const tsRestApiStub = jest
      .spyOn(clientModule, 'tsRestFetchApi')
      .mockResolvedValue({
        status: 200,
        body: { message: 'never gonna give you up, never gonna let you down' },
        headers: new Headers(),
      });
    await clientModule.fetchApi({
      body: {
        message: 'never gonna say goodbye, never gonna tell a lie and hurt you',
      },
      headers: {},
      path: '/rick-astley',
      clientArgs: {
        baseUrl: 'https://api.com',
        baseHeaders: {},
      },
      route: {
        method: 'POST',
        body: null,
        path: '/rick-astley',
        responses: {
          200: c.response<{ message: string }>(),
        },
      },
      query: {},
      extraInputArgs: {},
    });
    expect(tsRestApiStub).toHaveBeenCalledWith(
      expect.objectContaining({
        body: '{"message":"never gonna say goodbye, never gonna tell a lie and hurt you"}',
        contentType: 'application/json',
        credentials: undefined,
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        next: undefined,
        path: '/rick-astley',
        rawBody: {
          message:
            'never gonna say goodbye, never gonna tell a lie and hurt you',
        },
        rawQuery: {},
        signal: undefined,
      }),
    );
  });
});
