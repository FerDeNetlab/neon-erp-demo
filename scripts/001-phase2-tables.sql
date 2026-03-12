-- NEON ERP: Phase 2 — Tickets, Evidencias, Incidencias
-- Run this against your Neon database

-- Tabla de Usuarios (simplificada para el ERP)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellidos VARCHAR(255),
  telefono VARCHAR(50),
  rol VARCHAR(50) NOT NULL DEFAULT 'instalador',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets de trabajo
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ticket VARCHAR(50) UNIQUE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'otro',
  estado VARCHAR(50) DEFAULT 'pendiente',
  prioridad VARCHAR(20) DEFAULT 'media',
  cliente_nombre VARCHAR(255),
  cliente_telefono VARCHAR(50),
  direccion TEXT,
  ciudad VARCHAR(100),
  asignado_a UUID REFERENCES usuarios(id),
  fecha_programada DATE,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  notas TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidencias fotográficas
CREATE TABLE IF NOT EXISTS evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  tipo VARCHAR(50) DEFAULT 'foto',
  url TEXT NOT NULL,
  descripcion TEXT,
  subido_por VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidencias
CREATE TABLE IF NOT EXISTS incidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  reportado_por VARCHAR(255),
  tipo VARCHAR(50) NOT NULL DEFAULT 'otro',
  severidad VARCHAR(20) DEFAULT 'media',
  descripcion TEXT NOT NULL,
  estado VARCHAR(50) DEFAULT 'abierta',
  resolucion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_asignado ON tickets(asignado_a);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo ON tickets(tipo);
CREATE INDEX IF NOT EXISTS idx_evidencias_ticket ON evidencias(ticket_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_ticket ON incidencias(ticket_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias(estado);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tickets_updated_at') THEN
    CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_incidencias_updated_at') THEN
    CREATE TRIGGER update_incidencias_updated_at BEFORE UPDATE ON incidencias
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usuarios_updated_at') THEN
    CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
