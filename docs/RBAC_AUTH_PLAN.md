# RBAC & Auth Implementation Plan — Even B2B

## Step 0 Findings

### Current Stack
| Layer | Web App | Mobile App |
|-------|---------|------------|
| Framework | Next.js 16, React 19, Tailwind v4 | Expo SDK 54, React Native 0.81, Expo Router 6 |
| State | Zustand 5 | Zustand 5 |
| Auth | None (demo role picker) | None (demo role switcher) |
| Database | None (in-memory mock) | None (in-memory mock) |
| API | None | None |
| Backend | None | None |

### Supabase Project State
- **URL:** https://pmicuhnocedcsxtzvqdd.supabase.co
- **Tables:** 0
- **Migrations:** 0
- **Edge Functions:** 0
- **RLS Policies:** 0
- **Auth Users:** 0
- **Extensions installed:** pgcrypto, uuid-ossp, pg_graphql, pg_stat_statements, plpgsql, supabase_vault

### Existing Data Model (mock, both apps)
- Users: id, name, email, role (worker|manager|admin), approvalLimit
- Projects: id, name, jobNumber, address, monthlyBudget, status, phase
- CostCodes: id, code, label, category
- PurchaseRequests: full workflow (draft->pending->approved->rejected->purchased)
- AuditLog: requestId, action, userId, timestamp, details
- LineItems: name, quantity, unit, estimatedUnitCost

### Constraints
- No existing backend to preserve — building from scratch
- Must not break existing routing, component structure, or UI
- Must keep Zustand stores functional (hydrated from Supabase after auth)
- Both apps share identical data types (can share type definitions)

---

## Implementation Plan

### Phase 1: Backend Schema + Role/Permission Seed

**Supabase Migrations (in order):**

#### Migration 1: `create_organizations`
```sql
-- organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
```

#### Migration 2: `create_profiles`
```sql
-- profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  organization_id uuid REFERENCES public.organizations(id),
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

#### Migration 3: `create_rbac_tables`
```sql
-- org_roles: named bundles of permissions at org scope
CREATE TABLE public.org_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,  -- owner, org_admin, accounting
  description text,
  created_at timestamptz DEFAULT now()
);

-- org_permissions: atomic permission keys
CREATE TABLE public.org_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,  -- org.manage_settings, etc.
  description text
);

-- org_role_permissions: which permissions belong to which org role
CREATE TABLE public.org_role_permissions (
  org_role_id uuid REFERENCES public.org_roles(id) ON DELETE CASCADE,
  org_permission_id uuid REFERENCES public.org_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (org_role_id, org_permission_id)
);

-- org_role_bindings: user has an org role within an organization
CREATE TABLE public.org_role_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_role_id uuid REFERENCES public.org_roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, organization_id, org_role_id)
);

-- project_roles: named bundles at project scope
CREATE TABLE public.project_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL, -- project_admin, approver, purchaser, foreman, field_worker, viewer
  description text,
  created_at timestamptz DEFAULT now()
);

-- project_permissions: atomic permission keys
CREATE TABLE public.project_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL, -- project.view, request.create, etc.
  description text
);

-- project_role_permissions: which permissions belong to which project role
CREATE TABLE public.project_role_permissions (
  project_role_id uuid REFERENCES public.project_roles(id) ON DELETE CASCADE,
  project_permission_id uuid REFERENCES public.project_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (project_role_id, project_permission_id)
);

-- project_role_bindings: user has a project role within a specific project
CREATE TABLE public.project_role_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  project_role_id uuid REFERENCES public.project_roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, project_id, project_role_id)
);

