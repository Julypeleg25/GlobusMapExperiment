import type { AircraftSnapshot } from '../model/airTraffic';

interface AirTrafficHudProps {
  aircraft: AircraftSnapshot | null;
  mainAircraft: AircraftSnapshot | null;
  onClear: () => void;
}

export function AirTrafficHud({ aircraft, mainAircraft, onClear }: AirTrafficHudProps) {
  if (!aircraft) {
    return null;
  }

  const linkedToLead = mainAircraft && aircraft.role !== 'lead' ? mainAircraft.callsign : null;

  return (
    <div className="air-traffic-hud">
      <div className="air-traffic-header">
        <div>
          <strong>{aircraft.callsign}</strong>
          <span>{aircraft.role === 'lead' ? 'Lead aircraft' : 'Supporting aircraft'}</span>
        </div>
        <button type="button" className="menu-close-button" onClick={onClear}>
          X
        </button>
      </div>
      <div className="air-traffic-grid">
        <div>
          <span>Speed</span>
          <strong>{aircraft.speedKnots} kt</strong>
        </div>
        <div>
          <span>Altitude</span>
          <strong>{aircraft.altitudeFt.toLocaleString()} ft</strong>
        </div>
        <div>
          <span>Latitude</span>
          <strong>{aircraft.coordinate[1].toFixed(4)}</strong>
        </div>
        <div>
          <span>Longitude</span>
          <strong>{aircraft.coordinate[0].toFixed(4)}</strong>
        </div>
      </div>
      <p className="air-traffic-copy">
        {linkedToLead
          ? `Linked in real time to ${linkedToLead}. Clicking other planes updates the live intercept line.`
          : 'Primary aircraft. Click any escort plane to draw a live link and inspect its speed data.'}
      </p>
    </div>
  );
}
