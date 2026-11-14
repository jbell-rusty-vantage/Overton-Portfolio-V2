-- Additive portrait metering migration, rehearsed only on disposable data.
-- Owner database application requires the owner's release instruction. This row is the global
-- lock and contains metering metadata only (no prompts, answers, IPs or evidence).
CREATE TABLE portrait_ledger (
  id integer PRIMARY KEY CHECK (id = 1),
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO portrait_ledger (id,state) VALUES (1,'{"version":1,"killed":false,"turns":[]}');
COMMENT ON TABLE portrait_ledger IS 'Atomic shared portrait rate and spend ledger; no conversation content';
COMMENT ON COLUMN portrait_ledger.id IS 'Singleton ID locked for all reserve and settle transactions';
COMMENT ON COLUMN portrait_ledger.state IS 'Versioned integer micro-dollar reservations, usage settlement and hashed rate buckets';
COMMENT ON COLUMN portrait_ledger.updated_at IS 'Most recent ledger mutation timestamp';
