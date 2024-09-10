import { ClientArgs } from './client';
import { AppRoute } from './dsl';
import { SuccessfulHttpStatusCodes } from './status-codes';

export class TsRestClientResponseError<
  TAppRoute extends AppRoute = AppRoute,
  TClientArgs extends ClientArgs = ClientArgs,
> extends Error {
  constructor(
    public appRoute: TAppRoute,
    public response: { status: number; body: unknown; headers: Headers },
    public clientArgs: TClientArgs,
  ) {
    super(
      `Server returned unexpected response. Expected one of: ${SuccessfulHttpStatusCodes.join(
        ',',
      )} got: ${response.status}`,
    );
  }
}
