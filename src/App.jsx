import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Globe2,
  Heart,
  History,
  Home,
  Library,
  ListMusic,
  Menu,
  Moon,
  Music2,
  Pause,
  Play,
  Radio,
  Repeat2,
  Search,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
} from "lucide-react";
import { filters, tracks } from "./data/tracks";
import { durationToSeconds, formatTime } from "./utils/time";

const AUDIO_SOURCE_WARNING =
  "No se pudo reproducir este audio desde Supabase. Puedes abrirlo en Suno o descargarlo.";

const copy = {
  es: {
    subtitle: "Archivo personal de música creada con IA",
    neon: "Modo neón",
    now: "Reproduciendo ahora",
    radio: "Modo Radio",
    radioText: "Reproducción continua de canciones que te gustan. Siempre algo nuevo sonando.",
    startRadio: "Iniciar Radio",
    stopRadio: "Pausar Radio",
    customRadio: "Personalizar Radio",
    audioUnavailable: "Audio no disponible",
    audioWarning: AUDIO_SOURCE_WARNING,
    listen: "Escuchar",
    download: "Descargar",
    openSuno: "Abrir en Suno",
    explore: "Explorar canciones",
    search: "Buscar canciones o etiquetas...",
    recent: "Actividad reciente",
    all: "Todas",
    more: "Más",
    seeAll: "Ver todo",
    footerLeft: "Las máquinas crean.",
    footerAccent: "Tú sientes.",
    created: "Creado por",
    nav: ["Explorar", "Biblioteca", "Radio", "Descargas", "Ajustes"],
    side: ["Explorar", "Mi Biblioteca", "Favoritos", "Mis Playlists", "Descargas", "Historial", "Ajustes"],
  },
  en: {
    subtitle: "Personal archive of AI-created music",
    neon: "Neon mode",
    now: "Playing now",
    radio: "Radio Mode",
    radioText: "Continuous playback of songs you like. Always something new playing.",
    startRadio: "Start Radio",
    stopRadio: "Pause Radio",
    customRadio: "Customize Radio",
    audioUnavailable: "Audio unavailable",
    audioWarning: AUDIO_SOURCE_WARNING,
    listen: "Listen",
    download: "Download",
    openSuno: "Open Suno",
    explore: "Explore songs",
    search: "Search songs or tags...",
    recent: "Recent activity",
    all: "All",
    more: "More",
    seeAll: "See all",
    footerLeft: "Machines create.",
    footerAccent: "You feel.",
    created: "Created by",
    nav: ["Explore", "Library", "Radio", "Downloads", "Settings"],
    side: ["Explore", "My Library", "Favorites", "My Playlists", "Downloads", "History", "Settings"],
  },
};

const sidebarIcons = [Sparkles, Library, Heart, ListMusic, Download, History, Settings];
const bottomIcons = [Home, Library, Radio, Download, Settings];

function hasPlayableUrl(track) {
  return /^https?:\/\//.test(track.audioUrl ?? "");
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
      <button className="mobile-menu touch-button" aria-label="Abrir menu">
        <Menu size={22} />
      </button>
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
        <img
          className="avatar"
          alt="OPRBguitar avatar"
          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
        />
      </div>
    </header>
  );
}

function Sidebar({ labels }) {
  return (
    <aside className="sidebar" aria-label="Desktop navigation">
      {labels.map((label, index) => {
        const Icon = sidebarIcons[index];
        return (
          <button className={index === 0 ? "side-item active" : "side-item"} type="button" key={label}>
            <Icon size={25} />
            <span>{label}</span>
          </button>
        );
      })}
    </aside>
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
  isFavorite,
  onFavorite,
  t,
}) {
  return (
    <section className="player-shell" aria-label="Current music player">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit-dot dot-one" />
      <div className="orbit-dot dot-two" />
      <div className="player-disc">
        <div className="cover-wrap">
          <img src={track.cover} alt="" />
        </div>
        <span className="now-badge">{t.now}</span>
        <div className="title-row">
          <h2>{track.title}</h2>
          <button
            className={isFavorite ? "favorite active touch-button" : "favorite touch-button"}
            type="button"
            onClick={onFavorite}
            aria-label="Favorito"
          >
            <Heart size={26} fill="currentColor" />
          </button>
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
          <button className="touch-button ghost-control" type="button" aria-label="Aleatorio">
            <Shuffle size={23} />
          </button>
          <button className="touch-button circle-control" type="button" onClick={onPrevious} aria-label="Anterior">
            <SkipBack size={28} fill="currentColor" />
          </button>
          <button
            className="play-control"
            type="button"
            onClick={onToggle}
            disabled={!canPlay}
            aria-label="Reproducir o pausar"
          >
            {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={38} fill="currentColor" />}
          </button>
          <button className="touch-button circle-control" type="button" onClick={onNext} aria-label="Siguiente">
            <SkipForward size={28} fill="currentColor" />
          </button>
          <button className="touch-button ghost-control" type="button" aria-label="Repetir">
            <Repeat2 size={23} />
          </button>
        </div>
        <div className="volume">
          <Volume2 size={19} />
          <input type="range" min="0" max="100" defaultValue="68" aria-label="Volumen" />
          <Volume2 size={22} />
        </div>
      </div>
    </section>
  );
}

