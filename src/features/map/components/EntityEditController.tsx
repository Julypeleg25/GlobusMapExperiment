import { useEffect, useRef } from 'react';
import type { MapboxOverlay } from '@deck.gl/mapbox';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LonLatCoordinate, MissionEntityDto } from '@shared/types/mission.types';
import type { EditHandleDatum } from '../model/entityEditing';

interface EntityEditControllerProps {
  map: MapLibreMap | null;
  deckOverlay: MapboxOverlay | null;
  editingEntity: MissionEntityDto | null;
  onApplyHandleDrag: (handle: EditHandleDatum, coordinate: LonLatCoordinate) => void;
}

interface DragState {
  handle: EditHandleDatum;
  dragPanWasEnabled: boolean;
}

export function EntityEditController({
  map,
  deckOverlay,
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
    if (!map || !deckOverlay) {
      return;
    }

    const container = map.getContainer();
    const canvas = map.getCanvas();
    let dragState: DragState | null = null;

    const getRelativePoint = (event: MouseEvent | PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const isInsideCanvas = (x: number, y: number) =>
      x >= 0 && y >= 0 && x <= container.clientWidth && y <= container.clientHeight;

    const pickHandle = (event: MouseEvent | PointerEvent): EditHandleDatum | null => {
      const point = getRelativePoint(event);
      if (!isInsideCanvas(point.x, point.y)) {
        return null;
      }

      const picked = deckOverlay.pickObject({
        x: point.x,
        y: point.y,
        radius: 10,
        layerIds: ['edit-handles'],
      });
      const handle = picked?.object as EditHandleDatum | null | undefined;
      const currentEntity = editingEntityRef.current;

      if (
        !handle ||
        !currentEntity ||
        (currentEntity.type !== 'route' && currentEntity.type !== 'polygon') ||
        handle.entityId !== currentEntity.id
      ) {
        return null;
      }

      return handle;
    };

    const applyDragPosition = (handle: EditHandleDatum, event: MouseEvent | PointerEvent) => {
      const point = getRelativePoint(event);
      if (!isInsideCanvas(point.x, point.y)) {
        return;
      }

      const lngLat = map.unproject([point.x, point.y]);
      onApplyHandleDragRef.current(handle, [lngLat.lng, lngLat.lat]);
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
        canvas.style.cursor = '';
        return;
      }

      canvas.style.cursor = pickHandle(event) ? 'grab' : '';
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
      const dragPanWasEnabled = map.dragPan.isEnabled();
      if (dragPanWasEnabled) {
        map.dragPan.disable();
      }

      dragState = { handle, dragPanWasEnabled };
      canvas.style.cursor = 'grabbing';
      container.setPointerCapture(event.pointerId);
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
      if (event && container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }

      if (dragState?.dragPanWasEnabled) {
        map.dragPan.enable();
      }

      dragState = null;
      canvas.style.cursor = '';
    };

    const finishDragFromBlur = () => {
      finishDrag();
    };

    container.addEventListener('pointerdown', handlePointerDown, true);
    container.addEventListener('pointermove', updateHoverCursor);
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', finishDrag, true);
    window.addEventListener('pointercancel', finishDrag, true);
    window.addEventListener('blur', finishDragFromBlur);

    return () => {
      if (dragState?.dragPanWasEnabled) {
        map.dragPan.enable();
      }

      canvas.style.cursor = '';
      container.removeEventListener('pointerdown', handlePointerDown, true);
      container.removeEventListener('pointermove', updateHoverCursor);
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', finishDrag, true);
      window.removeEventListener('pointercancel', finishDrag, true);
      window.removeEventListener('blur', finishDragFromBlur);
    };
  }, [deckOverlay, map]);

  return null;
}
