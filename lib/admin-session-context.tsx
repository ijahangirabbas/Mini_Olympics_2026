'use client';

import React, { createContext, useContext } from 'react';

export type PagePermissionDetail = {
  canView: boolean;
  canEdit: boolean;
  canDelegate: boolean;
};

export type AdminSessionClient = {
  role: string;
  username: string;
  displayName: string;
  permissions: string[];
  permissionDetails: Record<string, PagePermissionDetail>;
  assignedGames: string[];
  assignedGender: string;
  impersonatedBy: string | null;
};

const AdminSessionContext = createContext<AdminSessionClient | null>(null);

export const AdminSessionProvider = AdminSessionContext.Provider;

export function useAdminSession(): AdminSessionClient {
  const ctx = useContext(AdminSessionContext);
  return (
    ctx || {
      role: 'sub_admin',
      username: '',
      displayName: '',
      permissions: [],
      permissionDetails: {},
      assignedGames: [],
      assignedGender: 'both',
      impersonatedBy: null,
    }
  );
}

export function canEditPage(session: AdminSessionClient, pageKey: string): boolean {
  if (session.role === 'super_admin') return true;
  return Boolean(session.permissionDetails?.[pageKey]?.canEdit);
}
