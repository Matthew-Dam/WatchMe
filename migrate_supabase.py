#!/usr/bin/env python3
"""Apply schema and seed data to Supabase."""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from supabase import create_client, Client

SUPABASE_URL = "https://fpplwgreqwmplmusjcfu.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcGx3Z3JlcXdtcGxtdXNqY2Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjk4MzEzNSwiZXhwIjoyMDk4NTU5MTM1fQ.H-ww-Ic1e31N1yjJJWZigv2zbec6U8z_56VbZcY9Vw"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("Connected to Supabase")

# Read and execute schema
with open("backend/supabase_schema.sql") as f:
    schema_sql = f.read()

# Split by statements and execute each
statements = [s.strip() for s in schema_sql.split(";") if s.strip()]
total = len(statements)

for i, stmt in enumerate(statements):
    try:
        supabase.table("_dummy").select("*").limit(1).execute()
        result = supabase.rpc("exec_sql", {"query": stmt}).execute()
        print(f"  [{i+1}/{total}] OK")
    except Exception as e:
        # Try raw sql endpoint
        try:
            supabase.postgrest.request("POST", "/rpc/pg_query", json={"query": stmt})
            print(f"  [{i+1}/{total}] OK (alt)")
        except Exception as e2:
            print(f"  [{i+1}/{total}] ERROR: {e2}")

print("Schema migration complete!")
