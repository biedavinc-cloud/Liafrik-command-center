import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import {
  createSql,
  TABLE_MAP,
  serializeValue,
  buildWhereClause,
  buildSortClause,
  convertRow,
  convertRows,
} from '../../shared/neonClient.ts';

const READ_OPS = new Set(['list', 'filter', 'get']);
const WRITE_OPS = new Set(['create', 'bulkCreate', 'update', 'bulkUpdate', 'updateMany', 'delete', 'deleteMany']);

// Columns that must never be returned in read responses (sensitive secrets stored in DB)
const EXCLUDED_COLUMNS: Record<string, string[]> = {
  payment_providers: ['secret_value', 'webhook_secret_value', 'site_id_value'],
};

function selectColumns(table: string): string {
  const excluded = EXCLUDED_COLUMNS[table];
  if (!excluded || !excluded.length) return '*';
  return excluded.map(c => `"${c}"`).join(', ');
  // Note: we build a column list excluding secrets — but simpler to SELECT * then strip
}

function stripSecrets(table: string, rows: any): any {
  const excluded = EXCLUDED_COLUMNS[table];
  if (!excluded || !excluded.length) return rows;
  const strip = (row: any) => {
    if (!row) return row;
    const out = { ...row };
    for (const c of excluded) delete out[c];
    return out;
  };
  return Array.isArray(rows) ? rows.map(strip) : strip(rows);
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { entity, operation, id, data, rows, query, update, sort, limit } = body;

    const table = TABLE_MAP[entity];
    if (!table) return Response.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    if (!operation) return Response.json({ error: 'Missing operation' }, { status: 400 });

    // Write operations require admin
    if (WRITE_OPS.has(operation) && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin required for mutations' }, { status: 403 });
    }

    const sql = createSql();

    // ── LIST ──
    if (operation === 'list') {
      const sortClause = buildSortClause(sort || '-created_date');
      const lim = Math.min(limit || 500, 5000);
      const rows = await sql(`SELECT * FROM ${table} ${sortClause} LIMIT $1`, [lim]);
      return Response.json(stripSecrets(table, convertRows(table, rows)));
    }

    // ── FILTER ──
    if (operation === 'filter') {
      const { clause, params, nextIdx } = buildWhereClause(query || {});
      const sortClause = buildSortClause(sort || '-created_date');
      const lim = Math.min(limit || 500, 5000);
      const where = clause ? `WHERE ${clause}` : '';
      const fullSql = `SELECT * FROM ${table} ${where} ${sortClause} LIMIT $${nextIdx}`;
      const rows = await sql(fullSql, [...params, lim]);
      return Response.json(stripSecrets(table, convertRows(table, rows)));
    }

    // ── GET ──
    if (operation === 'get') {
      const rows = await sql(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      return Response.json(stripSecrets(table, convertRow(table, rows[0] || null)));
    }

    // ── CREATE ──
    if (operation === 'create') {
      const cols = Object.keys(data);
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
      return Response.json(convertRow(table, result[0]));
    }

    // ── BULK CREATE ──
    if (operation === 'bulkCreate') {
      if (!Array.isArray(rows) || !rows.length) return Response.json([]);
      const allCols = [...new Set(rows.flatMap(r => Object.keys(r)))];
      const placeholders: string[] = [];
      const params: any[] = [];
      let idx = 1;
      for (const row of rows) {
        const ph: string[] = [];
        for (const col of allCols) {
          ph.push(`$${idx++}`);
          params.push(serializeValue(table, col, row[col]));
        }
        placeholders.push(`(${ph.join(', ')})`);
      }
      const result = await sql(
        `INSERT INTO ${table} (${allCols.join(', ')}) VALUES ${placeholders.join(', ')} RETURNING *`,
        params
      );
      return Response.json(convertRows(table, result));
    }

    // ── UPDATE ──
    if (operation === 'update') {
      const cols = Object.keys(data);
      const setClauses = cols.map((c, i) => `${c} = $${i + 1}`);
      const params = cols.map(c => serializeValue(table, c, data[c]));
      params.push(id);
      const result = await sql(
        `UPDATE ${table} SET ${setClauses.join(', ')}, updated_date = now() WHERE id = $${cols.length + 1} RETURNING *`,
        params
      );
      return Response.json(convertRow(table, result[0] || null));
    }

    // ── BULK UPDATE ──
    if (operation === 'bulkUpdate') {
      if (!Array.isArray(rows) || !rows.length) return Response.json([]);
      const results: any[] = [];
      for (const row of rows) {
        const { id: rowId, ...rest } = row;
        const cols = Object.keys(rest);
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
      return Response.json(results);
    }

    // ── UPDATE MANY ──
    if (operation === 'updateMany') {
      const { clause, params: whereParams, nextIdx } = buildWhereClause(query || {});
      const setParts: string[] = [];
      const setParams: any[] = [];
      let idx = nextIdx;
      for (const [op, opData] of Object.entries(update || {})) {
        if (op === '$set') {
          for (const [k, v] of Object.entries(opData as any)) {
            setParts.push(`${k} = $${idx++}`);
            setParams.push(serializeValue(table, k, v));
          }
        } else if (op === '$inc') {
          for (const [k, v] of Object.entries(opData as any)) {
            setParts.push(`${k} = COALESCE(${k}, 0) + $${idx++}`);
            setParams.push(v);
          }
        } else if (op === '$unset') {
          for (const k of Object.keys(opData as any)) {
            setParts.push(`${k} = NULL`);
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
      return Response.json({ modified: result.length, rows: convertRows(table, result) });
    }

    // ── DELETE ──
    if (operation === 'delete') {
      const result = await sql(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
      return Response.json(convertRow(table, result[0] || null));
    }

    // ── DELETE MANY ──
    if (operation === 'deleteMany') {
      const { clause, params: whereParams } = buildWhereClause(query || {});
      const where = clause ? `WHERE ${clause}` : '';
      const result = await sql(`DELETE FROM ${table} ${where} RETURNING *`, whereParams);
      return Response.json({ deleted: result.length });
    }

    return Response.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}