function RadioCard({ radioMode, onToggleRadio, t }) {
  return (
    <section className={radioMode ? "radio-card active" : "radio-card"}>
      <div className="radio-icon">
        <Radio size={30} />
      </div>
      <div>
        <h2>{t.radio}</h2>
        <p>{t.radioText}</p>
        <button className="primary-button" type="button" onClick={onToggleRadio}>
          {radioMode ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          {radioMode ? t.stopRadio : t.startRadio}
        </button>
        <button className="secondary-action" type="button">
          <SlidersHorizontal size={16} />
          {t.customRadio}
        </button>
      </div>
    </section>
  );
}

function TrackList({ items, selectedId, onSelect, onListen, favorites, onFavorite, t }) {
  return (
    <div className="track-list">
      {items.map((track) => (
        <article className={selectedId === track.id ? "track-row active" : "track-row"} key={track.id}>
          <button className="track-main" type="button" onClick={() => onSelect(track)}>
            <img src={track.cover} alt="" />
            <span>
              <strong>{track.title}</strong>
              <small>
                {track.genre} · {track.mood} · {track.language}
              </small>
            </span>
          </button>
          <div className="track-actions">
            <button
              className="track-action listen-action"
              type="button"
              onClick={() => onListen(track)}
              disabled={!hasPlayableUrl(track)}
              aria-label={hasPlayableUrl(track) ? t.listen : t.audioUnavailable}
            >
              <Play size={18} fill="currentColor" />
              <span>{hasPlayableUrl(track) ? t.listen : t.audioUnavailable}</span>
            </button>
            <a className="track-action" href={track.downloadUrl} download>
              <Download size={18} />
              <span>{t.download}</span>
            </a>
            {track.sunoUrl && (
              <a className="track-action" href={track.sunoUrl} target="_blank" rel="noreferrer">
                <Music2 size={18} />
                <span>{t.openSuno}</span>
              </a>
            )}
            <button
              className={favorites.includes(track.id) ? "track-action liked" : "track-action"}
              type="button"
              onClick={() => onFavorite(track.id)}
            >
              <Heart size={18} fill="currentColor" />
              <span>Favorito</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ExplorePanel({
  selectedTrack,
  visibleTracks,
  query,
  setQuery,
  activeFilter,
  setActiveFilter,
  onSelect,
  onListen,
  favorites,
  onFavorite,
  t,
}) {
  return (
    <section className="explore-panel">
      <div className="panel-heading">
        <h2>{t.explore}</h2>
        <a href="#songs">{t.seeAll}</a>
      </div>
      <div className="chips" role="list" aria-label="Genre filters">
        {filters.map((filter, index) => (
          <button
            key={filter}
            type="button"
            className={activeFilter === filter ? "chip active" : "chip"}
            onClick={() => setActiveFilter(filter)}
          >
            {index === 0 ? t.all : filter}
          </button>
        ))}
      </div>
      <label className="search-box">
        <span className="sr-only">{t.search}</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
        <Search size={22} />
      </label>
      <TrackList
        items={visibleTracks}
        selectedId={selectedTrack.id}
        onSelect={onSelect}
        onListen={onListen}
        favorites={favorites}
        onFavorite={onFavorite}
        t={t}
      />
    </section>
  );
}

function RecentActivity({ t }) {
  const items = [
    [tracks[0].title, "Nueva canción destacada"],
    [tracks[1].title, "Disponible desde Supabase"],
    [tracks[2].title, "Creada con Suno AI"],
  ];

  return (
    <section className="recent-card">
      <h2>{t.recent}</h2>
      {items.map(([title, detail], index) => (
        <div className="recent-item" key={title}>
          <img src={tracks[index + 1]?.cover ?? tracks[0].cover} alt="" />
          <span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </span>
        </div>
      ))}
      <button type="button">{t.seeAll}</button>
    </section>
  );
}

function BottomNav({ labels }) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {labels.map((label, index) => {
        const Icon = bottomIcons[index];
        return (
          <button className={index === 0 ? "active" : ""} type="button" key={label}>
            <Icon size={22} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const audioRef = useRef(null);
  const [selectedTrack, setSelectedTrack] = useState(tracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [radioMode, setRadioMode] = useState(false);
  const [playbackWarning, setPlaybackWarning] = useState("");
  const [failedTrackIds, setFailedTrackIds] = useState([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [currentTime, setCurrentTime] = useState(84);
  const [neonMode, setNeonMode] = useStoredState("oprbguitar-neon-mode", true, [
    "oprbguitar-night-mode",
  ]);
  const [language, setLanguage] = useStoredState("oprbguitar-language", "es");
  const [favorites, setFavorites] = useStoredState("oprbguitar-favorites", ["rezale-al-amor"]);
  const t = copy[language];

  const visibleTracks = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return tracks.filter((track) => {
      const filterMatch =
        activeFilter === "Todas" ||
        track.genre === activeFilter;
      const haystack = [track.title, track.genre, track.subgenre, track.mood, track.language, ...track.tags]
        .join(" ")
        .toLowerCase();
      return filterMatch && (!cleanQuery || haystack.includes(cleanQuery));
    });
  }, [activeFilter, query]);

  const selectTrack = (track) => {
    setSelectedTrack(track);
    setCurrentTime(0);
    setPlaybackWarning("");
  };

  const listenToTrack = (track) => {
    selectTrack(track);
    if (!hasPlayableUrl(track)) {
      setIsPlaying(false);
      setPlaybackWarning(t.audioUnavailable);
      return;
    }
    setIsPlaying(true);
  };

  const findNextTrack = (direction = 1, skipFailed = false) => {
    const index = tracks.findIndex((track) => track.id === selectedTrack.id);
    for (let step = 1; step <= tracks.length; step += 1) {
      const candidate = tracks[(index + step * direction + tracks.length) % tracks.length];
      if (hasPlayableUrl(candidate) && (!skipFailed || !failedTrackIds.includes(candidate.id))) {
        return candidate;
      }
    }
    return null;
  };

  const nextTrack = (skipFailed = false) => {
    const next = findNextTrack(1, skipFailed);
    if (!next) {
      setIsPlaying(false);
      setRadioMode(false);
      setPlaybackWarning(t.audioUnavailable);
      return;
    }
    listenToTrack(next);
  };

  const previousTrack = () => {
    const previous = findNextTrack(-1);
    if (previous) listenToTrack(previous);
  };

  const toggleFavorite = (trackId = selectedTrack.id) => {
    setFavorites((items) =>
      items.includes(trackId) ? items.filter((id) => id !== trackId) : [...items, trackId],
    );
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!hasPlayableUrl(selectedTrack)) {
      audio.pause();
      setIsPlaying(false);
      setPlaybackWarning(t.audioUnavailable);
      return;
    }
    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
        if (!audio.error && audio.readyState > 0) {
          return;
        }
        setPlaybackWarning(t.audioWarning);
        setFailedTrackIds((items) => (items.includes(selectedTrack.id) ? items : [...items, selectedTrack.id]));
        if (radioMode) {
          window.setTimeout(() => nextTrack(true), 250);
        }
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, selectedTrack, radioMode, t.audioUnavailable, t.audioWarning]);

  useEffect(() => {
    document.documentElement.dataset.theme = neonMode ? "neon" : "calm";
  }, [neonMode]);

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
        <Sidebar labels={t.side} />
        <div className="primary-column">
          <CircularPlayer
            track={selectedTrack}
            isPlaying={isPlaying}
            canPlay={canPlaySelected}
            playbackWarning={playbackWarning}
            onToggle={() => setIsPlaying((value) => !value)}
            onNext={() => nextTrack()}
            onPrevious={previousTrack}
            currentTime={currentTime}
            duration={selectedTrack.duration}
            isFavorite={favorites.includes(selectedTrack.id)}
            onFavorite={() => toggleFavorite()}
            t={t}
          />
          <RecentActivity t={t} />
        </div>
        <div className="content-column">
          <RadioCard
            radioMode={radioMode}
            onToggleRadio={() => {
              if (radioMode) {
                setRadioMode(false);
                setIsPlaying(false);
                return;
              }
              setRadioMode(true);
              const nextPlayable = hasPlayableUrl(selectedTrack) && !failedTrackIds.includes(selectedTrack.id)
                ? selectedTrack
                : findNextTrack(1, true);
              if (nextPlayable) listenToTrack(nextPlayable);
              else setPlaybackWarning(t.audioUnavailable);
            }}
            t={t}
          />
          <ExplorePanel
            selectedTrack={selectedTrack}
            visibleTracks={visibleTracks}
            query={query}
            setQuery={setQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            onSelect={selectTrack}
            onListen={listenToTrack}
            favorites={favorites}
            onFavorite={toggleFavorite}
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
      <BottomNav labels={t.nav} />
      <audio
        ref={audioRef}
        src={selectedTrack.audioUrl}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onError={() => {
          setIsPlaying(false);
          setPlaybackWarning(t.audioWarning);
          setFailedTrackIds((items) => (items.includes(selectedTrack.id) ? items : [...items, selectedTrack.id]));
          if (radioMode) nextTrack(true);
        }}
        onEnded={() => {
          if (radioMode) nextTrack(true);
          else setIsPlaying(false);
        }}
      />
      <div className="global-progress" style={{ "--progress": `${progress}%` }} />
    </div>
  );
}
