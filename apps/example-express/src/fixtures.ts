import { Post } from '@ts-rest/example-contracts';

export const mockPostFixtureFactory = (partial: Partial<Post>): Post => ({
  id: 'mock-id',
  title: `Post`,
  content: `Content`,
  description: `Description`,
  published: true,
  tags: ['tag1', 'tag2'],
  ...partial,
});

type OwnedPost = Post & { ownerId: string };

export const mockOwnedResource = (
  resource: 'post',
  partial: Partial<OwnedPost>
): OwnedPost => ({
  id: 'mock-id',
  ownerId: 'mock-owner-id',
  title: `Post`,
  content: `Content`,
  description: `Description`,
  published: true,
  tags: ['tag1', 'tag2'],
  ...partial,
});
