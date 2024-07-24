import React from 'react';
import { tsr } from './main';

export const App = () => {
  const { data } = tsr.getPosts.useQuery({
    queryKey: ['posts'],
  });

  const posts = data?.body || [];

  const [file, setFile] = React.useState<File | null>(null);

  return (
    <div>
      <h1>Posts from posts-service</h1>
      {posts.map((post) => (
        <div key={post.id}>
          <h1>{post.title}</h1>
          <p>{post.content}</p>
          <input
            multiple={false}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={() => {
              if (file) {
                tsr.updatePostThumbnail.mutate({
                  body: {
                    thumbnail: file,
                    data: 'Hey there!',
                  },
                  params: {
                    id: '1',
                  },
                });
              }
            }}
          >
            Upload
          </button>
        </div>
      ))}
    </div>
  );
};
