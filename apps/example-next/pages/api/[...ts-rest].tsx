import { apiNested } from '@ts-rest/example-contracts';
import { createNextRoute, createNextRouter } from '@ts-rest/next';

const postsRouter = createNextRoute(apiNested.posts, {
  createPost: async (args) => {
    return {
      status: 200,
      body: {
        id: '1',
      },
    };
  },
  updatePost: async (args) => {
    return {
      status: 200,
      body: {
        id: '1',
        title: 'title',
        tags: [],
        description: '',
        content: '',
        published: false,
      },
    };
  },
  deletePost: async (args) => {
    return {
      status: 200,
      body: { message: 'Post deleted' },
    };
  },
  getPost: async ({ params }) => {
    console.log(params);

    if (params.id === '2') {
      return {
        status: 404,
        body: null,
      };
    }

    return {
      status: 200,
      body: {
        id: '1',
        title: 'title',
        tags: [],
        description: '',
        content: '',
        published: false,
      },
    };
  },
  getPosts: async (args) => {
    return {
      status: 200,
      body: {
        posts: [
          {
            id: '1',
            title: 'title',
            tags: [],
            description: '',
            content: '',
            published: false,
          },
        ],
        total: 1,
      },
    };
  },
});

const healthRouter = createNextRoute(apiNested.health, {
  check: async () => {
    return {
      status: 200,
      body: { message: 'OK' },
    };
  },
});

const router = createNextRoute(apiNested, {
  posts: postsRouter,
  health: healthRouter,
});

export default createNextRouter(apiNested, router);
