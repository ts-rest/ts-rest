import {
  arrayBufferToBase64,
  arrayBufferToString,
  blobToArrayBuffer,
  splitCookiesString,
} from './utils';

describe('utils', () => {
  let nullArrayBuffer: ArrayBuffer;

  beforeAll(async () => {
    nullArrayBuffer = await blobToArrayBuffer(
      new Blob([Buffer.from('AAAAAAAAAAAAAA==', 'base64')]),
    );
  });

  describe('arrayBufferToBase64', () => {
    it('should convert ArrayBuffer with binary data to base64 string', async () => {
      const base64 = await arrayBufferToBase64(nullArrayBuffer);
      expect(base64).toBe('AAAAAAAAAAAAAA==');
    });

    it('should convert ArrayBuffer with text data to base64 string', async () => {
      const buffer = new TextEncoder().encode('Hello World').buffer;
      const base64 = await arrayBufferToBase64(buffer);
      expect(base64).toBe(btoa('Hello World'));
    });

    it('should convert Blob with binary data to base64 string', async () => {
      const blob = new Blob([nullArrayBuffer]);
      const base64 = await arrayBufferToBase64(blob);
      expect(base64).toBe('AAAAAAAAAAAAAA==');
    });

    it('should convert Blob with text data to base64 string', async () => {
      const blob = new Blob(['Hello World']);
      const base64 = await arrayBufferToBase64(blob);
      expect(base64).toBe(btoa('Hello World'));
    });
  });

  describe('arrayBufferToString', () => {
    it('should convert ArrayBuffer to string', async () => {
      const buffer = new TextEncoder().encode('Hello World').buffer;
      const string = await arrayBufferToString(buffer);
      expect(string).toBe('Hello World');
    });

    it('should convert Blob to string', async () => {
      const blob = new Blob(['Hello World']);
      const string = await arrayBufferToString(blob);
      expect(string).toBe('Hello World');
    });

    it('should convert ArrayBuffer with binary data to string', async () => {
      const string = await arrayBufferToString(nullArrayBuffer);
      expect(string).toBe('\0\0\0\0\0\0\0\0\0\0');
    });
  });

  describe('splitCookiesString', () => {
    it('should split single cookie string properly', () => {
      const cookiesString = 'name=value';
      const result = splitCookiesString(cookiesString);
      expect(result).toEqual(['name=value']);
    });

    it('should split multiple cookies string properly', () => {
      const cookiesString = 'name1=value1, name2=value2';
      const result = splitCookiesString(cookiesString);
      expect(result).toEqual(['name1=value1', 'name2=value2']);
    });

    it('should handle cookies with semicolons in values properly', () => {
      const cookiesString = 'name1=value1;Path=/,name2=value2;Path=/another';
      const result = splitCookiesString(cookiesString);
      expect(result).toEqual([
        'name1=value1;Path=/',
        'name2=value2;Path=/another',
      ]);
    });

    it('should handle cookies with spaces around commas properly', () => {
      const cookiesString = 'name1=value1; Path=/, name2=value2; Path=/another';
      const result = splitCookiesString(cookiesString);
      expect(result).toEqual([
        'name1=value1; Path=/',
        'name2=value2; Path=/another',
      ]);
    });
  });
});
