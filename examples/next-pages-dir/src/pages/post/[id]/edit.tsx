import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Post } from '@ts-rest-examples/contracts';
import { tsr } from '@/lib/tsr';

interface Form {
  title: string;
  description: string;
  content: string;
}

const Edit = ({ post }: { post: Post }) => {
  const tsrQueryClient = tsr.useQueryClient();
  const router = useRouter();

  const { register, handleSubmit } = useForm<Form>({
    defaultValues: {
      title: post.title,
      description: post.description || '',
      content: post.content || '',
    },
  });

  const { mutate } = tsr.updatePost.useMutation({
    onSuccess: async (res) => {
      await tsrQueryClient.invalidateQueries({ queryKey: ['posts'] });
      await tsrQueryClient.invalidateQueries({
        queryKey: ['post', res.body.id],
      });
      await router.push(`/post/${res.body.id}`);
      toast.success('Post updated!');
    },
  });

  const submit = async (data: Form) => {
    mutate({
      params: {
        id: post.id,
      },
      body: {
        title: data.title,
        description: data.description,
        content: data.content,
      },
    });
  };

  return (
    <div className="prose">
      <h1>Edit Post</h1>
      <form onSubmit={handleSubmit(submit)}>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            {...register('title', { required: true })}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            {...register('description', { required: true })}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Content</span>
          </label>
          <textarea
            className="textarea textarea-bordered"
            {...register('content', { required: true })}
          />
        </div>
        <button className="btn mt-4">Edit Post</button>
      </form>
    </div>
  );
};

export function Index() {
  const router = useRouter();

  const postId = router.query.id as string;

  const { data, isPending, isError } = tsr.getPost.useQuery({
    queryKey: [`post-${postId}`],
    queryData: {
      params: { id: postId },
    },
  });

  if (isError) {
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

  return <Edit post={data.body} />;
}

export default Index;
