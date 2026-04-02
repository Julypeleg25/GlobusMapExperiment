import { useQuery } from '@tanstack/react-query';
import { getMission } from '@shared/api/mission.api';
import {
  createMissionEntityCollection,
  type MissionEntityCollection,
} from '../model/missionEntityCollection';

export function useMissionEntitiesQuery(missionId: string | null) {
  return useQuery({
    queryKey: ['mission-entities', missionId],
    queryFn: () => getMission(missionId as string),
    enabled: Boolean(missionId),
    select: (mission): MissionEntityCollection =>
      createMissionEntityCollection(mission.entities),
  });
}
