import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { EyeOff } from 'lucide-react';
import type { WalletWidgetId } from '../../stores/walletLayoutStore';

interface WidgetsGalleryProps {
  order: WalletWidgetId[];
  setOrder: (o: WalletWidgetId[]) => void;
  hiddenWidgets: WalletWidgetId[];
  toggleHidden: (id: WalletWidgetId) => void;
  editEnabled: boolean;
  isRTL: boolean;
  /** Renders the inner visual (circle + label) for a given widget id. */
  renderBody: (id: WalletWidgetId) => React.ReactNode;
}

// Drag-to-hide drop target, mirroring the accessibility FAB's
// drag-to-dismiss trash. A circular target sits at bottom-center while a
// widget is dragged; releasing the widget over it toggles the widget's
// hidden flag instead of reordering.
const TRASH_SIZE = 64;
const TRASH_BOTTOM = 96; // distance from the bottom edge of the viewport
const TRASH_HIT_RADIUS = 72; // how close the finger must get to "snap in"

/**
 * Horizontal gallery of circular widgets with a natural reorder gesture.
 *
 * In edit mode you grab a widget and it lifts under your finger; the other
 * widgets slide apart and a dashed gray circle placeholder opens up at the
 * slot where the widget will drop. Releasing commits the new order.
 *
 * To HIDE a widget you don't tap a corner button — instead you drag it down
 * onto the circular "hide" target that appears at the bottom-center of the
 * screen (the same gesture as dismissing the accessibility FAB). Releasing
 * over the target toggles the widget's hidden flag.
 *
 * Implemented with manual pointer tracking (rather than framer's Reorder)
 * so we can render an explicit drop placeholder and keep the drop target
 * obvious. The dragged widget is rendered as a floating portal chip so it
 * isn't clipped by the gallery's horizontal scroll container.
 */
