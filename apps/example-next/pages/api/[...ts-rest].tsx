import { apiNested } from '@ts-rest/example-contracts';
import { createNextRoute, createNextRouter } from '@ts-rest/next';
import { posts } from '../../server/posts';

const postsRouter = createNextRoute(apiNested.posts, {
  createPost: async (args) => {
    const newPost = await posts.createPost(args.body);

    return {
      status: 201,
      body: newPost,
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
    const post = await posts.getPost(params.id);

    if (!post) {
      return {
        status: 404,
        body: null,
      };
    }

    return {
      status: 200,
      body: post,
    };
  },
  getPosts: async (args) => {
    const allPosts = await posts.getPosts();

    return {
      status: 200,
      body: {
        posts: allPosts,
        total: allPosts.length,
      },
    };
  },
});

const healthRouter = createNextRoute(apiNested.health, {
  check: async (args) => {
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
