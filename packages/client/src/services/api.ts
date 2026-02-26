const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

interface AuthResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    attempted: number;
    correct: number;
  };
}

interface MeResponse {
  user: {
    userId: string;
    username: string;
    attempted: number;
    correct: number;
  };
}

interface ErrorResponse {
  error: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as ErrorResponse).error || 'Request failed');
  }

  return data as T;
}

export async function signup(
  username: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password, confirmPassword }),
  });
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getMe(token: string): Promise<MeResponse> {
  return request<MeResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// localStorage helpers
const TOKEN_KEY = 'math-arena-token';
const USERNAME_KEY = 'math-arena-username';

export function saveSession(token: string, username: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export function getStoredSession(): { token: string; username: string } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const username = localStorage.getItem(USERNAME_KEY);
  if (token && username) {
    return { token, username };
  }
  return null;
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}
