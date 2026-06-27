import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Globe2,
  Moon,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Sun,
} from "lucide-react";
import { tracks as localTracks } from "./data/tracks";
import {
  fetchSupabaseTracks,
  getCachedSupabaseStats,
  getCachedSupabaseTracks,
  mergeTrackLists,
} from "./services/supabaseTracks";
import { durationToSeconds, formatTime } from "./utils/time";

const AUDIO_SOURCE_WARNING =
  "No se pudo reproducir este audio desde Supabase. Puedes abrirlo en Suno o descargarlo.";

const copy = {
  es: {
    subtitle: "Archivo personal de música creada con IA",
    neon: "Modo neón",
    now: "Reproduciendo ahora",
    radio: "Modo Radio",
    radioActive: "Radio aleatoria activa",
    radioText: "Reproducción continua de canciones que te gustan. Siempre algo nuevo sonando.",
    startRadio: "Reproducir Radio",
    stopRadio: "Detener radio",
    audioUnavailable: "Audio no disponible",
    audioWarning: AUDIO_SOURCE_WARNING,
    libraryWarning: "No se pudo actualizar Supabase. Usando canciones guardadas.",
    noAudio: "No se encontraron audios en Supabase Storage.",
    refreshSongs: "Actualizar canciones",
    refreshingSongs: "Actualizando canciones...",
    loadedSongs: (count) => `${count} canciones cargadas`,
    listen: "Escuchar",
    explore: "Explorar canciones",
    footerLeft: "Las máquinas crean.",
    footerAccent: "Tú sientes.",
    created: "Creado por",
  },
  en: {
    subtitle: "Personal archive of AI-created music",
    neon: "Neon mode",
    now: "Playing now",
    radio: "Radio Mode",
    radioActive: "Random radio active",
    radioText: "Continuous playback of songs you like. Always something new playing.",
    startRadio: "Play Radio",
    stopRadio: "Stop radio",
    audioUnavailable: "Audio unavailable",
    audioWarning: AUDIO_SOURCE_WARNING,
    libraryWarning: "Could not refresh Supabase. Using saved songs.",
    noAudio: "No audio files were found in Supabase Storage.",
    refreshSongs: "Refresh songs",
    refreshingSongs: "Refreshing songs...",
    loadedSongs: (count) => `${count} songs loaded`,
    listen: "Listen",
    explore: "Explore songs",
    footerLeft: "Machines create.",
    footerAccent: "You feel.",
    created: "Created by",
  },
};

function hasPlayableUrl(track) {
  return /^https?:\/\//.test(track.audioUrl ?? "");
}

function getRandomPlayableTrack(trackList, currentTrackId, excludedIds = []) {
  const excluded = new Set(excludedIds);
  const playableTracks = trackList.filter((track) => hasPlayableUrl(track) && !excluded.has(track.id));
  if (playableTracks.length === 0) return null;

  const candidates =
    playableTracks.length > 1
      ? playableTracks.filter((track) => track.id !== currentTrackId)
      : playableTracks;

  return candidates[Math.floor(Math.random() * candidates.length)] ?? playableTracks[0];
}

function getInitialLibrary() {
  const cachedSupabaseTracks = getCachedSupabaseTracks();
  return mergeTrackLists(localTracks, cachedSupabaseTracks);
}

function getInitialTrack(trackList) {
  return getRandomPlayableTrack(trackList, null) ?? trackList[0] ?? localTracks[0];
}

