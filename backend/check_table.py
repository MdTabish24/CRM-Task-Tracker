from app import app, db
from sqlalchemy import text

app.app_context().push()
conn = db.engine.connect()
result = conn.execute(text('DESCRIBE other_admissions'))
print("Table structure:")
for row in result:
    print(row)
conn.close()