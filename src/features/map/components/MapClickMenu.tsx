import { useEffect, useMemo, useState } from 'react';
import type { FeatureLike } from 'ol/Feature';
import type OlMap from 'ol/Map';
import type MapBrowserEvent from 'ol/MapBrowserEvent';
import { unByKey } from 'ol/Observable';
import type { Pixel } from 'ol/pixel';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useSelectedEntity } from '../hooks/useSelectedEntity';
import type {
  LonLatCoordinate,
  MissionEntityDto,
  MissionEntityType,
  RouteEntityDto,
} from '@shared/types/mission.types';
import type { MenuOverlayApi } from '../map/menuOverlay';
import type { EditHandleDatum } from '../model/entityEditing';

interface MapClickMenuProps {
  map: OlMap | null;
  menu: MenuOverlayApi;
  onPlaneClick?: (pixel: Pixel) => boolean;
  entities: MissionEntityDto[];
  editingEntityId: string | null;
  onBeginEdit: (entityId: string) => void;
  onEndEdit: () => void;
  onUpdateLabel: (entityId: string, label: string) => void;
  onUpdatePrimaryColor: (entityId: string, color: string) => void;
  onUpdatePolygonFillColor: (entityId: string, color: string) => void;
  onUpdateCircleRadius: (entityId: string, radius: number) => void;
  onUpdateDoubleCircleRadii: (
    entityId: string,
    innerRadius: number,
    outerRadius: number,
  ) => void;
  onPinEntity: (entityId: string, coordinate: LonLatCoordinate) => void;
  onAddVertex: (entityId: string, coordinate: LonLatCoordinate) => void;
  onInsertVertexAtHandle: (handle: EditHandleDatum) => void;
  onCreateEntity: (entityType: MissionEntityType, coordinate: LonLatCoordinate) => string;
}

type ClickMenuState =
  | { kind: 'closed' }
  | { kind: 'create'; coordinate: LonLatCoordinate }
  | { kind: 'single'; entityId: string; coordinate: LonLatCoordinate }
  | {
      kind: 'plonter';
      entityIds: string[];
      source: 'left' | 'right';
      coordinate: LonLatCoordinate;
    }
  | {
      kind: 'editing';
      entityId: string;
      coordinate: LonLatCoordinate;
    };

interface RouteVertexDatum {
  entity: RouteEntityDto;
}

