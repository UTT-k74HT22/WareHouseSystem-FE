declare global {
  interface Window {
    __WHS_RUNTIME_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

export class BaseURL {
  private static readonly DEFAULT_API_URL = '/api/v1/';

  private static normalize(url: string): string {
    return url.endsWith('/') ? url : `${url}/`;
  }

  public static get API_URL(): string {
    const runtimeValue = window.__WHS_RUNTIME_CONFIG__?.apiUrl?.trim();

    if (!runtimeValue) {
      return BaseURL.DEFAULT_API_URL;
    }

    return BaseURL.normalize(runtimeValue);
  }
}
