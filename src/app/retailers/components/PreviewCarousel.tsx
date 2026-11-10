'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { ArrowRight, MapPin, X } from 'lucide-react';
import { formatDistanceKm } from '@/lib/deliveryQuote';
import type { MapRetailer } from '@/lib/retailerMap';
import { OpenChip, RatingPill, RetailerChips, RetailerThumb, retailerSubtitle } from './RetailerRow';
import styles from '../Retailers.module.css';

interface PreviewCarouselProps {
    /** Plotted shops in list order; swiping moves through them. */
    retailers: MapRetailer[];
    selectedId: number;
    onSelect: (id: number) => void;
    onOpen: (id: number) => void;
    onClose: () => void;
}

/** Swipeable shop cards for the selected marker; the centred card drives the map selection. */
export default function PreviewCarousel({ retailers, selectedId, onSelect, onOpen, onClose }: PreviewCarouselProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef(new Map<number, HTMLDivElement>());
    const programmaticUntil = useRef(0);
    const first = useRef(true);
    const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Centre the selected card (instantly the first time, smoothly afterwards).
    useLayoutEffect(() => {
        const track = trackRef.current;
        const card = cardRefs.current.get(selectedId);
        if (!track || !card) return;
        const target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
        if (Math.abs(track.scrollLeft - target) < 4) {
            first.current = false;
            return;
        }
        programmaticUntil.current = Date.now() + (first.current ? 150 : 600);
        track.scrollTo({ left: target, behavior: first.current ? 'auto' : 'smooth' });
        first.current = false;
    }, [selectedId]);

    useEffect(() => () => {
        if (settle.current) clearTimeout(settle.current);
    }, []);

    const handleScroll = () => {
        if (settle.current) clearTimeout(settle.current);
        settle.current = setTimeout(() => {
            if (Date.now() < programmaticUntil.current) return;
            const track = trackRef.current;
            if (!track) return;
            const middle = track.scrollLeft + track.clientWidth / 2;
            let best: number | null = null;
            let bestGap = Infinity;
            cardRefs.current.forEach((el, id) => {
                const gap = Math.abs(el.offsetLeft + el.offsetWidth / 2 - middle);
                if (gap < bestGap) {
                    bestGap = gap;
                    best = id;
                }
            });
            if (best !== null && best !== selectedId) onSelect(best);
        }, 110);
    };

    return (
        <div className={styles.preview} data-testid="retailer-preview">
            <div className={styles.previewTrack} ref={trackRef} onScroll={handleScroll}>
                {retailers.map((retailer) => {
                    const active = retailer.id === selectedId;
                    const distance = formatDistanceKm(retailer.distance);
                    const subtitle = retailerSubtitle(retailer);
                    const place = [retailer.city, retailer.state].filter(Boolean).join(', ');
                    return (
                        <div
                            key={retailer.id}
                            ref={(el) => {
                                if (el) cardRefs.current.set(retailer.id, el);
                                else cardRefs.current.delete(retailer.id);
                            }}
                            className={`${styles.previewCard} ${active ? styles.previewCardActive : ''} ${retailer.is_currently_open === false ? styles.previewCardClosed : ''}`}
                            onClick={() => {
                                if (!active) onSelect(retailer.id);
                            }}
                            aria-current={active || undefined}
                        >
                            <div className={styles.previewTop}>
                                <RetailerThumb retailer={retailer} size="lg" />
                                <div className={styles.previewInfo}>
                                    <div className={styles.rowTitleLine}>
                                        <h3 className={styles.previewTitle}>{retailer.shop_name}</h3>
                                        <RatingPill retailer={retailer} />
                                    </div>
                                    {subtitle && <p className={styles.rowSubtitle}>{subtitle}</p>}
                                    <div className={styles.rowMeta}>
                                        <OpenChip retailer={retailer} />
                                        {(distance || place) && (
                                            <span className={styles.metaItem}>
                                                <MapPin size={12} />
                                                {distance ? `${distance} away` : place}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {active && (
                                    <button
                                        type="button"
                                        className={styles.previewClose}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        aria-label="Close preview"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <RetailerChips retailer={retailer} />
                            <button
                                type="button"
                                className={styles.previewCta}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpen(retailer.id);
                                }}
                                tabIndex={active ? 0 : -1}
                                data-testid={`retailer-preview-open-${retailer.id}`}
                            >
                                {retailer.is_currently_open === false ? 'Browse store' : 'Shop here'}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
