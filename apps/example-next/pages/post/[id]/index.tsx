import { useRouter } from 'next/router';
import { Post } from '../../../components/Post';

export function Index() {
  const router = useRouter();

  const postId = router.query.id as string;

  if (!postId) {
    return null;
  }

  return <Post postId={postId} />;
}

export default Index;