export default function WidgetsGallery({
  order,
  setOrder,
  hiddenWidgets,
  toggleHidden,
  editEnabled,
  isRTL,
  renderBody,
}: WidgetsGalleryProps) {
  const [dragId, setDragId] = useState<WalletWidgetId | null>(null);
  const [overIndex, setOverIndex] = useState(0);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const [overTrash, setOverTrash] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef(new Map<WalletWidgetId, HTMLElement>());
  const overIndexRef = useRef(0);
  const overTrashRef = useRef(false);
  const pointerXRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const setSlotRef = (id: WalletWidgetId) => (el: HTMLElement | null) => {
    if (el) slotRefs.current.set(id, el);
    else slotRefs.current.delete(id);
  };

  // Insertion index = how many non-dragged slots sit "before" the pointer.
  // In RTL the row runs right→left, so a slot whose centre is to the RIGHT
  // of the pointer precedes it; in LTR it's the slots to the left.
  const computeOverIndex = useCallback(
    (pointerX: number) => {
      let count = 0;
      for (const id of order) {
        if (id === dragId) continue;
        const el = slotRefs.current.get(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const center = r.left + r.width / 2;
        if (isRTL ? center > pointerX : center < pointerX) count++;
      }
      return count;
    },
    [order, dragId, isRTL],
  );

  // True when the pointer is within snap range of the bottom-center target.
  const computeOverTrash = useCallback((x: number, y: number) => {
    const trashCenterX = window.innerWidth / 2;
    const trashCenterY = window.innerHeight - TRASH_BOTTOM - TRASH_SIZE / 2;
    return Math.hypot(x - trashCenterX, y - trashCenterY) < TRASH_HIT_RADIUS;
  }, []);

  // Edge auto-scroll while a drag is active and the finger nears an edge.
  useEffect(() => {
    if (!dragId) return;
    const EDGE = 64;
    const SPEED = 14;
    const loop = () => {
      const el = scrollerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = pointerXRef.current;
        if (x < rect.left + EDGE) {
          el.scrollLeft -= Math.min(1, (rect.left + EDGE - x) / EDGE) * SPEED;
        } else if (x > rect.right - EDGE) {
          el.scrollLeft += Math.min(1, (x - (rect.right - EDGE)) / EDGE) * SPEED;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [dragId]);

  // Global pointer listeners for the active drag.
  useEffect(() => {
    if (!dragId) return;
    const onMove = (e: PointerEvent) => {
      pointerXRef.current = e.clientX;
      setFloatPos({ x: e.clientX, y: e.clientY });
      const onTrash = computeOverTrash(e.clientX, e.clientY);
      overTrashRef.current = onTrash;
      setOverTrash(onTrash);
      const idx = computeOverIndex(e.clientX);
      overIndexRef.current = idx;
      setOverIndex(idx);
    };
    const onUp = () => {
      // Released over the bottom "hide" target → toggle hidden, no reorder.
      if (overTrashRef.current) {
        toggleHidden(dragId);
      } else {
        const list = order.filter((id) => id !== dragId);
        const idx = Math.min(overIndexRef.current, list.length);
        const next = [...list.slice(0, idx), dragId, ...list.slice(idx)];
        setOrder(next);
      }
      setDragId(null);
      setFloatPos(null);
      setOverTrash(false);
      overTrashRef.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragId, order, computeOverIndex, computeOverTrash, setOrder, toggleHidden]);

  const startDrag = (id: WalletWidgetId) => (e: React.PointerEvent) => {
    if (!editEnabled) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    pointerXRef.current = e.clientX;
    setFloatPos({ x: e.clientX, y: e.clientY });
    overTrashRef.current = false;
    setOverTrash(false);
    const idx = order.indexOf(id);
    overIndexRef.current = idx;
    setOverIndex(idx);
    setDragId(id);
  };

  // ── Idle / non-edit rendering — plain row, taps navigate normally ──
  if (!editEnabled) {
    return (
      <div className="px-5 flex gap-5 overflow-x-auto no-scrollbar pb-2 pt-1">
        {order.map((id) =>
          hiddenWidgets.includes(id) ? null : (
            <div key={id} className="flex-none w-16">
              {renderBody(id)}
            </div>
          ),
        )}
      </div>
    );
  }

  // ── Edit-mode rendering — drag to reorder with a dashed placeholder ──
  const placeholder = (
    <motion.div
      layout
      key="__placeholder__"
      className="flex-none w-16 flex flex-col items-center gap-1.5"
    >
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300/90 bg-gray-100/40" />
      <span className="text-[11px] leading-tight">&nbsp;</span>
    </motion.div>
  );

  const listOrder = dragId ? order.filter((id) => id !== dragId) : order;
  const slots: React.ReactNode[] = [];
  listOrder.forEach((id, i) => {
    if (dragId && !overTrash && i === overIndex) slots.push(placeholder);
    const hidden = hiddenWidgets.includes(id);
    slots.push(
      <motion.div
        layout
        key={id}
        ref={setSlotRef(id)}
        onPointerDown={startDrag(id)}
        // In edit mode a tap shouldn't navigate — block the child button's
        // click so the gesture is purely reorder / hide.
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`relative flex-none w-16 touch-none cursor-grab active:cursor-grabbing transition-opacity ${
          hidden ? 'opacity-40' : ''
        }`}
      >
        {renderBody(id)}
      </motion.div>,
    );
  });
  if (dragId && !overTrash && overIndex >= listOrder.length) slots.push(placeholder);

  return (
    <>
      <div
        ref={scrollerRef}
        className="px-5 flex gap-5 overflow-x-auto no-scrollbar pb-2 pt-1"
        style={{ touchAction: dragId ? 'none' : undefined }}
      >
        {slots}
      </div>

      {/* Floating chip — follows the finger, lifted above everything. */}
      {dragId &&
        floatPos &&
        createPortal(
          <div
            className="fixed z-[120] pointer-events-none"
            style={{ left: floatPos.x, top: floatPos.y, transform: 'translate(-50%, -50%)' }}
          >
            <div
              className={`w-16 drop-shadow-2xl transition-transform ${
                overTrash ? 'scale-90 opacity-70' : 'scale-110'
              }`}
            >
              {renderBody(dragId)}
            </div>
          </div>,
          document.body,
        )}

      {/* Drag-to-hide target — appears at bottom-center during a drag, like
          the accessibility FAB's dismiss trash. Drop a widget here to hide. */}
      {dragId &&
        createPortal(
          <div
            aria-hidden
            className="fixed left-1/2 z-[115] flex flex-col items-center gap-1.5 pointer-events-none"
            style={{ bottom: TRASH_BOTTOM, transform: 'translateX(-50%)' }}
          >
            <div
              className={`rounded-full flex items-center justify-center border transition-all duration-150 ${
                overTrash
                  ? 'bg-red-500 border-white/40 text-white scale-110 shadow-2xl'
                  : 'bg-[#0a2540]/90 border-white/15 text-white/80 shadow-xl'
              }`}
              style={{ width: TRASH_SIZE, height: TRASH_SIZE }}
            >
              <EyeOff size={24} strokeWidth={2} />
            </div>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                overTrash ? 'bg-red-500 text-white' : 'bg-[#0a2540]/80 text-white/80'
              }`}
            >
              {isRTL ? 'גרור לכאן כדי להסתיר' : 'Drop here to hide'}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}
