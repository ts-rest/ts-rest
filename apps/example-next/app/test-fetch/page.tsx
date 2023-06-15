import { initClient } from '@ts-rest/core';
import { testContract } from '../../contracts/test';
import { DataComponent } from './data-component';

const edgeApi = initClient(testContract, {
  baseUrl: 'http://localhost:4200/api/edge',
  baseHeaders: {},
});

export default async function Test() {
  const response = await edgeApi.test({
    params: { id: 1 },
    query: { foo: 'test', bar: 123 },
  });

  if (response.status !== 200) {
    return <div>Error</div>;
  }

  return (
    <main>
      <DataComponent data={response.body} />
    </main>
  );
}
