import {
  isCircleEntity,
  isStandardEntity,
  type CircleEntityDto,
  type MissionEntityDto,
} from '@shared/types/mission.types';

export interface MissionEntityCollection {
  entities: MissionEntityDto[];
  circleEntities: CircleEntityDto[];
  standardEntities: Exclude<MissionEntityDto, CircleEntityDto>[];
  entityLookup: Record<string, MissionEntityDto>;
}

export const emptyMissionEntityCollection: MissionEntityCollection = {
  entities: [],
  circleEntities: [],
  standardEntities: [],
  entityLookup: {},
};

export function createMissionEntityCollection(
  entities: MissionEntityDto[],
): MissionEntityCollection {
  const entityLookup: Record<string, MissionEntityDto> = {};

  for (const entity of entities) {
    entityLookup[entity.id] = entity;
  }

  return {
    entities,
    circleEntities: entities.filter(isCircleEntity),
    standardEntities: entities.filter(isStandardEntity),
    entityLookup,
  };
}
