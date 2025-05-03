'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Voyage, Milestone } from '@/types/voyage';

// Fix Leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VoyageMapProps {
  voyage: Voyage;
}

// Custom ship icon
const createShipIcon = (isActive: boolean) => {
  return L.divIcon({
    html: `
      <div style="position: relative;">
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #00d4aa 0%, #00ffcc 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(0, 212, 170, ${isActive ? '0.6' : '0.3'});
          border: 2px solid rgba(0, 255, 204, ${isActive ? '0.8' : '0.4'});
          ${isActive ? 'animation: pulse 2s ease-in-out infinite;' : ''}
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0e14" stroke-width="2">
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"></path>
            <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"></path>
            <path d="M12 10v4"></path>
            <path d="M12 2v3"></path>
          </svg>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      </style>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Custom milestone icon
const createMilestoneIcon = (status: Milestone['status']) => {
  const colors = {
    verified: '#00d4aa',
    awaiting_verification: '#fbbf24',
    in_progress: '#38bdf8',
    pending: '#64748b',
    disputed: '#f87171',
  };

  const color = colors[status] || colors.pending;

  return L.divIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 0 15px ${color}80;
      "></div>
    `,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Port icon
const createPortIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: #38bdf8;
        border-radius: 50%;
        border: 3px solid rgba(56, 189, 248, 0.3);
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0e14" stroke-width="2.5">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

// Auto-fit bounds component
function AutoFitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  return null;
}

export default function VoyageMap({ voyage }: VoyageMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Calculate bounds to fit entire route
  const bounds: L.LatLngBoundsExpression = voyage.routeCoordinates.map((coord) => [coord[0], coord[1]] as [number, number]);

  // Current position or start position
  const shipPosition = voyage.currentPosition || voyage.origin.coordinates;

  return (
    <div className="w-full h-full">
      <MapContainer
        center={shipPosition as [number, number]}
        zoom={5}
        style={{ width: '100%', height: '100%', background: '#060a0f' }}
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <AutoFitBounds bounds={bounds} />

        {/* Route Polyline */}
        <Polyline
          positions={voyage.routeCoordinates.map((coord) => [coord[0], coord[1]] as [number, number])}
          pathOptions={{
            color: '#00d4aa',
            weight: 3,
            opacity: 0.6,
            dashArray: '10, 10',
          }}
        />

        {/* Origin Port */}
        <Marker
          position={voyage.origin.coordinates as [number, number]}
          icon={createPortIcon()}
        >
          <Popup>
            <div className="font-mono text-sm">
              <p className="font-bold text-accent-sky">{voyage.origin.name}</p>
              <p className="text-xs text-text-muted">Origin Port</p>
              <p className="text-xs mt-1">
                Departure: {new Date(voyage.scheduledDeparture).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Port */}
        <Marker
          position={voyage.destination.coordinates as [number, number]}
          icon={createPortIcon()}
        >
          <Popup>
            <div className="font-mono text-sm">
              <p className="font-bold text-accent-sky">{voyage.destination.name}</p>
              <p className="text-xs text-text-muted">Destination Port</p>
              <p className="text-xs mt-1">
                ETA: {new Date(voyage.estimatedArrival).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Milestones */}
        {voyage.milestones
          .filter((m) => m.coordinates)
          .map((milestone) => (
            <Marker
              key={milestone.id}
              position={milestone.coordinates as [number, number]}
              icon={createMilestoneIcon(milestone.status)}
            >
              <Popup>
                <div className="font-mono text-sm">
                  <p className="font-bold">{milestone.name}</p>
                  <p className="text-xs text-text-muted mt-1">
                    Status: {milestone.status.replace('_', ' ')}
                  </p>
                  {milestone.progressPercentage !== undefined && (
                    <p className="text-xs">Progress: {milestone.progressPercentage}%</p>
                  )}
                  {milestone.verifiedAt && (
                    <p className="text-xs text-rlusd-glow mt-1">
                      ✓ Verified {new Date(milestone.verifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Current Ship Position */}
        {voyage.status === 'in_progress' && (
          <Marker
            position={shipPosition as [number, number]}
            icon={createShipIcon(voyage.simulationActive || false)}
          >
            <Popup>
              <div className="font-mono text-sm">
                <p className="font-bold text-rlusd-glow">{voyage.vesselName}</p>
                <p className="text-xs text-text-muted">{voyage.voyageNumber}</p>
                <p className="text-xs mt-2">Progress: {voyage.currentProgress}%</p>
                {voyage.currentSpeed && (
                  <p className="text-xs">Speed: {voyage.currentSpeed.toFixed(1)} knots</p>
                )}
                {voyage.currentHeading !== undefined && (
                  <p className="text-xs">Heading: {voyage.currentHeading}°</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
