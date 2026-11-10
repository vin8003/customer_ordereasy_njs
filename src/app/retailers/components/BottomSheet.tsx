'use client';

import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { pickSnap, type SheetSnap } from '@/lib/retailerMap';
import styles from '../Retailers.module.css';

interface BottomSheetProps {
    snap: SheetSnap;
    onSnapChange: (snap: SheetSnap) => void;
    /** Visible height of the sheet at each snap, in px. */
    heights: Record<SheetSnap, number>;
    /** Slides the sheet fully out (a shop preview or the pin picker is showing). */
    hidden?: boolean;
    header: React.ReactNode;
    children: React.ReactNode;
    label: string;
}

/**
 * Draggable sheet over the map. Drag the header (or tap it) to move between
 * three heights; the list inside scrolls on its own. On wide screens CSS turns
 * it into a fixed side panel and the drag is ignored.
 */
export default function BottomSheet({ snap, onSnapChange, heights, hidden, header, children, label }: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const drag = useRef<{
        startY: number;
        startVisible: number;
        visible: number;
        moved: boolean;
        samples: { t: number; y: number }[];
    } | null>(null);

    const place = useCallback((visible: number, animate: boolean) => {
        const el = sheetRef.current;
        if (!el) return;
        el.style.transition = animate ? '' : 'none';
        el.style.transform = `translate3d(0, ${Math.max(0, heights.full - visible)}px, 0)`;
        el.style.setProperty('--sheet-hidden', `${Math.max(0, heights.full - visible)}px`);
    }, [heights.full]);

    useLayoutEffect(() => {
        if (drag.current) return;
        const el = sheetRef.current;
        if (!el) return;
        if (hidden) {
            el.style.transition = '';
            el.style.transform = `translate3d(0, ${heights.full + 40}px, 0)`;
            return;
        }
        place(heights[snap], true);
    }, [snap, heights, hidden, place]);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (window.matchMedia('(min-width: 900px)').matches) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
            startY: e.clientY,
            startVisible: heights[snap],
            visible: heights[snap],
            moved: false,
            samples: [{ t: e.timeStamp, y: e.clientY }],
        };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (!d) return;
        const dy = e.clientY - d.startY;
        if (!d.moved && Math.abs(dy) < 4) return;
        d.moved = true;
        let visible = d.startVisible - dy;
        // Rubber band past either end.
        if (visible > heights.full) visible = heights.full + (visible - heights.full) * 0.2;
        if (visible < heights.peek) visible = heights.peek - (heights.peek - visible) * 0.35;
        d.visible = visible;
        d.samples.push({ t: e.timeStamp, y: e.clientY });
        if (d.samples.length > 5) d.samples.shift();
        place(visible, false);
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
        const d = drag.current;
        if (!d) return;
        drag.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        if (!d.moved) {
            if (!cancelled) onSnapChange(snap === 'peek' ? 'mid' : snap === 'mid' ? 'full' : 'mid');
            return;
        }
        const first = d.samples[0];
        const last = d.samples[d.samples.length - 1];
        const dt = last.t - first.t;
        const velocity = cancelled || dt <= 0 ? 0 : (last.y - first.y) / dt;
        const next = pickSnap(d.visible, velocity, heights, snap);
        if (next === snap) place(heights[snap], true);
        else onSnapChange(next);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowUp') onSnapChange(snap === 'peek' ? 'mid' : 'full');
        else if (e.key === 'ArrowDown') onSnapChange(snap === 'full' ? 'mid' : 'peek');
        else if (e.key === 'Enter' || e.key === ' ') onSnapChange(snap === 'peek' ? 'mid' : snap === 'mid' ? 'full' : 'mid');
        else return;
        e.preventDefault();
    };

    return (
        <section
            ref={sheetRef}
            className={styles.sheet}
            style={{ height: heights.full }}
            aria-label={label}
            aria-hidden={hidden || undefined}
            data-snap={snap}
            data-testid="retailer-sheet"
        >
            <div
                className={styles.sheetHeader}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => endDrag(e, false)}
                onPointerCancel={(e) => endDrag(e, true)}
                onKeyDown={onKeyDown}
                role="slider"
                tabIndex={0}
                aria-label="Resize the store list"
                aria-orientation="vertical"
                aria-valuemin={0}
                aria-valuemax={2}
                aria-valuenow={snap === 'peek' ? 0 : snap === 'mid' ? 1 : 2}
                aria-valuetext={snap === 'peek' ? 'Collapsed' : snap === 'mid' ? 'Half open' : 'Fully open'}
            >
                <span className={styles.sheetHandle} aria-hidden="true" />
                {header}
            </div>
            <div className={styles.sheetBody} data-testid="retailer-sheet-body">
                {children}
            </div>
        </section>
    );
}
