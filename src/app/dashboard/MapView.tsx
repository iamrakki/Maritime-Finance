'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Ship, Anchor, Navigation, MapPin } from 'lucide-react';

interface Ship {
  id: string;
  name: string;
  status: 'active' | 'parked' | 'maintenance';
  position: [number, number];
  speed: number;
  heading: number;
  destination: string;
  eta: string;
  voyageProgress: number;
}

interface MapViewProps {
  ships: Ship[];
  selectedShip: string | null;
}

// Shipping routes (major trade routes) - Fixed to follow proper maritime paths
const shippingRoutes = [
  {
    name: 'Singapore - Rotterdam (Suez Canal)',
    coords: [
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
      [43.5, -5.5],        // Strait of Gibraltar approach
      [45.0, -8.0],        // Atlantic approach
      [51.9, 4.4]          // Rotterdam
    ],
    color: '#00d4aa'
  },
  {
    name: 'Shanghai - Los Angeles (Trans-Pacific)',
    coords: [
      [31.2, 121.5],       // Shanghai
      [33.0, 135.0],       // East China Sea
      [35.0, 150.0],       // Northwest Pacific
      [37.0, 165.0],       // North Pacific
      [39.0, 180.0],       // Date Line
      [40.0, -175.0],      // Northeast Pacific
      [38.0, -155.0],      // Hawaiian approach
      [36.0, -140.0],      // Eastern Pacific
      [34.0, -125.0],      // California approach
      [33.7, -118.2]       // Los Angeles
    ],
    color: '#38bdf8'
  },
  {
    name: 'Hong Kong - Dubai (Strait of Malacca)',
    coords: [
      [22.3, 114.2],       // Hong Kong
      [18.0, 110.0],       // South China Sea
      [10.0, 105.0],       // Gulf of Thailand
      [5.0, 100.0],        // Strait of Malacca north
      [2.0, 98.0],         // Strait of Malacca
      [6.0, 92.0],         // Andaman Sea
      [10.0, 85.0],        // Bay of Bengal
      [12.0, 75.0],        // Arabian Sea
      [15.0, 65.0],        // Arabian Sea approach
      [20.0, 60.0],        // Gulf of Oman approach
      [25.2, 55.3]         // Dubai
    ],
    color: '#a78bfa'
  },
  {
    name: 'Busan - New York (Panama Canal)',
    coords: [
      [35.1, 129.0],       // Busan
      [30.0, 140.0],       // Northwest Pacific
      [25.0, 155.0],       // Western Pacific
      [20.0, 170.0],       // Central Pacific
      [15.0, -175.0],      // South Pacific
      [10.0, -150.0],      // Eastern Pacific
      [9.5, -80.0],        // Panama Canal approach
      [9.0, -79.5],        // Panama Canal
      [12.0, -78.0],       // Caribbean Sea
      [20.0, -75.0],       // Northwest Atlantic
      [30.0, -74.5],       // East Coast approach
      [40.7, -74.0]        // New York
    ],
    color: '#fbbf24'
  }
];

// Major ports
const majorPorts = [
  { name: 'Singapore', coords: [1.3521, 103.8198] },
  { name: 'Shanghai', coords: [31.2, 121.5] },
  { name: 'Rotterdam', coords: [51.9, 4.4] },
  { name: 'Los Angeles', coords: [33.7, -118.2] },
  { name: 'Dubai', coords: [25.2, 55.3] },
  { name: 'Hong Kong', coords: [22.3, 114.2] },
  { name: 'Busan', coords: [35.1, 129.0] },
  { name: 'New York', coords: [40.7, -74.0] },
];

