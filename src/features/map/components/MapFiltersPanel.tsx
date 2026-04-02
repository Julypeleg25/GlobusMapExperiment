import { missionCategories, missionStatuses } from '@shared/types/mission.types';
import { useMapFilters } from '../hooks/useMapFilters';
import { useSelectedEntity } from '../hooks/useSelectedEntity';
import type { MissionEntityCollection } from '../model/missionEntityCollection';

interface MapFiltersPanelProps {
  entityCollection: MissionEntityCollection;
  isLoading: boolean;
}

export function MapFiltersPanel({
  entityCollection,
  isLoading,
}: MapFiltersPanelProps) {
  const {
    category,
    status,
    minPriority,
    showLabels,
    setCategory,
    setStatus,
    setMinPriority,
    setShowLabels,
  } = useMapFilters();
  const { selectedEntityId, setSelectedEntityId } = useSelectedEntity();
  const selectedEntity = selectedEntityId
    ? entityCollection.entityLookup[selectedEntityId] ?? null
    : null;

  return (
    <aside className="map-sidebar">
      <div className="sidebar-block">
        <p className="eyebrow">Operations View</p>
        <h1>Mission map</h1>
        <p className="muted">
          Stable MapLibre camera with deck.gl layers for circles, routes, polygons,
          labels, and selection highlights.
        </p>
      </div>

      <div className="sidebar-block sidebar-stats">
        <div>
          <span className="stat-value">{entityCollection.circleEntities.length}</span>
          <span className="stat-label">bulk circles</span>
        </div>
        <div>
          <span className="stat-value">{entityCollection.standardEntities.length}</span>
          <span className="stat-label">vector entities</span>
        </div>
      </div>

      <div className="sidebar-block">
        <div className="section-title-row">
          <h2>Filters</h2>
          {isLoading ? <span className="loading-pill">Refreshing</span> : null}
        </div>

        <label className="field">
          <span>Category</span>
          <select
            value={category ?? ''}
            onChange={(event) => setCategory(event.target.value || null)}
          >
            <option value="">All categories</option>
            {missionCategories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Status</span>
          <select
            value={status ?? ''}
            onChange={(event) => setStatus(event.target.value || null)}
          >
            <option value="">All statuses</option>
            {missionStatuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Minimum priority: {minPriority}</span>
          <input
            type="range"
            min="0"
            max="5"
            value={minPriority}
            onChange={(event) => setMinPriority(Number(event.target.value))}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(event) => setShowLabels(event.target.checked)}
          />
          <span>Show label layer from zoom 9+</span>
        </label>
      </div>

      <div className="sidebar-block">
        <div className="section-title-row">
          <h2>Selection</h2>
          {selectedEntity ? (
            <button type="button" className="ghost-button" onClick={() => setSelectedEntityId(null)}>
              Clear
            </button>
          ) : null}
        </div>

        {selectedEntity ? (
          <div className="selection-card">
            <strong>{selectedEntity.label}</strong>
            <span>{selectedEntity.type}</span>
            <span>
              {selectedEntity.category} / {selectedEntity.status}
            </span>
            <span>Priority {selectedEntity.priority}</span>
            <span>Selection highlight is active</span>
          </div>
        ) : (
          <p className="muted">
            Click a rendered feature to inspect it, or use the plonter menu when several
            entities overlap.
          </p>
        )}
      </div>
    </aside>
  );
}
