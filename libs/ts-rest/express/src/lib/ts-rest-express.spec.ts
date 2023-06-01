import { initContract } from '@ts-rest/core';
import { getValue, initServer } from './ts-rest-express';

const c = initContract();
const postsRouter = c.router({
  getPost: {
    method: 'GET',
    path: `/posts/:id`,
    responses: {
      200: null,
    },
  },
});

describe('strict mode', () => {
  it('allows unknown responses when not in strict mode', () => {
    const cLoose = c.router({ posts: postsRouter });
    const s = initServer();

    s.router(cLoose, {
      posts: {
        getPost: async ({ params: { id } }) => {
          return {
            status: 201,
            body: null,
          };
        },
      },
    });
  });

  it('does not allow unknown statuses when in strict mode', () => {
    const cStrict = c.router(
      { posts: postsRouter },
      { strictStatusCodes: true }
    );
    const s = initServer();

    s.router(cStrict, {
      posts: {
        // @ts-expect-error 201 is not defined as a known response
        getPost: async ({ params: { id } }) => {
          return {
            status: 201,
            body: null,
          };
        },
      },
    });
  });
});

describe('getValue', () => {
  it('should get one level deep', () => {
    const obj = {
      title: 'Title',
    };

    const value = getValue(obj, 'title');

    expect(value).toBe('Title');
  });

  it('should get one level deep with nullable', () => {
    const obj = {
      title: 'Title',
    };

    const value = getValue(obj, 'test', null);

    expect(value).toBe(null);
  });

  it('should get two levels deep', () => {
    const obj = {
      sub: {
        text: 'text',
      },
    };

    const value = getValue(obj, 'sub.text');

    expect(value).toBe('text');
  });
});
