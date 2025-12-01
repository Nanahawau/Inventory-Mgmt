set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'inventory_mgmt'
    ) THEN
      CREATE DATABASE "inventory_mgmt";
    END IF;
  END
  \$\$;
EOSQL