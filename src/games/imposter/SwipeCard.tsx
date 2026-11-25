import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../../services/db';
import { ImposterRole } from './ScoringEngine';
import { WordItem } from './data/wordBank';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Eye, ArrowUp, Lock, HelpCircle, ShieldAlert } from 'lucide-react';

interface SwipeCardProps {
  player: Player;
  role: ImposterRole;
  wordItem: WordItem;
  undercoverMode: boolean;
  hintsEnabled: boolean;
  imposterNames: string[];
  onPassToNext: () => void;
  isLastPlayer: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  player,
  role,
  wordItem,
  undercoverMode,
  hintsEnabled,
  imposterNames,
  onPassToNext,
  isLastPlayer,
}) => {
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const startYRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Maximum distance the card can be pulled up
  const MAX_DRAG = 240;
  const REVEAL_THRESHOLD = 70;

  const handleTouchStart = (clientY: number) => {
    startYRef.current = clientY;
  };

  const handleTouchMove = (clientY: number) => {
    if (startYRef.current === null) return;
    const delta = startYRef.current - clientY; // pulling up is positive

    if (delta > 0) {
      const clamped = Math.min(delta, MAX_DRAG);
      setDragOffset(clamped);

      if (clamped >= REVEAL_THRESHOLD && !isRevealed) {
        setIsRevealed(true);
        sound.playSwipe();
        haptics.medium();
      }
    } else {
      setDragOffset(0);
    }
  };

  const handleTouchEnd = () => {
    // Elastic drop back down
    startYRef.current = null;
    setDragOffset(0);
    setIsRevealed(false);
  };

  // Setup non-passive touch listeners on cardRef to prevent mobile screen rubber-banding while swiping
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => handleTouchStart(e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // prevents background page scroll during swipe peek
      handleTouchMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => handleTouchEnd();

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isRevealed]);

  // Determine what secret content to show
  const renderSecretContent = () => {
    if (role === 'imposter') {
      if (undercoverMode) {
        // Undercover: sees the alternative word!
        return (
          <div className="space-y-3">
            <span className="neo-badge bg-[#A7F3D0] text-[#18181B]">
              Category: {wordItem.category.replace('_', ' ').toUpperCase()}
            </span>
            <div className="text-3xl font-extrabold tracking-wide text-[#18181B]">{wordItem.undercoverWord}</div>
            <p className="text-xs font-semibold text-gray-600">Give subtle clues about this word to blend in!</p>
          </div>
        );
      } else {
        // Standard Imposter
        return (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FECDD3] border-2 border-black text-xs font-black uppercase text-[#991B1B]">
              <ShieldAlert className="w-4 h-4 text-[#DC2626]" /> YOU ARE THE IMPOSTER
            </div>
            <div className="text-2xl font-black text-[#DC2626]">Shhh! You don't know the word.</div>
            {hintsEnabled && (
              <div className="p-2.5 bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-xl">
                <div className="text-xs font-black uppercase text-yellow-800">🕵️ Secret Hint:</div>
                <div className="text-sm font-bold text-gray-800">
                  {wordItem.hints.oneWord} • "{wordItem.hints.twoWord}"
                </div>
              </div>
            )}
            <p className="text-xs font-semibold text-gray-600">Listen carefully and pretend you know it!</p>
          </div>
        );
      }
    }

    if (role === 'assistant') {
      return (
        <div className="space-y-3">
          <span className="neo-badge bg-[#DDD6FE] text-[#18181B]">🤝 YOU ARE THE ASSISTANT</span>
          <div className="text-xs font-bold text-purple-900">
            Imposter: <span className="font-extrabold underline">{imposterNames.join(', ')}</span>
          </div>
          <div className="text-3xl font-extrabold text-[#18181B]">{wordItem.word}</div>
          <p className="text-xs font-semibold text-gray-600">
            Help the imposter survive without revealing your identity!
          </p>
        </div>
      );
    }

    if (role === 'jester') {
      return (
        <div className="space-y-3">
          <span className="neo-badge bg-[#F5D0FE] text-[#18181B]">🃏 YOU ARE THE JESTER</span>
          <div className="text-2xl font-black text-[#9333EA]">Get Voted Out!</div>
          <p className="text-xs font-semibold text-gray-600">
            Act super suspicious! If players vote you out, you win <span className="font-bold text-green-700">+2 points</span>.
          </p>
        </div>
      );
    }

    // Default: Innocent
    return (
      <div className="space-y-3">
        <span className="neo-badge bg-[#A7F3D0] text-[#18181B]">
          Category: {wordItem.category.replace('_', ' ').toUpperCase()}
        </span>
        <div className="text-3xl font-black tracking-wide text-[#18181B]">{wordItem.word}</div>
        <p className="text-xs font-semibold text-gray-600">
          Describe this without giving it away to the Imposter!
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[520px] w-full max-w-sm mx-auto p-4 select-none">
      {/* Turn Header */}
      <div className="text-center space-y-1">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Pass phone to</div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-3 border-black bg-white shadow-[3px_3px_0px_#000]">
          <span className="text-2xl">{player.avatarEmoji}</span>
          <span className="text-xl font-black text-[#18181B]">{player.name}</span>
        </div>
      </div>

      {/* Interactive Card Stage */}
      <div className="relative w-full h-[320px] my-4 flex items-center justify-center">
        {/* Revealed Secret Underneath */}
        <div className="absolute inset-0 neo-card bg-amber-50 p-6 flex flex-col items-center justify-center text-center">
          {renderSecretContent()}
        </div>

        {/* Sliding Shield Card on Top */}
        <div
          ref={cardRef}
          onMouseDown={(e) => handleTouchStart(e.clientY)}
          onMouseMove={(e) => {
            if (startYRef.current !== null) handleTouchMove(e.clientY);
          }}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          style={{
            transform: `translateY(-${dragOffset}px)`,
            transition: startYRef.current === null ? 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
          }}
          className="absolute inset-0 neo-card-lg bg-gradient-to-b from-[#FEF08A] to-[#FDE047] flex flex-col items-center justify-between p-6 cursor-grab active:cursor-grabbing border-4 border-black"
        >
          <div className="flex items-center justify-between w-full">
            <span className="neo-badge bg-white text-xs font-black">TOP SECRET</span>
            <Lock className="w-5 h-5 text-gray-800" />
          </div>

          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full border-3 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_#000]">
              <Eye className="w-8 h-8 text-gray-800" />
            </div>
            <div className="text-lg font-black text-[#18181B]">HOLD & SWIPE UP</div>
            <p className="text-xs font-bold text-gray-700">Only {player.name} should look!</p>
          </div>

          <div className="flex flex-col items-center gap-1 text-gray-800">
            <ArrowUp className="w-5 h-5 animate-bounce stroke-[3]" />
            <span className="text-[11px] font-black uppercase tracking-wider">Swipe up to reveal</span>
          </div>
        </div>
      </div>

      {/* Done & Pass Button */}
      <button
        onClick={() => {
          sound.playPop();
          haptics.light();
          onPassToNext();
        }}
        className="w-full neo-btn py-3.5 px-6 bg-[#A7F3D0] hover:bg-[#86EFAC] text-lg font-black text-[#18181B]"
      >
        {isLastPlayer ? 'All Set → Start Discussion ⏱️' : `I’ve Memorized It → Pass to Next ➡️`}
      </button>
    </div>
  );
};
