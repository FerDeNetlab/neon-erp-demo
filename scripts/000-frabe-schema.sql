-- =====================================================
-- FRABE ERP · Schema Completo · Redes Ópticas
-- 35 tablas, 5 capas
-- =====================================================

-- ╔══════════════════════════════════════════════════╗
-- ║ STEP 0: DROP ALL EXISTING TABLES                ║
-- ╚══════════════════════════════════════════════════╝
DROP TABLE IF EXISTS asignaciones_material CASCADE;
DROP TABLE IF EXISTS cotizacion_partidas CASCADE;
DROP TABLE IF EXISTS cotizaciones CASCADE;
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS vehiculo_combustible CASCADE;
DROP TABLE IF EXISTS vehiculo_mantenimientos CASCADE;
DROP TABLE IF EXISTS vehiculo_multas CASCADE;
DROP TABLE IF EXISTS vehiculos CASCADE;
DROP TABLE IF EXISTS movimientos_material CASCADE;
DROP TABLE IF EXISTS materiales CASCADE;
DROP TABLE IF EXISTS activos_fijos CASCADE;
DROP TABLE IF EXISTS evidencias CASCADE;
DROP TABLE IF EXISTS incidencias CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ╔══════════════════════════════════════════════════╗
-- ║ CAPA 0: TENANCY & AUTH                          ║
-- ╚══════════════════════════════════════════════════╝

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  logo_url    TEXT,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  address     TEXT,
  city        VARCHAR(100),
  state       VARCHAR(100),
  zip_code    VARCHAR(20),
  phone       VARCHAR(50),
  manager_id  UUID,  -- FK added after users table
  is_main     BOOLEAN DEFAULT false,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auth_id           VARCHAR(255),  -- Neon Auth user ID
  email             VARCHAR(255) UNIQUE NOT NULL,
  full_name         VARCHAR(255) NOT NULL,
  phone             VARCHAR(50),
  role              VARCHAR(50) NOT NULL DEFAULT 'installer', -- admin, manager, supervisor, installer, warehouse
  default_branch_id UUID REFERENCES branches(id),
  avatar_url        TEXT,
  active            BOOLEAN DEFAULT true,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Now add FK for branch manager
ALTER TABLE branches ADD CONSTRAINT fk_branch_manager FOREIGN KEY (manager_id) REFERENCES users(id);

CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organizations(id),
  employee_number VARCHAR(50),
  position        VARCHAR(255),
  department      VARCHAR(255),
  hire_date       DATE,
  birth_date      DATE,
  curp            VARCHAR(20),
  rfc             VARCHAR(15),
  nss             VARCHAR(15),
  emergency_contact_name  VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  bank_name       VARCHAR(100),
  bank_account    VARCHAR(50),
  address         TEXT,
  photo_url       TEXT,
  docs_url        JSONB DEFAULT '[]',  -- array of {name, url}
  notes           TEXT,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ╔══════════════════════════════════════════════════╗
-- ║ CAPA 1: OPERATIVA / CORE                       ║
-- ╚══════════════════════════════════════════════════╝

CREATE TABLE service_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES organizations(id),
  branch_id           UUID NOT NULL REFERENCES branches(id),
  order_number        VARCHAR(50) UNIQUE NOT NULL,
  title               VARCHAR(500) NOT NULL,
  description         TEXT,
  service_type        VARCHAR(50) NOT NULL DEFAULT 'otro', -- fibra, cctv, cableado, servidor, otro
  status              VARCHAR(50) DEFAULT 'created',       -- created, assigned, in_progress, completed, closed
  priority            VARCHAR(20) DEFAULT 'medium',        -- low, medium, high, urgent
  -- Cliente
  client_name         VARCHAR(255),
  client_phone        VARCHAR(50),
  client_email        VARCHAR(255),
  client_address      TEXT,
  client_city         VARCHAR(100),
  client_reference    TEXT,  -- references para ubicar
  -- Logística
  assigned_vehicle_id UUID,  -- FK added later
  scheduled_date      DATE,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  -- Financiero
  quoted_amount       NUMERIC(12,2) DEFAULT 0,
  -- Meta
  notes               TEXT,
  client_signature_url TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_order_assignments (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id),
  role      VARCHAR(50) DEFAULT 'installer', -- installer, supervisor, lead
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, user_id)
);

