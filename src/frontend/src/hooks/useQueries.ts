import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, UserRole, CandidUserProfile, toCandidProfile, fromCandidProfile } from '../backend';
import { Principal } from '@dfinity/principal';

export function useInitializeAccessControl() {
  const { actor, isFetching: actorFetching } = useActor();
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!actor || actorFetching || state !== 'idle') return;
    setState('loading');
    actor.initializeAccessControl()
      .then(() => setState('success'))
      .catch((err: unknown) => {
        console.error('initializeAccessControl failed:', err);
        setState('error');
      });
  }, [actor, actorFetching, state]);

  return {
    isLoading: state === 'idle' || state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
  };
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result: [] | [CandidUserProfile] = await actor.getCallerUserProfile();
      return result.length ? fromCandidProfile(result[0]) : null;
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(toCandidProfile(profile));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllUserProfiles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['allUserProfiles'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result: Array<[Principal, CandidUserProfile]> = await actor.getAllUserProfiles();
      return result.map(([p, cp]) => [p, fromCandidProfile(cp)] as [Principal, UserProfile]);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}
