import type { User } from '../../types/user.types';

export const mockUser: User = {
  id: 'usr_001',
  firstName: 'משתמש',
  lastName: 'לדוגמה',
  email: 'user@example.com',
  phone: '050-0000000',
  avatar: 'https://ui-avatars.com/api/?name=User&background=635bff&color=fff&size=128&bold=true',
  organizationId: 'org_001',
  organizationName: 'חברת הייטק בע"מ',
  language: 'he',
  createdAt: '2024-01-15T10:00:00Z',
  preferences: {
    spendingFocus: 'food',
    dealPreference: 'big_discount',
    notificationFrequency: 'only_relevant',
  },
};
