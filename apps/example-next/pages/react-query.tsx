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

  const { mutate: healthMutate } = clientReactQuery.healthMutation.useMutation({
    onSettled: (res, err) => console.log('health mutated', res, err),
  });

  const health = clientReactQuery.health.useQuery(['health'], {
    query: {},
  });

  const healthBad = clientReactQuery.health.useQuery(['healthBad'], {
    query: { mockError: true },
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
      <p>Health</p>
      {health.isLoading ? 'loading' : null}

      <pre>{JSON.stringify(health.data, null, 2)}</pre>
      <pre>{JSON.stringify(health.error, null, 2)}</pre>

      <button onClick={() => healthMutate({ body: { mockError: false } })}>
        health OK mutate
      </button>

      <p>Health Bad</p>
      {healthBad.isLoading ? 'loading' : null}
      <pre>{JSON.stringify(healthBad.data, null, 2)}</pre>
      <pre>{JSON.stringify(healthBad.error, null, 2)}</pre>

      <button onClick={() => healthMutate({ body: { mockError: true } })}>
        health bad mutate
      </button>
    </div>
  );
};

export default Index;
