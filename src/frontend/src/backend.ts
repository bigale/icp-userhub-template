// Candid types matching the Motoko backend canister interface.

// Candid encoding: Motoko ?Text = [] (None) | [string] (Some)
export interface CandidUserProfile {
  name: string;
  email: [] | [string];
  bio: [] | [string];
}

// Friendly UI types
export interface UserProfile {
  name: string;
  email?: string;
  bio?: string;
}

// Convert UI profile → Candid encoding for canister calls
export function toCandidProfile(p: UserProfile): CandidUserProfile {
  return {
    name: p.name,
    email: p.email ? [p.email] : [],
    bio: p.bio ? [p.bio] : [],
  };
}

// Convert Candid encoding → UI profile
export function fromCandidProfile(p: CandidUserProfile): UserProfile {
  return {
    name: p.name,
    email: p.email.length ? p.email[0] : undefined,
    bio: p.bio.length ? p.bio[0] : undefined,
  };
}

export const UserRole = {
  admin: { admin: null } as const,
  user: { user: null } as const,
  guest: { guest: null } as const,
};

export type UserRole = { admin: null } | { user: null } | { guest: null };
