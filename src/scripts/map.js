import L from 'leaflet';
import { phaseColor } from '../data/phases.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function markerHtml(color, size, active, done) {
  const opacity = active ? 1 : done ? 0.85 : 0.4;
  const pulse = active ? 'map-marker--active' : '';
  const ring = active ? '<span class="map-marker-ring"></span>' : '';
  return `<div class="map-marker ${pulse}" style="
    width:${size}px;height:${size}px;
    background:${color};
    box-shadow:0 0 ${active ? 24 : 10}px ${color};
    --marker-glow:${color};
    opacity:${opacity};
  ">${ring}</div>`;
}

export class HolyLandMap {
  constructor(elId, events) {
    this.elId = elId;
    this.events = events;
    this.map = null;
    this.markers = [];
    this.traveledLine = null;
    this.futureLine = null;
    this.onMarkerClick = null;
  }

  init() {
    this.map = L.map(this.elId, {
      center: [31.8, 35.2],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer(TILES, { subdomains: 'abcd', maxZoom: 18 }).addTo(this.map);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.futureLine = L.polyline(this.events.map(e => e.coords), {
      color: 'rgba(212,175,55,0.12)',
      weight: 2,
      dashArray: '4,12',
    }).addTo(this.map);

    this.events.forEach((ev, i) => {
      const c = phaseColor(ev.phase);
      const m = L.marker(ev.coords, {
        icon: L.divIcon({
          html: markerHtml(c, 10, false, false),
          className: 'map-marker-wrap',
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
      }).addTo(this.map).bindPopup(
        `<strong>${ev.title}</strong>${ev.place}<br><em>${ev.scripture}</em>`,
        { closeButton: false, offset: [0, -8] }
      );
      m.on('click', () => this.onMarkerClick?.(i));
      this.markers.push(m);
    });
  }

  goTo(index) {
    const ev = this.events[index];
    const c = phaseColor(ev.phase);
    const zoom = ev.phase === 'Passion Week' ? 12
      : ev.phase.includes('Galilee') ? 10
      : ev.place === 'Egypt' ? 6
      : 8;

    this.map.flyTo(ev.coords, zoom, { duration: 1.6, easeLinearity: 0.25 });

    if (this.traveledLine) this.map.removeLayer(this.traveledLine);
    this.traveledLine = L.polyline(
      this.events.slice(0, index + 1).map(e => e.coords),
      { color: c, weight: 3, opacity: 0.9 }
    ).addTo(this.map);

    this.markers.forEach((m, i) => {
      const col = phaseColor(this.events[i].phase);
      const active = i === index;
      const done = i < index;
      const sz = active ? 20 : done ? 12 : 8;
      m.setIcon(L.divIcon({
        html: markerHtml(col, sz, active, done),
        className: 'map-marker-wrap',
        iconSize: [sz, sz],
        iconAnchor: [sz / 2, sz / 2],
      }));
      if (active) m.openPopup();
      else m.closePopup();
    });
  }
}