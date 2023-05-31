import { TextEncoder, TextDecoder } from 'util';
import {
  isV2,
  requestBody,
  requestFromEvent,
  requestHeaders,
  requestMethod,
  requestRemoteAddress,
  requestUrl,
} from './api-gateway';
import * as apiGatewayEventV1 from './test-data/api-gateway-event-v1.json';
import * as apiGatewayEventV2 from './test-data/api-gateway-event-v2.json';
import * as apiGatewayPostEventV1 from './test-data/api-gateway-post-event-v1.json';

const headerToObject = (headers: Headers) => {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

describe('ApiGateway', () => {
  describe('isV2', () => {
    it('should return false for v1 event', () => {
      expect(isV2(apiGatewayEventV1 as any)).toStrictEqual(false);
    });

    it('should return true for v2 event', () => {
      expect(isV2(apiGatewayEventV2 as any)).toStrictEqual(true);
    });
  });

  describe('requestMethod', () => {
    it('should work for v1 event', () => {
      expect(requestMethod(apiGatewayEventV1 as any)).toStrictEqual('GET');
    });

    it('should work for v2 event', () => {
      expect(requestMethod(apiGatewayEventV2 as any)).toStrictEqual('GET');
    });
  });

  describe('requestRemoteAddress', () => {
    it('should work for v1 event', () => {
      expect(requestRemoteAddress(apiGatewayEventV1 as any)).toStrictEqual(
        '52.255.255.12'
      );
    });

    it('should work for v2 event', () => {
      expect(requestRemoteAddress(apiGatewayEventV2 as any)).toStrictEqual(
        '205.255.255.176'
      );
    });
  });

  describe('requestHeaders', () => {
    it('should work for v1 event', () => {
      expect(headerToObject(requestHeaders(apiGatewayEventV1 as any))).toEqual({
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        cookie:
          's_fid=7AAB6XMPLAFD9BBF-0643XMPL09956DE2; regStatus=pre-register',
        host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'upgrade-insecure-requests': '1',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'x-amzn-trace-id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
        'x-forwarded-for': '52.255.255.12',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      });
    });

    it('should work for v2 event', () => {
      expect(headerToObject(requestHeaders(apiGatewayEventV2 as any))).toEqual({
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        'content-length': '0',
        cookie:
          's_fid=7AABXMPL1AFD9BBF-0643XMPL09956DE2; regStatus=pre-register',
        host: 'r3pmxmplak.execute-api.us-east-2.amazonaws.com',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'x-amzn-trace-id': 'Root=1-5e6722a7-cc56xmpl46db7ae02d4da47e',
        'x-forwarded-for': '205.255.255.176',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      });
    });
  });

  describe('requestBody', () => {
    it('should work for v1 event', () => {
      const body = requestBody(apiGatewayPostEventV1 as any);
      const bodyString = new TextDecoder().decode(body);

      expect(JSON.parse(bodyString)).toEqual({
        foo: 'bar',
      });
    });
  });

  describe('requestUrl', () => {
    it('should work for v1 event', () => {
      expect(requestUrl(apiGatewayEventV1 as any)).toStrictEqual(
        '/?parameter1=value1&parameter3=value3&parameter3=value4&parameter2=value'
      );
    });

    it('should work for v2 event', () => {
      expect(requestUrl(apiGatewayEventV2 as any)).toStrictEqual(
        '/default/nodejs-apig-function-1G3XMPLZXVXYI?foo=bar'
      );
    });
  });

  describe('requestFromEvent', () => {
    it('should work for v1 event', () => {
      const request = requestFromEvent(apiGatewayEventV1 as any);

      expect(request.remoteAddress).toEqual('52.255.255.12');
      expect(request.method).toEqual('GET');
      expect(request.path).toEqual('/');
      expect(request.query).toEqual({
        parameter1: 'value1',
        parameter2: 'value',
        parameter3: ['value3', 'value4'],
      });
      expect(headerToObject(request.headers)).toEqual({
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        cookie:
          's_fid=7AAB6XMPLAFD9BBF-0643XMPL09956DE2; regStatus=pre-register',
        host: '70ixmpl4fl.execute-api.us-east-2.amazonaws.com',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'upgrade-insecure-requests': '1',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'x-amzn-trace-id': 'Root=1-5e66d96f-7491f09xmpl79d18acf3d050',
        'x-forwarded-for': '52.255.255.12',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      });
      expect(request.body).toEqual(new ArrayBuffer(0));
    });

    it('should work for v1 post event', () => {
      const request = requestFromEvent(apiGatewayPostEventV1 as any);

      expect(request.remoteAddress).toEqual('203.0.113.203');
      expect(request.method).toEqual('POST');
      expect(request.path).toEqual('/post');
      expect(request.query).toEqual({});
      expect(headerToObject(request.headers)).toEqual({
        accept: '*/*',
        authorization: 'Bearer REDACTED',
        'content-type': 'application/x-www-form-urlencoded',
        host: 'myapi.example.com',
        'user-agent': 'curl/7.58.0',
        'x-amzn-trace-id': 'Root=1-5f2330a4-6a0de1cd0e17c0508d386a64',
        'x-forwarded-for': '203.0.113.203',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      });
      expect(request.body).toEqual(new TextEncoder().encode('{"foo": "bar"}'));
    });
  });
});
