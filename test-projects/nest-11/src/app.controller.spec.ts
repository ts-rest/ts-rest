import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('AppController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('root', () => {
    it('should return "Hello from Nest 11!"', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello from Nest 11!');
    });
  });
});
