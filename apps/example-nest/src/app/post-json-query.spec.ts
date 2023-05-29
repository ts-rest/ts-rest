import { PostService } from './post.service';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Post } from '@prisma/client';
import * as request from 'supertest';
import { PostJsonQueryController } from './post-json-query.controller';

describe('PostJsonQueryController', () => {
  let app: INestApplication;
  let postService: PostService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PostJsonQueryController],
      providers: [
        {
          provide: PostService,
          useValue: {
            getPosts: jest.fn(),
            createPost: jest.fn(),
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('GET /posts-json-query', () => {
    it('should correctly parse number values', async () => {
      jest
        .spyOn(postService, 'getPosts')
        .mockImplementation(async ({ search }) => ({
          posts: [{ title: search } as Post],
          totalPosts: 1,
        }));

      return request(app.getHttpServer())
        .get('/posts-json-query')
        .set('x-api-key', 'foo')
        .query('skip=0&take=10&search="foo"')
        .expect(200)
        .expect({
          posts: [{ title: 'foo' }],
          count: 1,
          skip: 0,
          take: 10,
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
