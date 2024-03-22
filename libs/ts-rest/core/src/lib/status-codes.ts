export const successfulHttpStatusCodes = [
  200, 201, 202, 203, 204, 205, 206, 207,
] as const;

export type SuccessfulHttpStatusCode =
  (typeof successfulHttpStatusCodes)[number];

const informationalHttpStatusCodes = [100, 101, 102] as const;

const redirectionHttpStatusCodes = [
  300, 301, 302, 303, 304, 305, 307, 308,
] as const;

const clientErrorHttpStatusCodes = [
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414,
  415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 428, 429, 431, 451,
] as const;

const serverErrorHttpStatusCodes = [
  500, 501, 502, 503, 504, 505, 507, 511,
] as const;

const errorHttpStatusCodes = [
  ...informationalHttpStatusCodes,
  ...redirectionHttpStatusCodes,
  ...clientErrorHttpStatusCodes,
  ...serverErrorHttpStatusCodes,
] as const;

export type ErrorHttpStatusCode = (typeof errorHttpStatusCodes)[number];

const httpStatusCodes = [
  ...successfulHttpStatusCodes,
  ...errorHttpStatusCodes,
] as const;

/**
 * All available HTTP Status codes
 */
export type HTTPStatusCode = (typeof httpStatusCodes)[number];
