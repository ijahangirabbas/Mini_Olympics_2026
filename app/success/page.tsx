'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Download,
  Medal,
  Users,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  Home,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams?.get('id');
  const registrationNumber = searchParams?.get('regNum');
  const slipId = searchParams?.get('slipId');
  const method = searchParams?.get('method');
  const transactionId = searchParams?.get('transactionId');
  const total = searchParams?.get('total');
  const [groupInfo, setGroupInfo] = useState<any[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      if (!registrationId || !slipId || !registrationNumber) return;
      setGroupLoading(true);
      try {
        const regRes = await fetch(
          `/api/public/registration?id=${encodeURIComponent(registrationId)}&slipId=${encodeURIComponent(slipId)}`,
          { cache: 'no-store' }
        );
        const regData = await regRes.json();
        if (!regData?.success) return;

        const selectedGames: string[] = regData.data?.selectedGames || [];
        if (!Array.isArray(selectedGames) || selectedGames.length === 0) return;

        const gender = regData.data?.gender || 'boys';

        const params = new URLSearchParams({
          games: selectedGames.join(','),
          gender: gender,
          regNum: String(registrationNumber),
          name: regData.data?.name || '',
          roll: regData.data?.rollNumber || '',
          phone: regData.data?.contactNumber || '',
          teamName: regData.data?.teamName || '',
        });

        const groupsRes = await fetch(`/api/groups?${params.toString()}`, { cache: 'no-store' });
        const groupsData = await groupsRes.json();
        if (groupsData?.success) {
          setGroupInfo(groupsData.data || []);
        }
      } finally {
        setGroupLoading(false);
      }
    };

    loadGroups();
  }, [registrationId, slipId, registrationNumber]);

  return (
    <div className="min-h-screen bg-[#0B1124] text-[#F8FAFC] py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Floodlight Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#12E2C4]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto z-10">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-3xl bg-[#131B38] border border-[#12E2C4]/30 shadow-2xl shadow-[#12E2C4]/20 mb-4">
            <CheckCircle2 className="w-12 h-12 text-[#12E2C4]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] uppercase font-['Space_Grotesk'] tracking-tight">
            REGISTRATION SUBMITTED!
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#94A3B8] mt-1.5 uppercase tracking-wider">
            MINI OLYMPICS 2026 • OFFICIAL ENTRY CONFIRMATION
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-[#131B38] border border-white/[0.08] shadow-2xl overflow-hidden">
          {/* Ticket Number Banner */}
          {registrationNumber && (
            <div className="p-8 text-center bg-gradient-to-b from-[#182244] to-[#131B38] border-b border-white/[0.08]">
              <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#12E2C4] uppercase mb-1">
                <Medal className="w-4 h-4 text-[#12E2C4]" />
                <span>OFFICIAL TICKET NUMBER</span>
                <Medal className="w-4 h-4 text-[#12E2C4]" />
              </div>
              <p className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
                #{registrationNumber}
              </p>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            {/* Registration ID & Total */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0B1124] border border-white/[0.06] font-mono text-xs">
                <span className="text-[#94A3B8] block mb-1">REGISTRATION ID</span>
                <span className="font-bold text-[#F8FAFC] text-sm break-all">{registrationId}</span>
              </div>

              {total && (
                <div className="p-4 rounded-2xl bg-[#0B1124] border border-[#12E2C4]/30 font-mono text-xs">
                  <span className="text-[#94A3B8] block mb-1">TOTAL AMOUNT</span>
                  <span className="font-black text-lg text-[#12E2C4]">
                    Rs. {parseFloat(total).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Cash Slip Section */}
            {method === 'cash' && slipId && (
              <div className="p-6 rounded-2xl bg-[#1F1E16] border border-[#F59E0B]/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base font-['Space_Grotesk'] uppercase text-[#F8FAFC]">
                      Cash Desk Slip ID
                    </h3>
                    <p className="text-xs font-mono text-[#94A3B8]">Present this slip at the FCIT Sports Society Desk</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0B1124] border border-white/[0.08] text-center font-mono">
                  <span className="text-2xl sm:text-3xl font-black text-[#F59E0B] tracking-wider">
                    {slipId}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head><title>Cash Slip - ${slipId}</title></head>
                          <body style="font-family: monospace; padding: 40px; text-align: center; background: #fff; color: #000;">
                            <h2>MINI OLYMPICS 2026</h2>
                            <h4>FCIT SPORTS SOCIETY • PUCIT</h4>
                            <hr/>
                            <h1 style="font-size: 32px; margin: 30px 0; border: 2px dashed #000; padding: 20px;">${slipId}</h1>
                            <p>Ticket: #${registrationNumber}</p>
                            <p>Registration ID: ${registrationId}</p>
                            <p>Total Amount: Rs. ${total}</p>
                            <hr/>
                            <p style="margin-top: 30px;">Present this slip to the registration desk to verify payment.</p>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="w-full py-3 rounded-xl text-xs font-mono font-bold text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] uppercase"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print / Save Cash Slip
                </Button>
              </div>
            )}

            {/* Online Transfer Reference */}
            {method === 'online' && slipId && (
              <div className="p-6 rounded-2xl bg-[#141824] border border-[#3B82F6]/30 space-y-4 font-mono">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#3B82F6]/20 text-[#3B82F6]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base font-['Space_Grotesk'] uppercase text-[#F8FAFC]">
                      Online Payment Under Review
                    </h3>
                    <p className="text-xs text-[#94A3B8]">Reference ID: {slipId}</p>
                  </div>
                </div>

                {transactionId && (
                  <div className="p-3 rounded-xl bg-[#0B1124] border border-white/[0.06] text-xs">
                    <span className="text-[#94A3B8]">Transaction ID: </span>
                    <span className="font-bold text-white">{transactionId}</span>
                  </div>
                )}

                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Your payment receipt has been uploaded and queued for admin verification. You will receive an automated confirmation email once verified.
                </p>
              </div>
            )}

            {/* WhatsApp Group Links */}
            <div className="p-6 rounded-2xl bg-[#0B1124] border border-white/[0.08] space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#12E2C4]" />
                <h3 className="font-bold text-sm sm:text-base font-['Space_Grotesk'] uppercase text-[#F8FAFC]">
                  Official WhatsApp Sport Groups
                </h3>
              </div>

              {groupLoading ? (
                <div className="text-center py-4 text-xs font-mono text-[#94A3B8]">Loading group links...</div>
              ) : groupInfo.length === 0 ? (
                <p className="text-xs font-mono text-[#94A3B8]">
                  Group links are being scheduled. Keep your ticket #{registrationNumber} handy for announcements.
                </p>
              ) : (
                <div className="space-y-3">
                  {groupInfo.map((g) => (
                    <div
                      key={g.gameName}
                      className="p-3.5 rounded-xl bg-[#131B38] border border-white/[0.06] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#F8FAFC] font-['Space_Grotesk']">
                          {g.groupTitle || g.gameName}
                        </div>
                        <div className="text-[10px] font-mono text-[#94A3B8]">{g.gameName}</div>
                      </div>

                      {g.groupUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            if (g.messageText) {
                              navigator.clipboard.writeText(g.messageText);
                            }
                            window.open(g.groupUrl, '_blank');
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-all inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>JOIN GROUP</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/[0.08]">
              <Link
                href="/"
                className="w-full sm:w-1/2 py-3 rounded-xl text-xs font-mono font-bold text-center text-[#F8FAFC] bg-white/[0.06] hover:bg-white/[0.1] transition-colors uppercase"
              >
                RETURN HOME
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-1/2 py-3 rounded-xl text-xs font-mono font-bold text-center text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-colors uppercase"
              >
                REGISTER ANOTHER ATHLETE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B1124] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#12E2C4] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
