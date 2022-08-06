import { Parent, Args, ResolveField, Resolver, Query } from '@nestjs/graphql';
import { User } from '../graphql';
import { PrismaService } from './prisma.service';

@Resolver('User')
export class UserResolver {
  constructor(private prisma: PrismaService) {}

  @Query('users')
  async users() {
    const users = await this.prisma.user.findMany({});

    return users;
  }

  @Query('user')
  async user(@Args('id') id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    return user ?? null;
  }

  @ResolveField('posts')
  async author(@Parent() author: User) {
    const posts = await this.prisma.post.findMany({
      where: {
        authorId: author.id,
      },
    });

    return posts;
  }
}