function useStoredState(key, initialValue, migrateFrom = []) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    const migrated = stored ?? migrateFrom.map((oldKey) => localStorage.getItem(oldKey)).find((item) => item !== null);
    if (migrated === null || migrated === undefined) return initialValue;
    try {
      return JSON.parse(migrated);
    } catch {
      return migrated;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function Header({ neonMode, setNeonMode, language, setLanguage, t }) {
  return (
    <header className="header">
      <div className="brand">
        <BrandMark />
        <div>
          <h1>OPRBguitar</h1>
          <p>{t.subtitle}</p>
        </div>
      </div>
      <div className="header-actions">
        <button
          className="mode-toggle"
          type="button"
          onClick={() => setNeonMode((value) => !value)}
          aria-pressed={neonMode}
        >
          <Sun size={17} />
          <span>{t.neon}</span>
          <span className="switch">
            <span />
          </span>
          <Moon size={18} />
        </button>
        <div className="language" aria-label="Language selector">
          <Globe2 size={23} />
          <button
            type="button"
            className={language === "es" ? "active" : ""}
            onClick={() => setLanguage("es")}
          >
            ES
          </button>
          <button
            type="button"
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
}

function Waveform() {
  return (
    <div className="waveform" aria-hidden="true">
      {Array.from({ length: 72 }).map((_, index) => (
        <span key={index} style={{ "--h": `${18 + ((index * 13) % 34)}px` }} />
      ))}
    </div>
  );
}

function CircularPlayer({
  track,
  isPlaying,
  canPlay,
  playbackWarning,
  onToggle,
  onNext,
  onPrevious,
  currentTime,
  duration,
  t,
}) {
  return (
    <section className="player-shell" aria-label="Current music player">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit-dot dot-one" />
      <div className="orbit-dot dot-two" />
      <div className="player-disc">
        <span className="now-badge">{t.now}</span>
        <div className="title-row">
          <h2>{track.title}</h2>
        </div>
        <p className="track-meta">
          {track.genre} · {track.subgenre} · {track.mood} · {track.language}
        </p>
        {!canPlay && <p className="player-warning">{t.audioUnavailable}</p>}
        {playbackWarning && <p className="player-warning">{playbackWarning}</p>}
        <Waveform />
        <div className="time-row">
          <span>{formatTime(currentTime)}</span>
          <span>{duration}</span>
        </div>
        <div className="controls">
          <button className="touch-button circle-control" type="button" onClick={onPrevious} aria-label="Anterior">
            <SkipBack size={28} fill="currentColor" />
          </button>
          <button
            className="play-control"
            type="button"
            onClick={onToggle}
            disabled={!canPlay}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            aria-pressed={isPlaying}
          >
            {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={38} fill="currentColor" />}
          </button>
          <button className="touch-button circle-control" type="button" onClick={onNext} aria-label="Siguiente">
            <SkipForward size={28} fill="currentColor" />
          </button>
        </div>
      </div>
    </section>
  );
}

function TrackList({ items, selectedId, isPlaying, onListen, t }) {
  return (
    <div className="track-list">
      {items.map((track) => {
        const isCurrent = selectedId === track.id;
        const isPlayingThis = isCurrent && isPlaying;
        return (
        <article className={isCurrent ? "track-row active" : "track-row"} key={track.id}>
          <div className="track-main">
            <img src={track.cover} alt="" />
            <span>
              <strong>{track.title}</strong>
              <small>
                {track.genre} · {track.mood} · {track.language}
              </small>
            </span>
          </div>
          <div className="track-actions">
            <button
              className={isPlayingThis ? "track-action listen-action playing" : "track-action listen-action"}
              type="button"
              onClick={() => onListen(track)}
              disabled={!hasPlayableUrl(track)}
              aria-label={
                !hasPlayableUrl(track) ? t.audioUnavailable : isPlayingThis ? "Pausar" : t.listen
              }
            >
              {isPlayingThis ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              <span>{hasPlayableUrl(track) ? (isPlayingThis ? "Pausar" : t.listen) : t.audioUnavailable}</span>
            </button>
          </div>
        </article>
        );
      })}
    </div>
  );
}

function RadioCard({ isPlaying, onToggleRadio, t }) {
  return (
    <section className={isPlaying ? "radio-card active" : "radio-card"}>
      <div className="radio-icon">
        <Radio size={24} />
      </div>
      <div className="radio-copy">
        <h2>{isPlaying ? t.radioActive : t.radio}</h2>
        <p>{t.radioText}</p>
        <button className="primary-button" type="button" onClick={onToggleRadio}>
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
          <span>{isPlaying ? t.stopRadio : t.startRadio}</span>
        </button>
      </div>
    </section>
  );
}

function ExplorePanel({
  selectedTrack,
  visibleTracks,
  isPlaying,
  onListen,
  onRefresh,
  isRefreshing,
  loadedCount,
  syncWarning,
  t,
}) {
  return (
    <section className="explore-panel" id="songs" aria-label={t.explore}>
      <div className="song-list-toolbar">
        <span>{t.loadedSongs(loadedCount)}</span>
        <button className="refresh-songs-button" type="button" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? t.refreshingSongs : t.refreshSongs}
        </button>
      </div>
      {syncWarning && <p className="library-warning">{syncWarning}</p>}
      {visibleTracks.length > 0 ? (
        <TrackList
          items={visibleTracks}
          selectedId={selectedTrack.id}
          isPlaying={isPlaying}
          onListen={onListen}
          t={t}
        />
      ) : (
        <p className="empty-songs">{t.noAudio}</p>
      )}
    </section>
  );
}

export default function App() {
  const audioRef = useRef(null);
  const loadedUrlRef = useRef("");
  const mediaHandlers = useRef({});
  const [library, setLibrary] = useState(getInitialLibrary);
  const [syncStats, setSyncStats] = useState(() => getCachedSupabaseStats());
  const [syncWarning, setSyncWarning] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(() => getInitialTrack(library.tracks));
  const [isPlaying, setIsPlaying] = useState(false);
  const [radioMode, setRadioMode] = useState(true);
  const [autoBlocked, setAutoBlocked] = useState(false);
  const [playbackWarning, setPlaybackWarning] = useState("");
  const [failedTrackIds, setFailedTrackIds] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [neonMode, setNeonMode] = useStoredState("oprbguitar-neon-mode", true, [
    "oprbguitar-night-mode",
  ]);
  const [language, setLanguage] = useStoredState("oprbguitar-language", "es");
  const t = copy[language];

  const visibleTracks = useMemo(() => library.tracks.filter((track) => hasPlayableUrl(track)), [library.tracks]);

  const applySupabaseTracks = useCallback((supabaseTracks, supabaseStats) => {
    const dynamicLibrary = {
      tracks: supabaseTracks,
      duplicateTracksSkipped: supabaseStats?.duplicateTracksSkipped ?? 0,
    };
    const nextStats = {
      supabaseTracksLoaded: supabaseStats?.loaded ?? supabaseTracks.length,
      cachedLocalFallbackTracks: localTracks.length,
      totalTracksAvailable: supabaseTracks.length,
      duplicateTracksSkipped: supabaseStats?.duplicateTracksSkipped ?? 0,
      invalidFilesIgnored: supabaseStats?.invalidFilesIgnored ?? 0,
      fileNames: supabaseStats?.fileNames ?? supabaseTracks.map((track) => track.filename).filter(Boolean),
      fetchedAt: supabaseStats?.fetchedAt ?? new Date().toISOString(),
    };

    setLibrary(dynamicLibrary);
    setSyncStats(nextStats);
    window.__OPRBGUITAR_TRACK_STATS__ = nextStats;
    setSyncWarning("");
    setSelectedTrack((current) => {
      const updatedCurrent = supabaseTracks.find((track) => track.id === current.id);
      return updatedCurrent ?? getInitialTrack(supabaseTracks);
    });
  }, []);

  const refreshTracks = useCallback(
    async ({ showWarning = false, manual = false } = {}) => {
      setIsRefreshing(true);
      if (manual) setSyncWarning("");
      try {
        const result = await fetchSupabaseTracks();
        applySupabaseTracks(result.tracks, result.stats);
      } catch {
        if (showWarning || manual) {
          setSyncWarning(t.libraryWarning);
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [applySupabaseTracks, t.libraryWarning],
  );

  useEffect(() => {
    refreshTracks({ showWarning: false });
    const refreshInterval = window.setInterval(() => refreshTracks({ showWarning: false }), 5 * 60 * 1000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshTracks({ showWarning: true });
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshTracks]);

  // Single source of truth for playback: imperatively drive the <audio> element
  // so rapid Next/Prev taps never race a declarative src binding or an effect.
  const playTrack = (track) => {
    if (!hasPlayableUrl(track)) {
      setIsPlaying(false);
      setPlaybackWarning(t.audioUnavailable);
      return;
    }

    const audio = audioRef.current;
    setSelectedTrack(track);
    setPlaybackWarning("");
    setFailedTrackIds((ids) => ids.filter((id) => id !== track.id));

    if (!audio) {
      setIsPlaying(true);
      return;
    }

    // Only reload when the track really changes, so resume keeps its position.
    if (loadedUrlRef.current !== track.audioUrl) {
      loadedUrlRef.current = track.audioUrl;
      audio.src = track.audioUrl;
      audio.load();
      setCurrentTime(0);
    }

    const attempt = audio.play();
    if (attempt && typeof attempt.then === "function") {
      attempt
        .then(() => {
          setAutoBlocked(false);
          setIsPlaying(true);
        })
        .catch((error) => {
          // Switching src or pausing aborts the pending play() — that's normal.
          if (error && error.name === "AbortError") return;
          if (error && error.name === "NotAllowedError") {
            setAutoBlocked(true);
            setIsPlaying(false);
            return;
          }
          setFailedTrackIds((ids) => (ids.includes(track.id) ? ids : [...ids, track.id]));
          setPlaybackWarning(t.audioWarning);
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(true);
    }
  };

  const pausePlayback = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  // Sequential navigation so every track is reachable going forward and back.
  const findAdjacentTrack = (direction, skipFailed = false) => {
    if (visibleTracks.length === 0) return null;
    const index = visibleTracks.findIndex((track) => track.id === selectedTrack.id);
    const startIndex = index >= 0 ? index : 0;
    for (let step = 1; step <= visibleTracks.length; step += 1) {
      const candidate =
        visibleTracks[(startIndex + step * direction + visibleTracks.length) % visibleTracks.length];
      if (hasPlayableUrl(candidate) && (!skipFailed || !failedTrackIds.includes(candidate.id))) {
        return candidate;
      }
    }
    // Everything else is marked failed — fall back to the first playable track.
    return visibleTracks.find((track) => hasPlayableUrl(track)) ?? null;
  };

  const nextTrack = (skipFailed = false) => {
    const next = findAdjacentTrack(1, skipFailed);
    if (next) playTrack(next);
    else setPlaybackWarning(t.audioUnavailable);
  };

  const previousTrack = () => {
    const previous = findAdjacentTrack(-1);
    if (previous) playTrack(previous);
  };

  // Main play/pause button.
  const togglePlayback = () => {
    if (isPlaying) {
      pausePlayback();
      return;
    }
    setRadioMode(true);
    playTrack(selectedTrack);
  };

  // Per-row button: toggles the current track, otherwise plays the tapped one.
  const toggleTrack = (track) => {
    if (track.id === selectedTrack.id && isPlaying) {
      pausePlayback();
      return;
    }
    setRadioMode(true);
    playTrack(track);
  };

  const toggleRadioMode = () => {
    if (isPlaying) {
      pausePlayback();
      return;
    }
    setRadioMode(true);
    playTrack(selectedTrack);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = neonMode ? "neon" : "calm";
  }, [neonMode]);

  useEffect(() => {
    window.__OPRBGUITAR_TRACK_STATS__ = syncStats ?? {
      supabaseTracksLoaded: 0,
      cachedLocalFallbackTracks: localTracks.length,
      totalTracksAvailable: library.tracks.length,
      duplicateTracksSkipped: library.duplicateTracksSkipped ?? 0,
      invalidFilesIgnored: 0,
    };
  }, [library, syncStats]);

  // Keep the latest callbacks available to the (once-registered) media handlers.
  mediaHandlers.current = {
    play: () => playTrack(selectedTrack),
    pause: () => pausePlayback(),
    next: () => nextTrack(),
    previous: () => previousTrack(),
    seek: (time) => {
      const audio = audioRef.current;
      if (!audio || time == null) return;
      audio.currentTime = time;
      setCurrentTime(time);
    },
  };

  // Expose transport controls to the OS / car (Bluetooth AVRCP, Android Auto
  // media surface, lock screen). Registered once; reads live callbacks via ref.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return undefined;
    const ms = navigator.mediaSession;
    const bind = (action, fn) => {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        /* action not supported on this browser */
      }
    };
    bind("play", () => mediaHandlers.current.play());
    bind("pause", () => mediaHandlers.current.pause());
    bind("stop", () => mediaHandlers.current.pause());
    bind("previoustrack", () => mediaHandlers.current.previous());
    bind("nexttrack", () => mediaHandlers.current.next());
    bind("seekto", (details) => mediaHandlers.current.seek(details.seekTime));
    return () => {
      ["play", "pause", "stop", "previoustrack", "nexttrack", "seekto"].forEach((action) =>
        bind(action, null),
      );
    };
  }, []);

  // Publish track metadata + playback state so the car/lock screen show artwork,
  // title and respond to the steering-wheel controls.
  useEffect(() => {
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: selectedTrack.title,
      artist: selectedTrack.artist ?? "OPRBguitar",
      album: `${selectedTrack.genre} · OPRBguitar`,
      artwork: [256, 384, 512].map((size) => ({
        src: selectedTrack.cover,
        sizes: `${size}x${size}`,
        type: "image/jpeg",
      })),
    });
  }, [selectedTrack]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  // If autoplay was blocked, start playback on the first user interaction.
  useEffect(() => {
    if (!autoBlocked) return;
    const resume = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoBlocked(false);
        })
        .catch(() => {});
    };
    const events = ["pointerdown", "keydown", "touchstart"];
    events.forEach((event) => document.addEventListener(event, resume));
    return () => events.forEach((event) => document.removeEventListener(event, resume));
  }, [autoBlocked]);

  const duration = durationToSeconds(selectedTrack.duration);
  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const canPlaySelected = hasPlayableUrl(selectedTrack);

  return (
    <div className="app">
      <div className="ambient-grid" />
      <div className="starfield" />
      <Header
        neonMode={neonMode}
        setNeonMode={setNeonMode}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      <main className="dashboard">
        <div className="primary-column">
          <CircularPlayer
            track={selectedTrack}
            isPlaying={isPlaying}
            canPlay={canPlaySelected}
            playbackWarning={playbackWarning}
            onToggle={togglePlayback}
            onNext={() => nextTrack()}
            onPrevious={previousTrack}
            currentTime={currentTime}
            duration={selectedTrack.duration}
            t={t}
          />
        </div>
        <div className="content-column">
          <RadioCard isPlaying={isPlaying} onToggleRadio={toggleRadioMode} t={t} />
          <ExplorePanel
            selectedTrack={selectedTrack}
            visibleTracks={visibleTracks}
            isPlaying={isPlaying}
            onListen={toggleTrack}
            onRefresh={() => refreshTracks({ showWarning: true, manual: true })}
            isRefreshing={isRefreshing}
            loadedCount={visibleTracks.length}
            syncWarning={syncWarning}
            t={t}
          />
        </div>
      </main>
      <footer className="footer">
        <span>
          {t.footerLeft} <strong>{t.footerAccent}</strong>
        </span>
        <span>© 2026 OPRBguitar</span>
        <span>
          {t.created} <strong>oprguitar</strong>
        </span>
      </footer>
      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setCurrentTime(audio.currentTime);
          if ("mediaSession" in navigator && navigator.mediaSession.setPositionState && Number.isFinite(audio.duration)) {
            try {
              navigator.mediaSession.setPositionState({
                duration: audio.duration,
                position: audio.currentTime,
                playbackRate: audio.playbackRate || 1,
              });
            } catch {
              /* ignore unsupported position state */
            }
          }
        }}
        onError={() => {
          setIsPlaying(false);
          setPlaybackWarning(t.audioWarning);
          setFailedTrackIds((items) => (items.includes(selectedTrack.id) ? items : [...items, selectedTrack.id]));
          if (radioMode) nextTrack(true);
        }}
        onEnded={() => {
          nextTrack(true);
        }}
      />
      <div className="global-progress" style={{ "--progress": `${progress}%` }} />
    </div>
  );
}