export function MapClickMenu({
  map,
  menu,
  onPlaneClick,
  entities,
  editingEntityId,
  onBeginEdit,
  onEndEdit,
  onUpdateLabel,
  onUpdatePrimaryColor,
  onUpdatePolygonFillColor,
  onUpdateCircleRadius,
  onUpdateDoubleCircleRadii,
  onPinEntity,
  onAddVertex,
  onInsertVertexAtHandle,
  onCreateEntity,
}: MapClickMenuProps) {
  const { setSelectedEntityId } = useSelectedEntity();
  const [menuState, setMenuState] = useState<ClickMenuState>({ kind: 'closed' });
  const entityLookup = useMemo(
    () => new Map(entities.map((entity) => [entity.id, entity])),
    [entities],
  );
  const editingEntity =
    editingEntityId != null ? entityLookup.get(editingEntityId) ?? null : null;

  useEffect(() => {
    if (menuState.kind !== 'editing') {
      return;
    }

    if (editingEntityId !== menuState.entityId) {
      setMenuState({
        kind: 'single',
        entityId: menuState.entityId,
        coordinate: menuState.coordinate,
      });
    }
  }, [editingEntityId, menuState]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const hideMenu = () => {
      setMenuState({ kind: 'closed' });
      menu.hide();
    };

    const showSingleEntity = (entity: MissionEntityDto, coordinate: LonLatCoordinate) => {
      onEndEdit();
      setSelectedEntityId(entity.id);
      setMenuState({ kind: 'single', entityId: entity.id, coordinate });
    };

    const openEditing = (entity: MissionEntityDto, coordinate: LonLatCoordinate) => {
      setSelectedEntityId(entity.id);
      onBeginEdit(entity.id);
      setMenuState({ kind: 'editing', entityId: entity.id, coordinate });
    };

      const handleLeftClick = (event: MapBrowserEvent<PointerEvent>) => {
      const coordinate = toLonLat(event.coordinate) as LonLatCoordinate;

      if (onPlaneClick?.(event.pixel)) {
        setMenuState({ kind: 'closed' });
        menu.hide();
        return;
      }

      if (menuState.kind === 'editing' && editingEntity) {
        const clickedHandle = getEditHandleAtPixel(map, event.pixel, editingEntity);

        if (clickedHandle?.kind === 'midpoint') {
          onInsertVertexAtHandle(clickedHandle);
          setSelectedEntityId(null);
          menu.showAt(clickedHandle.position);
          setMenuState((currentState) =>
            currentState.kind === 'editing'
              ? { ...currentState, coordinate: clickedHandle.position }
              : currentState,
          );
          return;
        }

        if (editingEntity.type === 'route' || editingEntity.type === 'polygon') {
          if (clickedHandle) {
            return;
          }

          onAddVertex(editingEntity.id, coordinate);
        } else if (editingEntity.type === 'circle' || editingEntity.type === 'point') {
          onPinEntity(editingEntity.id, coordinate);
        } else {
          return;
        }

        setSelectedEntityId(null);
        menu.showAt(coordinate);
        setMenuState((currentState) =>
          currentState.kind === 'editing'
            ? { ...currentState, coordinate }
            : currentState,
        );
        return;
      }

      const clickedEntities = getClickedEntities(map, event.pixel, entityLookup);

      if (!clickedEntities.length) {
        if (menuState.kind === 'single') {
          setSelectedEntityId(null);
          setMenuState({ kind: 'closed' });
          menu.hide();
        }
        return;
      }

      menu.showAt(coordinate);

      if (clickedEntities.length === 1) {
        showSingleEntity(clickedEntities[0], coordinate);
      } else {
        onEndEdit();
        setSelectedEntityId(null);
        setMenuState({
          kind: 'plonter',
          entityIds: clickedEntities.map((entity) => entity.id),
          source: 'left',
          coordinate,
        });
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      const pixel = map.getEventPixel(event);
      const coordinate = toLonLat(map.getEventCoordinate(event)) as LonLatCoordinate;
      const clickedEntities = getClickedEntities(map, pixel, entityLookup);

      if (!clickedEntities.length) {
        if (menuState.kind !== 'editing') {
          menu.showAt(coordinate);
          setSelectedEntityId(null);
          setMenuState({ kind: 'create', coordinate });
        }
        return;
      }

      menu.showAt(coordinate);

      if (clickedEntities.length === 1) {
        openEditing(clickedEntities[0], coordinate);
      } else {
        setSelectedEntityId(null);
        setMenuState({
          kind: 'plonter',
          entityIds: clickedEntities.map((entity) => entity.id),
          source: 'right',
          coordinate,
        });
      }
    };

    const viewport = map.getViewport();
    const singleClickKey = map.on('singleclick', handleLeftClick as never);
    viewport.addEventListener('contextmenu', handleContextMenu);

    return () => {
      unByKey(singleClickKey);
      viewport.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    editingEntity,
    entityLookup,
    map,
    menu,
    menuState.kind,
    onPlaneClick,
    onAddVertex,
    onBeginEdit,
    onEndEdit,
    onPinEntity,
    onInsertVertexAtHandle,
    setSelectedEntityId,
  ]);

  if (
    !map ||
    !menu.state.isOpen ||
    !menu.state.screenPosition ||
    menuState.kind === 'closed'
  ) {
    return null;
  }

  const closeMenu = () => {
    onEndEdit();
    setMenuState({ kind: 'closed' });
    menu.hide();
  };

  const focusOnEntity = (entity: MissionEntityDto) => {
    const view = map.getView();
    view.animate({
      center: fromLonLat([entity.lon, entity.lat]),
      zoom: Math.max(view.getZoom() ?? 0, 13),
      duration: 320,
    });
  };

  const openEditFromSingle = (entity: MissionEntityDto) => {
    if (menuState.kind !== 'single') {
      return;
    }

    const coordinate = menuState.coordinate;
    setSelectedEntityId(entity.id);
    onBeginEdit(entity.id);
    setMenuState({ kind: 'editing', entityId: entity.id, coordinate });
    menu.showAt(coordinate);
  };

  const chooseEntity = (entity: MissionEntityDto) => {
    if (menuState.kind !== 'plonter') {
      return;
    }

    if (menuState.source === 'right') {
      setSelectedEntityId(entity.id);
      onBeginEdit(entity.id);
      setMenuState({
        kind: 'editing',
        entityId: entity.id,
        coordinate: menuState.coordinate,
      });
      return;
    }

    onEndEdit();
    setSelectedEntityId(entity.id);
    setMenuState({ kind: 'single', entityId: entity.id, coordinate: menuState.coordinate });
  };

  const createEntity = (entityType: MissionEntityType) => {
    if (menuState.kind !== 'create') {
      return;
    }

    const entityId = onCreateEntity(entityType, menuState.coordinate);
    setMenuState({
      kind: 'editing',
      entityId,
      coordinate: menuState.coordinate,
    });
    menu.showAt(menuState.coordinate);
  };

  const finishEditing = (entityId: string) => {
    onEndEdit();
    setSelectedEntityId(entityId);
    setMenuState({ kind: 'closed' });
    menu.hide();
  };

  const renderContent = () => {
    if (menuState.kind === 'create') {
      return (
        <>
          <div className="click-menu-header">
            <div>
              <strong>Create entity</strong>
              <span>{formatCoordinate(menuState.coordinate)}</span>
            </div>
            <button type="button" className="menu-close-button" onClick={closeMenu}>
              X
            </button>
          </div>
          <div className="plonter-list">
            {entityCreationOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                className="plonter-item"
                onClick={() => createEntity(option.type)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (menuState.kind === 'single') {
      const entity = entityLookup.get(menuState.entityId);
      if (!entity) {
        return null;
      }

      return (
        <>
          <div className="click-menu-header">
            <div>
              <strong>{entity.label}</strong>
              <span>{entity.type}</span>
            </div>
            <button type="button" className="menu-close-button" onClick={closeMenu}>
              X
            </button>
          </div>
          <p>
            {entity.category} / {entity.status} / priority {entity.priority}
          </p>
          <div className="click-menu-actions">
            <button type="button" onClick={() => focusOnEntity(entity)}>
              Focus
            </button>
            <button type="button" onClick={() => openEditFromSingle(entity)}>
              Edit
            </button>
          </div>
        </>
      );
    }

    if (menuState.kind === 'plonter') {
      const plonterEntities = menuState.entityIds
        .map((entityId) => entityLookup.get(entityId))
        .filter((entity): entity is MissionEntityDto => Boolean(entity));

      return (
        <>
          <div className="click-menu-header">
            <div>
              <strong>{plonterEntities.length} entities here</strong>
              <span>
                {menuState.source === 'right'
                  ? 'Choose one to inspect and edit'
                  : 'Choose one from the plonter menu'}
              </span>
            </div>
            <button type="button" className="menu-close-button" onClick={closeMenu}>
              X
            </button>
          </div>
          <div className="plonter-list">
            {plonterEntities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                className="plonter-item"
                onClick={() => chooseEntity(entity)}
              >
                <strong>{entity.label}</strong>
                <span>
                  {entity.type} / {entity.category} / priority {entity.priority}
                </span>
              </button>
            ))}
          </div>
        </>
      );
    }

    const entity = entityLookup.get(menuState.entityId);
    if (!entity) {
      return null;
    }

    const primaryColor = getPrimaryColor(entity);
    const primaryColorLabel = getPrimaryColorLabel(entity);

    return (
      <>
        <div className="click-menu-header">
          <div>
            <strong>{entity.label}</strong>
            <span>{entity.type} editor</span>
          </div>
          <div className="menu-header-actions">
            <span className="menu-mode-pill">Edit mode</span>
            <button type="button" className="menu-close-button" onClick={closeMenu}>
              X
            </button>
          </div>
        </div>
        <p className="menu-context-copy">
          Right-clicked at {formatCoordinate(menuState.coordinate)}. Drag the highlighted handles
          on the map to reshape this entity. Green handles are draggable vertices. Red handles
          insert a new route point when clicked. While editing a route or polygon, each map click
          adds a new point. While editing a circle or point, each map click moves it. These map
          clicks clear the temporary selection highlight but keep the edit menu open.
        </p>
        <div className="menu-form-grid">
          <label className="menu-field">
            <span>Name</span>
            <input
              type="text"
              className="menu-text-input"
              value={entity.label}
              onChange={(event) => onUpdateLabel(entity.id, event.target.value)}
            />
          </label>
          <label className="menu-field">
            <span>{primaryColorLabel}</span>
            <input
              type="color"
              className="menu-color-input"
              value={toColorInputValue(primaryColor)}
              onChange={(event) => onUpdatePrimaryColor(entity.id, event.target.value)}
            />
          </label>
          {entity.type === 'circle' ? (
            <label className="menu-field">
              <span>Radius</span>
              <input
                type="number"
                min={2}
                max={80}
                step={1}
                className="menu-text-input"
                value={entity.radius}
                onChange={(event) =>
                  onUpdateCircleRadius(entity.id, Number(event.target.value) || entity.radius)
                }
              />
            </label>
          ) : null}
          {entity.type === 'doubleCircle' ? (
            <>
              <label className="menu-field">
                <span>Inner radius</span>
                <input
                  type="number"
                  min={2}
                  max={80}
                  step={1}
                  className="menu-text-input"
                  value={entity.innerRadius}
                  onChange={(event) =>
                    onUpdateDoubleCircleRadii(
                      entity.id,
                      Number(event.target.value) || entity.innerRadius,
                      entity.outerRadius,
                    )
                  }
                />
              </label>
              <label className="menu-field">
                <span>Outer radius</span>
                <input
                  type="number"
                  min={3}
                  max={120}
                  step={1}
                  className="menu-text-input"
                  value={entity.outerRadius}
                  onChange={(event) =>
                    onUpdateDoubleCircleRadii(
                      entity.id,
                      entity.innerRadius,
                      Number(event.target.value) || entity.outerRadius,
                    )
                  }
                />
              </label>
            </>
          ) : null}
          {entity.type === 'polygon' ? (
            <label className="menu-field">
              <span>Fill color</span>
              <input
                type="color"
                className="menu-color-input"
                value={toColorInputValue(entity.fillColor)}
                onChange={(event) => onUpdatePolygonFillColor(entity.id, event.target.value)}
              />
            </label>
          ) : null}
        </div>
        <div className="menu-data-grid">
          <div>
            <span>Category</span>
            <strong>{entity.category}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{entity.status}</strong>
          </div>
          <div>
            <span>Priority</span>
            <strong>{entity.priority}</strong>
          </div>
          <div>
            <span>Anchor</span>
            <strong>{formatCoordinate([entity.lon, entity.lat])}</strong>
          </div>
        </div>
        <div className="click-menu-actions click-menu-actions--wrap">
          <button type="button" onClick={() => focusOnEntity(entity)}>
            Focus
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => finishEditing(entity.id)}
          >
            Done
          </button>
        </div>
        <pre className="entity-data-preview">{JSON.stringify(entity, null, 2)}</pre>
      </>
    );
  };

  const content = renderContent();
  if (!content) {
    return null;
  }

  return (
    <div
      className="map-click-menu"
      style={{
        left: menu.state.screenPosition.x,
        top: menu.state.screenPosition.y,
      }}
    >
      <div className="click-menu-card">{content}</div>
    </div>
  );
}

function getClickedEntities(
  map: OlMap,
  pixel: Pixel,
  entityLookup: globalThis.Map<string, MissionEntityDto>,
): MissionEntityDto[] {
  const seenIds = new Set<string>();
  const clickedEntities: MissionEntityDto[] = [];

  map.forEachFeatureAtPixel(
    pixel,
    (feature) => {
      const entity = resolvePickedEntity(feature, entityLookup);
      if (!entity || seenIds.has(entity.id)) {
        return undefined;
      }

      seenIds.add(entity.id);
      clickedEntities.push(entity);
      return undefined;
    },
    {
      hitTolerance: 8,
      layerFilter: (layer) => layer.get('selectable') === true,
    },
  );

  return clickedEntities.sort((left, right) => right.priority - left.priority);
}

function resolvePickedEntity(
  feature: FeatureLike,
  entityLookup: globalThis.Map<string, MissionEntityDto>,
): MissionEntityDto | null {
  const entityId = feature.get('entityId');
  if (typeof entityId === 'string') {
    return entityLookup.get(entityId) ?? null;
  }

  const featureId = feature.getId();
  if (featureId != null) {
    return entityLookup.get(String(featureId)) ?? null;
  }

  const entity = feature.get('entity') as MissionEntityDto | RouteVertexDatum | undefined;
  if (entity && 'id' in entity && typeof entity.id === 'string') {
    return entityLookup.get(entity.id) ?? (isMissionEntity(entity) ? entity : null);
  }

  return null;
}

function getEditHandleAtPixel(
  map: OlMap,
  pixel: Pixel,
  editingEntity: MissionEntityDto,
): EditHandleDatum | null {
  if (editingEntity.type !== 'route' && editingEntity.type !== 'polygon') {
    return null;
  }

  return (
    map.forEachFeatureAtPixel(
      pixel,
      (feature, layer) => {
        if (layer?.get('interactiveRole') !== 'editHandle') {
          return null;
        }

        return resolveEditHandleFeature(feature, editingEntity);
      },
      {
        hitTolerance: 10,
        layerFilter: (layer) => layer.get('interactiveRole') === 'editHandle',
      },
    ) ?? null
  );
}

function resolveEditHandleFeature(
  feature: FeatureLike,
  editingEntity: MissionEntityDto,
): EditHandleDatum | null {
  const entityId = feature.get('entityId');
  if (typeof entityId !== 'string' || entityId !== editingEntity.id) {
    return null;
  }

  const handleCoordinate = feature.get('handleCoordinate');
  if (!isLonLatCoordinate(handleCoordinate)) {
    return null;
  }

  const rawKind = feature.get('handleKind');
  const rawVertexIndex = feature.get('vertexIndex');
  const rawInsertIndex = feature.get('insertIndex');

  return {
    id: String(feature.getId() ?? `${entityId}-handle`),
    entityId,
    entityType: editingEntity.type,
    kind:
      rawKind === 'anchor' ? 'anchor' : rawKind === 'midpoint' ? 'midpoint' : 'vertex',
    position: handleCoordinate,
    vertexIndex: typeof rawVertexIndex === 'number' ? rawVertexIndex : undefined,
    insertIndex: typeof rawInsertIndex === 'number' ? rawInsertIndex : undefined,
  };
}

function isLonLatCoordinate(value: unknown): value is LonLatCoordinate {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

function isMissionEntity(value: unknown): value is MissionEntityDto {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'id' in value &&
      'label' in value &&
      'type' in value &&
      'priority' in value,
  );
}

function getPrimaryColor(entity: MissionEntityDto): string {
  switch (entity.type) {
    case 'circle':
      return entity.colorCode;
    case 'doubleCircle':
      return entity.colorCode;
    case 'point':
      return entity.markerColor;
    case 'route':
      return entity.colorCode;
    case 'polygon':
      return entity.strokeColor;
  }
}

function getPrimaryColorLabel(entity: MissionEntityDto): string {
  switch (entity.type) {
    case 'point':
      return 'Marker color';
    case 'polygon':
      return 'Stroke color';
    default:
      return 'Color';
  }
}

function toColorInputValue(value: string): string {
  const hexMatch = value.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
  if (hexMatch) {
    return `#${hexMatch[1]}`;
  }

  const rgbaMatch = value.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/i,
  );
  if (rgbaMatch) {
    return rgbToHex(
      Number(rgbaMatch[1]),
      Number(rgbaMatch[2]),
      Number(rgbaMatch[3]),
    );
  }

  return '#5c677d';
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

function formatCoordinate([lon, lat]: LonLatCoordinate): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

const entityCreationOptions: Array<{
  type: MissionEntityType;
  label: string;
  description: string;
}> = [
  { type: 'circle', label: 'Circle', description: 'Create a single-radius circle and edit it.' },
  {
    type: 'doubleCircle',
    label: 'Double circle',
    description: 'Create a two-ring circle marker at this location.',
  },
  { type: 'point', label: 'Point', description: 'Create a point marker and move it on click.' },
  { type: 'route', label: 'Route', description: 'Create a route and keep clicking to add points.' },
  {
    type: 'polygon',
    label: 'Polygon',
    description: 'Create a polygon and keep clicking to add vertices.',
  },
];
