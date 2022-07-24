import { Comment, Post } from '@tscont/example-contracts';

const data: Post[] = [
  { id: '1', title: 'Post 1', body: 'This is post 1' },
  { id: '2', title: 'Post 2', body: 'This is post 2' },
  { id: '3', title: 'Post 3', body: 'This is post 3' },
  { id: '4', title: 'Post 4', body: 'This is post 4' },
];

const comments: Comment[] = [
  { postId: '1', body: 'Comment 1', id: '1' },
  { postId: '1', body: 'Comment 2', id: '2' },
  { postId: '2', body: 'Comment 3', id: '3' },
  { postId: '3', body: 'Comment 4', id: '4' },
  { postId: '4', body: 'Comment 5', id: '5' },
];

export const database = {
  findOne: (id: string) => {
    return data.find((post) => post.id === id);
  },
  findAll: () => {
    return data;
  },
  findPostComments: (id: string): Comment[] => {
    return comments.filter((comment) => comment.postId === id);
  },
};
