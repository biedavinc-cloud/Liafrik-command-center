import {
  createSql,
  TABLE_MAP,
  serializeValue,
  buildWhereClause,
  buildSortClause,
  convertRow,
  convertRows,
} from './neonClient.ts';

// Lightweight repo for backend functions — no auth check (the calling
// function is responsible for auth). Provides the same interface as
// base44.entities but reads/writes directly to Neon PostgreSQL.
export function neonRepo(entity) {
  const table = TABLE_MAP[entity];
  if (!table) throw new Error(`Unknown entity: ${entity}`);

  return {
    async list(sort, limit) {
      const sql = createSql();
      const sortClause = buildSortClause(sort || '-created_date');
      const lim = Math.min(limit || 500, 5000);
      const rows = await sql(`SELECT * FROM ${table} ${sortClause} LIMIT $1`, [lim]);
      return convertRows(table, rows);
    },
    async filter(query, sort, limit) {
      const sql = createSql();
      const { clause, params, nextIdx } = buildWhereClause(query || {});
      const sortClause = buildSortClause(sort || '-created_date');
      const lim = Math.min(limit || 500, 5000);
      const where = clause ? `WHERE ${clause}` : '';
      const rows = await sql(`SELECT * FROM ${table} ${where} ${sortClause} LIMIT $${nextIdx}`, [...params, lim]);
      return convertRows(table, rows);
    },
    async get(id) {
      const sql = createSql();
      const rows = await sql(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      return convertRow(table, rows[0] || null);
    },
    async create(data) {
      const sql = createSql();
      const cols = Object.keys(data);
      const vals = cols.map((c, i) => `$${i + 1}`);
      const params = cols.map(c => serializeValue(table, c, data[c]));
      const result = await sql(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING *`, params);
      return convertRow(table, result[0]);
    },
    async update(id, data) {
      const sql = createSql();
      const cols = Object.keys(data);
      const setClauses = cols.map((c, i) => `${c} = $${i + 1}`);
      const params = cols.map(c => serializeValue(table, c, data[c]));
      params.push(id);
      const result = await sql(`UPDATE ${table} SET ${setClauses.join(', ')}, updated_date = now() WHERE id = $${cols.length + 1} RETURNING *`, params);
      return convertRow(table, result[0] || null);
    },
    async updateMany(query, update) {
      const sql = createSql();
      const { clause, params: whereParams, nextIdx } = buildWhereClause(query || {});
      const setParts = [];
      const setParams = [];
      let idx = nextIdx;
      for (const [op, opData] of Object.entries(update || {})) {
        if (op === '$set') {
          for (const [k, v] of Object.entries(opData)) {
            setParts.push(`${k} = $${idx++}`);
            setParams.push(serializeValue(table, k, v));
          }
        } else if (op === '$inc') {
          for (const [k, v] of Object.entries(opData)) {
            setParts.push(`${k} = COALESCE(${k}, 0) + $${idx++}`);
            setParams.push(v);
          }
        }
      }
      setParts.push('updated_date = now()');
      const allParams = [...whereParams, ...setParams];
      const where = clause ? `WHERE ${clause}` : '';
      const result = await sql(`UPDATE ${table} SET ${setParts.join(', ')} ${where} RETURNING *`, allParams);
      return convertRows(table, result);
    },
  };
}