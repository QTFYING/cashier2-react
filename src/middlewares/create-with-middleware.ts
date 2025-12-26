import { applyMiddlewares, create, type Middleware, type StateCreator } from '../utils';

export function createWithMiddleware<S extends object>(stateCreator: StateCreator<S>, middlewares: Middleware<S>[]) {
  const composedCreator = applyMiddlewares(stateCreator, middlewares);
  return create(composedCreator);
}
