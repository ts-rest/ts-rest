import { apiNested } from '@ts-rest-examples/contracts';
import { createNextRoute, createNextRouter } from '@ts-rest/next';
import prisma from '@/server/db';

const postsRouter = createNextRoute(apiNested.posts, {
  getPosts: async ({ query: { take, skip, search } }) => {
    const posts = await prisma.post.findMany({
      take,
      skip,
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: { contains: search },
                },
                {
                  content: { contains: search },
                },
                {
                  description: { contains: search },
                },
              ],
            }
          : {}),
      },
    });

    const count = await prisma.post.count({
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: { contains: search },
                },
                {
                  content: { contains: search },
                },
                {
                  description: { contains: search },
                },
              ],
            }
          : {}),
      },
    });

    return {
      status: 200,
      body: {
        posts,
        count,
        skip,
        take,
      },
    };
  },
  getPost: async ({ params: { id } }) => {
    const post = await prisma.post.findUnique({
      where: { id },
    });

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
  createPost: async ({ body }) => {
    const post = await prisma.post.create({
      data: {
        ...body,
      },
    });

    return {
      status: 201,
      body: post,
    };
  },
  updatePost: async ({ params: { id }, body }) => {
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return {
      status: 200,
      body: post,
    };
  },
  deletePost: async ({ params: { id } }) => {
    if (id === 'all') {
      await prisma.post.deleteMany();
    } else {
      await prisma.post.delete({
        where: { id },
      });
    }

    return {
      status: 200,
      body: { message: 'Post deleted' },
    };
  },
  testPathParams: async ({ params }) => {
    return {
      status: 200,
      body: params,
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

export default createNextRouter(apiNested, router, {
  responseValidation: true,
  jsonQuery: true,
});
