export interface GeneratedApiClientRuntime {
  baseUrl: string;
  getRequestHeaders: () => Promise<Record<string, string>>;
}

let runtime: GeneratedApiClientRuntime | undefined;

export function configureGeneratedApiClient(nextRuntime: GeneratedApiClientRuntime) {
  runtime = nextRuntime;
}

export async function generatedApiClient<TResponse>(url: string, init: RequestInit): Promise<TResponse> {
  if (!runtime) {
    throw new Error("The generated API client has not been configured.");
  }

  const authHeaders = await runtime.getRequestHeaders();
  const response = await window.fetch(`${runtime.baseUrl}${url}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...authHeaders,
    },
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed with ${response.status}.`);
  }

  const data = response.status === 204 ? undefined : await response.json();
  return {
    data,
    headers: response.headers,
    status: response.status,
  } as TResponse;
}
