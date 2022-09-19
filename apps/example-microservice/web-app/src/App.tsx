import React from 'react';
import { postsClient } from './main';

export const App = () => {
  const { data } = postsClient.getPosts.useQuery(['posts'], {
    query: {},
  });

  const posts = data?.body || [];

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>
          <h1>{post.title}</h1>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
};
