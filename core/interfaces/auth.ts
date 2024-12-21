export interface WordPressAuthResponse {
  access_token: string;
  username: string;
}

export interface User {
  username: string;
}

export interface AuthStore {
  status: AuthStatus;
  token?: string;
  user?: User;

  login: (username: string, password: string) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
  changeStatus: (token?: string, user?: User) => Promise<boolean>;
}

export type AuthStatus = "authenticated" | "unauthenticated" | "checking";
