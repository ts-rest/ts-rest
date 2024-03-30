import { TsRestRequest } from './request';
import { TsRestResponse } from './response';

type OriginType = string | RegExp;

export interface CorsConfig {
  origins?: OriginType[] | '*';
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const isAllowedOrigin = (origin: string, origins: OriginType[]) => {
  return origins.some((allowedOrigin) => {
    if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    return allowedOrigin === origin;
  });
};

const createCorsHeaders = (
  req: TsRestRequest,
  {
    origins = '*',
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
    allowedHeaders,
    exposedHeaders,
    credentials,
    maxAge,
  }: CorsConfig,
  corsWhitelist: {
    origin?: boolean;
    methods?: boolean;
    allowedHeaders?: boolean;
    exposedHeaders?: boolean;
    credentials?: boolean;
    maxAge?: boolean;
  },
) => {
  const headers = new Headers();

  if (corsWhitelist.credentials && credentials === true) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (corsWhitelist.allowedHeaders) {
    let allowedHeadersValue = allowedHeaders?.join(',');
    if (allowedHeadersValue === undefined) {
      allowedHeadersValue =
        req.headers.get('Access-Control-Request-Headers') ?? undefined;

      headers.append('vary', 'Access-Control-Request-Headers');
    }

    if (allowedHeadersValue?.length) {
      headers.set('Access-Control-Allow-Headers', allowedHeadersValue);
    }
  }

  if (corsWhitelist.methods) {
    headers.set('Access-Control-Allow-Methods', methods.join(','));
  }

  if (corsWhitelist.origin) {
    if (origins === '*') {
      headers.set('Access-Control-Allow-Origin', '*');
    } else {
      const origin = req.headers.get('origin') ?? '';

      if (isAllowedOrigin(origin, origins)) {
        headers.set('Access-Control-Allow-Origin', origin);
      }

      headers.append('Vary', 'Origin');
    }
  }

  if (corsWhitelist.exposedHeaders && exposedHeaders?.length) {
    headers.set('Access-Control-Expose-Headers', exposedHeaders.join(','));
  }

  if (corsWhitelist.maxAge && maxAge) {
    headers.set('Access-Control-Max-Age', maxAge.toString());
  }

  return headers;
};

export const createCors = (corsConfig?: CorsConfig) => {
  const preflightHandler = (req: TsRestRequest) => {
    if (!corsConfig) {
      return;
    }

    const headers = createCorsHeaders(req, corsConfig, {
      origin: true,
      methods: true,
      allowedHeaders: true,
      exposedHeaders: true,
      credentials: true,
      maxAge: true,
    });

    return new TsRestResponse(null, {
      status: 200,
      headers,
    });
  };

  const corsifyResponseHeaders = (
    request: TsRestRequest,
    responseHeaders: Headers,
  ) => {
    if (!corsConfig) {
      return responseHeaders;
    }

    const corsHeaders = createCorsHeaders(request, corsConfig, {
      origin: true,
      credentials: true,
      exposedHeaders: true,
    });

    corsHeaders.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return responseHeaders;
  };

  return { preflightHandler, corsifyResponseHeaders };
};
