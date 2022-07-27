import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';

describe('AppController', () => {
  let appController: PostController;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: {
            getPosts: jest.fn(),
            getPost: jest.fn(),
            createPost: jest.fn(),
            updatePost: jest.fn(),
            deletePost: jest.fn(),
          },
        },
      ],
    }).compile();
    appController = app.get<PostController>(PostController);
  });

  describe('root', () => {
    it('should return posts', async () => {
      const posts = await appController.getPosts();

      expect(posts).toBe([]);
    });
  });
});
