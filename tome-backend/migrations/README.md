# Database Migrations

This directory contains SQL migration scripts for the Tome database.

## Available Migrations

### Reading Activity Tracking Migration

**File:** `add_reading_activity_tracking.sql`
**Date:** 2025-11-15

Adds comprehensive reading activity tracking features including:
- Reading sessions with pages/time tracking
- DNF (Did Not Finish) status for books
- Audiobook and ebook support
- User-specific edition tracking (different page counts)
- Auto-generated default lists (Currently Reading, To Be Read)
- Progress calculation views

**Rollback:** `rollback_reading_activity_tracking.sql`

---

## How to Run Migrations

### Using psql (Command Line)

```bash
# Run migration
psql -U myuser -d tomedb -f migrations/add_reading_activity_tracking.sql

# Rollback migration
psql -U myuser -d tomedb -f migrations/rollback_reading_activity_tracking.sql
```

### Using Docker

If your database is running in Docker:

```bash
# Copy migration file into container
docker cp migrations/add_reading_activity_tracking.sql tome-db:/tmp/

# Execute migration
docker exec -it tome-db psql -U myuser -d tomedb -f /tmp/add_reading_activity_tracking.sql
```

### Using pgAdmin or Another GUI Tool

1. Connect to your database
2. Open the SQL query tool
3. Copy and paste the contents of the migration file
4. Execute the script

---

## Migration Order

Migrations should be run in the following order:

1. `add_reading_activity_tracking.sql` - Reading activity tracking features

---

## Important Notes

### Before Running Migrations

1. **Backup your database** before running any migration:
   ```bash
   pg_dump -U myuser tomedb > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Review the migration script** to understand what changes will be made

3. **Test on a development database** first before running on production

### After Running Migrations

1. Verify the migration completed successfully by checking the output
2. Test the new features to ensure they work as expected
3. Update your application code to use the new schema

### Backfilling Default Lists

The migration includes commented-out SQL to create default lists for existing users. If you have existing users in your database, uncomment this section in `add_reading_activity_tracking.sql` before running:

```sql
-- PART 6: BACKFILL DEFAULT LISTS FOR EXISTING USERS (Optional)
```

### Rollback Considerations

- **Data Loss Warning:** Rolling back will delete all reading session data
- The rollback script cannot remove values from PostgreSQL enums (like 'did-not-finish')
- If you need to completely remove enum values, follow the commented instructions in the rollback script

---

## Database Connection Details

Default configuration (from docker-compose.yaml):
- **Host:** localhost
- **Port:** 5432
- **Database:** tomedb
- **Username:** myuser
- **Password:** secret

---

## Troubleshooting

### Error: "type already exists"

If you see errors about types already existing, the migration may have been partially run. You can either:
1. Run the rollback script first
2. Comment out the `CREATE TYPE` statements that are failing

### Error: "column already exists"

Similar to above - the migration was partially run. Run the rollback script or comment out the failing statements.

### Error: "cannot drop type because other objects depend on it"

When rolling back, ensure you drop dependent tables/views before dropping types.

---

## Support

For issues or questions about migrations, refer to:
- DATABASE_SCHEMA.md - Full schema documentation
- CLAUDE.md - Project overview and architecture
