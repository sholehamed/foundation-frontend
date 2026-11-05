import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const Tenant = 'tenant';
const TenantId = 'tenantId';
const AccountType = 'account_type';
const FullName = 'fullname';
const Picure = 'picture';
const Username = 'username';
const Sub = 'sub';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  setUserInfo(fullName:string,tenantId:string,tenant:string,picture:string,accountType:string,username:string,sub:string){
    localStorage.setItem(Tenant, tenant);
    localStorage.setItem(TenantId, tenantId);
    localStorage.setItem(FullName, fullName);
    localStorage.setItem(Picure, picture);
    localStorage.setItem(AccountType, accountType);
    localStorage.setItem(Username, username);
    localStorage.setItem(Sub, sub);
  }
  getUserFullname(){
        return localStorage.getItem(FullName);
  }
  getUsertenant(){
       return localStorage.getItem(Tenant);
  }
  getUsertenantId(){
       return localStorage.getItem(TenantId);
  }
  getAccountType(){
       return localStorage.getItem(AccountType);
  }
  getUserPicture(){
       return localStorage.getItem(Picure);
  }
  getUsername(){
       return localStorage.getItem(Username);
  }
  getUserSub(){
       return localStorage.getItem(Sub);
  }
  clear(): void {
    for (const key of [
      ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, Tenant, TenantId,
      AccountType, FullName, Picure, Username, Sub,
    ]) {
      localStorage.removeItem(key);
    }
  }
}
