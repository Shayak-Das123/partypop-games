import React, { useEffect, useState } from 'react';
import { Session, getAllSessions, switchActiveSession, deleteSession } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { X, Plus, Calendar, Users, Trophy, Trash2, ArrowRight } from 'lucide-react';

interface HistoryDrawerProps {
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewSessionClick: () => void;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  currentSessionId,
  onSelectSession,
  onNewSessionClick,
  onClose,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadSessions = async () => {
    setLoading(true);
    const list = await getAllSessions();
    setSessions(list);
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSwitch = async (sessionId: string) => {
    sound.playPop();
    haptics.light();
    await switchActiveSession(sessionId);
    onSelectSession(sessionId);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;

    sound.playPop();
    haptics.warning();
    await deleteSession(sessionId);
    loadSessions();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-start select-none">
      <div className="w-full max-w-xs sm:max-w-sm h-full bg-[#FFFDF7] border-r-4 border-black p-5 flex flex-col space-y-4 shadow-[8px_0px_0px_#000] overflow-y-auto animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-xl font-black text-[#18181B]">Past Sessions</h2>
              <p className="text-[10px] font-bold text-gray-500">History of all party nights</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center active:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Start New Session CTA */}
        <button
          onClick={() => {
            sound.playPop();
            haptics.light();
            onNewSessionClick();
            onClose();
          }}
          className="w-full neo-btn py-3 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B] flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> + Start New Session
        </button>

        {/* Sessions List */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs font-bold text-gray-500">Loading history...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="text-3xl">🎲</div>
              <div className="text-xs font-bold text-gray-500">No previous sessions found.</div>
            </div>
          ) : (
            sessions.map(s => {
              const isCurrent = s.id === currentSessionId;
              const dateStr = new Date(s.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              // Find winner
              let winnerName = '';
              let maxScore = -Infinity;
              s.players.forEach(p => {
                const sc = s.cumulativeScores[p.id] || 0;
                if (sc > maxScore) {
                  maxScore = sc;
                  winnerName = p.name;
                }
              });

              return (
                <div
                  key={s.id}
                  onClick={() => handleSwitch(s.id)}
                  className={`p-3.5 rounded-2xl border-3 border-black text-left cursor-pointer transition-all space-y-2 ${
                    isCurrent
                      ? 'bg-[#A7F3D0] shadow-[4px_4px_0px_#000] scale-[1.01]'
                      : 'bg-white hover:bg-yellow-50 shadow-[2px_2px_0px_#000]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#18181B] truncate max-w-[170px]">
                      {s.title}
                    </span>
                    {isCurrent && (
                      <span className="neo-badge bg-black text-white text-[9px] py-0 px-1.5 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {dateStr}
                    </span>
                    <div className="flex items-center gap-2">
                      {((s.photos?.length || 0) + (s.videoLinks?.length || 0) > 0) && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-black">
                          📸 {(s.photos?.length || 0) + (s.videoLinks?.length || 0)}
                        </span>
                      )}
                      <span>{s.history.length} rounds</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-black/10">
                    <div className="text-[10px] font-bold text-gray-700 truncate max-w-[180px]">
                      {s.players.map(p => p.name).join(', ') || 'No players'}
                    </div>
                    <button
                      type="button"
                      onClick={e => handleDelete(e, s.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
