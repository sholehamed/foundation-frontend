import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PagedList } from '../../../../shared/components/grid-components';


export interface GroupMemberDto {
  userId: string;
  displayName: string;
  username?: string;
  email?: string;
  mobile?: string;
  isActive: boolean;
}

export interface UserSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  username?: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserGroupApi {
  constructor(private http: HttpClient) {}

  getMembers(groupId: string, req: {
    search?: string;
    page: number; pageSize: number;
    sort?: string; dir?: 'asc' | 'desc';
  }): Observable<PagedList> {
    return this.http.post<PagedList>(environment.apiUrl+ `/system/groups/${groupId}/members`, {
      pageNumber: req.page, pageSize: req.pageSize, search: req.search ?? ''
    });
  }

  searchUsers(query: string, excludeGroupId: string): Observable<UserSummaryDto[]> {
    const params = new HttpParams()
      .set('search', query)
      .set('groupId', excludeGroupId)
      .set('pageSize', 20);

    return this.http.get<UserSummaryDto[]>(environment.apiUrl+`/system/groups/searchmembers`, { params });
  }

  addMembers(groupId: string, userIds: string[]): Observable<void> {
    return this.http.post<void>(environment.apiUrl+`/system/groups/${groupId}/addmembers`, { userIds });
  }

  removeMembers(groupId: string, userIds: string[]): Observable<unknown> {
    if (!userIds.length) return of(void 0);
    // Backend supports individually audited URI-scoped revocation, not bulk DELETE.
    return forkJoin(userIds.map(userId =>
      this.http.delete<void>(environment.apiUrl + `/system/groups/${groupId}/members/${userId}`)
    ));
  }
}
