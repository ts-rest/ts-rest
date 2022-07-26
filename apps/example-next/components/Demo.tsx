import { useQuery } from '@tanstack/react-query';
import { InitClientReturn } from '@ts-rest/core';
import { router } from '@tscont/example-contracts';
import { queryClient } from '../pages/_app';

interface DemoProps {
  client: InitClientReturn<typeof router>;
  id: string;
}

export const Demo: React.FunctionComponent<DemoProps> = ({ client, id }) => {
  const { data, isLoading } = useQuery([`post-${id}`], () =>
    client.posts.getPosts({ query: {} })
  );

  const handleUpdatePost = async (id: string) => {
    await client.posts.updatePost({
      params: {
        id,
      },
      body: {
        title: 'New Title',
        content: 'New Content',
        description: 'Updated description',
      },
    });

    queryClient.refetchQueries([`post-${id}`]);
  };

  const handleDeletePost = async (id: string) => {
    await client.posts.deletePost({
      params: {
        id,
      },
      body: {},
    });

    queryClient.refetchQueries([`post-${id}`]);
  };

  const handleCreatePost = async () => {
    await client.posts.createPost({
      body: {
        title: 'New Title',
        content: 'New Content',
        description: 'New post description',
        authorId: 'cl61gznu7000109la4ngq97zk',
      },
    });

    queryClient.refetchQueries([`post-${id}`]);
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {data.data.map((post) => (
            <div key={post.id} className="bg-gray-100">
              <h3 className="text-lg">{post.title}</h3>
              <p>{post.description}</p>
              <button onClick={() => handleUpdatePost(post.id)}>Update</button>
              <button onClick={() => handleDeletePost(post.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
      <button onClick={handleCreatePost}>Create</button>
    </div>
  );
};
