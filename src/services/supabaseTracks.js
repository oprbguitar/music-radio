import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://oprewkvgcolmfzjscvtu.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcmV3a3ZnY29sbWZ6anNjdnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MjM2MjYsImV4cCI6MjA5ODA5OTYyNn0.et5-fXKtaRanzAopPI34psW-wNQ2gz-3TMIMn71yugU";

export const SUPABASE_TRACK_CACHE_KEY = "oprbguitar-supabase-tracks-v1";
export const SUPABASE_TRACK_STATS_KEY = "oprbguitar-supabase-track-stats-v1";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || "oprb-tracks";
const SUPABASE_AUDIO_FOLDER = import.meta.env.VITE_SUPABASE_AUDIO_FOLDER || "audio";

const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "aac", "ogg", "flac"]);
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80";

let client;

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readStorage(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  const value = localStorage.getItem(key);
  return value ? safeJsonParse(value, fallback) : fallback;
}

function writeStorage(key, value) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function getExtension(filename) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isSupportedAudioFile(filename) {
  return AUDIO_EXTENSIONS.has(getExtension(filename));
}

export function normalizeFilename(filename) {
  return decodeURIComponent(filename)
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function titleFromFilename(filename) {
  const smallWords = new Set(["a", "al", "and", "de", "del", "el", "en", "from", "la", "las", "los", "of", "the", "y"]);
  const normalized = normalizeFilename(filename);

  return normalized
    .split(" ")
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function trackIdFromPath(path) {
  return `supabase-${normalizeFilename(path).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function fileToTrack(file) {
  const path = `${SUPABASE_AUDIO_FOLDER}/${file.name}`;
  const { data } = getSupabaseClient().storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  const title = titleFromFilename(file.name);

  return {
    id: trackIdFromPath(path),
    title,
    artist: "OPRBguitar",
    audioUrl: data.publicUrl,
    downloadUrl: `${data.publicUrl}?download`,
    genre: "OPRBguitar",
    subgenre: "Supabase Storage",
    mood: "Radio",
    energy: "Media",
    language: "Instrumental / Vocal",
    duration: "00:00",
    cover: DEFAULT_COVER,
    tags: ["supabase", "radio", "oprb"],
    category: "Supabase",
    source: "supabase",
    createdAt: file.created_at ?? null,
    updatedAt: file.updated_at ?? file.last_accessed_at ?? null,
    createdWith: "Suno AI",
    year: 2026,
    isPublic: true,
    featured: false,
    notes: "Loaded automatically from Supabase Storage.",
    normalizedFilename: normalizeFilename(file.name),
  };
}

function dedupeTracks(tracks) {
  const seenAudioUrls = new Set();
  const seenFilenames = new Set();
  const seenTitles = new Set();
  const unique = [];
  let duplicateCount = 0;

  tracks.forEach((track) => {
    const audioKey = track.audioUrl?.toLowerCase();
    const filenameKey = track.normalizedFilename || normalizeFilename(track.audioUrl ?? track.title ?? "");
    const titleKey = track.title?.trim().toLowerCase();

    if (
      (audioKey && seenAudioUrls.has(audioKey)) ||
      (filenameKey && seenFilenames.has(filenameKey)) ||
      (titleKey && seenTitles.has(titleKey))
    ) {
      duplicateCount += 1;
      return;
    }

    if (audioKey) seenAudioUrls.add(audioKey);
    if (filenameKey) seenFilenames.add(filenameKey);
    if (titleKey) seenTitles.add(titleKey);
    unique.push(track);
  });

  return { tracks: unique, duplicateCount };
}

export function getCachedSupabaseTracks() {
  const cached = readStorage(SUPABASE_TRACK_CACHE_KEY, []);
  return Array.isArray(cached) ? cached : [];
}

export function getCachedSupabaseStats() {
  return readStorage(SUPABASE_TRACK_STATS_KEY, null);
}

export async function fetchSupabaseTracks() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Missing Supabase public client configuration.");

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .list(SUPABASE_AUDIO_FOLDER, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) throw error;

  const files = (data ?? []).filter((file) => file.name && !file.name.endsWith("/"));
  const supportedFiles = files.filter((file) => isSupportedAudioFile(file.name));
  const unsupportedFiles = files.length - supportedFiles.length;
  const deduped = dedupeTracks(supportedFiles.map(fileToTrack));
  const stats = {
    loaded: deduped.tracks.length,
    duplicateTracksSkipped: deduped.duplicateCount,
    invalidFilesIgnored: unsupportedFiles,
    fetchedAt: new Date().toISOString(),
  };

  writeStorage(SUPABASE_TRACK_CACHE_KEY, deduped.tracks);
  writeStorage(SUPABASE_TRACK_STATS_KEY, stats);

  return { tracks: deduped.tracks, stats };
}

export function mergeTrackLists(localTracks, supabaseTracks) {
  const normalizedLocal = localTracks.map((track) => ({
    ...track,
    category: track.category ?? track.genre ?? "OPRBguitar",
    source: track.source ?? "local",
    normalizedFilename: track.normalizedFilename ?? normalizeFilename(track.audioUrl ?? track.title ?? ""),
  }));
  const normalizedSupabase = supabaseTracks.map((track) => ({
    ...track,
    source: track.source ?? "supabase",
    normalizedFilename: track.normalizedFilename ?? normalizeFilename(track.audioUrl ?? track.title ?? ""),
  }));

  const deduped = dedupeTracks([...normalizedLocal, ...normalizedSupabase]);
  return {
    tracks: deduped.tracks,
    duplicateTracksSkipped: deduped.duplicateCount,
  };
}