CREATE TABLE evidence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  type        VARCHAR(50) DEFAULT 'photo', -- photo, document, video, signature
  url         TEXT,
  description TEXT,
  stage       VARCHAR(50) DEFAULT 'during', -- before, during, after, delivery
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES service_orders(id),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  reported_by   UUID REFERENCES users(id),
  type          VARCHAR(50) NOT NULL DEFAULT 'other', -- accident, delay, missing_material, damaged_equipment, other
  severity      VARCHAR(20) DEFAULT 'medium',
  title         VARCHAR(255),
  description   TEXT NOT NULL,
  status        VARCHAR(50) DEFAULT 'open', -- open, in_review, resolved, closed
  resolution    TEXT,
  resolved_by   UUID REFERENCES users(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Almacenes
CREATE TABLE warehouses (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    UUID NOT NULL REFERENCES organizations(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  name      VARCHAR(255) NOT NULL,
  type      VARCHAR(50) DEFAULT 'general', -- general, tools, consumable
  address   TEXT,
  manager_id UUID REFERENCES users(id),
  active    BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id  UUID NOT NULL REFERENCES warehouses(id),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  sku           VARCHAR(100),
  name          VARCHAR(255) NOT NULL,
  category      VARCHAR(100) DEFAULT 'general',
  unit          VARCHAR(50) DEFAULT 'pieza',
  stock_qty     NUMERIC(12,2) DEFAULT 0,
  min_stock     NUMERIC(12,2) DEFAULT 0,
  unit_cost     NUMERIC(12,2) DEFAULT 0,
  location      VARCHAR(100), -- ubicación dentro del almacén
  barcode       VARCHAR(100),
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_movements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id           UUID NOT NULL REFERENCES inventory_items(id),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  type              VARCHAR(50) NOT NULL, -- entry, exit, transfer, adjustment, return
  quantity          NUMERIC(12,2) NOT NULL,
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id   UUID REFERENCES warehouses(id),
  order_id          UUID REFERENCES service_orders(id),
  reference         VARCHAR(255),
  notes             TEXT,
  performed_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  branch_id     UUID NOT NULL REFERENCES branches(id),
  po_number     VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(255),
  status        VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, received, cancelled
  subtotal      NUMERIC(12,2) DEFAULT 0,
  tax           NUMERIC(12,2) DEFAULT 0,
  total         NUMERIC(12,2) DEFAULT 0,
  notes         TEXT,
  approved_by   UUID REFERENCES users(id),
  approved_at   TIMESTAMPTZ,
  received_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id           UUID REFERENCES inventory_items(id),
  description       VARCHAR(500),
  quantity          NUMERIC(12,2) NOT NULL,
  unit              VARCHAR(50) DEFAULT 'pieza',
  unit_price        NUMERIC(12,2) DEFAULT 0,
  total             NUMERIC(12,2) DEFAULT 0,
  received_qty      NUMERIC(12,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Herramientas
CREATE TABLE tools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  branch_id       UUID REFERENCES branches(id),
  name            VARCHAR(255) NOT NULL,
  brand           VARCHAR(100),
  model           VARCHAR(100),
  serial_number   VARCHAR(100),
  category        VARCHAR(100) DEFAULT 'general',
  status          VARCHAR(50) DEFAULT 'available', -- available, assigned, in_maintenance, lost, decommissioned
  acquisition_cost NUMERIC(12,2) DEFAULT 0,
  acquisition_date DATE,
  warranty_expiry  DATE,
  next_maintenance DATE,
  photo_url        TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tool_custodies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id       UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  status        VARCHAR(50) DEFAULT 'active', -- active, returned, transferred
  signature_url TEXT,
  assigned_at   TIMESTAMPTZ DEFAULT NOW(),
  returned_at   TIMESTAMPTZ,
  notes         TEXT,
  assigned_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tool_maintenances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id           UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  type              VARCHAR(50) DEFAULT 'preventive', -- preventive, corrective
  description       TEXT,
  cost              NUMERIC(12,2) DEFAULT 0,
  vendor            VARCHAR(255),
  date_performed    DATE,
  next_maintenance  DATE,
  performed_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Material consumption (links orders to inventory)
CREATE TABLE material_consumptions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  item_id   UUID NOT NULL REFERENCES inventory_items(id),
  quantity  NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  notes     TEXT,
  consumed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ╔══════════════════════════════════════════════════╗
-- ║ CAPA 2: LOGÍSTICA                              ║
-- ╚══════════════════════════════════════════════════╝

CREATE TABLE vehicles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  branch_id         UUID REFERENCES branches(id),
  plate_number      VARCHAR(20) NOT NULL,
  economic_number   VARCHAR(20),
  brand             VARCHAR(100),
  model             VARCHAR(100),
  year              INTEGER,
  color             VARCHAR(50),
  type              VARCHAR(50) DEFAULT 'pickup', -- pickup, van, sedan, truck
  vin               VARCHAR(50),
  status            VARCHAR(50) DEFAULT 'active', -- active, in_shop, inactive, decommissioned
  assigned_to       UUID REFERENCES users(id),
  current_km        INTEGER DEFAULT 0,
  -- Documentos
  insurance_policy  VARCHAR(100),
  insurance_expiry  DATE,
  verification_expiry DATE,
  registration_expiry DATE,
  circulation_card  TEXT,
  photo_url         TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Now add FK from service_orders to vehicles
ALTER TABLE service_orders ADD CONSTRAINT fk_order_vehicle FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id);

CREATE TABLE vehicle_maintenances (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id            UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type                  VARCHAR(50) DEFAULT 'preventive',
  description           TEXT,
  km_at_maintenance     INTEGER,
  cost                  NUMERIC(12,2) DEFAULT 0,
  vendor                VARCHAR(255),
  date_performed        DATE,
  next_maintenance_date DATE,
  next_maintenance_km   INTEGER,
  invoice_url           TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_fuel_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id   UUID REFERENCES users(id),
  liters      NUMERIC(10,2),
  total_cost  NUMERIC(12,2),
  price_per_liter NUMERIC(8,2),
  km_at_fill  INTEGER,
  station     VARCHAR(255),
  fuel_type   VARCHAR(50) DEFAULT 'magna',
  date        DATE,
  receipt_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_fines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id   UUID REFERENCES users(id),
  date        DATE,
  amount      NUMERIC(12,2),
  reason      TEXT,
  status      VARCHAR(50) DEFAULT 'pending', -- pending, paid, contested
  paid_at     DATE,
  receipt_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_tires (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  position      VARCHAR(10), -- FL, FR, RL, RR, spare
  brand         VARCHAR(100),
  model         VARCHAR(100),
  size          VARCHAR(50),
  km_installed  INTEGER,
  km_current    INTEGER,
  status        VARCHAR(50) DEFAULT 'active', -- active, worn, replaced
  installed_at  DATE,
  replaced_at   DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_inspections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES users(id),
  date        DATE,
  km          INTEGER,
  checklist   JSONB DEFAULT '{}',  -- {exterior: true, interior: true, fluids: true, ...}
  observations TEXT,
  photos      JSONB DEFAULT '[]',
  status      VARCHAR(50) DEFAULT 'passed', -- passed, failed, pending_review
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  branch_id         UUID REFERENCES branches(id),
  name              VARCHAR(255) NOT NULL,
  category          VARCHAR(100),
  serial_number     VARCHAR(100),
  asset_tag         VARCHAR(50),
  status            VARCHAR(50) DEFAULT 'available',
  assigned_to       UUID REFERENCES users(id),
  acquisition_cost  NUMERIC(12,2) DEFAULT 0,
  acquisition_date  DATE,
  useful_life_months INTEGER,
  depreciation_rate NUMERIC(5,2),
  signature_url     TEXT,
  photo_url         TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branch_contracts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id),
  type        VARCHAR(100), -- rent, insurance, service, utilities
  provider    VARCHAR(255),
  description TEXT,
  amount      NUMERIC(12,2),
  start_date  DATE,
  end_date    DATE,
  renewal_alert_days INTEGER DEFAULT 30,
  document_url TEXT,
  status      VARCHAR(50) DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ╔══════════════════════════════════════════════════╗
-- ║ CAPA 3: COSTOS Y RH                            ║
-- ╚══════════════════════════════════════════════════╝

CREATE TABLE service_order_costs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  cost_type       VARCHAR(50) NOT NULL, -- materials, labor, transport, other
  description     VARCHAR(500),
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  hours           NUMERIC(6,2),       -- for labor type
  rate_per_hour   NUMERIC(12,2),      -- for labor type
  km_traveled     NUMERIC(10,2),      -- for transport type
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE operational_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  branch_id   UUID REFERENCES branches(id),
  category    VARCHAR(100) NOT NULL, -- rent, utilities, payroll, supplies, insurance, other
  description VARCHAR(500),
  amount      NUMERIC(12,2) NOT NULL,
  date        DATE,
  vendor      VARCHAR(255),
  receipt_url TEXT,
  payment_method VARCHAR(50),
  contpaq_account VARCHAR(50), -- mapping to CONTPAQi
  notes       TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_vacations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  days        INTEGER,
  type        VARCHAR(50) DEFAULT 'vacation', -- vacation, personal, sick
  status      VARCHAR(50) DEFAULT 'requested', -- requested, approved, rejected, taken
  approved_by UUID REFERENCES users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  type          VARCHAR(100), -- tardiness, absence, misconduct, injury, other
  date          DATE,
  description   TEXT,
  severity      VARCHAR(20) DEFAULT 'minor',
  action_taken  TEXT,
  reported_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_trainings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  trainer     VARCHAR(255),
  date        DATE,
  duration_hours NUMERIC(6,2),
  location    VARCHAR(255),
  evidence_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_training_attendees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES hr_trainings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  attended    BOOLEAN DEFAULT false,
  score       NUMERIC(5,2),
  notes       TEXT,
  UNIQUE(training_id, employee_id)
);

-- ╔══════════════════════════════════════════════════╗
-- ║ CAPA 4: DIRECCIÓN                              ║
-- ╚══════════════════════════════════════════════════╝

CREATE TABLE admin_projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(50) DEFAULT 'active', -- active, paused, completed, cancelled
  priority    VARCHAR(20) DEFAULT 'medium',
  start_date  DATE,
  due_date    DATE,
  owner_id    UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES admin_projects(id) ON DELETE CASCADE,
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  status        VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, done, blocked
  priority      VARCHAR(20) DEFAULT 'medium',
  assigned_to   UUID REFERENCES users(id),
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meetings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  project_id  UUID REFERENCES admin_projects(id),
  title       VARCHAR(255) NOT NULL,
  date        TIMESTAMPTZ,
  location    VARCHAR(255),
  attendees   JSONB DEFAULT '[]', -- [{user_id, name}]
  minutes     TEXT,
  action_items JSONB DEFAULT '[]',
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  category    VARCHAR(100), -- procedure, policy, manual, template
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  version     VARCHAR(20) DEFAULT '1.0',
  file_url    TEXT,
  tags        JSONB DEFAULT '[]',
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE position_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  title         VARCHAR(255) NOT NULL,
  department    VARCHAR(255),
  description   TEXT,
  requirements  TEXT,
  responsibilities TEXT,
  salary_range  VARCHAR(100),
  reports_to    UUID REFERENCES position_profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ╔══════════════════════════════════════════════════╗
-- ║ INDEXES                                         ║
-- ╚══════════════════════════════════════════════════╝

-- Tenancy
CREATE INDEX idx_branches_org ON branches(org_id);
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employees_org ON employees(org_id);
CREATE INDEX idx_employees_user ON employees(user_id);

-- Service Orders
CREATE INDEX idx_orders_org ON service_orders(org_id);
CREATE INDEX idx_orders_branch ON service_orders(branch_id);
CREATE INDEX idx_orders_status ON service_orders(status);
CREATE INDEX idx_orders_type ON service_orders(service_type);
CREATE INDEX idx_orders_scheduled ON service_orders(scheduled_date);
CREATE INDEX idx_order_assignments_order ON service_order_assignments(order_id);
CREATE INDEX idx_order_assignments_user ON service_order_assignments(user_id);
CREATE INDEX idx_evidence_order ON evidence(order_id);
CREATE INDEX idx_incidents_order ON incidents(order_id);
CREATE INDEX idx_incidents_org ON incidents(org_id);

-- Inventory
CREATE INDEX idx_warehouses_org ON warehouses(org_id);
CREATE INDEX idx_inventory_warehouse ON inventory_items(warehouse_id);
CREATE INDEX idx_inventory_org ON inventory_items(org_id);
CREATE INDEX idx_inv_movements_item ON inventory_movements(item_id);
CREATE INDEX idx_inv_movements_order ON inventory_movements(order_id);
CREATE INDEX idx_material_consumption_order ON material_consumptions(order_id);
CREATE INDEX idx_purchase_orders_org ON purchase_orders(org_id);

-- Tools
CREATE INDEX idx_tools_org ON tools(org_id);
CREATE INDEX idx_tool_custodies_tool ON tool_custodies(tool_id);
CREATE INDEX idx_tool_custodies_user ON tool_custodies(user_id);

-- Vehicles
CREATE INDEX idx_vehicles_org ON vehicles(org_id);
CREATE INDEX idx_vehicles_branch ON vehicles(branch_id);
CREATE INDEX idx_vehicle_maint ON vehicle_maintenances(vehicle_id);
CREATE INDEX idx_vehicle_fuel ON vehicle_fuel_logs(vehicle_id);
CREATE INDEX idx_vehicle_fines ON vehicle_fines(vehicle_id);
CREATE INDEX idx_assets_org ON assets(org_id);

-- Costs & HR
CREATE INDEX idx_order_costs ON service_order_costs(order_id);
CREATE INDEX idx_expenses_org ON operational_expenses(org_id);
CREATE INDEX idx_vacations_employee ON hr_vacations(employee_id);
CREATE INDEX idx_hr_incidents_employee ON hr_incidents(employee_id);

-- Direction
CREATE INDEX idx_projects_org ON admin_projects(org_id);
CREATE INDEX idx_tasks_project ON admin_tasks(project_id);
CREATE INDEX idx_meetings_org ON meetings(org_id);
CREATE INDEX idx_documents_org ON documents(org_id);

-- ╔══════════════════════════════════════════════════╗
-- ║ TRIGGERS                                        ║
-- ╚══════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'organizations','branches','users','employees',
    'service_orders','incidents',
    'warehouses','inventory_items','purchase_orders',
    'tools','vehicles','assets','branch_contracts',
    'hr_vacations','operational_expenses',
    'admin_projects','admin_tasks','documents','position_profiles'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END $$;
