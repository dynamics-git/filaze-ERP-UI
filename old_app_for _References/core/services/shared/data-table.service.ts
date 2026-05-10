import { Injectable, PipeTransform } from '@angular/core';
import { Subject, BehaviorSubject, Observable, of } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { tap, debounceTime, switchMap, delay } from 'rxjs/operators';
import { SortDirection } from '../models/shared/sort-event.model';

interface SearchResult {
  records: any[];
  total: number;
}

interface State {
  headers: any[];
  data: any[];
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: string;
  sortDirection: SortDirection;
  pagination: boolean;
}

function compare(v1: any, v2: any) {
  return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
}

function sort(data: any[], column: string, direction: string): any[] {
  if (direction === '') {
    return data;
  } else {
    return [...data].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(data: any, headers: any[], term: string, pipe: PipeTransform) {
  let result: boolean = false;
  if (term && term !== '') {
    for (let i = 0; i < headers.length; i++) {
      const header: any = headers[i];
      if (typeof data[header.prop] === 'string') {
        result = data[header.prop].toLowerCase().includes(term.toLowerCase());
      } else if (typeof data[header.prop] === 'number') {
        result = (data[header.prop] + '').toLowerCase().includes(term.toLowerCase());
      }

      if (result) break;
    }
  } else {
    result = true;
  }

  return result;
}

@Injectable({
  providedIn: 'root'
})
export class DataTableService {

  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _data$ = new BehaviorSubject<any[]>([]);
  private _total$ = new BehaviorSubject<number>(0);
  private _itemSelected$: Subject<any> = new Subject<any>();

  private _state: State = {
    headers: [],
    data: [],
    page: 1,
    pageSize: 4,
    searchTerm: '',
    sortColumn: '',
    sortDirection: '',
    pagination: true
  };

  constructor(private pipe: DecimalPipe) {
    this._search$.pipe(
      tap(() => this._loading$.next(true)),
      debounceTime(200),
      switchMap(() => this._search()),
      delay(200),
      tap(() => this._loading$.next(false))
    ).subscribe(result => {
      this._data$.next(result.records);
      this._total$.next(result.total);
    });

    this._search$.next();
  }

  private _cacheData: any = {};
  public clearCacheData(prop?: string) {
    if (prop) {
      delete this._cacheData[prop];
      return;
    }

    this._cacheData = {};
  }
  public setCacheData(prop: string, data: any, page?: number) {
    if (page) {
      if (this._cacheData[prop]) {
        this._cacheData[prop][page] = data;
      } else {
        this._cacheData[prop] = {}
        this._cacheData[prop][page] = data;
      }
    } else {
      this._cacheData[prop] = data;
    }
  }
  public getCacheData(prop: string, page?: number) {
    if (page) {
      if (this._cacheData[prop]) {
        return this._cacheData[prop][page];
      } else {
        return null;
      }
    } else {
      return this._cacheData[prop];
    }
  }

  get ItemSelected$(): Subject<any> { return this._itemSelected$; }

  get data$() { return this._data$.asObservable(); }
  get total$() { return this._total$.asObservable(); }
  get loading$() { return this._loading$.asObservable(); }
  get data() { return this._state.data; }
  get headers() { return this._state.headers; }
  get page() { return this._state.page; }
  get pageSize() { return this._state.pageSize; }
  get searchTerm() { return this._state.searchTerm; }
  get pagination() { return this._state.pagination; }

  set data(data: any[]) { this._set({ data }); }
  set headers(headers: any[]) { this._set({ headers }); }
  set page(page: number) { this._set({ page }); }
  set pageSize(pageSize: number) { this._set({ pageSize }); }
  set searchTerm(searchTerm: string) { this._set({ searchTerm }); }
  set sortColumn(sortColumn: string) { this._set({ sortColumn }); }
  set sortDirection(sortDirection: SortDirection) { this._set({ sortDirection }); }
  set pagination(pagination: boolean) { this._set({ pagination }); }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  private _search(): Observable<SearchResult> {
    const { sortColumn, sortDirection, pageSize, page, searchTerm, data, headers, pagination } = this._state;

    // 1. sort
    let records = sort(data, sortColumn, sortDirection);

    // 2. filter
    records = records.filter(x => matches(x, headers, searchTerm, this.pipe));
    const total = records.length;

    if (pagination) {
      // 3. paginate
      records = records.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    }

    return of({ records, total });
  }


  private selectedItemSource = new BehaviorSubject<any[]>([]);
  selectedItem$ = this.selectedItemSource.asObservable();

  setSelectedItem(lines: any[]) {
    this.selectedItemSource.next(lines);
  }

  clearSelectedItem() {
    this.selectedItemSource.next([]);
  }

  /** Emits data synchronously to data$ bypassing the debounced search pipe.
   *  Use this before flipping initialDataReady so the template never sees an empty frame. */
  setDataDirect(data: any[]) {
    this._state.data = data;
    this._data$.next(data);
  }

  public popupTaggle: any;
}
