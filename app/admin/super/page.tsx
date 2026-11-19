'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users,
  Link2,
  Phone,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  User,
  UserCircle2,
  Search,
  Copy,
  Lock,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';

type GamePrice = {
  name: string;
  boys: number | null;
  girls: number | null;
};

type SportGroup = {
  id: string;
  game_name: string;
  gender: 'boys' | 'girls';
  group_title: string | null;
  group_url: string | null;
  coordinator_name: string | null;
  coordinator_phone: string | null;
  message_template: string | null;
  is_active: boolean;
  updated_at: string;
};

export default function SuperAdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<SportGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [canManageGroups, setCanManageGroups] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<SportGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [genderTab, setGenderTab] = useState<'boys' | 'girls'>('boys');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allGames, setAllGames] = useState<GamePrice[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SportGroup | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    gameName: '',
    gender: 'boys' as 'boys' | 'girls',
    applyToBoth: false,
    groupTitle: '',
    groupUrl: '',
    coordinatorName: '',
    coordinatorPhone: '',
    messageTemplate: '',
    isActive: true,
  });

  const loadGames = async () => {
    try {
      const res = await fetch(`/api/games?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setAllGames(data.data);
      }
    } catch (error) {
      console.error('Load games error:', error);
    }
  };

  useEffect(() => {
    loadGames();
    fetch('/api/admin/verify', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUserRole(data.role || 'admin');
          const allowedPages: string[] = Array.isArray(data.permissions) ? data.permissions : [];
          const hasAccess =
            data.role === 'super_admin' ||
            data.role === 'admin' ||
            allowedPages.includes('/admin/super') ||
            allowedPages.includes('/admin/hoc');
          if (!hasAccess) {
            router.push(data.defaultPage || '/admin/dashboard');
            return;
          }
          setCanManageGroups(
            data.role === 'super_admin' ||
              data.role === 'admin' ||
              Boolean(data.permissionDetails?.['/admin/super']?.canEdit) ||
              Boolean(data.permissionDetails?.['/admin/hoc']?.canEdit)
          );
          loadGroups();
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const res = await fetch(`/api/admin/sport-groups?t=${Date.now()}`, { cache: 'no-store', headers: { Pragma: 'no-cache' } });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setGroups(data.data);
      }
    } finally {
      setGroupsLoading(false);
    }
  };

  const openCreateDialog = (gender: 'boys' | 'girls') => {
    setEditingGroup(null);
    setFormData({
      gameName: '',
      gender,
      applyToBoth: false,
      groupTitle: '',
      groupUrl: '',
      coordinatorName: '',
      coordinatorPhone: '',
      messageTemplate: 'Assalam o Alaikum, I registered for {game}. My ticket # is {regNum}. Name: {name}, Roll: {roll}, Team: {teamName}. Please add me to the group.',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (group: SportGroup) => {
    setEditingGroup(group);
    setFormData({
      gameName: group.game_name,
      gender: group.gender,
      applyToBoth: false,
      groupTitle: group.group_title || '',
      groupUrl: group.group_url || '',
      coordinatorName: group.coordinator_name || '',
      coordinatorPhone: group.coordinator_phone || '',
      messageTemplate: group.message_template || '',
      isActive: group.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.gameName) { toast.error('Game name is required'); return; }

    setSaving(true);
    try {
      if (editingGroup) {
        const body = {
          id: editingGroup.id,
          gameName: formData.gameName,
          gender: formData.gender,
          groupTitle: formData.groupTitle || `${formData.gameName} (${formData.gender === 'boys' ? 'Boys' : 'Girls'})`,
          groupUrl: formData.groupUrl || null,
          coordinatorName: formData.coordinatorName || null,
          coordinatorPhone: formData.coordinatorPhone || null,
          messageTemplate: formData.messageTemplate || null,
          isActive: formData.isActive,
        };
        const res = await fetch('/api/admin/sport-groups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        let data: { success?: boolean; error?: string };
        try {
          data = await res.json();
        } catch {
          toast.error(`Server returned invalid response (Status ${res.status})`);
          return;
        }
        if (data.success) {
          toast.success('Sport group updated');
          setDialogOpen(false);
          await loadGroups();
        } else {
          toast.error(data.error || 'Failed to update sport group');
        }
        return;
      }

      const gendersToCreate: ('boys' | 'girls')[] = formData.applyToBoth ? ['boys', 'girls'] : [formData.gender];
      const groupTitle = formData.groupTitle || (formData.applyToBoth ? formData.gameName : `${formData.gameName} (${formData.gender === 'boys' ? 'Boys' : 'Girls'})`);

      for (const gender of gendersToCreate) {
        const body = {
          gameName: formData.gameName,
          gender,
          groupTitle: formData.applyToBoth ? `${formData.gameName} (${gender === 'boys' ? 'Boys' : 'Girls'})` : groupTitle,
          groupUrl: formData.groupUrl || null,
          coordinatorName: formData.coordinatorName || null,
          coordinatorPhone: formData.coordinatorPhone || null,
          messageTemplate: formData.messageTemplate || null,
          isActive: formData.isActive,
        };
        const res = await fetch('/api/admin/sport-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        let data: { success?: boolean; error?: string };
        try {
          data = await res.json();
        } catch {
          toast.error(`Server returned invalid response (Status ${res.status})`);
          return;
        }
        if (!data.success) {
          toast.error(data.error || 'Failed to create group');
          return;
        }
      }
      toast.success('Sport group created');
      setDialogOpen(false);
      await loadGroups();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (group: SportGroup) => {
    setConfirmDeleteGroup(group);
  };

  const executeDeleteGroup = async () => {
    if (!confirmDeleteGroup) return;
    setDeletingGroup(true);
    try {
      const res = await fetch(`/api/admin/sport-groups?id=${confirmDeleteGroup.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Sport group deleted');
        setConfirmDeleteGroup(null);
        await loadGroups();
      } else {
        toast.error(data.error || 'Failed to delete group');
      }
    } catch {
      toast.error('Failed to delete group');
    } finally {
      setDeletingGroup(false);
    }
  };

  const toggleActive = async (group: SportGroup) => {
    try {
      const res = await fetch('/api/admin/sport-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: group.id, isActive: !group.is_active }),
      });
      if ((await res.json()).success) await loadGroups();
    } catch {}
  };

  // Filter groups by gender + search
  const boysGroups = groups.filter((g) => g.gender === 'boys');
  const girlsGroups = groups.filter((g) => g.gender === 'girls');
  const currentGenderGroups = genderTab === 'boys' ? boysGroups : girlsGroups;
  const currentGroups = searchQuery.trim()
    ? currentGenderGroups.filter((g) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          g.game_name.toLowerCase().includes(q) ||
          (g.group_title || '').toLowerCase().includes(q) ||
          (g.coordinator_name || '').toLowerCase().includes(q)
        );
      })
    : currentGenderGroups;

  // Get games that don't have a group for the current gender tab
  const existingGamesForGender = currentGenderGroups.map((g) => g.game_name);
  const availableGames = allGames.map((g) => g.name).filter((name) => !existingGamesForGender.includes(name));

  const isSuperAdmin = userRole === 'super_admin' || canManageGroups;

  const handleCopyLink = (group: SportGroup) => {
    if (!group.group_url) return;
    navigator.clipboard.writeText(group.group_url);
    setCopiedId(group.id);
    toast.success('WhatsApp group link copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#12E2C4]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto text-[#F8FAFC]">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
            <OlympicRingsIcon className="w-5 h-3" />
            <span>// WHATSAPP &amp; COORDINATOR CHANNELS</span>
          </div>
          <h1 className="text-3xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight">
            Sport Groups
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-1">Manage WhatsApp groups &amp; coordinator links for Male and Female divisions</p>
        </div>
        {!isSuperAdmin && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase">
            <Lock className="w-3.5 h-3.5" /> Read-Only
          </span>
        )}
      </div>

      {/* Info Card */}
      <Card className="mb-6 border border-white/[0.08] shadow-lg bg-gradient-to-r from-[#131B38] to-[#182244] text-[#F8FAFC]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#12E2C4]/15 rounded-xl text-[#12E2C4]">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-[#F8FAFC]">Gender-Specific Groups</h3>
              <p className="text-[#94A3B8] text-sm">
                Each game has <strong className="text-[#F8FAFC]">separate groups</strong> for Male and Female. Configure WhatsApp links and coordinator contacts for each.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gender Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          <Button
            onClick={() => setGenderTab('boys')}
            variant={genderTab === 'boys' ? 'default' : 'outline'}
            className={genderTab === 'boys' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-[#131B38] border-white/[0.1] text-[#94A3B8]'}
          >
            <User className="h-4 w-4 mr-2" />
            Male ({boysGroups.length})
          </Button>
          <Button
            onClick={() => setGenderTab('girls')}
            variant={genderTab === 'girls' ? 'default' : 'outline'}
            className={genderTab === 'girls' ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-[#131B38] border-white/[0.1] text-[#94A3B8]'}
          >
            <UserCircle2 className="h-4 w-4 mr-2" />
            Female ({girlsGroups.length})
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sport or coordinator..."
              className="pl-9 h-9 bg-[#131B38] border-white/15 text-xs text-[#F8FAFC]"
            />
          </div>
          {isSuperAdmin && (
            <Button onClick={() => openCreateDialog(genderTab)} className={genderTab === 'boys' ? 'bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-bold' : 'bg-pink-500 hover:bg-pink-600 text-white font-bold'}>
              <Plus className="h-4 w-4 mr-2" />
              Add {genderTab === 'boys' ? 'Male' : 'Female'} Group
            </Button>
          )}
        </div>
      </div>

      {/* Groups Grid */}
      {groupsLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#12E2C4]" />
        </div>
      ) : currentGroups.length === 0 ? (
        <Card className="bg-[#131B38] border border-white/[0.08] shadow-lg">
          <CardContent className="py-16 text-center">
            <Link2 className="h-12 w-12 mx-auto text-[#94A3B8]/50 mb-4" />
            <p className="text-[#94A3B8] mb-4">No {genderTab} groups configured yet</p>
            {isSuperAdmin && (
              <Button onClick={() => openCreateDialog(genderTab)} className={genderTab === 'boys' ? 'bg-blue-600 text-white' : 'bg-pink-500 text-white'}>
                <Plus className="h-4 w-4 mr-2" />
                Add First {genderTab === 'boys' ? 'Male' : 'Female'} Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentGroups.map((group) => (
            <Card key={group.id} className={`bg-[#131B38] border border-white/[0.08] text-[#F8FAFC] shadow-lg overflow-hidden ${!group.is_active ? 'opacity-60' : ''}`}>
              <div className={`h-1 ${group.is_active ? (group.gender === 'boys' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-pink-500 to-rose-500') : 'bg-slate-600'}`}></div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${group.gender === 'boys' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'}`}>
                        {group.gender === 'boys' ? '♂ Male' : '♀ Female'}
                      </span>
                    </div>
                    <CardTitle className="text-lg text-[#F8FAFC]">{group.group_title || group.game_name}</CardTitle>
                    <CardDescription className="text-[#94A3B8]">Game: {group.game_name}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.is_active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-[#94A3B8]'}`}>
                    {group.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.group_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Link2 className="h-4 w-4 text-[#12E2C4] shrink-0" />
                    <a href={group.group_url} target="_blank" rel="noreferrer" className="text-[#12E2C4] hover:underline truncate flex-1">
                      {group.group_url}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(group)}
                      title="Copy WhatsApp link"
                      className="p-1.5 rounded-lg bg-[#0B1124] border border-white/10 text-[#94A3B8] hover:text-[#12E2C4]"
                    >
                      {copiedId === group.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                {group.coordinator_name && (
                  <div className="flex items-center gap-2 text-sm text-[#E2E8F0]">
                    <Users className="h-4 w-4 text-[#94A3B8]" />
                    <span>{group.coordinator_name}</span>
                  </div>
                )}
                {group.coordinator_phone && (
                  <div className="flex items-center gap-2 text-sm font-mono text-[#E2E8F0]">
                    <Phone className="h-4 w-4 text-[#94A3B8]" />
                    <span>{group.coordinator_phone}</span>
                  </div>
                )}
                {group.message_template && (
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-[#94A3B8] mt-0.5 shrink-0" />
                    <span className="text-[#94A3B8] text-xs line-clamp-2">{group.message_template}</span>
                  </div>
                )}

                {isSuperAdmin && (
                  <div className="flex gap-2 pt-3 border-t border-white/[0.08]">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(group)} className="flex-1 bg-[#0B1124] border-white/15 text-[#F8FAFC] hover:bg-white/10">
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(group)} className={`bg-[#0B1124] border-white/15 ${group.is_active ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                      {group.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(group)} className="bg-[#0B1124] border-white/15 text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Add */}
      {isSuperAdmin && availableGames.length > 0 && (
        <Card className="mt-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Quick Add {genderTab === 'boys' ? 'Male' : 'Female'} Games</CardTitle>
            <CardDescription>Games without {genderTab} groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableGames.map((gameName) => (
                <Button
                  key={gameName}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingGroup(null);
                    setFormData({
                      gameName,
                      gender: genderTab,
                      applyToBoth: false,
                      groupTitle: `${gameName} (${genderTab === 'boys' ? 'Male' : 'Female'})`,
                      groupUrl: '',
                      coordinatorName: '',
                      coordinatorPhone: '',
                      messageTemplate: 'Assalam o Alaikum, I registered for {game}. My ticket # is {regNum}. Name: {name}, Roll: {roll}, Team: {teamName}. Please add me to the group.',
                      isActive: true,
                    });
                    setDialogOpen(true);
                  }}
                  className={`border-dashed ${genderTab === 'boys' ? 'hover:border-blue-400 hover:text-blue-600' : 'hover:border-pink-400 hover:text-pink-600'}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {gameName}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingGroup ? (
                formData.gender === 'boys' ? (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">♂ Male</span>
                ) : (
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-sm">♀ Female</span>
                )
              ) : formData.applyToBoth ? (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-sm">♂♀ Both</span>
              ) : formData.gender === 'boys' ? (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">♂ Male</span>
              ) : (
                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-sm">♀ Female</span>
              )}
              {editingGroup ? 'Edit Sport Group' : 'Add Sport Group'}
            </DialogTitle>
            <DialogDescription>
              {!editingGroup && formData.applyToBoth
                ? 'Same WhatsApp link and details will be created for both Male and Female.'
                : `Configure the WhatsApp group link and coordinator details for ${formData.gender}.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Game Name *</Label>
                {editingGroup ? (
                  <Input value={formData.gameName} disabled className="bg-[#131B38] border-white/15 text-[#94A3B8]" />
                ) : (
                  <Select value={formData.gameName} onValueChange={(v) => setFormData({ ...formData, gameName: v, groupTitle: formData.applyToBoth ? v : `${v} (${formData.gender === 'boys' ? 'Male' : 'Female'})` })}>
                    <SelectTrigger><SelectValue placeholder="Select a game" /></SelectTrigger>
                    <SelectContent>
                      {availableGames.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {!editingGroup && (
                <div className="space-y-2 flex flex-col justify-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="applyToBoth"
                      checked={formData.applyToBoth}
                      onChange={(e) => setFormData({ ...formData, applyToBoth: e.target.checked, groupTitle: e.target.checked ? formData.gameName : `${formData.gameName} (${formData.gender === 'boys' ? 'Male' : 'Female'})` })}
                      className="w-4 h-4 rounded"
                    />
                    <Label htmlFor="applyToBoth" className="font-normal cursor-pointer">Same group for both Male & Female</Label>
                  </div>
                  <p className="text-xs text-slate-500">Creates one entry for Male and one for Female with the same URL and details.</p>
                </div>
              )}
              {!formData.applyToBoth && (
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as 'boys' | 'girls', groupTitle: formData.gameName ? `${formData.gameName} (${v === 'boys' ? 'Male' : 'Female'})` : '' })} disabled={!!editingGroup}>
                    <SelectTrigger className={editingGroup ? 'bg-[#131B38] text-[#94A3B8]' : ''}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boys">Male</SelectItem>
                      <SelectItem value="girls">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Group Title</Label>
              <Input value={formData.groupTitle} onChange={(e) => setFormData({ ...formData, groupTitle: e.target.value })} />
            </div>
            
            <div className="space-y-2">
              <Label>Group URL</Label>
              <Input value={formData.groupUrl} onChange={(e) => setFormData({ ...formData, groupUrl: e.target.value })} placeholder="https://chat.whatsapp.com/..." />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coordinator Name</Label>
                <Input value={formData.coordinatorName} onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Coordinator Phone</Label>
                <Input value={formData.coordinatorPhone} onChange={(e) => setFormData({ ...formData, coordinatorPhone: e.target.value })} placeholder="03001234567" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Message Template</Label>
              <textarea
                value={formData.messageTemplate}
                onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                placeholder="Use {game}, {regNum}, {name}, {roll}, {phone}"
                className="w-full h-20 px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded" />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">Active</Label>
              </div>
              <p className="text-xs text-slate-500">When checked, this group and its join link appear on the registration success page so participants can join. Uncheck to hide it without deleting.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.gameName} className={formData.gender === 'boys' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-500 hover:bg-pink-600'}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {editingGroup ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDeleteGroup)}
        title={`Delete "${confirmDeleteGroup?.game_name}" (${confirmDeleteGroup?.gender}) group?`}
        description="Participants will no longer see this WhatsApp group link on the registration success page."
        confirmLabel="Delete Group"
        destructive
        loading={deletingGroup}
        onCancel={() => setConfirmDeleteGroup(null)}
        onConfirm={executeDeleteGroup}
      />
    </div>
  );
}
