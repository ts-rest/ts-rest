import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { tsr } from '../../pages-tsr';

interface Form {
  title: string;
  description: string;
  content: string;
}

export function Index() {
  const router = useRouter();

  const { mutate } = tsr.createPost.useMutation({
    onSuccess: (res) => {
      router.push(`/post/${res.body.id}`);
      toast.success('Post created!');
    },
  });

  const { register, handleSubmit } = useForm<Form>({});

  const submit = async (data: Form) => {
    mutate({
      body: {
        title: data.title,
        description: data.description,
        content: data.content,
      },
    });
  };

  return (
    <div className="prose">
      <h1>Create Post</h1>
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
        <button className="btn mt-4">Create Post</button>
      </form>
    </div>
  );
}

export default Index;
