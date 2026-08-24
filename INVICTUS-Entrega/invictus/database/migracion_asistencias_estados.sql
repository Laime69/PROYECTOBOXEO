-- Migracion: Agregar tardanza y justificado al CHECK constraint de asistencias.estado
-- Ejecutar: psql -U postgres -d invictus_boxeo -f migracion_asistencias_estados.sql

ALTER TABLE asistencias 
  DROP CONSTRAINT IF EXISTS asistencias_estado_check;

ALTER TABLE asistencias 
  ADD CONSTRAINT asistencias_estado_check 
    CHECK (estado IN ('presente', 'falta', 'permiso', 'tardanza', 'justificado'));
