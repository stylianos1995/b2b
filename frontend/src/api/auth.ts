import { apiPost, apiGet, apiPatch } from './client';
import type { User } from '../types';

export interface LoginRes {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterBody {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface UpdateProfileBody {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
}

export interface ChangePasswordBody {
  current_password: string;
  new_password: string;
}

export interface ChangeEmailBody {
  new_email: string;
  password: string;
}

export interface DeleteAccountBody {
  password: string;
}

export async function login(email: string, password: string): Promise<LoginRes> {
  return apiPost<LoginRes>('/auth/login', { email, password });
}

export async function register(body: RegisterBody): Promise<{ user_id: string; email: string; created_at: string }> {
  return apiPost('/auth/register', body);
}

export async function getMe(): Promise<User> {
  return apiGet<User>('/auth/me');
}

export async function updateProfile(body: UpdateProfileBody): Promise<{ first_name: string; last_name: string; phone: string | null }> {
  return apiPatch('/auth/me', body);
}

export async function changePassword(body: ChangePasswordBody): Promise<void> {
  return apiPost('/auth/change-password', body);
}

export async function changeEmail(body: ChangeEmailBody): Promise<{ email: string }> {
  return apiPost('/auth/change-email', body);
}

export async function deleteAccount(body: DeleteAccountBody): Promise<void> {
  return apiPost('/auth/delete-account', body);
}
