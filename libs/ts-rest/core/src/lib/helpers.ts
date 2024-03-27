import {
  type AppRoute,
  type ContractAnyType,
  type ContractNullType,
  type ContractOtherResponse,
  type ContractPlainType,
  ContractPlainTypeRuntimeSymbol,
} from './dsl';

/**
 * Create a type that would be used in contract. Valid only at compile time. For having runtime safety, use `zod` types.
 */
export const makeType: <T>() => T extends null
  ? ContractNullType
  : ContractPlainType<T> = ContractPlainTypeRuntimeSymbol;

/**
 * Create route definition that would be used in contract.
 */
export function makeRoute<const TAppRoute extends AppRoute>(
  route: TAppRoute,
): TAppRoute {
  return route;
}

/**
 * Create a response definition that would be used for route definition in a contract.
 */
export function makeResponses<
  const TResponses extends Record<
    number,
    ContractAnyType | ContractOtherResponse<ContractAnyType>
  >,
>(responses: TResponses): TResponses {
  return responses;
}
