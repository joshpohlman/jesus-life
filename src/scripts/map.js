import L from 'leaflet';
import { PHASES, phaseColor } from '../data/phases.js';

const TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const PHASE_ZOOM = { 1: 8, 2: 10, 3: 8, 4: 10, 5: 10, 6: 13, 7: 9 };

function markerHtml(color, size, active, done) {
  const opacity = active ? 1 : done ? 0.85 : 0.4;
  const pulse = active ? 'map-marker--active' : '';
  const ring = active ? '<span class="map-marker-ring"></span>' : '';
  return `<div class="map-marker ${pulse}" style="
    width:${size}px;height:${size}px;
    background:${color};
    box-shadow:0 0 ${active ? 18 : 8}px ${color};
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
    this.legLine = null;
    this.lastIndex = 0;
    this.flyTimer = 0;
    this.chipTimer = 0;
    this.onMarkerClick = null;
  }

  init() {
    this.map = L.map(this.elId, {
      center: [31.8, 35.2],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer(TILES, { subdomains: 'abcd', maxZoom: 18 }).addTo(this.map);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.polyline(this.events.map(e => e.coords), {
      color: 'rgba(201,169,110,0.14)',
      weight: 2,
      dashArray: '4,12',
    }).addTo(this.map);

    this.traveledLine = L.polyline([this.events[0].coords], {
      color: '#c9a96e',
      weight: 3,
      opacity: 0.9,
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
      }).addTo(this.map);
      m.bindTooltip(`${ev.title}`, {
        direction: 'top',
        offset: [0, -10],
        className: 'map-tip',
      });
      m.on('click', () => this.onMarkerClick?.(i));
      this.markers.push(m);
    });
  }

  showTravelChip(from, to) {
    const chip = document.getElementById('map-travel-chip');
    if (!chip || from === to) return;
    chip.textContent = `${from} → ${to}`;
    chip.classList.add('is-visible');
    clearTimeout(this.chipTimer);
    this.chipTimer = setTimeout(() => chip.classList.remove('is-visible'), 2600);
  }

  /** Animate the newest leg of the route being walked */
  drawLeg(fromCoords, toCoords, color) {
    if (this.legLine) { this.map.removeLayer(this.legLine); this.legLine = null; }
    this.legLine = L.polyline([fromCoords, toCoords], {
      color,
      weight: 3,
      opacity: 0.95,
      className: 'route-leg',
    }).addTo(this.map);

    const path = this.legLine._path;
    if (path && typeof path.getTotalLength === 'function') {
      const len = path.getTotalLength();
      path.style.transition = 'none';
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      path.style.strokeDashoffset = '0';
    }

    setTimeout(() => {
      if (this.legLine) { this.map.removeLayer(this.legLine); this.legLine = null; }
    }, 1300);
  }

  goTo(index) {
    const ev = this.events[index];
    const prev = this.events[this.lastIndex];
    const c = phaseColor(ev.phase);
    const ph = PHASES.find(p => p.label === ev.phase);
    const zoom = ev.place === 'Egypt' ? 6 : (PHASE_ZOOM[ph?.id] ?? 9);

    // Debounce flight so skimming doesn't thrash the map
    clearTimeout(this.flyTimer);
    this.flyTimer = setTimeout(() => {
      const distance = this.map.getCenter().distanceTo(L.latLng(ev.coords));
      const duration = Math.min(2, Math.max(0.8, distance / 80000));
      this.map.flyTo(ev.coords, zoom, { duration, easeLinearity: 0.25 });
    }, 250);

    // Persistent traveled path; animate single forward steps
    if (index === this.lastIndex + 1) {
      this.drawLeg(prev.coords, ev.coords, c);
      const pts = this.events.slice(0, index + 1).map(e => e.coords);
      setTimeout(() => this.traveledLine.setLatLngs(pts), 1200);
      this.showTravelChip(prev.place, ev.place);
    } else {
      this.traveledLine.setLatLngs(this.events.slice(0, index + 1).map(e => e.coords));
    }
    this.lastIndex = index;

    this.markers.forEach((m, i) => {
      const col = phaseColor(this.events[i].phase);
      const isActive = i === index;
      const done = i < index;
      const sz = isActive ? 18 : done ? 12 : 8;
      m.setIcon(L.divIcon({
        html: markerHtml(col, sz, isActive, done),
        className: 'map-marker-wrap',
        iconSize: [sz, sz],
        iconAnchor: [sz / 2, sz / 2],
      }));
    });
  }
}
