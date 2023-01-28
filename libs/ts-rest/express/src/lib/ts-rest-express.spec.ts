import { getValue } from './ts-rest-express';

describe('getValue', () => {
  it('should get one level deep', () => {
    const obj = {
      title: 'Title',
    };

    const value = getValue(obj, 'title');

    expect(value).toBe('Title');
  });

  it('should get one level deep with nullable', () => {
    const obj = {
      title: 'Title',
    };

    const value = getValue(obj, 'test', null);

    expect(value).toBe(null);
  });

  it('should get two levels deep', () => {
    const obj = {
      sub: {
        text: 'text',
      },
    };

    const value = getValue(obj, 'sub.text');

    expect(value).toBe('text');
  });
});
