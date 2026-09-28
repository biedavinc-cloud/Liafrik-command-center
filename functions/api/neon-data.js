// Cloudflare Pages Function: POST /api/neon-data — generic entity CRUD on Neon
import { createSql, TABLE_MAP, serializeValue, buildWhereClause, buildSortClause, convertRow, convertRows, ident } from '../_shared/neon.js';
import { getUser } from '../_shared/auth.js';

const WRITE_OPS = new Set(['create', 'bulkCreate', 'update', 'bulkUpdate', 'updateMany', 'delete', 'deleteMany']);

// Columns that must never be returned in read responses
const EXCLUDED_COLUMNS = {
  payment_providers: ['secret_value', 'webhook_secret_value', 'site_id_value'],
};

function stripSecrets(table, rows) {
  const excluded = EXCLUDED_COLUMNS[table];
  if (!excluded || !excluded.length) return rows;
  const strip = (row) => {
    if (!row) return row;
    const out = { ...row };
    for (const c of excluded) delete out[c];
    return out;
  };
  return Array.isArray(rows) ? rows.map(strip) : strip(rows);
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request: req, env }) {

  try {
    const user = await getUser(req, env);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { entity, operation, id, data, rows, query, update, sort, limit } = body;

    const table = TABLE_MAP[entity];
    if (!table) return json({ error: `Unknown entity: ${entity}` }, 400);
    if (!operation) return json({ error: 'Missing operation' }, 400);

    // Write operations require admin
    if (WRITE_OPS.has(operation) && user.role !== 'admin') {
      return json({ error: 'Forbidden: admin required for mutations' }, 403);
    }

    const sql = createSql(env);

    // ── LIST ──
    if (operation === 'list') {
      const sortClause = buildSortClause(sort || '-created_date');
      const lim = Math.min(limit || 500, 5000);
      const rows = await sql(`SELECT * FROM ${table} ${sortClause} LIMIT $1`, [lim]);
      return json(stripSecrets(table, convertRows(table, rows)));
    }

    // ── FILTER ──
    if (operation === 'filter') {
      const { clause, params, nextIdx } = buildWhereClause(query || {});
      const sortClause = buildSortClause(sort || '-created_date');
      const lim = Math.min(limit || 500, 5000);
      const where = clause ? `WHERE ${clause}` : '';
      const fullSql = `SELECT * FROM ${table} ${where} ${sortClause} LIMIT $${nextIdx}`;
      const rows = await sql(fullSql, [...params, lim]);
      return json(stripSecrets(table, convertRows(table, rows)));
    }

    // ── GET ──
    if (operation === 'get') {
      const rows = await sql(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      return json(stripSecrets(table, convertRow(table, rows[0] || null)));
    }

    // ── COUNT ──
    if (operation === 'count') {
      const { clause, params: whereParams } = buildWhereClause(query || {});
      const where = clause ? `WHERE ${clause}` : '';
      const rows = await sql(`SELECT COUNT(*)::int as count FROM ${table} ${where}`, whereParams);
      return json({ count: rows[0]?.count || 0 });
    }

    // ── CREATE ──
    if (operation === 'create') {
      const cols = Object.keys(data).map(ident);
      const vals = cols.map((c, i) => `$${i + 1}`);
      const params = cols.map(c => serializeValue(table, c, data[c]));
      // Add created_by_id
      const allCols = [...cols];
      if (!allCols.includes('created_by_id') && user.id) {
        allCols.push('created_by_id');
        vals.push(`$${cols.length + 1}`);
        params.push(user.id);
      }
      const result = await sql(
        `INSERT INTO ${table} (${allCols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING *`,
        params
      );
      return json(convertRow(table, result[0]));
    }

    // ── BULK CREATE ──
    if (operation === 'bulkCreate') {
      if (!Array.isArray(rows) || !rows.length) return json([]);
      const allCols = [...new Set(rows.flatMap(r => Object.keys(r)))].map(ident);
      // Add created_by_id to all rows if user is available
      if (user.id && !allCols.includes('created_by_id')) allCols.push('created_by_id');
      const placeholders = [];
      const params = [];
      let idx = 1;
      for (const row of rows) {
        const ph = [];
        for (const col of allCols) {
          ph.push(`$${idx++}`);
          const val = col === 'created_by_id' ? user.id : serializeValue(table, col, row[col]);
          params.push(val);
        }
        placeholders.push(`(${ph.join(', ')})`);
      }
      const result = await sql(
        `INSERT INTO ${table} (${allCols.join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`,
        params
      );
      return json(stripSecrets(table, convertRows(table, result)));
    }

    // ── UPDATE ──
    if (operation === 'update') {
      const cols = Object.keys(data).map(ident);
      const setClauses = cols.map((c, i) => `${c} = $${i + 1}`);
      const params = cols.map(c => serializeValue(table, c, data[c]));
      params.push(id);
      const result = await sql(
        `UPDATE ${table} SET ${setClauses.join(', ')}, updated_date = now() WHERE id = $${cols.length + 1} RETURNING *`,
        params
      );
      return json(convertRow(table, result[0] || null));
    }

    // ── BULK UPDATE ──
    if (operation === 'bulkUpdate') {
      if (!Array.isArray(rows) || !rows.length) return json([]);
      const results = [];
      for (const row of rows) {
        const { id: rowId, ...rest } = row;
        const cols = Object.keys(rest).map(ident);
        if (!cols.length) { results.push(row); continue; }
        const setClauses = cols.map((c, i) => `${c} = $${i + 1}`);
        const params = cols.map(c => serializeValue(table, c, rest[c]));
        params.push(rowId);
        const r = await sql(
          `UPDATE ${table} SET ${setClauses.join(', ')}, updated_date = now() WHERE id = $${cols.length + 1} RETURNING *`,
          params
        );
        results.push(convertRow(table, r[0]));
      }
      return json(results);
    }

    // ── UPDATE MANY ──
    if (operation === 'updateMany') {
      const { clause, params: whereParams, nextIdx } = buildWhereClause(query || {});
      const setParts = [];
      const setParams = [];
      let idx = nextIdx;
      for (const [op, opData] of Object.entries(update || {})) {
        if (op === '$set') {
          for (const [k, v] of Object.entries(opData)) {
            setParts.push(`${ident(k)} = $${idx++}`);
            setParams.push(serializeValue(table, k, v));
          }
        } else if (op === '$inc') {
          for (const [k, v] of Object.entries(opData)) {
            setParts.push(`${ident(k)} = COALESCE(${ident(k)}, 0) + $${idx++}`);
            setParams.push(v);
          }
        } else if (op === '$unset') {
          for (const k of Object.keys(opData)) {
            setParts.push(`${ident(k)} = NULL`);
          }
        }
      }
      setParts.push('updated_date = now()');
      const allParams = [...whereParams, ...setParams];
      const where = clause ? `WHERE ${clause}` : '';
      const result = await sql(
        `UPDATE ${table} SET ${setParts.join(', ')} ${where} RETURNING *`,
        allParams
      );
      return json({ modified: result.length, rows: convertRows(table, result) });
    }

    // ── DELETE ──
    if (operation === 'delete') {
      const result = await sql(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
      return json(convertRow(table, result[0] || null));
    }

    // ── DELETE MANY ──
    if (operation === 'deleteMany') {
      const { clause, params: whereParams } = buildWhereClause(query || {});
      const where = clause ? `WHERE ${clause}` : '';
      const result = await sql(`DELETE FROM ${table} ${where} RETURNING *`, whereParams);
      return json({ deleted: result.length });
    }

    return json({ error: `Unknown operation: ${operation}` }, 400);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}