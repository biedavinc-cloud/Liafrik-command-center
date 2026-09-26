import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { neonRepo } from '../../shared/neonRepo.ts';

// Branding management — singleton (key='global').
// GET  → returns the branding record (public, for sidebar/header display).
// SET  → updates branding fields (admin only). Logo URLs are uploaded
//        client-side via UploadPublicFile and passed here as file_url strings.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const body = await req.json().catch(() => ({}));
    const operation = body.operation || 'get';

    const repo = neonRepo('Branding');

    if (operation === 'get') {
      // Public read — any authenticated user can see branding
      const rows = await repo.filter({ key: 'global' });
      return Response.json(rows[0] || { key: 'global', organization_name: null, logo_url: null });
    }

    if (operation === 'set') {
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

      const allowed = [
        'organization_name', 'organization_description',
        'logo_url', 'logo_dark_url', 'favicon_url', 'primary_color',
      ];
      const data: Record<string, any> = { updated_by: user.email };
      for (const k of allowed) {
        if (body[k] !== undefined) data[k] = body[k];
      }

      // Upsert: if branding record exists, update; otherwise create
      const existing = await repo.filter({ key: 'global' });
      let result;
      if (existing[0]) {
        result = await repo.update(existing[0].id, data);
      } else {
        data.key = 'global';
        result = await repo.create(data);
      }

      // Audit
      const auditRepo = neonRepo('AuditEvent');
      await auditRepo.create({
        actor: user.email,
        actor_role: user.role,
        action: 'branding.update',
        resource: 'branding',
        resource_id: result.id,
        outcome: 'success',
        risk_level: 'medium',
        correlation_id: `branding_${Date.now()}`,
      });

      return Response.json(result);
    }

    return Response.json({ error: 'Unknown operation' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}