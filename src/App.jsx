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
  MoreVertical,
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

const copy = {
  es: {
    subtitle: "Archivo personal de música creada con IA",
    night: "Night mode",
    now: "Reproduciendo ahora",
    radio: "Modo Radio",
    radioText: "Reproducción continua de canciones que te gustan. Siempre algo nuevo sonando.",
    startRadio: "Iniciar Radio",
    stopRadio: "Pausar Radio",
    customRadio: "Personalizar Radio",
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
    night: "Night mode",
    now: "Playing now",
    radio: "Radio Mode",
    radioText: "Continuous playback of songs you like. Always something new playing.",
    startRadio: "Start Radio",
    stopRadio: "Pause Radio",
    customRadio: "Customize Radio",
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

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) return initialValue;
    try {
      return JSON.parse(stored);
    } catch {
      return stored;
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

function Header({ darkMode, setDarkMode, language, setLanguage, t }) {
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
          onClick={() => setDarkMode((value) => !value)}
          aria-pressed={darkMode}
        >
          <Sun size={17} />
          <span>{t.night}</span>
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
          {track.genre} · {track.subgenre} · {track.mood} · {track.tags[0]}
        </p>
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
          <button className="play-control" type="button" onClick={onToggle} aria-label="Reproducir o pausar">
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

function TrackList({ items, selectedId, onSelect, favorites, onFavorite }) {
  return (
    <div className="track-list">
      {items.map((track) => (
        <article className={selectedId === track.id ? "track-row active" : "track-row"} key={track.id}>
          <button className="track-main" type="button" onClick={() => onSelect(track)}>
            <img src={track.cover} alt="" />
            <span>
              <strong>{track.title}</strong>
              <small>
                {track.genre} · {track.subgenre}
              </small>
            </span>
          </button>
          <div className="track-actions">
            <button className="mini-play" type="button" onClick={() => onSelect(track)} aria-label="Seleccionar">
              <Play size={18} fill="currentColor" />
            </button>
            <a className="icon-link desktop-only" href={track.downloadUrl} download aria-label="Descargar">
              <Download size={20} />
            </a>
            <button
              className={favorites.includes(track.id) ? "icon-link liked" : "icon-link"}
              type="button"
              onClick={() => onFavorite(track.id)}
              aria-label="Favorito"
            >
              <Heart size={18} fill="currentColor" />
            </button>
            <button className="icon-link" type="button" aria-label="Mas opciones">
              <MoreVertical size={20} />
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
  favorites,
  onFavorite,
  t,
}) {
  const localizedFilters = filters.map((filter) => {
    if (filter === "Todas") return t.all;
    if (filter === "Más") return t.more;
    return filter;
  });

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
            {localizedFilters[index]}
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
        favorites={favorites}
        onFavorite={onFavorite}
      />
    </section>
  );
}

function RecentActivity({ t }) {
  const items = [
    ["Mañana se Derrumba", "Reproducida hace 2 min"],
    ["Sombras del Asfalto", "Descargada hace 1 hr"],
    ["Latidos de Concreto", "Añadida a Favoritos"],
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
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [currentTime, setCurrentTime] = useState(84);
  const [darkMode, setDarkMode] = useStoredState("oprbguitar-night-mode", true);
  const [language, setLanguage] = useStoredState("oprbguitar-language", "es");
  const [favorites, setFavorites] = useStoredState("oprbguitar-favorites", ["manana-se-derrumba"]);
  const t = copy[language];

  const visibleTracks = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return tracks.filter((track) => {
      const filterMatch =
        activeFilter === "Todas" ||
        track.genre === activeFilter ||
        track.subgenre === activeFilter ||
        (activeFilter === "Rock" && track.subgenre.includes("Rock")) ||
        (activeFilter === "Más" && true);
      const haystack = [track.title, track.genre, track.subgenre, track.mood, ...track.tags]
        .join(" ")
        .toLowerCase();
      return filterMatch && (!cleanQuery || haystack.includes(cleanQuery));
    });
  }, [activeFilter, query]);

  const selectTrack = (track) => {
    setSelectedTrack(track);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const nextTrack = () => {
    const index = tracks.findIndex((track) => track.id === selectedTrack.id);
    selectTrack(tracks[(index + 1) % tracks.length]);
  };

  const previousTrack = () => {
    const index = tracks.findIndex((track) => track.id === selectedTrack.id);
    selectTrack(tracks[(index - 1 + tracks.length) % tracks.length]);
  };

  const toggleFavorite = (trackId = selectedTrack.id) => {
    setFavorites((items) =>
      items.includes(trackId) ? items.filter((id) => id !== trackId) : [...items, trackId],
    );
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, selectedTrack]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "darker";
  }, [darkMode]);

  const duration = durationToSeconds(selectedTrack.duration);
  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="app">
      <div className="ambient-grid" />
      <div className="starfield" />
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
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
            onToggle={() => setIsPlaying((value) => !value)}
            onNext={nextTrack}
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
              setRadioMode((value) => !value);
              setIsPlaying(true);
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
        onEnded={() => {
          if (radioMode) nextTrack();
          else setIsPlaying(false);
        }}
      />
      <div className="global-progress" style={{ "--progress": `${progress}%` }} />
    </div>
  );
}
