export interface PassportAuthenticationError extends Error {
  status: number;
}

export const PassportAuthenticationError =
  require('passport/lib/errors/authenticationerror') as new (
    message: string,
    status: number
  ) => PassportAuthenticationError;
