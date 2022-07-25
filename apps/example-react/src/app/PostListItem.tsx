import { Post } from '@tscont/example-contracts';

interface PostListItemProps {
  post: Post;
}

export const PostListItem: React.FunctionComponent<PostListItemProps> = ({
  post,
}) => {
  return <div>{post.title}</div>;
};
