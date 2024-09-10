import type { Post } from '@ts-rest-examples/contracts';

export const mockPost = (partial: Partial<Post>): Post => ({
  id: 'mock-id',
  title: 'Post',
  content: 'Content',
  description: 'Description',
  published: true,
  ...partial,
});
