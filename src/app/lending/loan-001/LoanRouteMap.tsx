'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Singapore → Rotterdam route (17 waypoints from MapView.tsx)
const singaporeRotterdamRoute: [number, number][] = [
  [1.3521, 103.8198],  // Singapore
  [6.0, 95.0],         // Strait of Malacca
  [8.0, 88.0],         // Bay of Bengal
  [10.0, 77.0],        // Arabian Sea approach
  [12.6, 43.3],        // Bab el Mandeb
  [15.0, 42.0],        // Red Sea
  [27.0, 34.0],        // Gulf of Suez
  [30.5, 32.3],        // Suez Canal
  [31.5, 31.0],        // Port Said
  [35.0, 25.0],        // Eastern Mediterranean
  [37.0, 15.0],        // Central Mediterranean
  [38.0, 10.0],        // Strait of Sicily
  [40.0, 5.0],         // Western Mediterranean
  [43.5, -5.5],        // Strait of Gibraltar
  [45.0, -8.0],        // Atlantic approach
  [51.9, 4.4]          // Rotterdam
];

// Port icons
const createPortIcon = (color: string) => L.divIcon({
  html: `<div style="width: 12px; height: 12px; border-radius: 50%;
                     background: ${color}; border: 2px solid white;
                     box-shadow: 0 0 10px ${color}66;"></div>`,
  className: '',
  iconSize: [12, 12]
});

export default function LoanRouteMap() {
  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-white/5">
      <MapContainer
        center={[25, 45]}  // Center on route midpoint
        zoom={3}
        zoomControl={false}  // No zoom controls for static view
        dragging={false}     // No dragging
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        className="h-full w-full"
        style={{ background: '#060a0f' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* Main route line */}
        <Polyline
          positions={singaporeRotterdamRoute}
          pathOptions={{
            color: '#00d4aa',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 10'
          }}
        />

        {/* Origin: Singapore */}
        <Marker position={[1.3521, 103.8198]} icon={createPortIcon('#00ffcc')}>
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">Singapore</p>
              <p className="text-text-muted">Origin Port</p>
            </div>
          </Popup>
        </Marker>

        {/* Destination: Rotterdam */}
        <Marker position={[51.9, 4.4]} icon={createPortIcon('#38bdf8')}>
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">Rotterdam</p>
              <p className="text-text-muted">Destination Port</p>
            </div>
          </Popup>
        </Marker>

        {/* Key waypoint: Suez Canal */}
        <Marker position={[30.5, 32.3]} icon={createPortIcon('#a78bfa')}>
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">Suez Canal</p>
              <p className="text-text-muted">Critical Waypoint</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
