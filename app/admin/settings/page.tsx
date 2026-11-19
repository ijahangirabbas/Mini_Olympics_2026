'use client';

import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { canEditPage, useAdminSession } from '@/lib/admin-session-context';
import {
  Settings,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Gamepad2,
  Plus,
  Trash2,
  Edit,
  Mail,
  Server,
  Send,
  Tag,
  Lock,
  Unlock,
  Banknote,
  Power,
} from 'lucide-react';

type GamePricing = {
  id: number;
  game_id?: string | null;
  game_name: string;
  gender: string;
  price: number;
  players: number | null;
  category?: string | null;
  is_active?: boolean;
  coupon_eligible?: boolean;
};

export default function SettingsPage() {
  const adminSession = useAdminSession();
  const canEdit = canEditPage(adminSession, '/admin/settings');
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const [settings, setSettings] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_email: '',
    smtp_password: '',
    smtp_from_name: 'FCIT Sports Society',
    registrations_open: true,
    cash_payment_enabled: true,
  });

  const [savingRegistrations, setSavingRegistrations] = useState(false);
  const [savingCashToggle, setSavingCashToggle] = useState(false);

  const [emailTemplates, setEmailTemplates] = useState({
    email_registration_submitted_online_subject: 'Mini Olympics 2026 Registration',
    email_registration_submitted_online_body: `<h2>Welcome to Mini Olympics 2026!</h2>
<p>Dear {{name}},</p>
<p>Thank you for registering for the FCIT Sports Mini Olympics 2026.</p>
<p><strong>Ticket #:</strong> {{regNum}}</p>
<p><strong>Reference / Slip ID:</strong> {{slipId}}</p>
<p><strong>Team name:</strong> {{teamName}}</p>
<p><strong>Registered game(s):</strong></p>
<ul>{{gamesList}}</ul>`,
    email_registration_submitted_cash_subject: 'Mini Olympics 2026 Registration',
    email_registration_submitted_cash_body: `<h2>Welcome to Mini Olympics 2026!</h2>
<p>Dear {{name}},</p>
<p>Thank you for registering for the FCIT Sports Mini Olympics 2026.</p>
<p><strong>Ticket #:</strong> {{regNum}}</p>
<p><strong>Reference / Slip ID:</strong> {{slipId}}</p>
<p><strong>Team name:</strong> {{teamName}}</p>
<p><strong>Registered game(s):</strong></p>
<ul>{{gamesList}}</ul>`,
    email_payment_received_subject: 'Mini Olympics 2026 Registration',
    email_payment_received_body: `<h2>Payment Confirmed</h2>
<p>Dear {{name}},</p>
<p>Your payment for <strong>Mini Olympics 2026</strong> has been received and verified.</p>
<p><strong>Ticket #:</strong> {{regNum}}</p>
<p><strong>Reference ID:</strong> {{slipId}}</p>`,
    email_payment_rejected_subject: 'Mini Olympics 2026 Registration',
    email_payment_rejected_body: `<h2>Payment Verification Required</h2>
<p>Dear {{name}},</p>
<p>We were unable to verify your payment for <strong>Mini Olympics 2026</strong> (Ticket #{{regNum}}).</p>
<p><strong>Reference ID:</strong> {{slipId}}</p>
<p>{{paymentAction}}</p>`,
  });
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [templatesSaveSuccess, setTemplatesSaveSuccess] = useState(false);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<
    'registration_online' | 'registration_cash' | 'payment_received' | 'payment_rejected'
  >('registration_online');

  const normalizeCategorySlug = (raw?: string | null): string => {
    const val = String(raw || '').trim().toLowerCase();
    if (val === 'team' || val.includes('team')) return 'team';
    if (val === 'indoor' || val.includes('indoor') || val.includes('table') || val === 'racket' || val.includes('racket')) return 'indoor';
    if (val === 'track' || val.includes('track') || val.includes('field') || val === 'race' || val.includes('race')) return 'track';
    if (val === 'esports' || val.includes('esport')) return 'esports';
    if (val === 'fun' || val.includes('fun') || val === 'board' || val.includes('board') || val.includes('strategy') || val === 'skill') return 'fun';
    return 'team';
  };

  // Games state
  const [games, setGames] = useState<GamePricing[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GamePricing | null>(null);
  const [savingGame, setSavingGame] = useState(false);
  const [syncingPdfGames, setSyncingPdfGames] = useState(false);
  const [gameForm, setGameForm] = useState({
    original_game_name: '',
    game_name: '',
    category: 'team',
    is_active: true,
    coupon_eligible: true,
    boys_price: '',
    boys_players: '',
    girls_price: '',
    girls_players: '',
  });

  // Coupons state
  const [coupons, setCoupons] = useState<
    { id: string; code: string; discount_percent: number; is_active: boolean }[]
  >([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: '' });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [togglingCouponId, setTogglingCouponId] = useState<string | null>(null);

  // Confirm dialogs state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({ open: false, title: '', description: '', confirmLabel: 'Confirm', onConfirm: () => {} });
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadGames();
    loadCoupons();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const d = data.data;
        setSettings({
          smtp_host: d.smtp_host || 'smtp.gmail.com',
          smtp_port: d.smtp_port || '587',
          smtp_email: d.smtp_email || '',
          smtp_password: d.smtp_password || '',
          smtp_from_name: d.smtp_from_name || 'FCIT Sports Society',
          registrations_open: d.registrations_open !== 'false' && d.registrations_open !== '0',
          cash_payment_enabled: d.cash_payment_enabled !== 'false' && d.cash_payment_enabled !== '0',
        });
        setEmailTemplates((prev) => ({
          email_registration_submitted_online_subject:
            d.email_registration_submitted_online_subject ?? prev.email_registration_submitted_online_subject,
          email_registration_submitted_online_body:
            d.email_registration_submitted_online_body ?? prev.email_registration_submitted_online_body,
          email_registration_submitted_cash_subject:
            d.email_registration_submitted_cash_subject ?? prev.email_registration_submitted_cash_subject,
          email_registration_submitted_cash_body:
            d.email_registration_submitted_cash_body ?? prev.email_registration_submitted_cash_body,
          email_payment_received_subject:
            d.email_payment_received_subject ?? prev.email_payment_received_subject,
          email_payment_received_body:
            d.email_payment_received_body ?? prev.email_payment_received_body,
          email_payment_rejected_subject:
            d.email_payment_rejected_subject ?? prev.email_payment_rejected_subject,
          email_payment_rejected_body:
            d.email_payment_rejected_body ?? prev.email_payment_rejected_body,
        }));
      }
    } catch (error) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async () => {
    setLoadingGames(true);
    try {
      const res = await fetch('/api/admin/games?includeInactive=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setGames(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load games');
      }
    } catch {
      toast.error('Failed to load games');
    } finally {
      setLoadingGames(false);
    }
  };

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch('/api/admin/coupons', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data || []);
      }
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const runSettingToggle = async (key: 'registrations_open' | 'cash_payment_enabled', next: boolean) => {
    const setFlag = key === 'registrations_open' ? setSavingRegistrations : setSavingCashToggle;
    setFlag(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: next ? 'true' : 'false' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings((prev) => ({ ...prev, [key]: next }));
        toast.success(`${key === 'registrations_open' ? 'Registrations' : 'Cash payments'} ${next ? 'enabled' : 'disabled'}`);
      } else {
        toast.error(data.error || 'Failed to update setting');
      }
    } catch {
      toast.error('Failed to update setting');
    } finally {
      setFlag(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    setSmtpSaveSuccess(false);
    try {
      const smtpSettings = [
        { key: 'smtp_host', value: settings.smtp_host },
        { key: 'smtp_port', value: settings.smtp_port },
        { key: 'smtp_email', value: settings.smtp_email },
        { key: 'smtp_password', value: settings.smtp_password },
        { key: 'smtp_from_name', value: settings.smtp_from_name },
      ];
      for (const setting of smtpSettings) {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save SMTP settings');
        }
      }
      setSmtpSaveSuccess(true);
      toast.success('SMTP configuration saved');
      setTimeout(() => setSmtpSaveSuccess(false), 3000);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save SMTP settings');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSaveEmailTemplates = async () => {
    setSavingTemplates(true);
    setTemplatesSaveSuccess(false);
    try {
      const keys = Object.keys(emailTemplates) as (keyof typeof emailTemplates)[];
      for (const key of keys) {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: emailTemplates[key] }),
        });
        if (!res.ok) throw new Error('Failed to save templates');
      }
      setTemplatesSaveSuccess(true);
      toast.success('Email templates saved');
      setTimeout(() => setTemplatesSaveSuccess(false), 3000);
    } catch {
      toast.error('Failed to save email templates');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.smtp_email) {
      toast.error('Please enter SMTP email address first');
      return;
    }
    setTestingEmail(true);
    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: settings.smtp_email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Test email sent successfully! Check your inbox.');
      } else {
        toast.error(data.error || 'Failed to send test email');
      }
    } catch {
      toast.error('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleCreateCoupon = async () => {
    const code = couponForm.code.trim().toUpperCase();
    const pct = parseFloat(couponForm.discountPercent);
    if (!code) {
      toast.error('Enter a coupon code');
      return;
    }
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      toast.error('Discount percent must be between 1 and 100');
      return;
    }
    setSavingCoupon(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discount_percent: pct }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponForm({ code: '', discountPercent: '' });
        toast.success(`Coupon ${code} created`);
        loadCoupons();
      } else {
        toast.error(data.error || 'Failed to create coupon');
      }
    } catch {
      toast.error('Failed to create coupon');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon: { id: string; code: string; is_active: boolean }) => {
    setTogglingCouponId(coupon.id);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Coupon ${coupon.code} ${!coupon.is_active ? 'activated' : 'deactivated'}`);
        loadCoupons();
      } else {
        toast.error(data.error || 'Failed to update coupon');
      }
    } catch {
      toast.error('Failed to update coupon');
    } finally {
      setTogglingCouponId(null);
    }
  };

  const requestDeleteCoupon = (c: { id: string; code: string }) => {
    setConfirmState({
      open: true,
      title: `Delete coupon ${c.code}?`,
      description: 'This coupon will be permanently removed and cannot be redeemed at checkout.',
      confirmLabel: 'Delete Coupon',
      destructive: true,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          toast.success(`Deleted coupon ${c.code}`);
          loadCoupons();
        } else {
          toast.error(data.error || 'Failed to delete coupon');
        }
      },
    });
  };

  const handleOpenGameDialog = (game?: GamePricing) => {
    if (game) {
      const gameName = game.game_name;
      const boysEntry = games.find((g) => g.game_name === gameName && g.gender === 'boys');
      const girlsEntry = games.find((g) => g.game_name === gameName && g.gender === 'girls');

      setEditingGame(game);
      setGameForm({
        original_game_name: gameName,
        game_name: gameName,
        category: normalizeCategorySlug(boysEntry?.category || girlsEntry?.category),
        is_active: (boysEntry?.is_active ?? girlsEntry?.is_active) !== false,
        coupon_eligible: (boysEntry?.coupon_eligible ?? girlsEntry?.coupon_eligible) !== false,
        boys_price: boysEntry && boysEntry.is_active !== false ? boysEntry.price.toString() : '',
        boys_players: boysEntry?.players?.toString() || '',
        girls_price: girlsEntry && girlsEntry.is_active !== false ? girlsEntry.price.toString() : '',
        girls_players: girlsEntry?.players?.toString() || '',
      });
    } else {
      setEditingGame(null);
      setGameForm({
        original_game_name: '',
        game_name: '',
        category: 'team',
        is_active: true,
        coupon_eligible: true,
        boys_price: '',
        boys_players: '',
        girls_price: '',
        girls_players: '',
      });
    }
    setGameDialogOpen(true);
  };

  const handleSaveGame = async () => {
    if (!gameForm.game_name.trim()) {
      toast.error('Game name is required');
      return;
    }
    if (!gameForm.boys_price && !gameForm.girls_price) {
      toast.error('Provide pricing for at least Boys or Girls');
      return;
    }

    setSavingGame(true);
    try {
      const res = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_game_name: gameForm.original_game_name.trim() || undefined,
          game_name: gameForm.game_name.trim(),
          category: gameForm.category,
          is_active: gameForm.is_active,
          coupon_eligible: gameForm.coupon_eligible,
          boys: {
            enabled: Boolean(gameForm.boys_price),
            price: gameForm.boys_price,
            players: gameForm.boys_players,
          },
          girls: {
            enabled: Boolean(gameForm.girls_price),
            price: gameForm.girls_price,
            players: gameForm.girls_players,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Saved ${gameForm.game_name.trim()}`);
        setGameDialogOpen(false);
        loadGames();
      } else {
        toast.error(data.error || 'Failed to save game');
      }
    } catch {
      toast.error('Failed to save game');
    } finally {
      setSavingGame(false);
    }
  };

  const handleToggleGameActive = async (gameName: string, nextActive: boolean) => {
    try {
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active', game_name: gameName, is_active: nextActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${gameName} ${nextActive ? 'activated' : 'deactivated'}`);
        loadGames();
      } else {
        toast.error(data.error || 'Failed to toggle game');
      }
    } catch {
      toast.error('Failed to toggle game status');
    }
  };

  const requestSyncPdfGames = () => {
    setConfirmState({
      open: true,
      title: 'Sync official 50+ PDF games & prices?',
      description:
        'All official championship games will be synced to PDF prices. Custom games with existing registrations are automatically deactivated instead of deleted.',
      confirmLabel: 'Sync Official Games',
      onConfirm: async () => {
        setSyncingPdfGames(true);
        try {
          const res = await fetch('/api/admin/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync_pdf_defaults', replaceAll: true }),
          });
          const data = await res.json();
          if (data.success) {
            toast.success(`Synced ${data.syncedCount} championship games`);
            loadGames();
          } else {
            toast.error(data.error || 'Failed to sync games');
          }
        } finally {
          setSyncingPdfGames(false);
        }
      },
    });
  };

  const requestDeleteGame = (gameName: string) => {
    setConfirmState({
      open: true,
      title: `Delete "${gameName}"?`,
      description:
        'If registrations, matches, or groups reference this game, deletion will be blocked (409) and you can deactivate it safely instead.',
      confirmLabel: 'Delete Game',
      destructive: true,
      onConfirm: async () => {
        const resB = await fetch(`/api/admin/games?game_name=${encodeURIComponent(gameName)}&gender=boys`, {
          method: 'DELETE',
        });
        const resG = await fetch(`/api/admin/games?game_name=${encodeURIComponent(gameName)}&gender=girls`, {
          method: 'DELETE',
        });
        if (resB.status === 409 || resG.status === 409) {
          const d = await (resB.status === 409 ? resB : resG).json();
          toast.error(d.error || 'Game has historical references — deactivating instead.', 'Cannot Delete');
          await handleToggleGameActive(gameName, false);
          return;
        }
        toast.success(`Deleted ${gameName}`);
        loadGames();
      },
    });
  };

  const groupedGames = games.reduce((acc, game) => {
    if (!acc[game.game_name]) {
      acc[game.game_name] = { boys: null, girls: null };
    }
    if (game.gender === 'boys') {
      acc[game.game_name].boys = game;
    } else {
      acc[game.game_name].girls = game;
    }
    return acc;
  }, {} as Record<string, { boys: GamePricing | null; girls: GamePricing | null }>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080D1C]">
        <Loader2 className="h-8 w-8 animate-spin text-[#12E2C4]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-6 bg-[#080D1C] min-h-screen text-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131B38] border border-white/[0.08] text-xs font-mono text-[#12E2C4] uppercase tracking-wider mb-2">
            <span>// SYSTEM CONFIGURATION</span>
          </div>
          <h1 className="text-3xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight flex items-center gap-3">
            <Settings className="h-7 w-7 text-[#12E2C4]" />
            Settings &amp; Catalog
          </h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-1">
            REGISTRATION GATES, PAYMENT MODES, GAMES CATALOG, COUPONS &amp; SMTP TEMPLATES
          </p>
        </div>
        {!canEdit && (
          <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
            READ-ONLY VIEW
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registrations & Cash Payment Feature Flags */}
        <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08] shadow-xl lg:col-span-2">
          <CardHeader className="border-b border-white/[0.08]">
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              {settings.registrations_open ? (
                <Unlock className="h-5 w-5 text-[#12E2C4]" />
              ) : (
                <Lock className="h-5 w-5 text-amber-400" />
              )}
              Portal Feature Flags
            </CardTitle>
            <CardDescription className="text-[#94A3B8]">
              Control live public registration availability and accepted payment methods without redeploying.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#0B1124] border border-white/[0.08]">
              <div>
                <p className="font-semibold text-[#F8FAFC]">Accept New Registrations</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {settings.registrations_open
                    ? 'Public registration portal is open.'
                    : 'Registrations paused; visitors see contact notice.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Toggle registrations open"
                aria-checked={settings.registrations_open}
                disabled={!canEdit || savingRegistrations}
                onClick={() => runSettingToggle('registrations_open', !settings.registrations_open)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12E2C4] disabled:opacity-50 ${
                  settings.registrations_open ? 'bg-[#12E2C4]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#080D1C] shadow transition ${
                    settings.registrations_open ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#0B1124] border border-white/[0.08]">
              <div>
                <p className="font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[#F59E0B]" />
                  Desk Cash Payments Enabled
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {settings.cash_payment_enabled
                    ? 'Participants can choose Online or Desk Cash.'
                    : 'Cash option hidden; Online transfer required.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label="Toggle cash payments"
                aria-checked={settings.cash_payment_enabled}
                disabled={!canEdit || savingCashToggle}
                onClick={() => runSettingToggle('cash_payment_enabled', !settings.cash_payment_enabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12E2C4] disabled:opacity-50 ${
                  settings.cash_payment_enabled ? 'bg-[#F59E0B]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#080D1C] shadow transition ${
                    settings.cash_payment_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Games & Pricing Management */}
        <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08] shadow-xl lg:col-span-2">
          <CardHeader className="border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
                  <Gamepad2 className="h-5 w-5 text-[#12E2C4]" />
                  Games &amp; Pricing Catalog ({Object.keys(groupedGames).length})
                </CardTitle>
                <CardDescription className="text-[#94A3B8]">
                  Single source of truth synced with the public Games Directory and checkout pricing.
                </CardDescription>
              </div>
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={requestSyncPdfGames}
                    disabled={syncingPdfGames}
                    size="sm"
                    variant="outline"
                    className="border-white/15 bg-white/5 hover:bg-white/10 text-[#F8FAFC]"
                  >
                    {syncingPdfGames && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Sync PDF (50+)
                  </Button>
                  <Button
                    onClick={() => handleOpenGameDialog()}
                    size="sm"
                    className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-bold"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Game
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loadingGames ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#12E2C4]" />
              </div>
            ) : Object.keys(groupedGames).length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8]">
                <Gamepad2 className="h-12 w-12 mx-auto opacity-40 mb-2" />
                <p>No games configured in database</p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2.5 pr-1">
                {Object.entries(groupedGames).map(([name, { boys, girls }]) => {
                  const isActive = (boys?.is_active ?? girls?.is_active) !== false;
                  const couponEligible = (boys?.coupon_eligible ?? girls?.coupon_eligible) !== false;
                  return (
                    <div
                      key={name}
                      className={`border rounded-xl p-3 transition-colors ${
                        isActive
                          ? 'bg-[#0B1124] border-white/[0.08] hover:border-[#12E2C4]/30'
                          : 'bg-[#0B1124]/40 border-white/[0.04] opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#F8FAFC] truncate">{name}</h4>
                            {!isActive && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                                INACTIVE
                              </span>
                            )}
                            {!couponEligible && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                NO COUPON
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {boys && boys.is_active !== false && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded font-mono">
                                Boys: Rs.{boys.price}
                                {boys.players && boys.players > 1 && ` (${boys.players}p)`}
                              </span>
                            )}
                            {girls && girls.is_active !== false && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-pink-500/15 text-pink-300 border border-pink-500/25 rounded font-mono">
                                Girls: Rs.{girls.price}
                                {girls.players && girls.players > 1 && ` (${girls.players}p)`}
                              </span>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              title={isActive ? 'Deactivate game' : 'Activate game'}
                              onClick={() => handleToggleGameActive(name, !isActive)}
                              className="h-8 w-8 p-0 text-[#94A3B8] hover:text-[#12E2C4]"
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenGameDialog(boys || girls!)}
                              className="h-8 w-8 p-0 text-[#94A3B8] hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => requestDeleteGame(name)}
                              className="h-8 w-8 p-0 text-[#94A3B8] hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coupons */}
        <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08] shadow-xl flex flex-col min-h-[420px]">
          <CardHeader className="border-b border-white/[0.08]">
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <Tag className="h-5 w-5 text-[#F59E0B]" />
              Coupon Codes
            </CardTitle>
            <CardDescription className="text-[#94A3B8]">
              Manage discount coupons. Disabled coupons are preserved for history but rejected at checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col flex-1 min-h-0">
            {canEdit && (
              <div className="flex flex-wrap gap-3 items-end mb-4">
                <div className="space-y-1">
                  <Label htmlFor="couponCodeInput" className="text-xs text-[#94A3B8]">
                    Code
                  </Label>
                  <Input
                    id="couponCodeInput"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="EARLY10"
                    className="w-32 bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="couponPctInput" className="text-xs text-[#94A3B8]">
                    Discount %
                  </Label>
                  <Input
                    id="couponPctInput"
                    type="number"
                    min={1}
                    max={100}
                    value={couponForm.discountPercent}
                    onChange={(e) => setCouponForm((f) => ({ ...f, discountPercent: e.target.value }))}
                    placeholder="10"
                    className="w-24 bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                  />
                </div>
                <Button
                  onClick={handleCreateCoupon}
                  disabled={savingCoupon}
                  size="sm"
                  className="bg-[#F59E0B] hover:bg-amber-600 text-[#080D1C] font-bold"
                >
                  {savingCoupon ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
                  Add
                </Button>
              </div>
            )}

            <div className="flex-1 min-h-[220px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#0B1124] p-2.5">
              {loadingCoupons ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#F59E0B]" />
                </div>
              ) : coupons.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-[#94A3B8]">
                  No coupons yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {coupons.map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between gap-2 p-3 border rounded-lg ${
                        c.is_active
                          ? 'bg-[#131B38] border-white/10'
                          : 'bg-[#131B38]/40 border-white/5 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono font-semibold text-[#F8FAFC] truncate">{c.code}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {c.discount_percent}% off • {c.is_active ? 'Active' : 'Paused'}
                        </p>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={togglingCouponId === c.id}
                            onClick={() => handleToggleCoupon(c)}
                            className="h-8 w-8 p-0 text-[#94A3B8] hover:text-[#12E2C4]"
                            title={c.is_active ? 'Pause coupon' : 'Activate coupon'}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => requestDeleteCoupon(c)}
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/15"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Automated Email Templates */}
        <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08] shadow-xl flex flex-col min-h-[420px]">
          <CardHeader className="border-b border-white/[0.08]">
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <Mail className="h-5 w-5 text-[#12E2C4]" />
              Automated Email Templates
            </CardTitle>
            <CardDescription className="text-[#94A3B8]">
              Sent automatically on registration, approval &amp; rejection. Placeholders: {'{{name}}'}, {'{{regNum}}'}, {'{{slipId}}'}, {'{{teamName}}'}, {'{{gamesList}}'}, {'{{paymentAction}}'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col flex-1 min-h-0">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Template</Label>
                <Select
                  value={selectedEmailTemplate}
                  onValueChange={(v) => setSelectedEmailTemplate(v as typeof selectedEmailTemplate)}
                >
                  <SelectTrigger className="w-full bg-[#0B1124] border-white/15 text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration_online">Registration submitted (online)</SelectItem>
                    <SelectItem value="registration_cash">Registration submitted (cash)</SelectItem>
                    <SelectItem value="payment_received">Payment approved (confirmed)</SelectItem>
                    <SelectItem value="payment_rejected">Payment rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 flex-1 min-h-0 flex flex-col">
                <Label className="text-xs text-[#94A3B8]">Subject</Label>
                <Input
                  value={
                    selectedEmailTemplate === 'registration_online'
                      ? emailTemplates.email_registration_submitted_online_subject
                      : selectedEmailTemplate === 'registration_cash'
                        ? emailTemplates.email_registration_submitted_cash_subject
                        : selectedEmailTemplate === 'payment_received'
                          ? emailTemplates.email_payment_received_subject
                          : emailTemplates.email_payment_rejected_subject
                  }
                  disabled={!canEdit}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (selectedEmailTemplate === 'registration_online')
                      setEmailTemplates((t) => ({ ...t, email_registration_submitted_online_subject: v }));
                    else if (selectedEmailTemplate === 'registration_cash')
                      setEmailTemplates((t) => ({ ...t, email_registration_submitted_cash_subject: v }));
                    else if (selectedEmailTemplate === 'payment_received')
                      setEmailTemplates((t) => ({ ...t, email_payment_received_subject: v }));
                    else setEmailTemplates((t) => ({ ...t, email_payment_rejected_subject: v }));
                  }}
                  className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                />
                <Label className="text-xs text-[#94A3B8]">Body (HTML)</Label>
                <textarea
                  value={
                    selectedEmailTemplate === 'registration_online'
                      ? emailTemplates.email_registration_submitted_online_body
                      : selectedEmailTemplate === 'registration_cash'
                        ? emailTemplates.email_registration_submitted_cash_body
                        : selectedEmailTemplate === 'payment_received'
                          ? emailTemplates.email_payment_received_body
                          : emailTemplates.email_payment_rejected_body
                  }
                  disabled={!canEdit}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (selectedEmailTemplate === 'registration_online')
                      setEmailTemplates((t) => ({ ...t, email_registration_submitted_online_body: v }));
                    else if (selectedEmailTemplate === 'registration_cash')
                      setEmailTemplates((t) => ({ ...t, email_registration_submitted_cash_body: v }));
                    else if (selectedEmailTemplate === 'payment_received')
                      setEmailTemplates((t) => ({ ...t, email_payment_received_body: v }));
                    else setEmailTemplates((t) => ({ ...t, email_payment_rejected_body: v }));
                  }}
                  rows={7}
                  className="w-full px-3 py-2 border border-white/15 bg-[#0B1124] text-[#F8FAFC] rounded-lg text-xs font-mono resize-y flex-1 min-h-[160px]"
                />
              </div>
            </div>
            {canEdit && (
              <Button
                onClick={handleSaveEmailTemplates}
                disabled={savingTemplates}
                className="mt-4 bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-bold"
              >
                {savingTemplates ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : templatesSaveSuccess ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {templatesSaveSuccess ? 'Saved!' : 'Save Templates'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Gmail SMTP Email Configuration */}
        <Card className="bg-[#131B38] text-[#F8FAFC] border border-white/[0.08] shadow-xl lg:col-span-2">
          <CardHeader className="border-b border-white/[0.08]">
            <CardTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <Server className="h-5 w-5 text-[#12E2C4]" />
              Gmail SMTP Configuration
            </CardTitle>
            <CardDescription className="text-[#94A3B8]">
              Connect your Gmail account with a 16-character Google App Password to automatically send registration &amp; approval emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="p-3.5 rounded-xl bg-[#0B1124] border border-[#12E2C4]/25 text-xs font-mono text-[#94A3B8] leading-relaxed">
              <strong className="text-[#12E2C4]">Quick Gmail Setup:</strong> Go to{' '}
              <span className="text-[#F8FAFC]">Google Account → Security → 2-Step Verification → App Passwords</span>, create an app password for &quot;Mini Olympics&quot;, paste the 16-character password below, click <span className="text-[#F8FAFC]">Save SMTP</span>, and verify with <span className="text-[#F8FAFC]">Send Test Email</span>.
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpEmail" className="text-xs text-[#94A3B8]">
                    Gmail Address *
                  </Label>
                  <Input
                    id="smtpEmail"
                    type="email"
                    disabled={!canEdit}
                    value={settings.smtp_email}
                    onChange={(e) => setSettings({ ...settings, smtp_email: e.target.value })}
                    placeholder="your.society@gmail.com"
                    className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword" className="text-xs text-[#94A3B8]">
                    Google App Password (16 characters) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showSmtpPassword ? 'text' : 'password'}
                      disabled={!canEdit}
                      value={settings.smtp_password}
                      onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                      autoComplete="off"
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="pr-10 bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      aria-label="Toggle password visibility"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpFromName" className="text-xs text-[#94A3B8]">
                    Sender Display Name
                  </Label>
                  <Input
                    id="smtpFromName"
                    disabled={!canEdit}
                    value={settings.smtp_from_name}
                    onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                    placeholder="FCIT Sports Society"
                    className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost" className="text-xs text-[#94A3B8]">
                      SMTP Server
                    </Label>
                    <Input
                      id="smtpHost"
                      disabled={!canEdit}
                      value={settings.smtp_host}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort" className="text-xs text-[#94A3B8]">
                      Port
                    </Label>
                    <Input
                      id="smtpPort"
                      disabled={!canEdit}
                      value={settings.smtp_port}
                      onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                      placeholder="587"
                      className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button
                      onClick={handleSaveSmtp}
                      disabled={savingSmtp}
                      className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-bold"
                    >
                      {savingSmtp ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : smtpSaveSuccess ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {smtpSaveSuccess ? 'Saved!' : 'Save SMTP'}
                    </Button>
                    <Button
                      onClick={handleTestEmail}
                      disabled={testingEmail || !settings.smtp_email}
                      variant="outline"
                      className="border-white/15 bg-white/5 text-[#F8FAFC] hover:bg-white/10"
                    >
                      {testingEmail ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send Test Email
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Add/Edit Dialog */}
      <Dialog open={gameDialogOpen} onOpenChange={setGameDialogOpen}>
        <DialogContent className="max-w-md bg-[#0B1124] border-white/15 text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#F8FAFC]">
              <Gamepad2 className="h-5 w-5 text-[#12E2C4]" />
              {editingGame ? 'Edit Game' : 'Add New Game'}
            </DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Changes sync immediately to Public Games Directory and Registration pricing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Game Name *</Label>
                <Input
                  value={gameForm.game_name}
                  onChange={(e) => setGameForm({ ...gameForm, game_name: e.target.value })}
                  placeholder="e.g. Futsal"
                  className="bg-[#131B38] border-white/15 text-[#F8FAFC]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#94A3B8]">Category</Label>
                <Select
                  value={gameForm.category}
                  onValueChange={(v) => setGameForm({ ...gameForm, category: v })}
                >
                  <SelectTrigger className="bg-[#131B38] border-white/15 text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Team Sports</SelectItem>
                    <SelectItem value="indoor">Indoor &amp; Table Games</SelectItem>
                    <SelectItem value="track">Track &amp; Field</SelectItem>
                    <SelectItem value="fun">Fun Games</SelectItem>
                    <SelectItem value="esports">Esports Arena</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#131B38] border border-white/10 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gameForm.is_active}
                  onChange={(e) => setGameForm({ ...gameForm, is_active: e.target.checked })}
                />
                <span>Visible &amp; Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gameForm.coupon_eligible}
                  onChange={(e) => setGameForm({ ...gameForm, coupon_eligible: e.target.checked })}
                />
                <span>Coupon Eligible</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="font-medium text-blue-300 text-sm">Boys Division</h4>
                <div className="space-y-1">
                  <Label className="text-xs text-blue-200">Price (Rs.)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={gameForm.boys_price}
                    onChange={(e) => setGameForm({ ...gameForm, boys_price: e.target.value })}
                    className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-blue-200">Players / Team</Label>
                  <Input
                    type="number"
                    min={1}
                    value={gameForm.boys_players}
                    onChange={(e) => setGameForm({ ...gameForm, boys_players: e.target.value })}
                    className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="space-y-2.5 p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                <h4 className="font-medium text-pink-300 text-sm">Girls Division</h4>
                <div className="space-y-1">
                  <Label className="text-xs text-pink-200">Price (Rs.)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={gameForm.girls_price}
                    onChange={(e) => setGameForm({ ...gameForm, girls_price: e.target.value })}
                    className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-pink-200">Players / Team</Label>
                  <Input
                    type="number"
                    min={1}
                    value={gameForm.girls_players}
                    onChange={(e) => setGameForm({ ...gameForm, girls_players: e.target.value })}
                    className="bg-[#0B1124] border-white/15 text-[#F8FAFC]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setGameDialogOpen(false)}
                className="border-white/15 bg-white/5 text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveGame}
                disabled={savingGame || !gameForm.game_name.trim()}
                className="bg-[#12E2C4] hover:bg-[#0FC9AE] text-[#080D1C] font-bold"
              >
                {savingGame ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        loading={confirmLoading}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onConfirm={async () => {
          setConfirmLoading(true);
          try {
            await confirmState.onConfirm();
            setConfirmState((s) => ({ ...s, open: false }));
          } finally {
            setConfirmLoading(false);
          }
        }}
      />
    </div>
  );
}
