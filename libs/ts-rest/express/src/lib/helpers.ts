import { type AppRoute } from '@ts-rest/core';
import { type AppRouteImplementation } from './types';

/**
 * Create a route implementation for the provided route type.
 *
 * @param impl the implementation function
 */
export function makeAppRouteImplementation<TAppRoute extends AppRoute>(
  impl: AppRouteImplementation<TAppRoute>,
): AppRouteImplementation<TAppRoute>;
/**
 * Create a route implementation for the provided route parameter.
 *
 * @param route the route to create an implementation for
 * @param impl the implementation function
 */
export function makeAppRouteImplementation<TAppRoute extends AppRoute>(
  route: TAppRoute,
  impl: AppRouteImplementation<TAppRoute>,
): AppRouteImplementation<TAppRoute>;
export function makeAppRouteImplementation<TAppRoute extends AppRoute>(
  routeOrImpl: TAppRoute | AppRouteImplementation<TAppRoute>,
  impl?: AppRouteImplementation<TAppRoute>,
): AppRouteImplementation<TAppRoute> {
  if (typeof routeOrImpl === 'function') return routeOrImpl;
  if (impl) return impl;
  throw new Error('Invalid arguments');
}
