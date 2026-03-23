import { getPool } from "@/lib/db";

export async function limitRequests(
  ip: number,
  route: string,
  limit: number,
  windowMinutes: number
): Promise<boolean> {
  const pool = await getPool();

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

  //console.log(`Rate limiting check for IP: ${ip}, Route: ${route}`);

  // Crea la tabla si no existe (solo la primera vez)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      ip INTEGER NOT NULL,
      route TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Eliminar registros antiguos
  await pool.query(`DELETE FROM rate_limits WHERE created_at < $1`, [windowStart]);

  // Contar solicitudes recientes
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM rate_limits
     WHERE ip = $1 AND route = $2 AND created_at >= $3`,
    [ip, route, windowStart]
  );

  const requestCount = rows[0].count;

  if (requestCount >= limit) {
    return false; // Excedió el límite
  }

  // Registrar la solicitud actual
  await pool.query(
    `INSERT INTO rate_limits (ip, route, created_at) VALUES ($1, $2, $3)`,
    [ip, route, now]
  );

  return true;
}
