import { mockUser } from '../data/user.mock';
import type { User } from '../../types/user.types';

export async function mockGetUser(): Promise<User> {
  return { ...mockUser };
}

export async function mockUpdateUser(updates: Partial<User>): Promise<User> {
  return { ...mockUser, ...updates };
}
