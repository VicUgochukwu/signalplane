-- Phase 0.1: Signal Type Extension
-- Extends control_plane.signals to support all new ship types

-- Drop existing constraint
ALTER TABLE control_plane.signals
  DROP CONSTRAINT IF EXISTS signals_signal_type_check;

-- Add new constraint with all signal types
ALTER TABLE control_plane.signals
  ADD CONSTRAINT signals_signal_type_check CHECK (
    signal_type IN (
      -- Existing
      'messaging', 'narrative', 'icp', 'horizon', 'objection',
      -- New ships
      'pricing', 'proof', 'distribution', 'hiring', 'launch_decay',
      -- Experiment surveillance
      'experiment'
    )
  );

-- Add decision_type comment
COMMENT ON COLUMN control_plane.signals.decision_type IS
  'positioning | packaging | distribution | proof | enablement | risk | hiring | launch';
