import { Module } from '@nestjs/common';

import { PostController } from './post.controller';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { PostService } from './post.service';

@Module({
  imports: [],
  controllers: [PostController, HealthController],
  providers: [PrismaService, PostService],
})
export class AppModule {}
