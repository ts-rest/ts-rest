'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Breadcrumbs: React.FunctionComponent = () => {
  const pathname = usePathname();
  const isPost = pathname.match(/\/post\/\w+/);

  return (
    <div className="breadcrumbs text-lg font-bold ">
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        {isPost ? <li>Post</li> : null}
      </ul>
    </div>
  );
};
