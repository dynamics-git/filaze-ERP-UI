import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { RestService } from '../rest.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalApiUiSearchService {

  constructor(private restService: RestService) { }

  //For Header table
  searchFromApi(config: any, headers: any[], searchTerm: string, limit: number = 50): Observable<any[]> {
    const term = searchTerm.trim().toLowerCase();
    let skip = 0;
    let orderby: string = '';
    const matchedRecords: any[] = [];

    const searchableFields: string[] = headers?.map((h: any) => {
      if (typeof h === 'string') return h;
      if (typeof h === 'object') return h.prop || h.key || '';
      return '';
    }).filter((field: string) => !!field) || [];

    if (!searchableFields.length) {
      return throwError(() => new Error('No searchable fields defined'));
    }

    if (config.headerApiOrderByField) {
      orderby = `&$orderby=${config.headerApiOrderByField} desc`;
    }

    const fetchAllPages = (): Observable<any[]> => {
      const query = `?$top=${limit}&$skip=${skip}${orderby}`;
      return this.restService.get(config.headerApi + query).pipe(
        switchMap((data: any) => {
          const chunk = data?.value || [];
          if (chunk.length === 0) {
            return of(matchedRecords);
          }

          const filtered = chunk.filter((record: any) => {
            return searchableFields.some((field: string) => {
              const value = record[field];
              const normalized =
                typeof value === 'string' ? value.toLowerCase()
                  : typeof value === 'number' ? value.toString()
                    : value?.toString()?.toLowerCase() || '';
              return normalized.includes(term);
            });
          });

          matchedRecords.push(...filtered);
          skip += limit;
          return fetchAllPages();
        }),
        catchError(error => throwError(() => error))
      );
    };

    return fetchAllPages();
  }




  //for line

  searchLineFromApi(config: any, lines: any[], searchTerm: string, limit: number = 50): Observable<any[]> {
    const term = searchTerm.trim().toLowerCase();
    let skip = 0;
    let orderby: string = '';
    const matchedRecords: any[] = [];

    const searchableFields: string[] = lines?.map((h: any) => {
      if (typeof h === 'string') return h;
      if (typeof h === 'object') return h.label || h.key || '';
      return '';
    }).filter((field: string) => !!field) || [];

    if (!searchableFields.length) {
      return throwError(() => new Error('No searchable fields defined'));
    }

    if (config.lineApiOrderByField) {
      orderby = `&$orderby=${config.lineApiOrderByField} desc`;
    }

    const fetchAllPages = (): Observable<any[]> => {
      const query = `?$top=${limit}&$skip=${skip}${orderby}`;
      return this.restService.get(config.api + query).pipe(
        switchMap((data: any) => {
          const chunk = data?.value || [];
          if (chunk.length === 0) {
            return of(matchedRecords);
          }

          const filtered = chunk.filter((record: any) => {
            return searchableFields.some((field: string) => {
              const value = record[field];
              const normalized =
                typeof value === 'string' ? value.toLowerCase()
                  : typeof value === 'number' ? value.toString()
                    : value?.toString()?.toLowerCase() || '';
              return normalized.includes(term);
            });
          });

          matchedRecords.push(...filtered);
          skip += limit;
          return fetchAllPages();
        }),
        catchError(error => throwError(() => error))
      );
    };

    return fetchAllPages();
  }

}
