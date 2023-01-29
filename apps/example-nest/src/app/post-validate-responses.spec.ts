import { PostService } from './post.service';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Post } from '@prisma/client';
import * as request from 'supertest';
import { PostValidateResponsesController } from './post-validate-responses.controller';

describe('PostValidateResponsesController', () => {
  let app: INestApplication;
  let postService: PostService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PostValidateResponsesController],
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

  describe('GET /posts', () => {
    it('should succeed validation, cleanup extra fields and add default fields', async () => {
      jest.spyOn(postService, 'getPosts').mockImplementation(async () => ({
        posts: [
          {
            id: '1',
            title: 'foo',
            description: 'foo',
            content: 'bar',
            published: true,
            tags: [],
            image: 'baz.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalPosts: 1,
      }));

      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect({
          posts: [
            {
              id: '1',
              title: 'foo',
              description: 'foo',
              content: 'bar',
              published: true,
              tags: [],
            },
          ],
          count: 1,
          skip: 0,
          take: 50,
          extra: 'hello world',
        });
    });

    it('should fail with missing fields', async () => {
      jest.spyOn(postService, 'getPosts').mockImplementation(async () => ({
        posts: [{} as Post],
        totalPosts: 1,
      }));

      return request(app.getHttpServer())
        .get('/posts')
        .expect(500)
        .expect({ statusCode: 500, message: 'Internal Server Error' });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
