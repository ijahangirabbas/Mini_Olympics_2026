'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Shield, X } from 'lucide-react';
import { GameInfo, getDivisionLabel } from '@/lib/games-data';
import { SportIcon } from './sport-icons';

interface GameDossierModalProps {
  game: GameInfo | null;
  onClose: () => void;
}

let supportsDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (
    typeof window === 'undefined' ||
    !window.CSS?.supports?.('transition-behavior', 'allow-discrete') ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay());
}

/** Accessible native `<dialog>` modal displaying full rules, format, venue, and fees for a game. */
export default function GameDossierModal({ game, onClose }: GameDossierModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [renderedGame, setRenderedGame] = useState<GameInfo | null>(game);

  const closeTopLayer = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) return;

    if (!supportsTopLayerExit()) {
      dialog.setAttribute('data-closing', '');
      const animations = dialog.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((resolve) => setTimeout(resolve, 400)),
        ]);
      }
      if (!dialog.hasAttribute('data-closing')) return;
      dialog.removeAttribute('data-closing');
    }

    dialog.close();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (game) {
      dialog.removeAttribute('data-closing');
      setRenderedGame(game);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      void closeTopLayer();
    }
  }, [game, closeTopLayer]);

  // Route native cancel (Esc / closedby light-dismiss) through closeTopLayer so exit animates
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      void closeTopLayer();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [closeTopLayer]);

  const handleClose = () => {
    dialogRef.current?.removeAttribute('data-closing');
    onClose();
  };

  // Clear rendered content only after exit transition settles
  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current && !dialogRef.current?.open && !game) {
      setRenderedGame(null);
    }
  };

  // Fallback light-dismiss for browsers where `closedby="any"` is not yet supported
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      void closeTopLayer();
    }
  };

  const activeGame = game ?? renderedGame;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={activeGame ? titleId : undefined}
      onClose={handleClose}
      onTransitionEnd={handleTransitionEnd}
      onClick={handleDialogClick}
      {...({ closedby: 'any' } as Record<string, string>)}
      className="game-dossier-dialog m-auto w-[calc(100%-2rem)] max-w-2xl rounded-3xl bg-[#131B38] border border-white/[0.14] text-[#F8FAFC] shadow-2xl p-0 max-h-[90vh] overflow-y-auto"
    >
      {activeGame && (
        <div>
          {/* Header Image Banner */}
          <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-t-3xl bg-black">
            <img
              src={activeGame.image}
              alt={activeGame.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#131B38] via-[#131B38]/60 to-transparent" />

            <button
              type="button"
              onClick={() => void closeTopLayer()}
              autoFocus
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/70 text-[#94A3B8] hover:text-white border border-white/[0.12] backdrop-blur-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12E2C4]"
              aria-label={`Close ${activeGame.name} details`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-6 sm:left-8 right-6 flex items-end justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-[#12E2C4] tracking-wider uppercase">
                    {activeGame.categoryLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.1] border border-white/[0.12] text-[10px] font-mono text-[#F8FAFC]">
                    {getDivisionLabel(activeGame.division)}
                  </span>
                </div>
                <h2
                  id={titleId}
                  className="text-2xl sm:text-4xl font-black text-[#F8FAFC] font-['Space_Grotesk'] uppercase leading-none"
                >
                  {activeGame.name}
                </h2>
              </div>

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/60 border border-white/[0.15] backdrop-blur-md shrink-0"
                style={{ color: activeGame.accentColor }}
              >
                <SportIcon name={activeGame.iconKey} size={24} />
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider block mb-1">
                Official Discipline Brief
              </span>
              <p className="text-sm sm:text-base text-[#F8FAFC] font-medium leading-relaxed">
                {activeGame.tagline}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-[#0B1124] border border-white/[0.08]">
                <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block mb-1">
                  Roster & Player Format
                </span>
                <span className="text-[#F8FAFC] font-bold text-sm block">{activeGame.playerFormat}</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1124] border border-white/[0.08]">
                <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block mb-1">
                  Match Format
                </span>
                <span className="text-[#12E2C4] font-bold text-sm block">
                  {activeGame.matchFormat || 'Knockout Bracket'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1124] border border-white/[0.08]">
                <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block mb-1">
                  Registration Entry Fee
                </span>
                <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  {activeGame.boysFee !== undefined && (
                    <span className="px-2 py-0.5 rounded bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-[#3B82F6]">
                      ♂ Boys: Rs. {activeGame.boysFee.toLocaleString()}
                    </span>
                  )}
                  {activeGame.girlsFee !== undefined && (
                    <span className="px-2 py-0.5 rounded bg-[#F068B1]/15 border border-[#F068B1]/40 text-[#F068B1]">
                      ♀ Girls: Rs. {activeGame.girlsFee.toLocaleString()}
                    </span>
                  )}
                  {activeGame.boysFee === undefined && activeGame.girlsFee === undefined && (
                    <span className="text-[#F8FAFC]">Free Entry</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1124] border border-white/[0.08]">
                <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider block mb-1">
                  Official Venue
                </span>
                <div className="flex items-center gap-1.5 text-[#F8FAFC] font-bold text-sm">
                  <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span className="truncate">{activeGame.venueNote}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B1124]/70 border border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#12E2C4] uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Tournament Regulations</span>
              </div>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">{activeGame.rulesOverview}</p>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => void closeTopLayer()}
                className="w-1/3 py-3.5 rounded-xl text-xs font-mono font-bold tracking-wider text-[#94A3B8] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors uppercase text-center"
              >
                Close
              </button>

              <Link
                href={`/register?game=${encodeURIComponent(activeGame.name)}`}
                onClick={() => void closeTopLayer()}
                className="w-2/3 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-black tracking-wider text-[#0B1124] bg-[#12E2C4] hover:bg-[#0FC9AE] transition-all uppercase font-['Space_Grotesk'] shadow-lg shadow-[#12E2C4]/20"
              >
                <span>Register for This Sport</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
