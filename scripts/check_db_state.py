import os, sqlite3

files = [
    'warehouse/cancer_dw.db',
    'warehouse/cancer_dw_backup_20261020_190913.db',
    'warehouse/cancer_dw_backup_phase2_pre_correction.db',
]
for f in files:
    if os.path.exists(f):
        print(f'EXISTS: {f} ({os.path.getsize(f):,} bytes)')
    else:
        print(f'MISSING: {f}')

con = sqlite3.connect('warehouse/cancer_dw.db')
tables = con.execute(
    "SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY type, name"
).fetchall()
print(f'\nDB tables/views ({len(tables)}):')
for t in tables:
    cnt = con.execute(f'SELECT COUNT(*) FROM [{t[0]}]').fetchone()[0]
    print(f'  {t[1].upper()}: {t[0]} ({cnt} rows)')
con.close()
