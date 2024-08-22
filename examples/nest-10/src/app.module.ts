import { Module } from '@nestjs/common';
import { TsRestModule } from '@ts-rest/nest';
import { BlogModule } from './blog/blog.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    TsRestModule.register({
      isGlobal: true,
      jsonQuery: true,
      validateResponses: true,
    }),
    CommonModule,
    BlogModule,
  ],
})
export class AppModule {}
