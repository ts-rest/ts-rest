import { Module } from '@nestjs/common';

import { PostController } from './post.controller';
import { PostJsonQueryController } from './post-json-query.controller';
import { PrismaService } from './prisma.service';
import { PostService } from './post.service';

@Module({
  imports: [],
  controllers: [PostController, PostJsonQueryController],
  providers: [PrismaService, PostService],
})
export class AppModule {}
