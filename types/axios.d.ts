import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** When true, a 401 will not clear session or redirect to /login (use for sign-in / register). */
    skipAuthRedirect?: boolean;
  }
}

export {};
