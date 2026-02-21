-- ============================================================
-- RBAC & Auth System — Verification Queries
-- Run these against your Supabase SQL Editor to verify setup
-- ============================================================

-- 1. Verify all RBAC tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles', 'organizations', 'org_roles', 'org_permissions',
    'org_role_permissions', 'project_roles', 'project_permissions',
    'project_role_permissions', 'user_org_role_bindings',
    'user_project_role_bindings', 'projects', 'cost_codes',
    'access_codes', 'audit_log', 'purchase_requests', 'line_items'
  )
ORDER BY table_name;
-- Expected: 16 rows

-- 2. Verify org-level permissions seeded
SELECT r.name AS role, array_agg(p.key ORDER BY p.key) AS permissions
FROM org_roles r
JOIN org_role_permissions rp ON rp.org_role_id = r.id
JOIN org_permissions p ON p.id = rp.org_permission_id
GROUP BY r.name
ORDER BY r.name;

-- 3. Verify project-level permissions seeded
SELECT r.name AS role, array_agg(p.key ORDER BY p.key) AS permissions
FROM project_roles r
JOIN project_role_permissions rp ON rp.project_role_id = r.id
JOIN project_permissions p ON p.id = rp.project_permission_id
GROUP BY r.name
ORDER BY r.name;

-- 4. Verify RLS is enabled on key tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'organizations', 'projects', 'cost_codes',
    'purchase_requests', 'line_items', 'audit_log', 'access_codes'
  )
ORDER BY tablename;
-- Expected: all rows have rowsecurity = true

-- 5. Test permission resolution functions exist
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN ('user_in_org', 'user_has_org_permission', 'user_has_project_permission')
ORDER BY proname;
-- Expected: 3 functions

-- 6. Verify access code claim flow
-- a) List existing access codes
SELECT code, max_uses, current_uses, expires_at
FROM access_codes
ORDER BY created_at DESC
LIMIT 5;

-- 7. Verify user org bindings
SELECT p.email, o.name AS org, r.name AS role
FROM user_org_role_bindings b
JOIN profiles p ON p.id = b.user_id
JOIN organizations o ON o.id = b.organization_id
JOIN org_roles r ON r.id = b.org_role_id
ORDER BY o.name, p.email;

-- 8. Verify user project bindings
SELECT p.email, pr.name AS project, r.name AS role
FROM user_project_role_bindings b
JOIN profiles p ON p.id = b.user_id
JOIN projects pr ON pr.id = b.project_id
JOIN project_roles r ON r.id = b.project_role_id
ORDER BY pr.name, p.email;

-- 9. Verify purchase_requests table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_requests'
ORDER BY ordinal_position;

-- 10. Verify line_items table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'line_items'
ORDER BY ordinal_position;

-- 11. Verify PO number sequence exists
SELECT last_value FROM po_number_seq;

-- 12. Verify audit_log trigger is set up
SELECT tgname, tgrelid::regclass, tgtype
FROM pg_trigger
WHERE tgname = 'trg_log_request_status_change';
-- Expected: 1 row, on purchase_requests

-- 13. Verify integration tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'integration_connections', 'integration_mappings',
    'integration_sync_logs', 'project_financial_settings',
    'vendors', 'org_display_titles'
  )
ORDER BY table_name;
-- Expected: 6 rows

-- 14. Verify project_financial_settings columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'project_financial_settings'
ORDER BY ordinal_position;
-- Expected: includes require_receipt_attachment, require_description, amount_threshold

-- 15. Verify Edge Functions via listing
-- (Run in Supabase Dashboard > Edge Functions, or use:)
-- supabase functions list
-- Expected: manage-request, get-my-permissions, claim-access-code,
--   manage-access-codes, leave-organization, integration-oauth,
--   integration-api, integration-export

-- 16. Verify org permission grants include finance/integration keys
SELECT r.name AS role, p.key AS permission
FROM org_role_permissions rp
JOIN org_roles r ON r.id = rp.org_role_id
JOIN org_permissions p ON p.id = rp.org_permission_id
WHERE p.key LIKE 'finance.%' OR p.key LIKE 'org.manage_integrations'
ORDER BY r.name, p.key;

-- 17. Verify project permission grants include finance/legacy keys
SELECT r.name AS role, p.key AS permission
FROM project_role_permissions rp
JOIN project_roles r ON r.id = rp.project_role_id
JOIN project_permissions p ON p.id = rp.project_permission_id
WHERE p.key LIKE 'finance.%' OR p.key LIKE 'request.%' OR p.key LIKE 'po.%'
ORDER BY r.name, p.key;

-- 18. Count data per org (sanity check)
SELECT
  o.name AS org,
  (SELECT count(*) FROM projects WHERE organization_id = o.id) AS projects,
  (SELECT count(*) FROM cost_codes WHERE organization_id = o.id) AS cost_codes,
  (SELECT count(*) FROM purchase_requests WHERE organization_id = o.id) AS requests,
  (SELECT count(*) FROM audit_log WHERE organization_id = o.id) AS audit_entries
FROM organizations o
ORDER BY o.name;
