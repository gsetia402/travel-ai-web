import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_TRIPOPS_API_URL || 'http://localhost:8001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export interface AuthUser {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  organization_id: string;
  organization_name: string;
}

export interface TokenResponse extends AuthUser {
  access_token: string;
  token_type: string;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(payload: {
  full_name: string;
  email: string;
  password: string;
  organization_name: string;
  organization_type: string;
}): Promise<TokenResponse> {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function getMe(token: string): Promise<AuthUser> {
  const { data } = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export function saveToken(token: string) {
  localStorage.setItem('tripops_token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('tripops_token');
}

export function saveUser(user: AuthUser) {
  localStorage.setItem('tripops_user', JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem('tripops_user');
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem('tripops_token');
  localStorage.removeItem('tripops_user');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
