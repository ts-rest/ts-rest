import { nonStrictModeTest } from './non-strict-mode-test';

describe('nonStrictModeTest', () => {
  it('should work', () => {
    expect(nonStrictModeTest()).toEqual('non-strict-mode-test');
  });
});
