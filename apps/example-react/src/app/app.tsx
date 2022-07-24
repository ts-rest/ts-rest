import { useState, useEffect } from 'react';
import { initClient, ApiFetcher } from 'tscont';
import { router, Post } from '@tscont/example-contracts';

const fetchApi: ApiFetcher = async ({ path, method, headers }) => {
  const result = await fetch(path, { method, headers }).then((res) =>
    res.json()
  );

  return { status: 200, data: result };
};

const client = initClient(router, {
  api: fetchApi,
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

export function App() {
  const [posts, setPosts] = useState<Post[] | null>(null);

  const fetchPosts = async () => {
    const { data } = await client.posts.getPosts();

    setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <>
      <h1>Posts</h1>
      <ul>
        {posts?.map((post) => (
          <li>
            <h3 key={post.id}>
              {post.id} {post.title}
            </h3>
            <p>{post.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
