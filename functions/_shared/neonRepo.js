import {
  createSql,
  TABLE_MAP,
  serializeValue,
  buildWhereClause,
  buildSortClause,
  convertRow,
  convertRows,
  ident
} from './neon.js';
function neonRepo(entity) {
  const table = TABLE_MAP[entity];
  if (!table) throw new Error(`Unknown entity: ${entity}`);
  return {
    async list(sort, limit) {
      const sql = createSql();
      const sortClause = buildSortClause(sort || "-created_date");
      const lim = Math.min(limit || 500, 5e3);
      const rows = await sql(`SELECT * FROM ${table} ${sortClause} LIMIT $1`, [lim]);
      return convertRows(table, rows);
    },
    async filter(query, sort, limit) {
      const sql = createSql();
      const { clause, params, nextIdx } = buildWhereClause(query || {});
      const sortClause = buildSortClause(sort || "-created_date");
      const lim = Math.min(limit || 500, 5e3);
      const where = clause ? `WHERE ${clause}` : "";
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
      const cols = Object.keys(data).map(ident);
      const vals = cols.map((c, i) => `$${i + 1}`);
      const params = cols.map((c) => serializeValue(table, c, data[c]));
      const result = await sql(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")}) RETURNING *`, params);
      return convertRow(table, result[0]);
    },
    async bulkCreate(rows) {
      const sql = createSql();
      if (!Array.isArray(rows) || !rows.length) return [];
      const allCols = [...new Set(rows.flatMap((r) => Object.keys(r)))].map(ident);
      const placeholders = [];
      const params = [];
      let idx = 1;
      for (const row of rows) {
        const ph = [];
        for (const col of allCols) {
          ph.push(`$${idx++}`);
          params.push(serializeValue(table, col, row[col]));
        }
        placeholders.push(`(${ph.join(", ")})`);
      }
      const result = await sql(`INSERT INTO ${table} (${allCols.join(", ")}) VALUES ${placeholders.join(", ")} RETURNING *`, params);
      return convertRows(table, result);
    },
    async update(id, data) {
      const sql = createSql();
      const cols = Object.keys(data).map(ident);
      const setClauses = cols.map((c, i) => `${c} = $${i + 1}`);
      const params = cols.map((c) => serializeValue(table, c, data[c]));
      params.push(id);
      const result = await sql(`UPDATE ${table} SET ${setClauses.join(", ")}, updated_date = now() WHERE id = $${cols.length + 1} RETURNING *`, params);
      return convertRow(table, result[0] || null);
    },
    async delete(id) {
      const sql = createSql();
      const result = await sql(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
      return convertRow(table, result[0] || null);
    },
    async deleteMany(query) {
      const sql = createSql();
      const { clause, params: whereParams } = buildWhereClause(query || {});
      const where = clause ? `WHERE ${clause}` : "";
      const result = await sql(`DELETE FROM ${table} ${where} RETURNING *`, whereParams);
      return convertRows(table, result);
    },
    async count(query) {
      const sql = createSql();
      const { clause, params: whereParams } = buildWhereClause(query || {});
      const where = clause ? `WHERE ${clause}` : "";
      const rows = await sql(`SELECT COUNT(*)::int as count FROM ${table} ${where}`, whereParams);
      return rows[0]?.count || 0;
    },
    async updateMany(query, update) {
      const sql = createSql();
      const { clause, params: whereParams, nextIdx } = buildWhereClause(query || {});
      const setParts = [];
      const setParams = [];
      let idx = nextIdx;
      for (const [op, opData] of Object.entries(update || {})) {
        if (op === "$set") {
          for (const [k, v] of Object.entries(opData).map(([a,b])=>[ident(a),b])) {
            setParts.push(`${k} = $${idx++}`);
            setParams.push(serializeValue(table, k, v));
          }
        } else if (op === "$inc") {
          for (const [k, v] of Object.entries(opData).map(([a,b])=>[ident(a),b])) {
            setParts.push(`${k} = COALESCE(${k}, 0) + $${idx++}`);
            setParams.push(v);
          }
        }
      }
      setParts.push("updated_date = now()");
      const allParams = [...whereParams, ...setParams];
      const where = clause ? `WHERE ${clause}` : "";
      const result = await sql(`UPDATE ${table} SET ${setParts.join(", ")} ${where} RETURNING *`, allParams);
      return convertRows(table, result);
    }
  };
}
export {
  neonRepo
};