ALTER TABLE public.org_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_role_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_role_bindings ENABLE ROW LEVEL SECURITY;
```

#### Migration 4: `create_projects`
```sql
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  job_number text NOT NULL,
  address text DEFAULT '',
  monthly_budget numeric(12,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','completed','on-hold')),
  phase text DEFAULT 'preconstruction',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
```

#### Migration 5: `create_access_codes`
```sql
CREATE TABLE public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  default_org_role_id uuid NOT NULL REFERENCES public.org_roles(id),
  project_role_id uuid REFERENCES public.project_roles(id),
  max_uses integer DEFAULT 1,
  uses_count integer DEFAULT 0,
  expires_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
```

#### Migration 6: `create_audit_log`
```sql
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  scope text NOT NULL, -- 'org' or 'project'
  target_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
```

#### Migration 7: `seed_roles_and_permissions`
Seed all org roles, project roles, org permissions, project permissions, and the role-permission mappings as defined in the spec.

#### Migration 8: `create_rls_policies`
All RLS policies. Key patterns:
- profiles: users can read own profile, org members can read each other
- organizations: members can read their org
- projects: users with project.view on that project (or org admin/owner)
- access_codes: org admin/owner can CRUD, others cannot see
- role bindings: readable by org members, writable by admin/owner
- audit_log: readable by users with org.view_audit_log

#### Migration 9: `create_auth_trigger`
```sql
-- On auth.users INSERT, create a profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Phase 2: Edge Functions (Secure Endpoints)

#### `claim-access-code`
- POST body: `{ code: string }`
- Validates code exists, is active, not expired, not maxed out
- Creates org_role_binding for the user
- Optionally creates project_role_binding if project_id set
- Sets profile.organization_id and profile.onboarded = true
- Increments uses_count
- Returns success with org info

#### `get-my-permissions`
- GET (authenticated)
- Resolves all org permissions + all project role bindings for the user
- Returns `{ orgPermissions: string[], projectBindings: { projectId, permissions: string[] }[] }`

### Phase 3: Web App Auth + Onboarding

1. Install `@supabase/supabase-js` and `@supabase/ssr`
2. Create Supabase client utilities (browser + server)
3. Add environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. Replace demo login with real Supabase Auth (email/password)
5. Add sign-up page
6. Add "Enter Access Code" onboarding screen (shown when profile.onboarded = false)
7. Create auth context/middleware that checks session + onboarding status
8. Create permission store (Zustand) that caches resolved permissions
9. Create `can(permissionKey, projectId?)` helper
10. Add route guards on all dashboard pages
11. Build Access Code management screen (admin only)
12. Build Users management screen (admin only)
13. Gate existing UI based on permissions

### Phase 4: Mobile App Auth + Onboarding

1. Install `@supabase/supabase-js`
2. Create Supabase client with AsyncStorage for session persistence
3. Add environment variables
4. Add auth screens: Sign In, Sign Up, Enter Access Code
5. Create auth navigation guard (redirect to auth if no session)
6. Create permission store (Zustand) with same `can()` helper
7. Gate existing screens/actions based on permissions

### Phase 5: Polish

- Loading states on all auth-dependent screens
- Error handling for all edge functions
- Empty states for no-data scenarios
- Consistent error messages across both apps

---

## Role-Permission Matrix

### Org Roles → Org Permissions

| Permission | owner | org_admin | accounting |
|------------|-------|-----------|------------|
| org.manage_settings | x | x | |
| org.manage_users | x | x | |
| org.manage_access_codes | x | x | |
| org.view_audit_log | x | x | x |

### Project Roles → Project Permissions

| Permission | project_admin | approver | purchaser | foreman | field_worker | viewer |
|------------|--------------|----------|-----------|---------|-------------|--------|
| project.view | x | x | x | x | x | x |
| project.manage_settings | x | | | | | |
| project.manage_members | x | | | | | |
| request.create | x | x | x | x | x | |
| request.view_own | x | x | x | x | x | x |
| request.view_any | x | x | x | x | | x |
| request.comment | x | x | x | x | x | |
| request.approve | x | x | | | | |
| request.deny | x | x | | | | |
| receipt.upload | x | | x | x | x | |
| receipt.view_any | x | x | x | x | | x |
| po.create | x | | x | | | |
| po.edit | x | | x | | | |
| po.mark_ordered | x | | x | | | |
| po.mark_received | x | | x | x | x | |

---

## Backend Enforcement Strategy

All enforcement lives in:
1. **RLS Policies** — every table has row-level security enabled; policies check user's role bindings
2. **Edge Functions** — claim-access-code and any privileged mutations verify permissions server-side
3. **Database Functions** — helper functions like `user_has_org_permission(user_id, permission_key)` and `user_has_project_permission(user_id, project_id, permission_key)` used by RLS policies

UI hiding is a convenience layer only. The backend is the source of truth.
