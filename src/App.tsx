import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Session, switchActiveSession } from './services/db';
import { SessionHeader } from './components/session/SessionHeader';
import { GameHub } from './components/session/GameHub';
import { PlayerManager } from './components/session/PlayerManager';
import { AwardsModal } from './components/session/AwardsModal';
import { HistoryDrawer } from './components/session/HistoryDrawer';
import { CreateSessionView } from './components/session/CreateSessionView';
import { ImposterGame } from './games/imposter/ImposterGame';
import { ForeheadGame } from './games/forehead/ForeheadGame';
import { BombGame } from './games/bomb/BombGame';
import { EchoBluffGame } from './games/echobluff/EchoBluffGame';
import { WordTrapGame } from './games/wordtrap/WordTrapGame';
import { ThingsYouSayGame } from './games/thingsyousay/ThingsYouSayGame';
import { FakeArtistGame } from './games/fakeartist/FakeArtistGame';
import { MafiaGame } from './games/mafia/MafiaGame';
import { ResistanceGame } from './games/resistance/ResistanceGame';
import { SpyfallGame } from './games/spyfall/SpyfallGame';
import { sound } from './services/soundboard';
import { enterFullscreen } from './services/fullscreen';

type ViewMode =
  | 'create_session'
  | 'hub'
  | 'imposter'
  | 'forehead_pop'
  | 'bomb'
  | 'echo_bluff'
  | 'word_trap'
  | 'things_to_say'
  | 'fake_artist'
  | 'mafia'
  | 'resistance'
  | 'spyfall';

