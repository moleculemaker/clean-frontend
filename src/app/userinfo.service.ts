import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  // TODO: Parameterize these somehow with environment (env.tpl?)
  baseUrl = 'https://mmli1.ncsa.illinois.edu';
  startPath = '/oauth2/start';
  signOutPath = '/oauth2/sign_out';
  userInfoPath = '/oauth2/userinfo';
  redirect = 'https://clean.frontend.mmli1.ncsa.illinois.edu/configuration';

  // Cache our currently logged-in user, or undefined if not logged in
  userInfo?: UserInfo;

  constructor(private http: HttpClient) { }

  fetchUserInfo() {
    const url = `${this.baseUrl}${this.userInfoPath}`
    this.http.get(url).pipe(catchError(err => {
      // 401 returned, no user found - login required
      this.userInfo = undefined;
      return err;
    })).subscribe((value: unknown) => {
      // User was found, meaning the cookie was valid
      this.userInfo = value as UserInfo;
    });
  }
}

export interface UserInfo {
  user: string;              // FIXME: this is currently empty
  email: string;             // user's email address in Keycloak
  preferredUsername: string; // username actually lives here
  groups: Array<string>;     // groups + roles from keycloak
}
