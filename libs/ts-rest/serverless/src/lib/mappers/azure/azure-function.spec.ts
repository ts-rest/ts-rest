import { requestFromHttpRequest } from './azure-function';
import {
  azureFunctionGetHttpRequest,
  azureFunctionPostHttpRequest,
} from './test-data/azure-function-http-request';

const headerToObject = (headers: Headers) => {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

describe('AzureFunction', () => {
  describe('requestFromHttpRequest', () => {
    it('should work for GET http request', async () => {
      const request = await requestFromHttpRequest(azureFunctionGetHttpRequest);

      expect(request.method).toEqual('GET');
      expect(request.url).toEqual(
        'http://localhost/?parameter1=value1&parameter2=value2',
      );
      expect(headerToObject(request.headers)).toEqual({
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'content-type': 'application/json',
      });
      expect(request.body).toEqual(null);
    });

    it('should work for POST http request', async () => {
      const request = await requestFromHttpRequest(
        azureFunctionPostHttpRequest,
      );

      expect(request.method).toEqual('POST');
      expect(request.url).toEqual('http://localhost/post');
      expect(headerToObject(request.headers)).toEqual({
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'content-type': 'application/json',
      });
      expect(await request.text()).toEqual('{"foo":"bar"}');
    });
  });
});
