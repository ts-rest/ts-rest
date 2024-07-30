import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { tsr } from '../pages-tsr';

export const Post = ({ postId }: { postId: string }) => {
  const router = useRouter();

  const { data, error, isPending } = tsr.getPost.useQuery({
    queryKey: ['post', postId],
    queryData: { params: { id: postId } },
    networkMode: 'offlineFirst',
    enabled: postId !== undefined,
    staleTime: 1000 * 60 * 30,
  });

  const { mutate: deletePost } = tsr.deletePost.useMutation({
    onSuccess: () => {
      router.push('/');
      toast.success('Post deleted!');
    },
  });

  if (error) {
    return (
      <div className="prose w-full h-full flex flex-row justify-center items-center">
        <div>
          <h1>Post not found!</h1>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="prose w-full h-full flex flex-row justify-center items-center">
        <div>
          <h1>Loading...</h1>
          <progress className="progress w-56"></progress>
        </div>
      </div>
    );
  }

  const post = data.body;

  return (
    <div>
      {post ? (
        <div className="prose max-w-none mx-auto px-2 sm:px-0">
          <div className="flex flex-col gap-4 sm:flex-row mb-10">
            <div className="flex flex-col">
              <h1 className="mb-2">{post.title}</h1>
              <h3 className="mt-0">{post.description}</h3>
            </div>
          </div>

          <p>{post.content}</p>

          <div className="flex flex-row gap-2">
            <button
              className="btn btn-error"
              onClick={() => deletePost({ params: { id: post.id } })}
            >
              Delete
            </button>
            <Link href={`/post/${post.id}/edit`}>
              <button className="btn">Edit</button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};
