/** Quiet basemap so the store pins are the loudest thing on screen. */
export const DISCOVERY_MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#f1f3f8' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 3 }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#e2eddf' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#e9ebf4' }] },
    // Roads stay white but keep a visible outline, otherwise they vanish into the landscape.
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#dcdfeb' }] },
    { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#d3d8e8' }] },
    { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#fff2dd' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#f0d5a8' }] },
    { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cfdcfb' }] },
];