export function App() {
  // Load persisted view and session from localStorage
  const [activeView, setActiveView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('partypop_active_view');
      if (
        saved &&
        [
          'create_session',
          'hub',
          'imposter',
          'forehead_pop',
          'bomb',
          'echo_bluff',
          'word_trap',
          'things_to_say',
          'fake_artist',
          'mafia',
          'resistance',
          'spyfall',
        ].includes(saved)
      ) {
        return saved as ViewMode;
      }
    } catch {}
    return 'hub';
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('partypop_active_session_id');
    } catch {}
    return null;
  });

  const [isRosterOpen, setIsRosterOpen] = useState<boolean>(false);
  const [isAwardsOpen, setIsAwardsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Subscribe to sessions from Dexie
  const allSessions = useLiveQuery(async () => {
    return await db.sessions.orderBy('updatedAt').reverse().toArray();
  }, []);

  // Determine current active session
  const activeSession = allSessions?.find(s => activeSessionId ? s.id === activeSessionId : s.status === 'active')
    || (allSessions && allSessions.length > 0 ? allSessions[0] : null);

  // 1. Fullscreen on first user gesture anywhere on screen
  useEffect(() => {
    let handled = false;
    const handleInitialUserGesture = () => {
      if (!handled) {
        handled = true;
        enterFullscreen();
      }
    };

    window.addEventListener('click', handleInitialUserGesture, { capture: true, passive: true });
    window.addEventListener('touchend', handleInitialUserGesture, { capture: true, passive: true });

    return () => {
      window.removeEventListener('click', handleInitialUserGesture, { capture: true });
      window.removeEventListener('touchend', handleInitialUserGesture, { capture: true });
    };
  }, []);

  // 2. Hardware / Browser Back Button & Swipe Interceptor
  useEffect(() => {
    // Establish baseline history state so pressing back stays within the app
    try {
      window.history.replaceState({ app: 'partypop', view: activeView }, '', window.location.pathname);
      window.history.pushState({ app: 'partypop', view: activeView }, '', window.location.pathname);
    } catch {}

    const handlePopState = () => {
      // Priority 1: Close active modal or drawer if open
      if (isRosterOpen) {
        setIsRosterOpen(false);
        try { window.history.pushState({ app: 'partypop', view: activeView }, '', window.location.pathname); } catch {}
        return;
      }
      if (isAwardsOpen) {
        setIsAwardsOpen(false);
        try { window.history.pushState({ app: 'partypop', view: activeView }, '', window.location.pathname); } catch {}
        return;
      }
      if (isHistoryOpen) {
        setIsHistoryOpen(false);
        try { window.history.pushState({ app: 'partypop', view: activeView }, '', window.location.pathname); } catch {}
        return;
      }

      // Priority 2: If inside a game view, return smoothly to the Game Hub
      if (activeView !== 'hub' && activeView !== 'create_session') {
        sound.playPop();
        setActiveView('hub');
        try { window.history.pushState({ app: 'partypop', view: 'hub' }, '', window.location.pathname); } catch {}
        return;
      }

      // Priority 3: If on create_session and an active session exists, return to hub
      if (activeView === 'create_session' && activeSession && activeSession.players.length > 0) {
        sound.playPop();
        setActiveView('hub');
        try { window.history.pushState({ app: 'partypop', view: 'hub' }, '', window.location.pathname); } catch {}
        return;
      }

      // Priority 4: Already on Hub: keep sentinel state so back press doesn't accidentally exit website
      try { window.history.pushState({ app: 'partypop', view: 'hub' }, '', window.location.pathname); } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView, isRosterOpen, isAwardsOpen, isHistoryOpen, activeSession]);

  // Sync activeView to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('partypop_active_view', activeView);
    } catch {}
  }, [activeView]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    try {
      if (activeSession?.id) {
        localStorage.setItem('partypop_active_session_id', activeSession.id);
      }
    } catch {}
  }, [activeSession?.id]);

  // If no session exists or active session has 0 players, prompt create_session
  useEffect(() => {
    if (allSessions !== undefined && (!activeSession || activeSession.players.length === 0)) {
      setActiveView('create_session');
    }
  }, [allSessions, activeSession]);

  // Screen Wake Lock API to prevent phone screen from sleeping during gameplay
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Ignore if unsupported or denied
      }
    };

    if (['imposter', 'forehead_pop', 'bomb', 'echo_bluff'].includes(activeView)) {
      requestWakeLock();
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [activeView]);

  // Helper to change view and push browser history
  const navigateTo = (view: ViewMode) => {
    sound.playPop();
    setActiveView(view);
    try {
      window.history.pushState({ app: 'partypop', view }, '', window.location.pathname);
    } catch {}
  };

  // Helper to open modal and push browser history
  const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>, modalName: string) => {
    sound.playPop();
    setter(true);
    try {
      window.history.pushState({ app: 'partypop', modal: modalName }, '', window.location.pathname);
    } catch {}
  };

  // Handle when user creates a session -> navigate directly to Game Hub
  const handleSessionCreated = (sessionId: string) => {
    setActiveSessionId(sessionId);
    navigateTo('hub');
  };

  // Handle when user clicks a past session from History
  const handleSelectSessionFromHistory = (sessionId: string) => {
    setActiveSessionId(sessionId);
    navigateTo('hub');
  };

  // Handle "+ Start New Session" from history or header
  const handleStartNewSession = () => {
    setActiveSessionId(null);
    navigateTo('create_session');
  };

  const getGameTitle = () => {
    if (activeView === 'imposter') return 'The Imposter';
    if (activeView === 'forehead_pop') return 'Forehead Pop!';
    if (activeView === 'bomb') return 'Tick-Tick-BOOM!';
    if (activeView === 'echo_bluff') return 'Echo Bluff';
    if (activeView === 'word_trap') return 'Word Trap';
    if (activeView === 'things_to_say') return 'Things You Can Say';
    if (activeView === 'fake_artist') return 'Fake Artist';
    if (activeView === 'mafia') return 'Mafia';
    if (activeView === 'resistance') return 'The Resistance';
    if (activeView === 'spyfall') return 'Spyfall';
    return 'Party Hub';
  };

  // 1. Loading State while reading IndexedDB
  if (allSessions === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFFDF7]">
        <div className="neo-card p-6 text-center space-y-3">
          <div className="text-4xl animate-bounce">🎉</div>
          <div className="text-xl font-black text-[#18181B]">Loading Party Games...</div>
        </div>
      </div>
    );
  }

  // 2. Fresh Session Creation Screen (Name session, add players & avatars, create)
  if (activeView === 'create_session' || !activeSession || activeSession.players.length === 0) {
    return (
      <div className="min-h-screen max-w-md mx-auto px-4 py-3 flex flex-col justify-between">
        <CreateSessionView
          onOpenHistory={() => setIsHistoryOpen(true)}
          onSessionCreated={handleSessionCreated}
        />

        {isHistoryOpen && (
          <HistoryDrawer
            currentSessionId={activeSession?.id}
            onSelectSession={handleSelectSessionFromHistory}
            onNewSessionClick={handleStartNewSession}
            onClose={() => setIsHistoryOpen(false)}
          />
        )}
      </div>
    );
  }

  // 3. Active Session Views (Hub, Imposter, Forehead Pop, Bomb, Echo Bluff, Word Trap, Things You Say, Fake Artist, Mafia, Resistance, Spyfall)
  const isExpandedView = activeView === 'fake_artist';
  const isHubView = activeView === 'hub';

  return (
    <div
      className={`mx-auto px-2 sm:px-6 transition-all ${
        isExpandedView
          ? 'w-full max-w-7xl h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col py-1 sm:py-2'
          : isHubView
          ? 'w-full max-w-6xl min-h-screen flex flex-col justify-between py-2 sm:py-4'
          : 'min-h-screen max-w-md flex flex-col justify-between py-2'
      }`}
    >
      {/* Universal Session Header with Hamburger Menu */}
      <SessionHeader
        session={activeSession}
        onOpenHistory={() => openModal(setIsHistoryOpen, 'history')}
        onOpenRoster={() => openModal(setIsRosterOpen, 'roster')}
        onOpenAwards={() => openModal(setIsAwardsOpen, 'awards')}
        activeGameTitle={getGameTitle()}
        onHomeClick={() => navigateTo('hub')}
      />

      {/* Main View Port */}
      <main className={`flex-1 flex flex-col ${isExpandedView ? 'min-h-0 overflow-hidden justify-start' : 'justify-center'}`}>
        {activeView === 'hub' && (
          <GameHub
            session={activeSession}
            onSelectGame={(gameId) => navigateTo(gameId)}
            onOpenRoster={() => openModal(setIsRosterOpen, 'roster')}
            onOpenAwards={() => openModal(setIsAwardsOpen, 'awards')}
            onStartNewSession={handleStartNewSession}
          />
        )}

        {activeView === 'imposter' && (
          <ImposterGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'forehead_pop' && (
          <ForeheadGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'bomb' && (
          <BombGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'echo_bluff' && (
          <EchoBluffGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'word_trap' && (
          <WordTrapGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'things_to_say' && (
          <ThingsYouSayGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'fake_artist' && (
          <FakeArtistGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'mafia' && (
          <MafiaGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'resistance' && (
          <ResistanceGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}

        {activeView === 'spyfall' && (
          <SpyfallGame
            sessionId={activeSession.id}
            players={activeSession.players}
            onBackToHub={() => navigateTo('hub')}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      {isRosterOpen && (
        <PlayerManager
          sessionId={activeSession.id}
          players={activeSession.players}
          scores={activeSession.cumulativeScores}
          onClose={() => setIsRosterOpen(false)}
        />
      )}

      {isAwardsOpen && (
        <AwardsModal
          session={activeSession}
          onClose={() => setIsAwardsOpen(false)}
        />
      )}

      {isHistoryOpen && (
        <HistoryDrawer
          currentSessionId={activeSession.id}
          onSelectSession={handleSelectSessionFromHistory}
          onNewSessionClick={handleStartNewSession}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
