import type { LonLatCoordinate } from '@shared/types/mission.types';

export interface AircraftTrack {
  id: string;
  callsign: string;
  role: 'lead' | 'wing';
  orbitCenter: LonLatCoordinate;
  radiusLon: number;
  radiusLat: number;
  angleRad: number;
  angularVelocityRadPerSec: number;
  altitudeFt: number;
  color: string;
}

export interface AircraftSnapshot {
  id: string;
  callsign: string;
  role: 'lead' | 'wing';
  coordinate: LonLatCoordinate;
  headingRad: number;
  speedKnots: number;
  altitudeFt: number;
  color: string;
  isFocused: boolean;
}

export interface AircraftLinkSnapshot {
  id: string;
  fromAircraftId: string;
  toAircraftId: string;
  path: LonLatCoordinate[];
}

export function createAircraftFleet(): AircraftTrack[] {
  return [
    {
      id: 'aircraft-lead',
      callsign: 'Falcon Lead',
      role: 'lead',
      orbitCenter: [35.02, 31.72],
      radiusLon: 0.34,
      radiusLat: 0.19,
      angleRad: 0.15,
      angularVelocityRadPerSec: 0.12,
      altitudeFt: 28700,
      color: '#f59e0b',
    },
    {
      id: 'aircraft-wing-1',
      callsign: 'Falcon Two',
      role: 'wing',
      orbitCenter: [34.96, 31.58],
      radiusLon: 0.29,
      radiusLat: 0.17,
      angleRad: 2.25,
      angularVelocityRadPerSec: 0.1,
      altitudeFt: 24100,
      color: '#0ea5e9',
    },
    {
      id: 'aircraft-wing-2',
      callsign: 'Falcon Three',
      role: 'wing',
      orbitCenter: [35.18, 31.45],
      radiusLon: 0.26,
      radiusLat: 0.14,
      angleRad: 4.1,
      angularVelocityRadPerSec: 0.115,
      altitudeFt: 25450,
      color: '#22c55e',
    },
    {
      id: 'aircraft-wing-3',
      callsign: 'Falcon Four',
      role: 'wing',
      orbitCenter: [35.08, 31.3],
      radiusLon: 0.31,
      radiusLat: 0.16,
      angleRad: 5.45,
      angularVelocityRadPerSec: 0.105,
      altitudeFt: 26320,
      color: '#ef4444',
    },
  ];
}

export function advanceAircraftFleet(
  fleet: AircraftTrack[],
  deltaSeconds: number,
): AircraftTrack[] {
  return fleet.map((aircraft) => ({
    ...aircraft,
    angleRad: normalizeAngle(
      aircraft.angleRad + aircraft.angularVelocityRadPerSec * deltaSeconds,
    ),
  }));
}

export function projectAircraftFleet(
  fleet: AircraftTrack[],
  focusedAircraftId: string | null,
): AircraftSnapshot[] {
  return fleet.map((aircraft) => {
    const coordinate = getAircraftCoordinate(aircraft);
    const speedKnots = getAircraftSpeedKnots(aircraft, coordinate[1]);

    return {
      id: aircraft.id,
      callsign: aircraft.callsign,
      role: aircraft.role,
      coordinate,
      headingRad: getAircraftHeadingRad(aircraft),
      speedKnots,
      altitudeFt: aircraft.altitudeFt,
      color: aircraft.color,
      isFocused: aircraft.id === focusedAircraftId,
    };
  });
}

export function createAircraftLink(
  fleet: AircraftSnapshot[],
  focusedAircraftId: string | null,
): AircraftLinkSnapshot | null {
  if (!focusedAircraftId) {
    return null;
  }

  const leadAircraft = fleet.find((aircraft) => aircraft.role === 'lead') ?? null;
  const focusedAircraft = fleet.find((aircraft) => aircraft.id === focusedAircraftId) ?? null;
  if (!leadAircraft || !focusedAircraft || focusedAircraft.role === 'lead') {
    return null;
  }

  return {
    id: `${leadAircraft.id}-link-${focusedAircraft.id}`,
    fromAircraftId: leadAircraft.id,
    toAircraftId: focusedAircraft.id,
    path: [leadAircraft.coordinate, focusedAircraft.coordinate],
  };
}

function getAircraftCoordinate(aircraft: AircraftTrack): LonLatCoordinate {
  return [
    aircraft.orbitCenter[0] + Math.cos(aircraft.angleRad) * aircraft.radiusLon,
    aircraft.orbitCenter[1] + Math.sin(aircraft.angleRad) * aircraft.radiusLat,
  ];
}

function getAircraftHeadingRad(aircraft: AircraftTrack): number {
  const deltaLon =
    -Math.sin(aircraft.angleRad) *
    aircraft.radiusLon *
    aircraft.angularVelocityRadPerSec;
  const deltaLat =
    Math.cos(aircraft.angleRad) *
    aircraft.radiusLat *
    aircraft.angularVelocityRadPerSec;

  return Math.atan2(deltaLon, deltaLat);
}

function getAircraftSpeedKnots(aircraft: AircraftTrack, latitude: number): number {
  const lonKm =
    -Math.sin(aircraft.angleRad) *
    aircraft.radiusLon *
    aircraft.angularVelocityRadPerSec *
    111.32 *
    Math.cos((latitude * Math.PI) / 180);
  const latKm =
    Math.cos(aircraft.angleRad) *
    aircraft.radiusLat *
    aircraft.angularVelocityRadPerSec *
    110.57;
  const kmPerHour = Math.sqrt(lonKm ** 2 + latKm ** 2) * 3600;
  return Math.round(kmPerHour / 1.852);
}

function normalizeAngle(angleRad: number): number {
  const fullTurn = Math.PI * 2;
  return ((angleRad % fullTurn) + fullTurn) % fullTurn;
}
