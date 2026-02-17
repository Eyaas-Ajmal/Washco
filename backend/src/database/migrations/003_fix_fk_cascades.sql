-- Fix FK constraints to use proper CASCADE/SET NULL rules
-- (Some constraints were created with NO ACTION instead of the intended rules)

-- tenants.owner_id -> users: CASCADE (deleting user deletes their tenant)
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_owner_id_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- bookings.customer_id -> users: CASCADE
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

-- bookings.tenant_id -> tenants: CASCADE
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_tenant_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- reviews.customer_id -> users: CASCADE
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

-- reviews.booking_id -> bookings: CASCADE
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- audit_logs.user_id -> users: SET NULL (keep logs even after user deletion)
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- audit_logs.tenant_id -> tenants: SET NULL
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_fkey;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
