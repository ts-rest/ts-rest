import { router, User } from './api';
import { initClient } from './dsl';

const mockApi = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_: { path: string; method: string; headers: Record<string, string> }) => {
    return Promise.resolve({ status: 200, data: {} });
  }
);

const mockUser: User = {
  id: '1',
  name: 'John Doe',
};

describe('query', () => {
  it('should return valid data', async () => {
    mockApi.mockResolvedValue({ status: 200, data: mockUser });

    const client = initClient(router, {
      api: mockApi,
      baseUrl: 'http://localhost:3000',
      baseHeaders: {
        Authorization: 'Bearer 123',
      },
    });

    const { data, status } = await client.user.getUser({ id: 'jeff' });

    expect(mockApi).toHaveBeenCalledWith({
      path: 'http://localhost:3000/users/jeff',
      method: 'GET',
      headers: {
        Authorization: 'Bearer 123',
      },
    });

    expect(data).toBe(mockUser);
    expect(status).toBe(200);
  });
});
