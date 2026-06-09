import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useWallpaperStore } from '../stores/wallpaperStore';

interface WallpaperTab {
  key: string;
  labelKey:
    | 'wallpaperTabUploaded'
    | 'wallpaperTabGlow'
    | 'wallpaperTabLava'
    | 'wallpaperTabLights'
    | 'wallpaperTabSnake'
    | 'wallpaperTabOuter';
}

const TABS: WallpaperTab[] = [
  { key: 'uploaded', labelKey: 'wallpaperTabUploaded' },
  { key: 'glow', labelKey: 'wallpaperTabGlow' },
  { key: 'lava', labelKey: 'wallpaperTabLava' },
  { key: 'lights', labelKey: 'wallpaperTabLights' },
  { key: 'snake', labelKey: 'wallpaperTabSnake' },
  { key: 'outer', labelKey: 'wallpaperTabOuter' },
];

/**
 * One wallpaper tile — radial / conic gradient + small play badge.
 * Backgrounds are inline CSS so we can use radial-gradient strings
 * directly (Tailwind's arbitrary `bg-[...]` works but inline keeps
 * each tile's recipe readable).
 */
interface TilePreset {
  id: string;
  background: string;
}

const TILES: TilePreset[] = [
  {
    id: 't1',
    background:
      'radial-gradient(circle at top left, #60a5fa, #a855f7 45%, #831843 100%)',
  },
  {
    id: 't2',
    background:
      'radial-gradient(circle at center, #facc15, #f97316 50%, #6b21a8 100%)',
  },
  {
    id: 't3',
    background:
      'radial-gradient(ellipse at bottom, #22d3ee, #10b981 50%, #0f172a 100%)',
  },
  {
    id: 't4',
    background:
      'radial-gradient(circle at bottom left, #38bdf8, #2563eb 50%, #1e1b4b 100%)',
  },
  {
    id: 't5',
    background:
      'radial-gradient(circle at top right, #a3e635, #16a34a 50%, #581c87 100%)',
  },
  {
    id: 't6',
    background:
      'radial-gradient(circle at center, #a78bfa, #2563eb 50%, #115e59 100%)',
  },
  {
    id: 't7',
    background:
      'conic-gradient(from 0deg at top right, #ec4899, #4338ca, #581c87)',
  },
  {
    id: 't8',
    background:
      'radial-gradient(circle at center, #67e8f9, #3b82f6 50%, #1e3a8a 100%)',
  },
  {
    id: 't9',
    background:
      'radial-gradient(circle at top, #fb923c, #dc2626 50%, #1e1b4b 100%)',
  },
  {
    id: 't10',
    background:
      'radial-gradient(circle at bottom left, #6366f1, #60a5fa 50%, #bef264 100%)',
  },
  {
    id: 't11',
    background:
      'radial-gradient(ellipse at center, #db2777, #3b82f6 50%, #67e8f9 100%)',
  },
];

/**
 * WallpaperPage
 *
 * Background-picker — modal-style screen reached from Profile →
 * Settings → "Wallpaper". Top bar has a close button, title, and an
 * Upload action; a horizontal-scrolling category tab strip; below that
 * a 3-col grid of preset tiles, each a radial / conic gradient with a
 * tiny play badge in the corner (suggests the wallpaper is animated).
 */
export default function WallpaperPage() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const setBackground = useWallpaperStore((s) => s.setBackground);
  const currentBackground = useWallpaperStore((s) => s.selectedBackground);

  const [activeTab, setActiveTab] = useState<string>('lava');
  // Pre-select whichever tile matches the stored background, if any —
  // so re-entering the page shows what's currently applied.
  const [selectedTile, setSelectedTile] = useState<string | null>(
    () => TILES.find((t) => t.background === currentBackground)?.id ?? null,
  );

  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto">
      {/* Header — large category-style title, with the Upload action
          aligned to the trailing edge. AppLayout marks this route as a
          full-screen-form so the global TopBar + chat FABs are
          suppressed; we just need a little top padding to clear the
          device status bar. */}
      <header className="flex items-end justify-between gap-3 px-4 pt-20 pb-3 relative z-10">
        <h1
          className={`text-3xl font-extrabold text-text-primary leading-tight ${
            isRTL ? 'text-right' : 'text-left'
          }`}
        >
          {t.profile.wallpaperTitle}
        </h1>
        <div className="flex items-end gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              // Clear the stored wallpaper and deselect any tile so
              // the user sees the default rainbow gradient again.
              setBackground(null);
              setSelectedTile(null);
            }}
            className="text-text-secondary font-semibold pb-1 text-[15px]"
          >
            {t.profile.wallpaperReset}
          </button>
          <button
            type="button"
            className="text-primary font-semibold pb-1 text-[15px]"
          >
            {t.profile.wallpaperUpload}
          </button>
        </div>
      </header>

      {/* Tab strip — horizontal scroll, no scrollbar. Active tab gets a
          rounded pill background. */}
      <nav className="px-4 py-2 relative z-10">
        <div className="flex overflow-x-auto no-scrollbar gap-2 items-center">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={
                  isActive
                    ? 'flex-shrink-0 px-4 py-1.5 rounded-full bg-surface text-text-primary text-[15px] font-medium whitespace-nowrap'
                    : 'flex-shrink-0 px-3 py-1.5 text-text-secondary text-[15px] font-medium whitespace-nowrap'
                }
              >
                {t.profile[tab.labelKey]}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Grid — 3 columns of aspect-[3/4] tiles. Extra bottom padding
          so the fixed CTA footer below doesn't cover the last row. */}
      <section className="flex-grow overflow-y-auto px-4 pt-4 pb-28 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {TILES.map((tile) => {
            const isSelected = selectedTile === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => setSelectedTile(tile.id)}
                aria-pressed={isSelected}
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm active:scale-[0.97] transition-all ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-light' : ''
                }`}
              >
                {/* Tile background — when this tile is selected we kick
                    on the lava-flow animation by oversizing the
                    background and morphing its position. Unselected
                    tiles are static. */}
                <div
                  className={`w-full h-full ${isSelected ? 'animate-lava-flow' : ''}`}
                  style={{
                    background: tile.background,
                    backgroundSize: isSelected ? '220% 220%' : '100% 100%',
                  }}
                />
                {/* Play badge — subtle hint the wallpaper animates. */}
                <span
                  className="absolute bottom-2 end-2 text-white"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}
                  aria-hidden
                >
                  <Play size={12} strokeWidth={0} fill="currentColor" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Fixed CTA — applies the selected wallpaper to the wallpaper
          store and navigates back so the user immediately sees the new
          backdrop on Home / Wallet / Profile. */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/85 backdrop-blur-sm border-t border-border/60 px-6 pt-4 pb-6 z-20">
        <button
          type="button"
          disabled={!selectedTile}
          onClick={() => {
            const tile = TILES.find((t) => t.id === selectedTile);
            if (tile) {
              setBackground(tile.background);
              navigate(-1);
            }
          }}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
            selectedTile
              ? 'bg-bg-dark text-white shadow-lg shadow-bg-dark/20 active:scale-[0.98] cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t.profile.wallpaperApplyCta}
        </button>
      </footer>
    </div>
  );
}
