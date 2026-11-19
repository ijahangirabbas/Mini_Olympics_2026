'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  Users,
  Check,
  X,
  Search,
  UserCheck,
  Gamepad2,
  Lock,
  History,
  LogIn,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

type PageMeta = {
  key: string;
  label: string;
  description: string;
};

type UserPerm = {
  pageKey: string;
  canView: boolean;
  canEdit: boolean;
  canDelegate: boolean;
};

type AdminUserRecord = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  assignedGames: string[];
  assignedGender: 'boys' | 'girls' | 'both';
  createdBy: string | null;
  isActive: boolean;
  createdAt: string;
  hasExplicitPermissions: boolean;
  permissions: UserPerm[];
};

const ROLE_OPTIONS = [
  { value: 'coordinator', label: 'Coordinator (Game Match Manager)' },
  { value: 'sub_admin', label: 'Sub-Admin (Custom Page Permissions)' },
  { value: 'registration_admin', label: 'Registration Admin' },
  { value: 'inventory_admin', label: 'Inventory Admin' },
  { value: 'hoc_admin', label: 'HOC Officer' },
  { value: 'finance_admin', label: 'Finance Admin' },
  { value: 'super_admin', label: 'Super Admin (Full Access)' },
];

export default function PermissionsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [games, setGames] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    userId: string | null;
    username: string | null;
    role: string;
    permissions: string[];
    permissionDetails: Record<string, { canView: boolean; canEdit: boolean; canDelegate: boolean }>;
  } | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'audit'>('accounts');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AdminUserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const toast = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    username: '',
    displayName: '',
    password: '',
    role: 'coordinator',
    assignedGender: 'both' as 'boys' | 'girls' | 'both',
    assignedGames: [] as string[],
    isActive: true,
    permsMap: {} as Record<string, { canView: boolean; canEdit: boolean; canDelegate: boolean }>,
  });
  const [gameSearch, setGameSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/permissions?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setPages(data.pages || []);
        setGames(data.games || []);
        setCurrentUser(data.currentUser || null);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const canEditPermissions =
    isSuperAdmin || Boolean(currentUser?.permissionDetails?.['/admin/permissions']?.canEdit);

  const actorCanGrantPage = (pageKey: string, mode: 'view' | 'edit' | 'delegate' = 'view') => {
    if (isSuperAdmin) return true;
    const d = currentUser?.permissionDetails?.[pageKey];
    if (!d?.canView) return false;
    if (mode === 'edit') return d.canEdit;
    if (mode === 'delegate') return d.canDelegate;
    return true;
  };

  const buildEmptyPermsMap = (defaultKeys: string[] = []) => {
    const map: Record<string, { canView: boolean; canEdit: boolean; canDelegate: boolean }> = {};
    for (const p of pages) {
      const enabled = defaultKeys.includes(p.key);
      map[p.key] = {
        canView: enabled && actorCanGrantPage(p.key, 'view'),
        canEdit: enabled && actorCanGrantPage(p.key, 'edit'),
        canDelegate: false,
      };
    }
    return map;
  };

  const openCreateModal = (presetRole: 'coordinator' | 'sub_admin' = 'coordinator') => {
    setEditingUser(null);
    setErrorMsg('');
    setGameSearch('');
    const defaultKeys = presetRole === 'coordinator' ? ['/admin/coordinator'] : ['/admin/dashboard'];
    setForm({
      username: '',
      displayName: '',
      password: '',
      role: presetRole,
      assignedGender: 'both',
      assignedGames: [],
      isActive: true,
      permsMap: buildEmptyPermsMap(defaultKeys),
    });
    setDialogOpen(true);
  };

  const openEditModal = (user: AdminUserRecord) => {
    setEditingUser(user);
    setErrorMsg('');
    setGameSearch('');
    const map: Record<string, { canView: boolean; canEdit: boolean; canDelegate: boolean }> = {};
    for (const p of pages) {
      const found = user.permissions.find((up) => up.pageKey === p.key);
      map[p.key] = {
        canView: Boolean(found?.canView),
        canEdit: Boolean(found?.canEdit),
        canDelegate: Boolean(found?.canDelegate),
      };
    }
    setForm({
      username: user.username,
      displayName: user.displayName || user.username,
      password: '',
      role: user.role,
      assignedGender: user.assignedGender || 'both',
      assignedGames: [...(user.assignedGames || [])],
      isActive: user.isActive,
      permsMap: map,
    });
    setDialogOpen(true);
  };

  const applyRolePreset = (role: string) => {
    const presets: Record<string, string[]> = {
      coordinator: ['/admin/coordinator'],
      sub_admin: ['/admin/dashboard', '/admin/registrations', '/admin/coordinator', '/admin/permissions'],
      registration_admin: ['/admin/registrations'],
      inventory_admin: ['/admin/inventory'],
      hoc_admin: ['/admin/super', '/admin/hoc', '/admin/coordinator'],
      finance_admin: ['/admin/finance'],
      super_admin: pages.map((p) => p.key),
    };
    setForm((prev) => ({
      ...prev,
      role,
      permsMap: buildEmptyPermsMap(presets[role] || []),
    }));
  };

  const togglePermissionFlag = (pageKey: string, field: 'canView' | 'canEdit' | 'canDelegate') => {
    setForm((prev) => {
      const current = prev.permsMap[pageKey] || { canView: false, canEdit: false, canDelegate: false };
      let next = { ...current };
      if (field === 'canView') {
        const nextView = !current.canView;
        next = {
          canView: nextView,
          canEdit: nextView ? current.canEdit : false,
          canDelegate: nextView ? current.canDelegate : false,
        };
      } else if (field === 'canEdit') {
        const nextEdit = !current.canEdit;
        next = {
          ...current,
          canView: nextEdit ? true : current.canView,
          canEdit: nextEdit,
        };
      } else {
        const nextDelegate = !current.canDelegate;
        next = {
          ...current,
          canView: nextDelegate ? true : current.canView,
          canDelegate: nextDelegate,
        };
      }
      return {
        ...prev,
        permsMap: {
          ...prev.permsMap,
          [pageKey]: next,
        },
      };
    });
  };

  const toggleAssignedGame = (gameName: string) => {
    setForm((prev) => ({
      ...prev,
      assignedGames: prev.assignedGames.includes(gameName)
        ? prev.assignedGames.filter((g) => g !== gameName)
        : [...prev.assignedGames, gameName],
    }));
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!editingUser && !form.username.trim()) {
      setErrorMsg('Username is required');
      return;
    }
    if (!editingUser && form.password.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters');
      return;
    }

    setSaving(true);
    try {
      const permissionsPayload = Object.entries(form.permsMap).map(([pageKey, val]) => ({
        pageKey,
        canView: val.canView,
        canEdit: val.canEdit,
        canDelegate: val.canDelegate,
      }));

      const res = await fetch('/api/admin/permissions', {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingUser
            ? {
                userId: editingUser.id,
                displayName: form.displayName.trim() || form.username.trim(),
                password: form.password.trim() || undefined,
                role: form.role,
                assignedGames: form.assignedGames,
                assignedGender: form.assignedGender,
                isActive: form.isActive,
                permissions: permissionsPayload,
              }
            : {
                username: form.username.trim(),
                displayName: form.displayName.trim() || form.username.trim(),
                password: form.password.trim(),
                role: form.role,
                assignedGames: form.assignedGames,
                assignedGender: form.assignedGender,
                isActive: form.isActive,
                permissions: permissionsPayload,
              }
        ),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to save user');
        return;
      }

      setDialogOpen(false);
      await loadData();
    } catch {
      setErrorMsg('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/admin/audit-logs?limit=50', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data || []);
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleImpersonate = async (user: AdminUserRecord) => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Impersonation failed');
        return;
      }
      toast.success(`Now viewing as ${data.username}`);
      window.location.href = data.defaultPage || (user.role === 'coordinator' ? '/admin/coordinator' : '/admin/dashboard');
    } catch {
      toast.error('Impersonation request failed');
    }
  };

  const handleDeleteUser = (user: AdminUserRecord) => {
    setConfirmDeleteUser(user);
  };

  const executeDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/admin/permissions?userId=${encodeURIComponent(confirmDeleteUser.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to delete user');
        return;
      }
      toast.success(`Deleted account ${confirmDeleteUser.username}`);
      setConfirmDeleteUser(null);
      await loadData();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter === 'coordinators' && u.role !== 'coordinator') return false;
      if (roleFilter === 'sub_admins' && u.role !== 'sub_admin') return false;
      if (roleFilter === 'super_admins' && u.role !== 'super_admin') return false;
      if (
        roleFilter === 'staff' &&
        ['coordinator', 'sub_admin', 'super_admin'].includes(u.role)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = [u.username, u.displayName, u.role, ...u.assignedGames].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  const filteredModalGames = useMemo(() => {
    if (!gameSearch.trim()) return games;
    const q = gameSearch.toLowerCase().trim();
    return games.filter((g) => g.toLowerCase().includes(q));
  }, [games, gameSearch]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#12E2C4] mx-auto" />
          <p className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">
            LOADING PERMISSION MATRIX...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
            <KeyRound className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>RBAC & DELEGATED ACCESS CONTROL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight">
            PERMISSIONS & ACCOUNTS
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-1">
            Create Sub-Admins & Game Coordinators, and assign granular per-page permissions from the database permission table.
          </p>
        </div>

        {canEditPermissions && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'accounts' ? 'default' : 'outline'}
              onClick={() => setActiveTab('accounts')}
              className={
                activeTab === 'accounts'
                  ? 'rounded-xl text-xs font-mono font-bold bg-[#182244] border border-[#12E2C4]/40 text-[#12E2C4]'
                  : 'rounded-xl text-xs font-mono bg-[#0B1124] border-white/10 text-[#94A3B8]'
              }
            >
              <Users className="w-4 h-4 mr-1.5" />
              Accounts
            </Button>
            <Button
              variant={activeTab === 'audit' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('audit');
                loadAuditLogs();
              }}
              className={
                activeTab === 'audit'
                  ? 'rounded-xl text-xs font-mono font-bold bg-[#182244] border border-[#12E2C4]/40 text-[#12E2C4]'
                  : 'rounded-xl text-xs font-mono bg-[#0B1124] border-white/10 text-[#94A3B8]'
              }
            >
              <History className="w-4 h-4 mr-1.5" />
              Audit Logs
            </Button>
            <Button
              onClick={() => openCreateModal('coordinator')}
              className="rounded-xl text-xs font-mono font-bold tracking-wider bg-[#F068B1] hover:bg-[#dc529c] text-white uppercase"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Coordinator
            </Button>
            <Button
              onClick={() => openCreateModal('sub_admin')}
              className="rounded-xl text-xs font-mono font-black tracking-wider bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#0B1124] uppercase"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Sub-Admin / Staff
            </Button>
          </div>
        )}
      </div>

      {activeTab === 'audit' ? (
        <div className="p-6 rounded-2xl bg-[#131B38] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
              <History className="w-4 h-4 text-[#12E2C4]" />
              Recent Admin &amp; Permission Audit Trail
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={loadAuditLogs}
              className="border-white/15 bg-white/5 text-xs text-[#F8FAFC]"
            >
              Refresh
            </Button>
          </div>
          {loadingAudit ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#12E2C4]" />
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-xs font-mono text-[#94A3B8] py-8 text-center">No audit events recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-[540px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-[#0B1124] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#12E2C4]/15 text-[#12E2C4] font-bold">
                        {log.action}
                      </span>
                      <span className="text-[#F8FAFC]">by @{log.actor_username || 'system'}</span>
                      <span className="text-[#94A3B8]">
                        ({log.target_type}
                        {log.target_id ? `:${log.target_id}` : ''})
                      </span>
                    </div>
                    {log.after_json && (
                      <p className="text-[11px] text-[#94A3B8] truncate max-w-3xl">{log.after_json}</p>
                    )}
                  </div>
                  <div className="text-[11px] text-[#64748B] shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#131B38] border border-white/[0.08]">
          <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Total Accounts</span>
          <p className="text-3xl font-black font-['Space_Grotesk'] text-[#F8FAFC] mt-1">{users.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#131B38] border border-[#12E2C4]/30">
          <span className="text-[11px] font-mono text-[#12E2C4] uppercase">Sub-Admins</span>
          <p className="text-3xl font-black font-['Space_Grotesk'] text-[#12E2C4] mt-1">
            {users.filter((u) => u.role === 'sub_admin').length}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#131B38] border border-[#F068B1]/30">
          <span className="text-[11px] font-mono text-[#F068B1] uppercase">Coordinators</span>
          <p className="text-3xl font-black font-['Space_Grotesk'] text-[#F068B1] mt-1">
            {users.filter((u) => u.role === 'coordinator').length}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#131B38] border border-[#F59E0B]/30">
          <span className="text-[11px] font-mono text-[#F59E0B] uppercase">Protected Pages</span>
          <p className="text-3xl font-black font-['Space_Grotesk'] text-[#F59E0B] mt-1">{pages.length}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 rounded-2xl bg-[#131B38] border border-white/[0.08]">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'coordinators', label: 'Coordinators' },
            { id: 'sub_admins', label: 'Sub-Admins' },
            { id: 'staff', label: 'Role Staff' },
            { id: 'super_admins', label: 'Super Admins' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors ${
                roleFilter === tab.id
                  ? 'bg-[#12E2C4] text-[#0B1124]'
                  : 'bg-[#0B1124] text-[#94A3B8] hover:text-white border border-white/[0.08]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search username, name, game..."
            className="pl-9 bg-[#0B1124] border-white/[0.1] text-xs font-mono text-[#F8FAFC] rounded-xl"
          />
        </div>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredUsers.map((user) => {
          const isProtectedSuper = user.role === 'super_admin' && !isSuperAdmin;
          const activePerms = user.permissions.filter((p) => p.canView);
          return (
            <div
              key={user.id}
              className={`p-6 rounded-2xl bg-[#131B38] border transition-all space-y-4 ${
                user.isActive ? 'border-white/[0.08]' : 'border-red-500/30 opacity-65'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1124] border border-white/[0.1] flex items-center justify-center font-mono font-bold text-[#12E2C4] shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-[#F8FAFC] font-['Space_Grotesk'] truncate">
                        {user.displayName}
                      </h3>
                      {!user.isActive && (
                        <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 text-[10px] font-mono">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#94A3B8]">
                      @{user.username} • <span className="text-[#F59E0B] uppercase">{user.role.replace('_', ' ')}</span>
                      {user.createdBy ? ` • by ${user.createdBy}` : ''}
                    </p>
                  </div>
                </div>

                {canEditPermissions && !isProtectedSuper && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSuperAdmin && user.role !== 'super_admin' && user.isActive && currentUser?.userId !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImpersonate(user)}
                        title="Impersonate user (logged)"
                        className="h-8 px-2 bg-[#0B1124] border-amber-500/30 text-amber-300 hover:bg-amber-500/15"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {currentUser?.userId !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(user)}
                        className="h-8 px-2.5 bg-[#0B1124] border-white/[0.1] text-[#12E2C4] hover:bg-[#182244]"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    )}
                    {currentUser?.userId !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user)}
                        className="h-8 w-8 p-0 bg-[#0B1124] border-white/[0.1] text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                )}
                {isProtectedSuper && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B1124] text-[10px] font-mono text-[#94A3B8] border border-white/[0.08]">
                    <Lock className="w-3 h-3 text-[#F59E0B]" />
                    Protected
                  </span>
                )}
              </div>

              {/* Coordinator Assigned Games */}
              {(user.role === 'coordinator' || user.assignedGames.length > 0) && (
                <div className="p-3 rounded-xl bg-[#0B1124] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#F068B1] font-bold uppercase flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5" />
                      Assigned Games ({user.assignedGames.length})
                    </span>
                    <span className="text-[#94A3B8] uppercase">
                      Division: {user.assignedGender}
                    </span>
                  </div>
                  {user.assignedGames.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {user.assignedGames.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded bg-[#182244] border border-[#3B82F6]/30 text-[11px] font-mono text-[#F8FAFC]"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] font-mono text-[#94A3B8]">No games assigned yet</p>
                  )}
                </div>
              )}

              {/* Page Permissions Badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block">
                  Page Permissions ({user.role === 'super_admin' ? 'ALL PAGES' : `${activePerms.length} PAGES`})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {user.role === 'super_admin' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[11px] font-mono font-bold text-[#F59E0B]">
                      Full Super Admin Access (View, Edit & Delegate All)
                    </span>
                  ) : activePerms.length === 0 ? (
                    <span className="text-xs font-mono text-red-400">No page permissions assigned</span>
                  ) : (
                    activePerms.map((perm) => {
                      const meta = pages.find((p) => p.key === perm.pageKey);
                      return (
                        <span
                          key={perm.pageKey}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0B1124] border border-[#12E2C4]/25 text-[11px] font-mono text-[#F8FAFC]"
                        >
                          <ShieldCheck className="w-3 h-3 text-[#12E2C4]" />
                          <span>{meta?.label || perm.pageKey}</span>
                          {perm.canEdit && (
                            <span className="text-[9px] px-1 rounded bg-[#12E2C4]/20 text-[#12E2C4]">EDIT</span>
                          )}
                          {perm.canDelegate && (
                            <span className="text-[9px] px-1 rounded bg-[#F59E0B]/20 text-[#F59E0B]">DELEGATE</span>
                          )}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-12 rounded-2xl bg-[#131B38] border border-white/[0.08] text-center text-sm font-mono text-[#94A3B8]">
          No accounts match your filter.
        </div>
      )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteUser)}
        title={`Delete account "@${confirmDeleteUser?.username}"?`}
        description="This staff account, active sessions, and delegated permissions will be permanently deleted."
        confirmLabel="Delete Account"
        destructive
        loading={deletingUser}
        onCancel={() => setConfirmDeleteUser(null)}
        onConfirm={executeDeleteUser}
      />

      {/* Create / Edit User & Permissions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#131B38] border border-white/[0.15] text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="font-['Space_Grotesk'] text-xl uppercase flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#12E2C4]" />
              {editingUser ? `Edit Account: ${editingUser.username}` : 'Create Account & Assign Permissions'}
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8] font-mono text-xs">
              Configure login credentials, role, assigned coordinator games, and per-page permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8] uppercase">Username *</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!editingUser}
                  placeholder="e.g. cricket_coord or ali_subadmin"
                  className="bg-[#0B1124] border-white/[0.1] text-sm text-[#F8FAFC] rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8] uppercase">Display Name</Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="e.g. Hamza (Cricket Coordinator)"
                  className="bg-[#0B1124] border-white/[0.1] text-sm text-[#F8FAFC] rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8] uppercase">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? '•••••••• (min 8 chars)' : 'Minimum 8 characters'}
                  className="bg-[#0B1124] border-white/[0.1] text-sm text-[#F8FAFC] rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8] uppercase">Role *</Label>
                <Select
                  value={form.role}
                  onValueChange={(val) => applyRolePreset(val)}
                >
                  <SelectTrigger className="bg-[#0B1124] border-white/[0.1] text-sm text-[#F8FAFC] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                    {ROLE_OPTIONS.filter((r) => isSuperAdmin || r.value !== 'super_admin').map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1124] border border-white/[0.08]">
              <div>
                <p className="text-xs font-mono font-bold text-[#F8FAFC] uppercase">Account Active</p>
                <p className="text-[11px] font-mono text-[#94A3B8]">Disabled accounts cannot log in to the terminal.</p>
              </div>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-[#12E2C4]"
              />
            </div>

            {/* Coordinator Game Scope */}
            {(form.role === 'coordinator' || form.assignedGames.length > 0) && (
              <div className="p-4 rounded-2xl bg-[#0B1124] border border-[#F068B1]/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-[#F068B1] uppercase flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4" />
                      Coordinator Game Assignment ({form.assignedGames.length} selected)
                    </h4>
                    <p className="text-[11px] font-mono text-[#94A3B8]">
                      Coordinator will only see players & schedule matches for these games.
                    </p>
                  </div>

                  <Select
                    value={form.assignedGender}
                    onValueChange={(v) =>
                      setForm({ ...form, assignedGender: v as 'boys' | 'girls' | 'both' })
                    }
                  >
                    <SelectTrigger className="w-40 bg-[#131B38] border-white/[0.1] text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
                      <SelectItem value="both">Boys & Girls</SelectItem>
                      <SelectItem value="boys">Boys Only</SelectItem>
                      <SelectItem value="girls">Girls Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                  placeholder="Filter games..."
                  className="bg-[#131B38] border-white/[0.1] text-xs font-mono text-[#F8FAFC] rounded-xl"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredModalGames.map((g) => {
                    const selected = form.assignedGames.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleAssignedGame(g)}
                        className={`px-2.5 py-2 rounded-xl text-left text-xs font-mono flex items-center gap-2 border transition-colors ${
                          selected
                            ? 'bg-[#F068B1]/15 border-[#F068B1] text-[#F8FAFC] font-bold'
                            : 'bg-[#131B38] border-white/[0.08] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            selected ? 'bg-[#F068B1] text-white' : 'border border-white/20'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3" />}
                        </span>
                        <span className="truncate">{g}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Page Permissions Matrix */}
            {form.role !== 'super_admin' && (
              <div className="p-4 rounded-2xl bg-[#0B1124] border border-[#12E2C4]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-[#12E2C4] uppercase">
                      Per-Page Permissions Table
                    </h4>
                    <p className="text-[11px] font-mono text-[#94A3B8]">
                      Choose exactly which admin pages this user can view, edit, or delegate to others.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {pages.map((page) => {
                    const perm = form.permsMap[page.key] || {
                      canView: false,
                      canEdit: false,
                      canDelegate: false,
                    };
                    const canGrantView = actorCanGrantPage(page.key, 'view');
                    const canGrantEdit = actorCanGrantPage(page.key, 'edit');
                    const canGrantDelegate = actorCanGrantPage(page.key, 'delegate');

                    return (
                      <div
                        key={page.key}
                        className="p-3 rounded-xl bg-[#131B38] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold font-['Space_Grotesk'] text-[#F8FAFC]">
                            {page.label}{' '}
                            <span className="text-[10px] font-mono font-normal text-[#94A3B8]">
                              ({page.key})
                            </span>
                          </p>
                          <p className="text-[11px] text-[#94A3B8] truncate">{page.description}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
                          <label
                            className={`inline-flex items-center gap-1.5 cursor-pointer ${
                              !canGrantView ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={!canGrantView}
                              checked={perm.canView}
                              onChange={() => togglePermissionFlag(page.key, 'canView')}
                              className="w-3.5 h-3.5 accent-[#12E2C4]"
                            />
                            <span>View</span>
                          </label>

                          <label
                            className={`inline-flex items-center gap-1.5 cursor-pointer ${
                              !canGrantEdit ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={!canGrantEdit}
                              checked={perm.canEdit}
                              onChange={() => togglePermissionFlag(page.key, 'canEdit')}
                              className="w-3.5 h-3.5 accent-[#3B82F6]"
                            />
                            <span>Edit</span>
                          </label>

                          <label
                            className={`inline-flex items-center gap-1.5 cursor-pointer ${
                              !canGrantDelegate ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={!canGrantDelegate}
                              checked={perm.canDelegate}
                              onChange={() => togglePermissionFlag(page.key, 'canDelegate')}
                              className="w-3.5 h-3.5 accent-[#F59E0B]"
                            />
                            <span>Delegate</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono">
                {errorMsg}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="bg-transparent border-white/[0.15] text-[#94A3B8] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#0B1124] font-mono font-bold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editingUser ? 'Save Changes' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
