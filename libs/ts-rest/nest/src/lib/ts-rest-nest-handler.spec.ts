import { doesUrlMatchContractPath } from './ts-rest-nest-handler';

describe('doesUrlMatchContractPath', () => {
  it.each`
    contractPath    | url           | expected
    ${'/'}          | ${'/'}        | ${true}
    ${'/'}          | ${'/api'}     | ${false}
    ${'/api'}       | ${'/api'}     | ${true}
    ${'/posts/:id'} | ${'/posts/1'} | ${true}
    ${'/posts/:id'} | ${'/posts/1'} | ${true}
    ${'/posts/:id'} | ${'/posts'}   | ${false}
  `(
    'should return $expected when contractPath is $contractPath and url is $url',
    ({ contractPath, url, expected }) => {
      expect(doesUrlMatchContractPath(contractPath, url)).toBe(expected);
    }
  );
});
