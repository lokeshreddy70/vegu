import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Nellore city center & known areas
const STORE = [14.4426, 79.9865];

const AREA_COORDS = {
  stonehousepet:   [14.4380, 79.9920],
  'grand canal':   [14.4450, 79.9840],
  'trunk road':    [14.4440, 79.9870],
  'tp town':       [14.4470, 79.9750],
  dargamitta:      [14.4500, 79.9800],
  'podalakur road':[14.4350, 79.9900],
  'hospital road': [14.4460, 79.9830],
  default:         [14.4430, 79.9810],
};

function getCustomerCoords(area = '') {
  const key = Object.keys(AREA_COORDS).find(k => area.toLowerCase().includes(k));
  return key ? AREA_COORDS[key] : AREA_COORDS.default;
}

// Pure HTML/CSS markers — no image files needed
function makeIcon(emoji, color = '#FF6B35', size = 40) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};
      display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size * 0.52)}px;
      box-shadow:0 3px 10px rgba(0,0,0,0.25);
      border:3px solid white;
    ">${emoji}</div>`,
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

// Smoothly pan map when center changes
function MapPanner({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.panTo(center, { animate: true, duration: 1 });
  }, [center, map]);
  return null;
}

// Rider delivery map — shows real GPS + customer location + route
export function RiderDeliveryMap({ order }) {
  const [riderPos, setRiderPos] = useState(STORE);
  const [gpsGranted, setGpsGranted] = useState(false);
  const watchRef = useRef(null);

  const customerPos = getCustomerCoords(order?.address?.area);

  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setRiderPos([pos.coords.latitude, pos.coords.longitude]);
        setGpsGranted(true);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  const distKm = riderPos
    ? (Math.sqrt(
        Math.pow((riderPos[0] - customerPos[0]) * 111, 2) +
        Math.pow((riderPos[1] - customerPos[1]) * 111 * Math.cos((riderPos[0] * Math.PI) / 180), 2)
      ).toFixed(1))
    : '…';

  const bounds = L.latLngBounds([riderPos, customerPos]).pad(0.3);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      {!gpsGranted && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, background: 'rgba(0,0,0,0.65)', color: '#fff',
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
          whiteSpace: 'nowrap',
        }}>
          📍 Showing store location — allow GPS for live tracking
        </div>
      )}

      <MapContainer
        bounds={bounds}
        style={{ height: 230, width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapPanner center={riderPos} />
        <Marker position={riderPos} icon={makeIcon('🛵', '#FF6B35', 42)} />
        <Marker position={customerPos} icon={makeIcon('🏠', '#4DA167', 38)} />
        <Polyline
          positions={[riderPos, customerPos]}
          pathOptions={{ color: '#FF6B35', weight: 3, dashArray: '8 5', opacity: 0.85 }}
        />
      </MapContainer>

      {/* Info bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 999,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
          🛵 You → 🏠 {order?.address?.area?.split(',')[0] || 'Customer'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6B35', background: '#fff3ee', padding: '2px 8px', borderRadius: 10 }}>
            {distKm} km
          </span>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${customerPos[0]},${customerPos[1]}&travelmode=driving`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 11, fontWeight: 800, color: '#fff', background: '#4285f4',
              padding: '2px 10px', borderRadius: 10, textDecoration: 'none',
            }}
          >
            Navigate ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// Customer tracking map — animated rider moving toward delivery location
export function CustomerTrackingMap({ order, stepIdx }) {
  const customerPos = getCustomerCoords(order?.address?.area);

  // Interpolate rider position from store → customer based on delivery step
  const progress = Math.min(stepIdx / 3, 0.95);
  const riderPos = [
    STORE[0] + (customerPos[0] - STORE[0]) * progress,
    STORE[1] + (customerPos[1] - STORE[1]) * progress,
  ];

  const bounds = L.latLngBounds([STORE, customerPos]).pad(0.3);

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        bounds={bounds}
        style={{ height: 200, width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapPanner center={riderPos} />
        <Marker position={STORE} icon={makeIcon('🏪', '#4DA167', 36)} />
        <Marker position={riderPos} icon={makeIcon('🛵', '#FF6B35', 40)} />
        <Marker position={customerPos} icon={makeIcon('🏠', '#1a1a1a', 36)} />
        <Polyline
          positions={[STORE, riderPos]}
          pathOptions={{ color: '#FF6B35', weight: 3, opacity: 0.9 }}
        />
        <Polyline
          positions={[riderPos, customerPos]}
          pathOptions={{ color: '#ccc', weight: 3, dashArray: '6 5', opacity: 0.7 }}
        />
      </MapContainer>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 999,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
        padding: '7px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>
          {stepIdx >= 2 ? '🛵 Rider is near you!' : '🏪 Order being prepared'}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#4DA167', background: '#f0fdf4', padding: '2px 8px', borderRadius: 10 }}>
          Live
        </span>
      </div>
    </div>
  );
}
