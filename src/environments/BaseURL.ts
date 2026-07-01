export class BaseURL {
  public static readonly API_URL: string =
    (typeof window !== 'undefined' && (window as any).__WHS_ENV__?.API_URL) ||
    'http://localhost:8080/api/v1/';
}
