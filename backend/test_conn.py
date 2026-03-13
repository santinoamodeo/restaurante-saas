import psycopg2

try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5433,
        user="postgres",
        password="postgres",
        dbname="postgres"
    )
    print("CONEXION EXITOSA")
    conn.close()
except Exception as e:
    print(f"ERROR: {e}")