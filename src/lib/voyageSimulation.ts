/**
 * Voyage Simulation Logic
 *
 * Simulates real-time voyage progress, AIS data, and milestone verification
 * for demonstration purposes.
 */

import { Voyage, Milestone, AISData, STORAGE_KEYS } from '@/types/voyage';

/**
 * Calculate the Haversine distance between two coordinates
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in nautical miles
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing (heading) from one point to another
 * @returns Bearing in degrees (0-360)
 */
function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Interpolate position along a route based on progress percentage
 */
function interpolatePosition(
  route: [number, number][],
  progress: number
): {
  position: [number, number];
  heading: number;
  segmentIndex: number;
} {
  if (route.length < 2) {
    return { position: route[0], heading: 0, segmentIndex: 0 };
  }

  // Calculate total distance of route
  let totalDistance = 0;
  const segmentDistances: number[] = [];

  for (let i = 0; i < route.length - 1; i++) {
    const dist = haversineDistance(
      route[i][0],
      route[i][1],
      route[i + 1][0],
      route[i + 1][1]
    );
    segmentDistances.push(dist);
    totalDistance += dist;
  }

  // Find target distance based on progress
  const targetDistance = (progress / 100) * totalDistance;

  // Find which segment we're in
  let accumulatedDistance = 0;
  let segmentIndex = 0;

  for (let i = 0; i < segmentDistances.length; i++) {
    if (accumulatedDistance + segmentDistances[i] >= targetDistance) {
      segmentIndex = i;
      break;
    }
    accumulatedDistance += segmentDistances[i];
  }

  // Interpolate within the segment
  const segmentProgress =
    (targetDistance - accumulatedDistance) / segmentDistances[segmentIndex];

  const lat =
    route[segmentIndex][0] +
    (route[segmentIndex + 1][0] - route[segmentIndex][0]) * segmentProgress;
  const lon =
    route[segmentIndex][1] +
    (route[segmentIndex + 1][1] - route[segmentIndex][1]) * segmentProgress;

  const heading = calculateBearing(
    route[segmentIndex][0],
    route[segmentIndex][1],
    route[segmentIndex + 1][0],
    route[segmentIndex + 1][1]
  );

  return {
    position: [lat, lon],
    heading: Math.round(heading),
    segmentIndex,
  };
}

/**
 * Generate realistic AIS data for current position
 */
function generateAISData(
  position: [number, number],
  heading: number,
  vesselType: string = 'container'
): AISData {
  // Base speed ranges by vessel type (knots)
  const speedRanges: Record<string, { min: number; max: number }> = {
    container: { min: 18, max: 24 },
    tanker: { min: 12, max: 16 },
    bulk: { min: 12, max: 15 },
    default: { min: 14, max: 20 },
  };

  const range = speedRanges[vesselType] || speedRanges.default;
  const speed =
    range.min + Math.random() * (range.max - range.min) + (Math.random() - 0.5) * 2;

  return {
    position,
    speed: Math.round(speed * 10) / 10,
    heading,
    timestamp: new Date().toISOString(),
    mmsi: `${Math.floor(200000000 + Math.random() * 100000000)}`,
    navigationStatus: 'Under way using engine',
  };
}

/**
 * Check if ship position is near a milestone
 */
function isNearMilestone(
  shipPosition: [number, number],
  milestonePosition: [number, number],
  threshold: number = 50 // nautical miles
): boolean {
  const distance = haversineDistance(
    shipPosition[0],
    shipPosition[1],
    milestonePosition[0],
    milestonePosition[1]
  );
  return distance < threshold;
}

/**
 * Update voyage progress simulation
 * Call this function every 5 seconds for active voyages
 */
