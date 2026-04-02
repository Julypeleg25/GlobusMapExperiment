import { useEffect, useRef } from 'react';
import type { FeatureLike } from 'ol/Feature';
import type Map from 'ol/Map';
import type { Pixel } from 'ol/pixel';
import { toLonLat } from 'ol/proj';
import DragPan from 'ol/interaction/DragPan';
import type { LonLatCoordinate, MissionEntityDto } from '@shared/types/mission.types';
import type { EditHandleDatum } from '../model/entityEditing';

interface EntityEditControllerProps {
  map: Map | null;
  editingEntity: MissionEntityDto | null;
  onApplyHandleDrag: (handle: EditHandleDatum, coordinate: LonLatCoordinate) => void;
}

interface DragState {
  handle: EditHandleDatum;
  dragPanInteraction: DragPan | null;
  dragPanWasActive: boolean;
}

export function EntityEditController({
  map,
  editingEntity,
  onApplyHandleDrag,
}: EntityEditControllerProps) {
  const editingEntityRef = useRef<MissionEntityDto | null>(editingEntity);
  const onApplyHandleDragRef = useRef(onApplyHandleDrag);

  useEffect(() => {
    editingEntityRef.current = editingEntity;
  }, [editingEntity]);

  useEffect(() => {
    onApplyHandleDragRef.current = onApplyHandleDrag;
  }, [onApplyHandleDrag]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const viewport = map.getViewport();
    let dragState: DragState | null = null;

    const isInsideViewport = (pixel: Pixel) => {
      const size = map.getSize();
      return Boolean(
        size &&
          pixel[0] >= 0 &&
          pixel[1] >= 0 &&
          pixel[0] <= size[0] &&
          pixel[1] <= size[1],
      );
    };

    const pickHandle = (event: MouseEvent | PointerEvent): EditHandleDatum | null => {
      const pixel = map.getEventPixel(event);
      if (!isInsideViewport(pixel)) {
        return null;
      }

      return (
        map.forEachFeatureAtPixel(
          pixel,
          (feature, layer) => {
            if (layer?.get('interactiveRole') !== 'editHandle') {
              return null;
            }

            return resolveHandleFeature(feature, editingEntityRef.current);
          },
          {
            hitTolerance: 10,
            layerFilter: (layer) => layer.get('interactiveRole') === 'editHandle',
          },
        ) ?? null
      );
    };

    const applyDragPosition = (handle: EditHandleDatum, event: MouseEvent | PointerEvent) => {
      const pixel = map.getEventPixel(event);
      if (!isInsideViewport(pixel)) {
        return;
      }

      onApplyHandleDragRef.current(
        handle,
        toLonLat(map.getEventCoordinate(event)) as LonLatCoordinate,
      );
    };

    const stopEvent = (event: MouseEvent | PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const updateHoverCursor = (event: MouseEvent | PointerEvent) => {
      if (dragState) {
        return;
      }

      const currentEntity = editingEntityRef.current;
      if (!currentEntity || (currentEntity.type !== 'route' && currentEntity.type !== 'polygon')) {
        viewport.style.cursor = '';
        return;
      }

      viewport.style.cursor = pickHandle(event) ? 'grab' : '';
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      const handle = pickHandle(event);
      if (!handle) {
        return;
      }

      stopEvent(event);
      const dragPanInteraction =
        map
          .getInteractions()
          .getArray()
          .find((interaction) => interaction instanceof DragPan) ?? null;
      const dragPanWasActive = dragPanInteraction?.getActive() ?? false;
      if (dragPanInteraction && dragPanWasActive) {
        dragPanInteraction.setActive(false);
      }

      dragState = { handle, dragPanInteraction, dragPanWasActive };
      viewport.style.cursor = 'grabbing';
      viewport.setPointerCapture(event.pointerId);
      applyDragPosition(handle, event);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState) {
        updateHoverCursor(event);
        return;
      }

      stopEvent(event);
      applyDragPosition(dragState.handle, event);
    };

    const finishDrag = (event?: PointerEvent) => {
      if (event && viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      if (dragState?.dragPanInteraction && dragState.dragPanWasActive) {
        dragState.dragPanInteraction.setActive(true);
      }

      dragState = null;
      viewport.style.cursor = '';
    };

    const finishDragFromBlur = () => {
      finishDrag();
    };

    viewport.addEventListener('pointerdown', handlePointerDown, true);
    viewport.addEventListener('pointermove', updateHoverCursor);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', finishDrag, true);
    window.addEventListener('pointercancel', finishDrag, true);
    window.addEventListener('blur', finishDragFromBlur);

    return () => {
      if (dragState?.dragPanInteraction && dragState.dragPanWasActive) {
        dragState.dragPanInteraction.setActive(true);
      }

      viewport.style.cursor = '';
      viewport.removeEventListener('pointerdown', handlePointerDown, true);
      viewport.removeEventListener('pointermove', updateHoverCursor);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', finishDrag, true);
      window.removeEventListener('pointercancel', finishDrag, true);
      window.removeEventListener('blur', finishDragFromBlur);
    };
  }, [map]);

  return null;
}

function resolveHandleFeature(
  feature: FeatureLike,
  editingEntity: MissionEntityDto | null,
): EditHandleDatum | null {
  if (!editingEntity || (editingEntity.type !== 'route' && editingEntity.type !== 'polygon')) {
    return null;
  }

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

  return {
    id: String(feature.getId() ?? `${entityId}-handle`),
    entityId,
    entityType: editingEntity.type,
    kind: rawKind === 'anchor' ? 'anchor' : 'vertex',
    position: handleCoordinate,
    vertexIndex: typeof rawVertexIndex === 'number' ? rawVertexIndex : undefined,
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
