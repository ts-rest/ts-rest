import { useQuery } from '@tanstack/react-query';
import { clientReactQuery } from '../../api';

export const Index = () => {
  const { data, isLoading } = useQuery([`posts`], () =>
    clientReactQuery.posts.getPosts({ query: {} })
  );

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
