'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { tsr } from '@/lib/react-query/tsr';

interface Form {
  title: string;
  description: string;
  content: string;
}

export const Edit = ({ postId }: { postId: string }) => {
  const router = useRouter();
  const tsrQueryClient = tsr.useQueryClient();

  const {
    data: { body: post },
  } = tsr.getPost.useSuspenseQuery({
    queryKey: ['post', postId],
    queryData: { params: { id: postId } },
  });

  const { register, handleSubmit } = useForm<Form>({
    defaultValues: {
      title: post.title,
      description: post.description || '',
      content: post.content || '',
    },
  });

  const { mutate } = tsr.updatePost.useMutation({
    onSuccess: async (res) => {
      await tsrQueryClient.invalidateQueries({
        queryKey: ['post', res.body.id],
      });
      await tsrQueryClient.invalidateQueries({ queryKey: ['posts'] });
      router.push(`/post/${res.body.id}`);
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
