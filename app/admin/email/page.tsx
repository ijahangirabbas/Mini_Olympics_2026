'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { useAdminSession, canEditPage } from '@/lib/admin-session-context';
import { OlympicRingsIcon } from '@/components/olympic-rings-icon';
import {
  Mail,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Sparkles,
  Search,
  Lock,
  Settings,
  RefreshCw,
} from 'lucide-react';

type Recipient = {
  email: string;
  name: string;
  gender: string;
  status: string;
  registration_number?: number | null;
  team_name?: string | null;
};

type GameOption = {
  name: string;
};

const QUICK_TEMPLATES = [
  {
    id: 'approval',
    label: 'Team Approved',
    subject: 'Mini Olympics 2026 — Registration Approved!',
    body: `Dear {{name}},\n\nCongratulations! Your registration (Ticket #{{regNum}}, Team: {{teamName}}) for Mini Olympics 2026 has been officially approved.\n\nPlease join your sport WhatsApp group for match schedules, timings, and venue announcements.\n\nBest of luck!`,
  },
  {
    id: 'schedule',
    label: 'Match Schedule Notice',
    subject: 'Mini Olympics 2026 — Match Schedule Update',
    body: `Dear {{name}},\n\nMatch schedules for Mini Olympics 2026 have been updated. Please report to your assigned venue 20 minutes before your scheduled match time with your university ID card.\n\nTicket #: {{regNum}} | Team: {{teamName}}`,
  },
  {
    id: 'reminder',
    label: 'Payment Reminder',
    subject: 'Mini Olympics 2026 — Payment Verification Reminder',
    body: `Dear {{name}},\n\nYour registration (Ticket #{{regNum}}) is currently pending payment verification. Please complete your payment and submit your screenshot or visit the cash desk so your team can be included in the official brackets.`,
  },
];

