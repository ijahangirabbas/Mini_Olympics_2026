'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Gamepad2, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { useAdminSession, canEditPage } from '@/lib/admin-session-context';

export default function EsportsSettingsPage() {
  const adminSession = useAdminSession();
  const canEdit = canEditPage(adminSession, '/admin/esports');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [closeDate, setCloseDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/esports', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setIsOpen(Boolean(data.data.is_open));
          setAnnouncement(data.data.announcement || '');
          setOpenDate(data.data.open_date || null);
          setCloseDate(data.data.close_date || null);
        }
      })
      .catch((error) => {
        console.error('Failed to load esports settings:', error);
        setFeedback({ type: 'error', text: 'Failed to load esports settings.' });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/esports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpen,
          announcement,
          openDate,
          closeDate,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFeedback({ type: 'success', text: 'Esports settings saved.' });
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to save settings.' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setFeedback({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#12E2C4] mx-auto" />
          <p className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase">
            LOADING ESPORTS SETTINGS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-3xl mx-auto space-y-8">
      <div className="pb-6 border-b border-white/[0.08]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
          <Gamepad2 className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>ESPORTS ARENA CONTROLS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight">
          ESPORTS SETTINGS
        </h1>
        <p className="text-xs font-mono text-[#94A3B8] mt-1">
          Manage esports registration status and public arena announcements.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-[#131B38] border border-white/[0.08] shadow-2xl space-y-6">
        <div className="p-4 rounded-2xl bg-[#080D1C] border border-white/[0.08]">
          {!canEdit && (
            <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono uppercase">
              <Lock className="w-3 h-3" /> Read-Only Access
            </div>
          )}
          <Label htmlFor="esports-open" className={`flex items-center gap-3 ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
            <input
              id="esports-open"
              type="checkbox"
              checked={isOpen}
              disabled={!canEdit}
              onChange={(e) => setIsOpen(e.target.checked)}
              className="h-4 w-4 accent-[#12E2C4] rounded"
            />
            <span className="text-sm font-bold text-[#F8FAFC] font-['Space_Grotesk'] uppercase">
              Esports Registration Open
            </span>
          </Label>
          <p className="text-xs font-mono text-[#94A3B8] mt-1.5 pl-7">
            When unchecked, esports registration will be disabled.
          </p>
        </div>

        <div>
          <Label htmlFor="announcement" className="text-xs font-mono text-[#94A3B8] uppercase">
            Announcement Message
          </Label>
          <Input
            id="announcement"
            value={announcement}
            disabled={!canEdit}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="Optional announcement for esports"
            className="mt-2 bg-[#080D1C] border-white/[0.1] text-sm text-[#F8FAFC] rounded-xl focus:border-[#12E2C4]"
          />
          <p className="text-xs font-mono text-[#94A3B8]/80 mt-1.5">
            This message will be displayed to esports registrants.
          </p>
        </div>

        {feedback && (
          <div
            role="status"
            className={`p-3.5 rounded-xl border font-mono text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-[#12E2C4]/10 border-[#12E2C4]/30 text-[#12E2C4]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {canEdit && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl text-xs font-mono font-black tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] uppercase shadow-lg shadow-[#12E2C4]/20"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'SAVING SETTINGS...' : 'SAVE ESPORTS SETTINGS'}
          </Button>
        )}
      </div>
    </div>
  );
}

