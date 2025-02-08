export interface WordPressAuthResponse {
  access_token: string;
  username: string;
}

export interface User {
  username: string;
  role?: string;
}

export interface AuthStore {
  status: AuthStatus;
  token?: string;
  user?: User;

  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  checkStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export type AuthStatus = "authenticated" | "unauthenticated" | "checking";