export function updateVoyageProgress(voyageId: string): Voyage | null {
  const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(voyageId));
  if (!voyageData) return null;

  const voyage: Voyage = JSON.parse(voyageData);

  // Only update if simulation is active
  if (!voyage.simulationActive) return voyage;

  // Increment progress (0.5% every 5 seconds = full voyage in ~17 minutes)
  const progressIncrement = 0.5;
  let newProgress = Math.min(100, voyage.currentProgress + progressIncrement);

  // Calculate new position
  const { position, heading } = interpolatePosition(
    voyage.routeCoordinates,
    newProgress
  );

  // Generate AIS data
  const aisData = generateAISData(position, heading, voyage.vesselType);

  // Update voyage object
  const updatedVoyage: Voyage = {
    ...voyage,
    currentProgress: newProgress,
    currentPosition: position,
    currentHeading: heading,
    currentSpeed: aisData.speed,
    currentAIS: aisData,
    lastAISUpdate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Check if voyage is complete
  if (newProgress >= 100) {
    updatedVoyage.status = 'completed';
    updatedVoyage.simulationActive = false;
    updatedVoyage.actualArrival = new Date().toISOString();
  }

  // Check milestones
  updatedVoyage.milestones = updatedVoyage.milestones.map((milestone) => {
    // Skip if already verified or not requiring verification
    if (milestone.status === 'verified' || !milestone.requiresVerification) {
      return milestone;
    }

    // Check percentage-based milestones (route segments)
    if (milestone.progressPercentage !== undefined) {
      if (
        newProgress >= milestone.progressPercentage &&
        milestone.status === 'pending'
      ) {
        return {
          ...milestone,
          status: 'awaiting_verification' as const,
          aisSnapshot: aisData,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // Check location-based milestones
    if (milestone.coordinates) {
      if (isNearMilestone(position, milestone.coordinates, 30)) {
        if (milestone.status === 'pending') {
          return {
            ...milestone,
            status: 'awaiting_verification' as const,
            aisSnapshot: aisData,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    }

    return milestone;
  });

  // Update milestone counts
  updatedVoyage.milestonesCompleted = updatedVoyage.milestones.filter(
    (m) => m.status === 'verified'
  ).length;

  // Save updated voyage
  localStorage.setItem(STORAGE_KEYS.voyage(voyageId), JSON.stringify(updatedVoyage));

  return updatedVoyage;
}

/**
 * Start simulation for a voyage
 */
export function startSimulation(voyageId: string): boolean {
  const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(voyageId));
  if (!voyageData) return false;

  const voyage: Voyage = JSON.parse(voyageData);
  voyage.simulationActive = true;
  voyage.status = 'in_progress';

  if (!voyage.actualDeparture) {
    voyage.actualDeparture = new Date().toISOString();
  }

  localStorage.setItem(STORAGE_KEYS.voyage(voyageId), JSON.stringify(voyage));
  return true;
}

/**
 * Stop simulation for a voyage
 */
export function stopSimulation(voyageId: string): boolean {
  const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(voyageId));
  if (!voyageData) return false;

  const voyage: Voyage = JSON.parse(voyageData);
  voyage.simulationActive = false;

  localStorage.setItem(STORAGE_KEYS.voyage(voyageId), JSON.stringify(voyage));
  return true;
}

/**
 * Platform auto-verification (demo mode)
 * Automatically verifies milestones that have been awaiting verification for > 10 seconds
 */
export function runPlatformAutoVerification(): void {
  // Get all voyages
  const voyageList: string[] = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.voyageList) || '[]'
  );

  voyageList.forEach((voyageId) => {
    const voyageData = localStorage.getItem(STORAGE_KEYS.voyage(voyageId));
    if (!voyageData) return;

    const voyage: Voyage = JSON.parse(voyageData);
    let updated = false;

    // Check each milestone
    voyage.milestones = voyage.milestones.map((milestone) => {
      if (milestone.status === 'awaiting_verification') {
        // Check how long it's been awaiting
        const waitTime =
          new Date().getTime() - new Date(milestone.updatedAt).getTime();

        // Auto-verify after 10 seconds (for demo)
        if (waitTime > 10000) {
          updated = true;

          // Create platform attestation
          const attestation = {
            id: `attestation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            milestoneId: milestone.id,
            voyageId: voyage.id,
            verifierId: 'platform-auto',
            verifierName: 'Platform Auto-Verification',
            verifierType: 'automated' as const,
            timestamp: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
            evidenceType: 'ais_data' as const,
            aisData: milestone.aisSnapshot,
            documents: [],
            platformVerified: true,
            platformTimestamp: new Date().toISOString(),
            signedHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            status: 'confirmed' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Save attestation
          localStorage.setItem(
            STORAGE_KEYS.attestation(attestation.id),
            JSON.stringify(attestation)
          );

          return {
            ...milestone,
            status: 'verified' as const,
            attestationId: attestation.id,
            verifiedAt: new Date().toISOString(),
            verifiedBy: 'Platform Auto-Verification',
            updatedAt: new Date().toISOString(),
          };
        }
      }

      return milestone;
    });

    if (updated) {
      // Update milestone counts
      voyage.milestonesCompleted = voyage.milestones.filter(
        (m) => m.status === 'verified'
      ).length;
      voyage.updatedAt = new Date().toISOString();

      localStorage.setItem(STORAGE_KEYS.voyage(voyageId), JSON.stringify(voyage));
    }
  });
}

/**
 * Master simulation loop
 * Call this every 5 seconds to update all active voyages
 */
export function runSimulationLoop(): void {
  // Get all voyages
  const voyageList: string[] = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.voyageList) || '[]'
  );

  // Update each active voyage
  voyageList.forEach((voyageId) => {
    updateVoyageProgress(voyageId);
  });

  // Run platform auto-verification
  runPlatformAutoVerification();
}