function buildBrandedHtml(subject: string, rawBody: string, sample?: Recipient): string {
  const name = sample?.name || 'Participant';
  const regNum = sample?.registration_number ? String(sample.registration_number) : '1001';
  const teamName = sample?.team_name || name;

  const replaced = rawBody
    .replace(/\{\{name\}\}|\{name\}/gi, name)
    .replace(/\{\{regNum\}\}|\{regNum\}/gi, regNum)
    .replace(/\{\{teamName\}\}|\{teamName\}/gi, teamName);

  const paragraphs = replaced
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#080D1C;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="height:5px;border-radius:14px 14px 0 0;background:linear-gradient(90deg,#0081C8 0%,#FCB131 35%,#12E2C4 70%,#EE334E 100%);"></div>
    <div style="background:linear-gradient(135deg,#131B38 0%,#0B1124 100%);padding:24px 28px;text-align:center;color:#F8FAFC;">
      <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#12E2C4;font-weight:700;">FCIT SPORTS SOCIETY • OFFICIAL NOTICE</p>
      <h1 style="margin:0;font-size:22px;font-weight:800;">Mini Olympics 2026</h1>
    </div>
    <div style="background:#FFFFFF;border-radius:0 0 14px 14px;padding:28px;color:#1E293B;line-height:1.7;font-size:15px;">
      <h2 style="margin:0 0 16px 0;font-size:18px;color:#0F172A;">${subject || 'Mini Olympics 2026 Update'}</h2>
      ${paragraphs}
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E2E8F0;color:#64748B;font-size:13px;">
        Best regards,<br/><strong style="color:#0F172A;">FCIT Sports Society</strong>
      </div>
    </div>
  </div>
</body>
</html>`.trim();
}

export default function EmailComposerPage() {
  const toast = useToast();
  const adminSession = useAdminSession();
  const canEdit = canEditPage(adminSession, '/admin/email');

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [games, setGames] = useState<GameOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpEmail, setSmtpEmail] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('paid');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boys' | 'girls'>('all');
  const [gameFilter, setGameFilter] = useState('all');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [customEmail, setCustomEmail] = useState('');

  // Composer
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);

  useEffect(() => {
    fetch('/api/games?includeInactive=true', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setGames(d.data);
      })
      .catch(() => {});
  }, []);

  const loadRecipients = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('filter', statusFilter);
      if (genderFilter !== 'all') qs.set('gender', genderFilter);
      if (gameFilter !== 'all') qs.set('game', gameFilter);
      const res = await fetch(`/api/admin/email?${qs.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const list: Recipient[] = data.data || [];
        setRecipients(list);
        setSelectedEmails(list.map((r) => r.email));
        setSmtpConfigured(Boolean(data.smtpConfigured));
        setSmtpEmail(data.smtpEmail || null);
      } else {
        toast.error(data.error || 'Failed to load recipients');
      }
    } catch {
      toast.error('Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipients();
  }, [statusFilter, genderFilter, gameFilter]);

  const visibleRecipients = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.team_name || '').toLowerCase().includes(q)
    );
  }, [recipients, recipientSearch]);

  const finalTargetRecipients = useMemo(() => {
    const map = new Map<string, Recipient>();
    for (const r of recipients) {
      if (selectedEmails.includes(r.email)) {
        map.set(r.email.toLowerCase(), r);
      }
    }
    const extra = customEmail
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.includes('@'));
    for (const em of extra) {
      if (!map.has(em.toLowerCase())) {
        map.set(em.toLowerCase(), {
          email: em,
          name: 'Participant',
          gender: 'both',
          status: 'paid',
        });
      }
    }
    return Array.from(map.values());
  }, [recipients, selectedEmails, customEmail]);

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const insertPlaceholder = (token: string) => {
    setBody((prev) => (prev ? `${prev} ${token}` : token));
  };

  const handleSendAll = async () => {
    if (!canEdit) return;
    setConfirmOpen(false);
    setSending(true);
    const targets = finalTargetRecipients;
    setSendProgress({ sent: 0, failed: 0, total: targets.length });

    let sent = 0;
    let failed = 0;

    for (const r of targets) {
      try {
        const html = buildBrandedHtml(subject, body, r);
        const res = await fetch('/api/admin/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: r.email,
            subject,
            html,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          sent++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      setSendProgress({ sent, failed, total: targets.length });
    }

    setSending(false);
    if (failed === 0) {
      toast.success(`Successfully sent ${sent} email(s)!`);
    } else if (sent > 0) {
      toast.error(`Sent ${sent}, failed ${failed}. Check Gmail SMTP settings.`);
    } else {
      toast.error('Failed to send emails. Please verify Gmail SMTP in Settings.');
    }
  };

  const previewHtml = useMemo(
    () => buildBrandedHtml(subject, body, finalTargetRecipients[0] || recipients[0]),
    [subject, body, finalTargetRecipients, recipients]
  );

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-6 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
            <OlympicRingsIcon className="w-5 h-3" />
            <span>// PARTICIPANT COMMUNICATIONS</span>
          </div>
          <h1 className="text-3xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight">
            Email Composer
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-1">
            Send personalized announcements, schedules &amp; reminders via Gmail SMTP
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!canEdit && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase">
              <Lock className="w-3.5 h-3.5" /> Read-Only
            </span>
          )}
          {smtpConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Gmail SMTP: {smtpEmail}
            </span>
          ) : (
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-mono transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Configure Gmail SMTP
              <Settings className="w-3 h-3 ml-1" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recipient Selector */}
        <Card className="lg:col-span-5 bg-[#131B38] border border-white/[0.08] text-[#F8FAFC] flex flex-col">
          <CardHeader className="border-b border-white/[0.08] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[#F8FAFC]">
                <Users className="w-4 h-4 text-[#12E2C4]" />
                Recipients ({finalTargetRecipients.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadRecipients}
                className="h-7 px-2 text-[#94A3B8] hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
            <CardDescription className="text-xs text-[#94A3B8]">
              Filter by payment status, gender, or specific game
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131B38] border-white/15 text-[#F8FAFC]">
                  <SelectItem value="paid">Paid / Approved</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="all">All Statuses</SelectItem>
                </SelectContent>
              </Select>

              <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as any)}>
                <SelectTrigger className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131B38] border-white/15 text-[#F8FAFC]">
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]">
                <SelectValue placeholder="Filter by Game" />
              </SelectTrigger>
              <SelectContent className="bg-[#131B38] border-white/15 text-[#F8FAFC] max-h-64">
                <SelectItem value="all">All Games</SelectItem>
                {games.map((g) => (
                  <SelectItem key={g.name} value={g.name}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Search name, team, or email..."
                className="pl-8 h-9 bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <span>
                Selected: <strong className="text-[#12E2C4]">{selectedEmails.length}</strong> / {recipients.length}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmails(recipients.map((r) => r.email))}
                  className="text-[#12E2C4] hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEmails([])}
                  className="text-rose-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="border border-white/[0.08] rounded-xl bg-[#0B1124] max-h-64 overflow-y-auto divide-y divide-white/[0.05]">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#12E2C4] mx-auto" />
                </div>
              ) : visibleRecipients.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-[#94A3B8]">
                  No recipients match these filters.
                </div>
              ) : (
                visibleRecipients.map((r) => (
                  <label
                    key={r.email}
                    className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.03] cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(r.email)}
                      onChange={() => toggleEmail(r.email)}
                      className="accent-[#12E2C4]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#F8FAFC] truncate">
                        {r.name}
                        {r.registration_number ? ` (#${r.registration_number})` : ''}
                      </p>
                      <p className="text-[11px] font-mono text-[#94A3B8] truncate">{r.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
              <Label className="text-[11px] font-mono text-[#94A3B8] uppercase">
                Additional Emails (comma-separated)
              </Label>
              <Input
                value={customEmail}
                disabled={!canEdit}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="extra1@pucit.edu.pk, extra2@gmail.com"
                className="bg-[#0B1124] border-white/15 text-xs text-[#F8FAFC]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: Message Composer & Preview */}
        <Card className="lg:col-span-7 bg-[#131B38] border border-white/[0.08] text-[#F8FAFC]">
          <CardHeader className="border-b border-white/[0.08] pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2 text-[#F8FAFC]">
                <Mail className="w-4 h-4 text-[#12E2C4]" />
                Compose Message
              </CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setSubject(tpl.subject);
                      setBody(tpl.body);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B1124] border border-white/10 hover:border-[#12E2C4]/40 text-[11px] font-mono text-[#E2E8F0] transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-[#94A3B8] uppercase">Subject *</Label>
              <Input
                value={subject}
                disabled={!canEdit}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mini Olympics 2026 — Match Schedule Update"
                className="bg-[#0B1124] border-white/15 text-sm text-[#F8FAFC]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-mono text-[#94A3B8] uppercase">Message Body *</Label>
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  <span className="text-[#94A3B8]">Insert:</span>
                  {['{{name}}', '{{regNum}}', '{{teamName}}'].map((tok) => (
                    <button
                      key={tok}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => insertPlaceholder(tok)}
                      className="px-2 py-0.5 rounded bg-[#0B1124] border border-white/15 text-[#12E2C4] hover:bg-[#12E2C4]/10 disabled:opacity-50"
                    >
                      {tok}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={9}
                value={body}
                disabled={!canEdit}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your announcement here... Placeholders like {{name}} and {{teamName}} are personalized per student."
                className="w-full p-3.5 rounded-xl bg-[#0B1124] border border-white/15 text-sm text-[#F8FAFC] font-mono focus:outline-none focus:border-[#12E2C4] resize-y"
              />
            </div>

            {sendProgress && (
              <div className="p-3 rounded-xl bg-[#0B1124] border border-[#12E2C4]/30 text-xs font-mono flex items-center justify-between">
                <span>
                  Progress: <strong className="text-[#12E2C4]">{sendProgress.sent}</strong> sent
                  {sendProgress.failed > 0 && (
                    <span className="text-rose-400 ml-2">{sendProgress.failed} failed</span>
                  )}
                </span>
                <span className="text-[#94A3B8]">
                  {sendProgress.sent + sendProgress.failed} / {sendProgress.total}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview((p) => !p)}
                className="border-white/15 bg-[#0B1124] text-[#F8FAFC] hover:bg-white/10"
              >
                <Eye className="w-4 h-4 mr-1.5 text-[#12E2C4]" />
                {showPreview ? 'Hide Preview' : 'Live Preview'}
              </Button>

              {canEdit && (
                <Button
                  type="button"
                  disabled={sending || !subject.trim() || !body.trim() || finalTargetRecipients.length === 0}
                  onClick={() => setConfirmOpen(true)}
                  className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-black font-mono uppercase tracking-wider px-6"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send to {finalTargetRecipients.length} Recipient(s)
                    </>
                  )}
                </Button>
              )}
            </div>

            {showPreview && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-white/15 bg-[#080D1C]">
                <div className="px-4 py-2 bg-[#182244] text-[11px] font-mono text-[#94A3B8] border-b border-white/10">
                  EMAIL PREVIEW (sample recipient: {finalTargetRecipients[0]?.name || 'Participant'})
                </div>
                <iframe
                  title="Email Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[380px] bg-[#080D1C]"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title={`Send email to ${finalTargetRecipients.length} recipient(s)?`}
        description={`Subject: "${subject}". Emails will be dispatched via your configured Gmail SMTP account.`}
        confirmLabel="Send Emails"
        onConfirm={handleSendAll}
      />
    </div>
  );
}
