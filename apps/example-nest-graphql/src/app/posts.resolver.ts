import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Post } from '../graphql';
import { PostService } from './post.service';

@Resolver('Post')
export class PostResolver {
  constructor(private postService: PostService) {}

  @Query()
  async posts() {
    const posts = await this.postService.getPosts({});

    return posts;
  }

  @ResolveField('author')
  async author(@Parent() post: Post) {
    const author = await this.postService.getAuthor(post.authorId);

    return author;
  }
}
