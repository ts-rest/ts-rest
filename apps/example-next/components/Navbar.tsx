import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from '../state';

export const Navbar: React.FunctionComponent = () => {
  const router = useRouter();

  const { searchString, setSearchString } = useStore();

  const post = router.query.id as string | undefined;

  return (
    <div className="navbar bg-base-100 ">
      <div className="flex-1">
        <div className="breadcrumbs text-lg font-bold ">
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            {post ? <li>Post</li> : null}
          </ul>
        </div>
      </div>

      <div className="flex-none gap-2">
        <div className="form-control">
          <input
            type="text"
            placeholder="Search"
            className="input input-bordered"
            value={searchString}
            onChange={(e) => {
              // if not on homepage, redirect to homepage
              if (router.pathname !== '/') {
                router.push('/');
              }

              setSearchString(e.target.value);
            }}
          />
        </div>
        <Link href="/post/new">
          <button className="btn ">New Post</button>
        </Link>
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle">
            <div className="avatar placeholder">
              <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                <span className="text-xs">OB</span>
              </div>
            </div>
          </label>
          <ul
            tabIndex={0}
            className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
