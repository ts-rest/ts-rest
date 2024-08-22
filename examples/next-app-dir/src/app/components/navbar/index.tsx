import Link from 'next/link';
import { SearchInput } from '@/app/components/navbar/search-input';
import { Breadcrumbs } from '@/app/components/navbar/breadcumbs';

export const Navbar: React.FunctionComponent = () => {
  return (
    <div className="navbar bg-base-100 ">
      <div className="flex-1">
        <Breadcrumbs />
      </div>

      <div className="flex-none gap-2">
        <SearchInput />
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
