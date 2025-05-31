import {
  isAlbEvent,
  requestBody,
  requestFromEvent,
  requestHeaders,
  requestMethod,
  requestRemoteAddress,
  requestUrl,
} from './alb';
import * as albEvent from './test-data/alb-event.json';
import * as albPostEvent from './test-data/alb-post-event.json';
import * as apiGatewayEventV1 from './test-data/api-gateway-event-v1.json';

const headerToObject = (headers: Headers) => {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

describe('ALB', () => {
  describe('isAlbEvent', () => {
    it('should return true for ALB event', () => {
      expect(isAlbEvent(albEvent)).toBe(true);
    });

    it('should return false for API Gateway event', () => {
      expect(isAlbEvent(apiGatewayEventV1)).toBe(false);
    });
  });

  describe('requestMethod', () => {
    it('should work for ALB event', () => {
      expect(requestMethod(albEvent as any)).toBe('GET');
    });
  });

  describe('requestRemoteAddress', () => {
    it('should work for ALB event', () => {
      expect(requestRemoteAddress(albEvent as any)).toBe(
        'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test-target-group/1234567890abcdef'
      );
    });
  });

  describe('requestHeaders', () => {
    it('should work for ALB event', () => {
      expect(headerToObject(requestHeaders(albEvent as any))).toEqual({
        accept: '*/*',
        'content-type': 'application/json',
        host: 'example.com',
        'user-agent': 'curl/7.58.0',
        'x-forwarded-for': '192.168.0.1',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      });
    });
  });

  describe('requestBody', () => {
    it('should return empty for GET request', () => {
      const body = requestBody(albEvent as any);
      expect(body).toBe('');
    });

    it('should work for POST request', () => {
      const body = requestBody(albPostEvent as any);
      expect(body).toBe('{"name":"Test Item"}');
    });
  });

  describe('requestUrl', () => {
    it('should work for ALB event', () => {
      expect(requestUrl(albEvent as any)).toBe(
        'http://localhost/test?foo=bar'
      );
    });

    it('should work for POST ALB event with no query params', () => {
      expect(requestUrl(albPostEvent as any)).toBe(
        'http://localhost/api/items'
      );
    });
  });

  describe('requestFromEvent', () => {
    it('should work for ALB event', () => {
      const request = requestFromEvent(albEvent as any);

      expect(request.method).toEqual('GET');
      expect(request.url).toEqual('http://localhost/test?foo=bar');
      expect(headerToObject(request.headers)).toEqual({
        accept: '*/*',
        'content-type': 'application/json',
        host: 'example.com',
        'user-agent': 'curl/7.58.0',
        'x-forwarded-for': '192.168.0.1',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
      });
      expect(request.body).toEqual(null);
    });

    it('should work for POST ALB event', async () => {
      const request = requestFromEvent(albPostEvent as any);

      expect(request.method).toEqual('POST');
      expect(request.url).toEqual('http://localhost/api/items');
      expect(headerToObject(request.headers)).toEqual({
        accept: 'application/json',
        'content-type': 'application/json',
        host: 'example.com',
        'user-agent': 'curl/7.58.0',
        'x-forwarded-for': '192.168.0.1',
        'x-forwarded-port': '443',
        'x-forwarded-proto': 'https',
        'content-length': '25',
      });
      expect(await request.text()).toEqual('{"name":"Test Item"}');
    });
  });
});
