import { Module } from '@nestjs/common';

import { PostController } from './post.controller';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { PostService } from './post.service';
import { UserController } from './user.controller';

@Module({
  imports: [],
  controllers: [PostController, HealthController, UserController],
  providers: [PrismaService, PostService],
})
export class AppModule {}
