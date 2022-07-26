import Link from 'next/link';

export function Index() {
  return (
    <div>
      <h1 className="text-blue-300">@ts-rest/core</h1>

      <Link href="examples/client">
        <span>Example</span>
      </Link>
    </div>
  );
}

export default Index;
