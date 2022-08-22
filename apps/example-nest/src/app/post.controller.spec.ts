import { PostService } from './post.service';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('PostController', () => {
  let app: INestApplication;
  let postService: PostService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: PostService,
          useValue: {
            getPosts: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    postService = moduleRef.get<PostService>(PostService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET posts`, () => {
    return request(app.getHttpServer())
      .get('/posts')
      .expect(200)
      .expect({
        data: postService.getPosts({}),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
