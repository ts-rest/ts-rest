import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { join } from 'path';
import { PostService } from './post.service';
import { PostResolver } from './posts.resolver';
import { PrismaService } from './prisma.service';
import { UserResolver } from './users.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      definitions: {
        path: join(process.cwd(), 'apps/example-nest-graphql/src/graphql.ts'),
      },
    }),
  ],
  providers: [PostService, PrismaService, PostResolver, UserResolver],
})
export class AppModule {}
