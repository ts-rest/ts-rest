export type {};

declare global {
  namespace Express {
    interface User {
      id: string;
    }
  }
}
