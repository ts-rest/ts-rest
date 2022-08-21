import { Module } from '@nestjs/common';

import { PostController } from './post.controller';
import { PrismaService } from './prisma.service';
import { PostService } from './post.service';

@Module({
  imports: [],
  controllers: [PostController],
  providers: [PrismaService, PostService],
})
export class AppModule {}
