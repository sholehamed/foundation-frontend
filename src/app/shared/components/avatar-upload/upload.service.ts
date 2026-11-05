import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly baseUrl =environment.apiUrl+'/system/MediaStorage/MediaStorage';

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<{ mediaId: string }>(this.baseUrl+'/upload', formData)
      .pipe(map((response) => response.mediaId));
  }

  preview(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/media/${id}/preview/3`, {
      responseType: 'blob',
    });
  }
}
