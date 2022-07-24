import { Post } from '@tscont/example-contracts';

const data: Post[] = [
  { id: '1', title: 'Post 1', body: 'This is post 1' },
  { id: '2', title: 'Post 2', body: 'This is post 2' },
  { id: '3', title: 'Post 3', body: 'This is post 3' },
  { id: '4', title: 'Post 4', body: 'This is post 4' },
];

const comments: { postId: string; message: string }[] = [
  { postId: '1', message: 'Comment 1' },
  { postId: '1', message: 'Comment 2' },
  { postId: '2', message: 'Comment 3' },
  { postId: '3', message: 'Comment 4' },
  { postId: '4', message: 'Comment 5' },
];

export const database = {
  findOne: (id: string) => {
    return data.find((post) => post.id === id);
  },
  findAll: () => {
    return data;
  },
  findPostComments: (id: string) => {
    return comments.filter((comment) => comment.postId === id);
  },
};
