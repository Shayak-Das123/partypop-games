import React, { useState, useEffect } from 'react';
import { Session, Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { Trophy, Users, Volume2, VolumeX, ChevronDown, Award, Menu, Maximize, Minimize } from 'lucide-react';
import { isFullscreen, toggleFullscreen } from '../../services/fullscreen';

interface SessionHeaderProps {
  session: Session;
  onOpenHistory: () => void;
  onOpenRoster: () => void;
  onOpenAwards: () => void;
  activeGameTitle?: string;
  onHomeClick?: () => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  session,
  onOpenHistory,
  onOpenRoster,
  onOpenAwards,
  activeGameTitle,
  onHomeClick,
}) => {
  const [isScoresOpen, setIsScoresOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [fullscreenActive, setFullscreenActive] = useState<boolean>(() => isFullscreen());

  useEffect(() => {
    const handleFsChange = () => {
      setFullscreenActive(isFullscreen());
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playPop();
  };

  const sortedPlayers = [...session.players].sort(
    (a, b) => (session.cumulativeScores[b.id] || 0) - (session.cumulativeScores[a.id] || 0)
  );

  return (
    <header className="w-full max-w-md mx-auto mb-4 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {/* Hamburger Menu button */}
          <button
            onClick={() => {
              sound.playPop();
              onOpenHistory();
            }}
            className="w-9 h-9 rounded-xl border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            title="Session History"
          >
            <Menu className="w-5 h-5 text-gray-800 stroke-[2.5]" />
          </button>

          <button
            onClick={onHomeClick}
            className="flex items-center gap-1.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl border-3 border-black bg-[#FEF08A] flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_#000] group-active:translate-x-0.5 group-active:translate-y-0.5">
              🎉
            </div>
            <div>
              <div className="text-base font-black tracking-tight leading-none text-[#18181B]">PartyPop</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {activeGameTitle || 'Social Games'}
              </div>
            </div>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Live Standings Button */}
          <button
            onClick={() => {
              sound.playPop();
              setIsScoresOpen(!isScoresOpen);
            }}
            className="neo-btn neo-btn-sm px-2.5 py-1.5 bg-[#A7F3D0] text-xs font-black flex items-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5 text-emerald-900" />
            <span>Scores</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isScoresOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Roster Button */}
          <button
            onClick={() => {
              sound.playPop();
              onOpenRoster();
            }}
            className="neo-btn neo-btn-sm px-2.5 py-1.5 bg-white text-xs font-black flex items-center gap-1"
            title="Player Roster"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{session.players.length}</span>
          </button>

          {/* Awards Button */}
          <button
            onClick={() => {
              sound.playPop();
              onOpenAwards();
            }}
            className="w-8 h-8 rounded-xl border-2 border-black bg-[#FED7AA] flex items-center justify-center shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            title="Session Awards & Tags"
          >
            <Award className="w-4 h-4 text-amber-900" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={async () => {
              sound.playPop();
              const isNow = await toggleFullscreen();
              setFullscreenActive(isNow);
            }}
            className="w-8 h-8 rounded-xl border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            title={fullscreenActive ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {fullscreenActive ? (
              <Minimize className="w-4 h-4 text-purple-600 stroke-[2.5]" />
            ) : (
              <Maximize className="w-4 h-4 text-purple-600 stroke-[2.5]" />
            )}
          </button>

          {/* Mute/Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="w-8 h-8 rounded-xl border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-gray-800" />}
          </button>
        </div>
      </div>

      {/* Live Scores Dropdown Panel */}
      {isScoresOpen && (
        <div className="neo-card p-4 bg-white mt-2 space-y-3 animate-pop border-3 border-black">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500">
              Cumulative Session Standings
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              {session.history.length} rounds played
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {sortedPlayers.map((p, idx) => {
              const score = session.cumulativeScores[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2 rounded-xl border-2 border-black text-xs ${
                    idx === 0 ? 'bg-[#FEF08A] font-black' : 'bg-gray-50 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-gray-500">#{idx + 1}</span>
                    <span>{p.avatarEmoji}</span>
                    <span className="truncate max-w-[130px]">{p.name}</span>
                  </div>
                  <div className="px-2 py-0.5 rounded-lg border border-black bg-white font-mono font-black">
                    {score} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
