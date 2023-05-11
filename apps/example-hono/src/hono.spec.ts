import { app } from './server';
import * as fs from 'fs';
import * as path from 'path';

describe('Hono', () => {
  it('get works', async () => {
    const result = await app.request('/test');

    expect(result.status).toBe(200);

    const body = await result.json();

    expect(body).toEqual({
      foo: 'Hello World!',
    });
  });

  it('post works', async () => {
    const result = await app.request('/test', {
      method: 'POST',
      body: JSON.stringify({
        foo: 'bar',
      }),
    });

    expect(result.status).toBe(200);

    const body = await result.json();

    expect(body).toEqual({
      foo: 'bar',
    });
  });

  it('file upload works', async () => {
    const image = fs.readFileSync(path.join(__dirname, './logo.png'));

    const imageBlob = new Blob([image], { type: 'image/png' });

    const formData = new FormData();

    formData.append('file', imageBlob);

    const result = await app.request('/file-upload', {
      method: 'POST',
      body: formData,
    });

    expect(result.status).toBe(200);

    const body = await result.json();

    expect(body).toEqual({
      message: 'File foo.txt uploaded',
    });
  });
});
