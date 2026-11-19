'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { useAdminSession, canEditPage } from '@/lib/admin-session-context';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  MapPin,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';

type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  location: string | null;
  is_active?: boolean;
};

const CATEGORIES = [
  { value: 'sports_equipment', label: 'Sports Equipment' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'awards', label: 'Medals & Awards' },
  { value: 'banners', label: 'Banners & Signage' },
  { value: 'general', label: 'General Supplies' },
];

function getCategoryLabel(val: string) {
  return CATEGORIES.find((c) => c.value === val)?.label || val.replace(/_/g, ' ');
}

export default function InventoryPage() {
  const toast = useToast();
  const adminSession = useAdminSession();
  const canEdit = canEditPage(adminSession, '/admin/inventory');

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Add / Edit Modal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'sports_equipment',
    quantity: '1',
    unit: 'pcs',
    minQuantity: '2',
    location: '',
    description: '',
  });

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory?_t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load inventory');
      }
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.min_quantity || 0)).length;
    const healthyStock = totalItems - lowStock;
    return { totalItems, totalUnits, lowStock, healthyStock };
  }, [items]);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      name: '',
      category: 'sports_equipment',
      quantity: '1',
      unit: 'pcs',
      minQuantity: '2',
      location: '',
      description: '',
    });
    setDialogOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category || 'general',
      quantity: String(item.quantity ?? 0),
      unit: item.unit || 'pcs',
      minQuantity: String(item.min_quantity ?? 0),
      location: item.location || '',
      description: item.description || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!canEdit) return;
    if (!form.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(editingItem ? { id: editingItem.id } : {}),
        name: form.name.trim(),
        category: form.category,
        quantity: Math.max(0, Number(form.quantity) || 0),
        unit: form.unit.trim() || 'pcs',
        minQuantity: Math.max(0, Number(form.minQuantity) || 0),
        location: form.location.trim() || null,
        description: form.description.trim() || null,
      };

      const res = await fetch('/api/admin/inventory', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingItem ? 'Item updated' : 'Item added to inventory');
        setDialogOpen(false);
        await loadItems();
      } else {
        toast.error(data.error || 'Failed to save item');
      }
    } catch {
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/inventory?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Deleted "${deleteTarget.name}"`);
        setDeleteTarget(null);
        await loadItems();
      } else {
        toast.error(data.error || 'Failed to delete item');
      }
    } catch {
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#12E2C4] mx-auto" />
          <p className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">
            LOADING EQUIPMENT INVENTORY...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-8 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
            <OlympicRingsIcon className="w-5 h-3" />
            <span>// EQUIPMENT &amp; STOCK DESK</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight">
            INVENTORY DASHBOARD
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-1">
            SIMPLE SPORTS EQUIPMENT &amp; SUPPLIES STOCK TRACKER
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!canEdit && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase">
              <Lock className="w-3.5 h-3.5" /> Read-Only
            </span>
          )}
          <Button
            onClick={loadItems}
            variant="outline"
            className="rounded-xl text-xs font-mono border-white/[0.12] bg-[#131B38] text-[#F8FAFC] hover:bg-white/[0.08]"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          {canEdit && (
            <Button
              onClick={openAddModal}
              className="rounded-xl text-xs font-mono font-black tracking-wider bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#0B1124] uppercase"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Equipment
            </Button>
          )}
        </div>
      </div>

      {/* 4 Clean Dark KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#131B38] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Total Items</span>
            <Package className="w-4 h-4 text-[#12E2C4]" />
          </div>
          <p className="text-3xl font-black font-['Space_Grotesk'] text-[#F8FAFC] mt-2">{stats.totalItems}</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#131B38] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Total Units</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-black font-['Space_Grotesk'] text-sky-400 mt-2">{stats.totalUnits}</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#131B38] border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#94A3B8] uppercase">In Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black font-['Space_Grotesk'] text-emerald-400 mt-2">{stats.healthyStock}</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#131B38] border border-amber-500/25">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-300 uppercase">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black font-['Space_Grotesk'] text-amber-400 mt-2">{stats.lowStock}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search equipment name, location, or notes..."
            className="pl-10 bg-[#131B38] border-white/[0.1] text-sm text-[#F8FAFC] rounded-xl"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-56 bg-[#131B38] border-white/[0.1] text-sm text-[#F8FAFC] rounded-xl">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-[#131B38] border-white/[0.15] text-[#F8FAFC]">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Equipment List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#131B38] border border-white/[0.08] text-center space-y-3">
          <Package className="w-10 h-10 text-[#94A3B8] mx-auto opacity-60" />
          <p className="text-sm font-mono text-[#94A3B8]">
            {items.length === 0
              ? 'No equipment items added yet.'
              : 'No equipment matches your search or category filter.'}
          </p>
          {canEdit && items.length === 0 && (
            <Button
              onClick={openAddModal}
              className="rounded-xl text-xs font-mono font-bold bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#0B1124]"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add First Item
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl bg-[#131B38] border border-white/[0.08] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#182244] border-b border-white/[0.08] text-[11px] font-mono uppercase text-[#94A3B8]">
                  <th className="py-3.5 px-5">Equipment</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canEdit && <th className="py-3.5 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-sm">
                {filteredItems.map((item) => {
                  const isLow = Number(item.quantity) <= Number(item.min_quantity || 0);
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#F8FAFC]">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-[#94A3B8] mt-0.5 line-clamp-1">{item.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0B1124] border border-white/[0.08] text-xs font-mono text-[#94A3B8]">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        <span className="font-bold text-[#F8FAFC]">{item.quantity}</span>{' '}
                        <span className="text-xs text-[#94A3B8]">{item.unit || 'pcs'}</span>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-[#94A3B8]">
                        {item.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#12E2C4]" />
                            {item.location}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(item)}
                            className="h-8 px-2.5 bg-[#0B1124] border-white/[0.12] text-[#F8FAFC] hover:bg-white/[0.08]"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTarget(item)}
                            className="h-8 px-2.5 bg-[#0B1124] border-white/[0.12] text-red-400 hover:bg-red-500/15"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredItems.map((item) => {
              const isLow = Number(item.quantity) <= Number(item.min_quantity || 0);
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#131B38] border border-white/[0.08] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#F8FAFC]">{item.name}</h3>
                      <p className="text-xs font-mono text-[#94A3B8]">{getCategoryLabel(item.category)}</p>
                    </div>
                    {isLow ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        In Stock
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8] pt-2 border-t border-white/[0.06]">
                    <span>
                      Stock: <strong className="text-[#F8FAFC]">{item.quantity} {item.unit || 'pcs'}</strong>
                    </span>
                    <span>{item.location || 'No location'}</span>
                  </div>

                  {canEdit && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(item)}
                        className="h-8 px-3 text-xs bg-[#0B1124] border-white/[0.12] text-[#F8FAFC]"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(item)}
                        className="h-8 px-3 text-xs bg-[#0B1124] border-white/[0.12] text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Equipment Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-[#0B1124] border-white/15 text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <Package className="w-5 h-5 text-[#12E2C4]" />
              {editingItem ? 'Edit Equipment Item' : 'Add Equipment Item'}
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Track sports equipment quantities and storage locations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-[#94A3B8]">Item Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Badminton Shuttlecocks"
                className="bg-[#131B38] border-white/15 text-[#F8FAFC]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-[#131B38] border-white/15 text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#131B38] border-white/15 text-[#F8FAFC]">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Sports Room / Hall"
                  className="bg-[#131B38] border-white/15 text-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Quantity *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="bg-[#131B38] border-white/15 text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="pcs / box"
                  className="bg-[#131B38] border-white/15 text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-[#94A3B8]">Min Alert</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.minQuantity}
                  onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                  className="bg-[#131B38] border-white/15 text-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-[#94A3B8]">Notes (Optional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Condition, brand, or assignment notes"
                className="bg-[#131B38] border-white/15 text-[#F8FAFC]"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/15 bg-white/5 text-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#0B1124] font-bold"
            >
              {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Equipment Item?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.name}" (${deleteTarget.quantity} ${deleteTarget.unit || 'pcs'}) from inventory?`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
