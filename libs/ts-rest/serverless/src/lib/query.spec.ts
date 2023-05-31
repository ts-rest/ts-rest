import { parseQueryString } from './query';

describe('parseQueryString', () => {
  it('should parse regular query', () => {
    expect(parseQueryString('foo=bar&baz=loo')).toEqual({
      foo: 'bar',
      baz: 'loo',
    });
  });

  it('should parse query with array', () => {
    expect(parseQueryString('foo=bar&foo=baz')).toEqual({
      foo: ['bar', 'baz'],
    });
  });

  it('should parse query with object', () => {
    expect(parseQueryString('foo[bar]=baz')).toEqual({
      foo: {
        bar: 'baz',
      },
    });
  });

  it('should parse query with array and object', () => {
    expect(parseQueryString('foo[bar]=baz&foo[bar]=qux')).toEqual({
      foo: {
        bar: ['baz', 'qux'],
      },
    });
  });

  it('should parse query with deep object', () => {
    expect(parseQueryString('foo[bar][baz]=qux')).toEqual({
      foo: {
        bar: {
          baz: 'qux',
        },
      },
    });
  });

  it('should be empty if no params', () => {
    expect(parseQueryString('')).toEqual({});
  });

  it('should convert url string to query params', () => {
    expect(parseQueryString('id=1&commentId=2&commentId2=3')).toEqual({
      id: '1',
      commentId: '2',
      commentId2: '3',
    });
  });

  it('should handle arrays', () => {
    expect(
      parseQueryString(encodeURI('array[0]=1&array[1]=2&array[2]=3&id=1'))
    ).toEqual({
      array: ['1', '2', '3'],
      id: '1',
    });
  });

  it('should handle arrays', () => {
    expect(
      parseQueryString(encodeURI('array[0]=1&array[1]=2&array[2]=3&id=1'))
    ).toEqual({
      array: ['1', '2', '3'],
      id: '1',
    });
  });

  it('should handle nested query strings with arrays and other keys', () => {
    expect(
      parseQueryString(
        encodeURI(
          'nested[array][0]=1&nested[array][1]=2&nested[array][2]=3&nested[id]=1&nested[nestedNested][id]=2'
        )
      )
    ).toEqual({
      nested: {
        array: ['1', '2', '3'],
        id: '1',
        nestedNested: {
          id: '2',
        },
      },
    });
  });

  it('should handle objects', () => {
    expect(parseQueryString(encodeURI('object[id]=1'))).toEqual({
      object: { id: '1' },
    });
  });

  it('should handle arrays of objects', () => {
    expect(
      parseQueryString(encodeURI('array[0][id]=1&array[1][id]=2'))
    ).toEqual({
      array: [{ id: '1' }, { id: '2' }],
    });
  });

  it('should handle arrays of arrays', () => {
    expect(parseQueryString(encodeURI('array[0][0]=1&array[0][1]=2'))).toEqual({
      array: [['1', '2']],
    });
  });

  it('should handle values with equals sign in key', () => {
    expect(parseQueryString('foo%3Dbar=baz')).toEqual({
      'foo=bar': 'baz',
    });
  });

  it('should handle values with equals sign in value', () => {
    expect(parseQueryString('foo=bar%3Dbaz')).toEqual({
      foo: 'bar=baz',
    });
  });
});