// Simple icon creation using L.divIcon with inline HTML
function createShipMarkerIcon(status: Ship['status'], isSelected: boolean) {
  const color = status === 'active' ? '#00ffcc' : status === 'parked' ? '#38bdf8' : '#fbbf24';
  const size = isSelected ? 40 : 32;

  return L.divIcon({
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <div style="width: ${size - 8}px; height: ${size - 8}px; border-radius: 12px; background: linear-gradient(135deg, ${color}66, ${color}33); border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px ${color}99;">
          <svg width="${size - 16}" height="${size - 16}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
            <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
            <path d="M12 10v4"/>
          </svg>
        </div>
      </div>
    `,
    className: 'ship-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function createPortMarkerIcon() {
  return L.divIcon({
    html: `
      <div style="width: 24px; height: 24px; border-radius: 50%; background: rgba(30, 39, 54, 0.95); border: 2px solid #00d4aa; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(0, 212, 170, 0.5);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5">
          <rect x="6" y="4" width="12" height="18" rx="2"/>
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
        </svg>
      </div>
    `,
    className: 'port-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16]
  });
}

// Animated ship component with position updates
function AnimatedShip({ ship, isSelected }: { ship: Ship; isSelected: boolean }) {
  const map = useMap();
  const [position, setPosition] = useState<[number, number]>(ship.position);

  useEffect(() => {
    if (ship.status === 'active') {
      const interval = setInterval(() => {
        setPosition(prev => {
          // Simulate small movement
          const latDelta = (Math.random() - 0.5) * 0.005;
          const lngDelta = (Math.random() - 0.5) * 0.005;
          return [prev[0] + latDelta, prev[1] + lngDelta];
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [ship.status]);

  useEffect(() => {
    if (isSelected) {
      map.flyTo(position, 5, { duration: 1.5 });
    }
  }, [isSelected, position, map]);

  return (
    <Marker position={position} icon={createShipMarkerIcon(ship.status, isSelected)}>
      <Popup closeButton={false} className="ship-popup">
        <div className="card p-4 min-w-[280px] bg-maritime-navy border-rlusd-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              ship.status === 'active'
                ? 'bg-rlusd-primary/20 border-2 border-rlusd-glow'
                : 'bg-accent-sky/20 border-2 border-accent-sky'
            }`}>
              {ship.status === 'parked' ? (
                <Anchor className="w-6 h-6 text-accent-sky" />
              ) : (
                <Ship className="w-6 h-6 text-rlusd-glow" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{ship.name}</h3>
              <p className="text-xs text-text-muted uppercase tracking-wider">{ship.status}</p>
            </div>
          </div>

          {ship.status === 'active' && (
            <>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-maritime-slate/30">
                  <span className="text-xs text-text-muted flex items-center gap-1.5">
                    <Navigation className="w-3 h-3" />
                    Speed
                  </span>
                  <span className="text-sm font-mono text-rlusd-glow">{ship.speed} kts</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-maritime-slate/30">
                  <span className="text-xs text-text-muted flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    Heading
                  </span>
                  <span className="text-sm font-mono text-text-primary">{ship.heading}°</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-maritime-slate/30">
                  <span className="text-xs text-text-muted">Destination</span>
                  <span className="text-sm font-medium text-text-primary">{ship.destination}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-maritime-slate/30">
                  <span className="text-xs text-text-muted">ETA</span>
                  <span className="text-sm font-medium text-accent-sky">{ship.eta}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">Voyage Progress</span>
                  <span className="text-sm font-mono font-bold text-rlusd-glow">{ship.voyageProgress}%</span>
                </div>
                <div className="h-2 bg-maritime-slate/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rlusd-dim to-rlusd-glow rounded-full transition-all duration-1000"
                    style={{ width: `${ship.voyageProgress}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {ship.status === 'parked' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-sky/10 border border-accent-sky/20">
              <Anchor className="w-5 h-5 text-accent-sky" />
              <div>
                <p className="text-sm text-accent-sky font-medium">Docked</p>
                <p className="text-xs text-text-muted">{ship.destination} Port</p>
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView({ ships, selectedShip }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-maritime-deeper">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-rlusd-primary/20 border-t-rlusd-primary rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading navigational charts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[20, 50]}
        zoom={3}
        className="h-full w-full"
        zoomControl={true}
        worldCopyJump={true}
        maxBounds={[[-90, -Infinity], [90, Infinity]]}
        maxBoundsViscosity={0.5}
        style={{ background: '#060a0f' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          noWrap={false}
        />

        {/* Shipping Routes */}
        {shippingRoutes.map((route, index) => (
          <Polyline
            key={`route-${index}`}
            positions={route.coords as [number, number][]}
            pathOptions={{
              color: route.color,
              weight: 2,
              opacity: 0.6,
              dashArray: '10, 10',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          >
            <Popup>
              <div className="text-sm font-medium text-text-primary p-2">{route.name}</div>
            </Popup>
          </Polyline>
        ))}

        {/* Major Ports */}
        {majorPorts.map((port, index) => (
          <Marker
            key={`port-${index}`}
            position={port.coords as [number, number]}
            icon={createPortMarkerIcon()}
          >
            <Popup closeButton={false}>
              <div className="card p-3 bg-maritime-navy border-rlusd-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-rlusd-primary/20 flex items-center justify-center">
                    <Anchor className="w-4 h-4 text-rlusd-glow" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm">{port.name}</h4>
                    <p className="text-xs text-text-muted">Major Port</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Ships */}
        {ships.map((ship) => (
          <AnimatedShip
            key={ship.id}
            ship={ship}
            isSelected={selectedShip === ship.id}
          />
        ))}
      </MapContainer>

      {/* Compass Rose Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="w-20 h-20 relative opacity-30">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#00d4aa" strokeWidth="1" opacity="0.3" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="#00d4aa" strokeWidth="0.5" opacity="0.2" />
            <line x1="50" y1="5" x2="50" y2="20" stroke="#00ffcc" strokeWidth="2" />
            <line x1="50" y1="80" x2="50" y2="95" stroke="#00d4aa" strokeWidth="1.5" />
            <line x1="5" y1="50" x2="20" y2="50" stroke="#00d4aa" strokeWidth="1.5" />
            <line x1="80" y1="50" x2="95" y2="50" stroke="#00d4aa" strokeWidth="1.5" />
            <text x="50" y="15" textAnchor="middle" fill="#00ffcc" fontSize="12" fontWeight="bold">N</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
