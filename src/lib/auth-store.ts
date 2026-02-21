'use client';

import { create } from 'zustand';
import { createClient } from './supabase-browser';
import type { Session, User } from '@supabase/supabase-js';

// Types matching the get-my-permissions response
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  organization_id: string | null;
  onboarded: boolean;
  disabled: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface ProjectBinding {
  projectId: string;
  roleNames: string[];
  permissions: string[];
}

interface AuthState {
  // Auth
  session: Session | null;
  user: User | null;
  loading: boolean;

  // Profile & permissions (from get-my-permissions)
  profile: Profile | null;
  onboarded: boolean;
  organization: Organization | null;
  orgRoles: string[];
  orgPermissions: string[];
  projectBindings: ProjectBinding[];

  // Actions
  initialize: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  claimAccessCode: (code: string) => Promise<{ error?: string; organization?: Organization }>;

  // Permission helpers
  can: (permissionKey: string, projectId?: string) => boolean;
  hasOrgRole: (roleName: string) => boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  profile: null,
  onboarded: false,
  organization: null,
  orgRoles: [],
  orgPermissions: [],
  projectBindings: [],

  initialize: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      set({ session, user: session.user });
      await get().refreshPermissions();
    }

    set({ loading: false });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null });
      if (session) {
        await get().refreshPermissions();
      } else {
        set({
          profile: null,
          onboarded: false,
          organization: null,
          orgRoles: [],
          orgPermissions: [],
          projectBindings: [],
        });
      }
    });
  },

  refreshPermissions: async () => {
    const { session } = get();
    if (!session) return;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/get-my-permissions`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      set({
        profile: data.profile,
        onboarded: data.onboarded,
        organization: data.organization ?? null,
        orgRoles: data.orgRoles ?? [],
        orgPermissions: data.orgPermissions ?? [],
        projectBindings: data.projectBindings ?? [],
      });
    } catch (err) {
      console.error('Failed to refresh permissions:', err);
    }
  },

  signIn: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  signUp: async (email, password, fullName) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      onboarded: false,
      organization: null,
      orgRoles: [],
      orgPermissions: [],
      projectBindings: [],
    });
  },

  claimAccessCode: async (code) => {
    const { session } = get();
    if (!session) return { error: 'Not authenticated' };

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/claim-access-code`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Failed to claim code' };

      // Refresh permissions after claiming
      await get().refreshPermissions();
      return { organization: data.organization };
    } catch {
      return { error: 'Network error' };
    }
  },

  can: (permissionKey, projectId) => {
    const { orgPermissions, projectBindings } = get();

    // Check org permissions first
    if (orgPermissions.includes(permissionKey)) return true;

    // Check project permissions
    if (projectId) {
      const binding = projectBindings.find((b) => b.projectId === projectId);
      if (binding?.permissions.includes(permissionKey)) return true;
    }

    // Check across all projects if no specific projectId
    if (!projectId) {
      return projectBindings.some((b) => b.permissions.includes(permissionKey));
    }

    return false;
  },

  hasOrgRole: (roleName) => {
    return get().orgRoles.includes(roleName);
  },
}));
