import { Module } from '@nestjs/common';

import { PostController } from './post.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';

@Module({
  imports: [],
  controllers: [PostController, HealthController],
  providers: [AppService],
})
export class AppModule {}
