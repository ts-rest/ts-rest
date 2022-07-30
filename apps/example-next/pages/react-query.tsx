import { clientReactQuery } from '../api';

export const Index = () => {
  const { data, isLoading, refetch } = clientReactQuery.posts.getPosts.useQuery(
    ['posts'],
    {
      query: {},
    }
  );

  const { mutate: createPost, isLoading: isCreatePostLoading } =
    clientReactQuery.posts.createPost.useMutation({
      onSuccess: () => refetch(),
    });

  const { mutate: deletePost } = clientReactQuery.posts.deletePost.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {data?.map((post) => (
            <div key={post.id} className="bg-gray-100">
              <h3 className="text-lg">{post.title}</h3>
              <p>{post.description}</p>
              <button onClick={() => deletePost({ params: { id: post.id } })}>
                delete
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        disabled={isCreatePostLoading}
        onClick={() =>
          createPost({
            body: {
              title: 'Hello World',
              content: 'content',
              authorId: 'cl61gznu7000109la4ngq97zk',
            },
          })
        }
      >
        {isCreatePostLoading ? 'Loading' : 'Create Post'}
      </button>
    </div>
  );
};

export default Index;
