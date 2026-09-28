# Liafrik Command Center — Architecture

## Overview

The Liafrik Command Center is a centralized control plane for managing a portfolio of independent SaaS applications, marketplaces, and internal digital tools. It is **not** a database for application business data — it is a control plane that monitors, manages, and coordinates applications through a standardized protocol.

## Architecture Layers

```
Presentation Layer (React + Tailwind)
        ↓
Application / Domain Layer (Services)
        ↓
API / Service Layer (Backend Functions)
        ↓
Control Protocol (LCP)
        ↓
Application Connectors
        ↓
External Applications
        ↓
Provider Infrastructure (Neon, GitHub, Cloudflare)
```

## Current State

### What Works Today
- **Application Registry**: Full CRUD with dynamic capability discovery
- **Control Protocol (LCP v1)**: Formal specification with versioned endpoints
- **Connector Interface**: Abstraction with 16 operations, unsupported returns controlled state
- **Audit System**: Immutable audit log with correlation IDs, risk levels, before/after state
- **RBAC**: 7 global roles with permission checking
- **Safe Mode**: Global read-only mode with mutation enforcement
- **Application Lock**: Per-application lock with mutation blocking
- **Maintenance Mode**: Per-application maintenance with environment awareness
- **Event Bus**: Formal event catalog with 35+ event types
- **Rule Engine**: WHEN/IF/THEN automation rules with action execution
- **Configuration Management**: Feature flags, settings, secrets (masked)
- **Incident Center**: Full lifecycle with timeline and correlation IDs
- **Security Center**: Sessions, security events, suspicious activity tracking
- **API Key Management**: Create, rotate, revoke with scoped keys
- **Webhook System**: Bidirectional with delivery tracking and retry
- **Deployment Center**: Status tracking with commit/branch metadata
- **Secret Management**: Lifecycle abstraction with masked hints
- **Change Management**: Before/after tracking with correlation IDs
- **Observability**: Health, latency, error rate, uptime tracking
- **Notification Engine**: In-app notifications with rule-based triggers
- **Bilingual**: Full English + French translations
- **Demo Mode**: Clearly labeled demo data across all entities

### Mock / Prototype
- Application health metrics (demo data, clearly labeled)
- API request charts (demo series)
- Revenue/transaction figures (demo data)
- User/administrator counts (demo data)
- Connector operations return "unsupported" for unconnected apps

### Connected
- Neon Auth (Better Auth, email/password, invite-only)
- Neon PostgreSQL (all entities)
- Cloudflare Pages Functions (`functions/api/`)

### Not Connected (Honestly Labeled)
- **Neon PostgreSQL**: `not_connected` — architecture prepared
- **GitHub**: `not_connected` — provider abstraction ready
- **Cloudflare**: `not_connected` — provider abstraction ready
- **Email delivery**: Not connected — notifications are in-app only
- **Real application APIs**: Not connected — LCP contracts defined but no live endpoints

## Database Model

### Control-Plane Entities (not application business data)

| Entity | Purpose |
|--------|---------|
| Application | Registry of managed applications |
| ApplicationEnvironment | Per-environment configuration (dev/staging/prod) |
| Deployment | Deployment records with status tracking |
| Administrator | Platform administrators with role assignments |
| Role | RBAC role definitions with permissions |
| AuditEvent | Immutable audit log with correlation IDs |
| Notification | In-app notifications |
| ActivityEvent | Event bus with formal event types |
| Integration | Provider integration registry |
| ApiKey | Scoped API keys with lifecycle |
| WebhookConfig | Webhook subscriptions with delivery tracking |
| Incident | Incident records with timeline |
| NotificationRule | Notification trigger rules |
| ApiLog | API request logs with correlation IDs |
| SecurityEvent | Security event tracking |
| Session | User session management |
| ChangeRecord | Configuration change history |
| Secret | Secret lifecycle abstraction (masked) |
| SystemState | Global system state (Safe Mode, infrastructure) |
| AppConfig | Application configuration (feature flags, settings) |
| AutomationRule | Rule engine rules (WHEN/IF/THEN) |

## Control Protocol (LCP)

### Versioning
- **v1** (current): `/health`, `/version`, `/capabilities`, `/metadata`, `/actions`, `/webhooks`
- **v1.1** (planned): Adds `/users`, `/administrators`, `/analytics`, `/audit`, `/notifications`, `/settings`
- **v2** (future): Adds `/events/stream`, `/config`

### Connection States (never faked)
- `implemented` — endpoint exists and returned valid data
- `configured` — URL set but not verified
- `pending` — registered, handshake not started
- `connected` — handshake completed, health passing
- `error` — endpoint returned error
- `unsupported` — capability not declared by application
- `mock` — simulated for demo (clearly labeled)

## Connector Interface

16 operations with controlled `unsupported` returns:
`connect`, `disconnect`, `testConnection`, `getMetadata`, `getCapabilities`, `getHealth`, `getVersion`, `getUsers`, `getAdministrators`, `getAnalytics`, `getAuditLogs`, `getNotifications`, `getSettings`, `executeAction`, `getConfiguration`, `updateConfiguration`

## Authentication Architecture

### Current (Neon + Cloudflare)
- Email/password with OTP verification
- Google OAuth
- Session-based with token management

### Prepared (Phase 4)
- Centralized identity (One Liafrik Identity)
- SSO / OIDC
- Session exchange for application access
- Signed application sessions
- Service credentials for API-to-API communication

## Authorization (RBAC)

### Global Roles
SuperAdmin → Global Admin → Platform Admin → Manager → Support → Analyst → Viewer

### Permission Scopes
`GLOBAL → APPLICATION → ENVIRONMENT → MODULE → ACTION`

### Enforcement
- Client-side: `useCan()` hook checks permissions
- Server-side: Backend functions verify `user.role === 'admin'`
- Safe Mode: `useAction` hook blocks all mutations when active
- Application Lock: Service layer blocks mutations on locked apps

## Event Bus

35+ formal event types in dot-namespace convention:
- `application.*` — lifecycle, health, lock, maintenance
- `user.*` / `admin.*` — identity changes
- `security.*` — security events
- `deployment.*` — deployment lifecycle
- `webhook.*` — webhook delivery
- `incident.*` — incident lifecycle
- `system.*` — system-level events

Every event includes: `event_type`, `severity`, `correlation_id`, `actor`, `environment`, `timestamp`

## Correlation IDs

Format: `cc_01JXXXXXXXXXXXX`

A single operation is traceable across:
- Audit logs
- API logs
- Webhook deliveries
- Events
- Incidents
- Configuration changes

## Provider Abstractions

| Provider Type | Abstraction | Status |
|--------------|------------|--------|
| Database | `DatabaseProvider` | Neon prepared, not connected |
| Repository | `RepositoryProvider` | GitHub prepared, not connected |
| Edge/CDN | `EdgeProvider` | Cloudflare prepared, not connected |
| Authentication | `AuthProvider` | Neon Auth active, SSO prepared |
| Email | `EmailProvider` | Not connected |
| Storage | `StorageProvider` | Neon active |
| Payments | `PaymentProvider` | Not connected |
| Monitoring | `MonitoringProvider` | Architecture ready |

## Migration Readiness

The application runs on Neon + Cloudflare and can be extended with:
```
GitHub (code) + Neon (database) + Cloudflare (hosting/CDN)
```

### Separation of Concerns
- **UI**: `src/pages/`, `src/components/` — React, no business logic
- **Business Logic**: `src/lib/services/` — framework-agnostic service functions
- **Data Access**: `src/lib/data/repositories.js` — single swap point for database
- **Protocol**: `src/lib/protocol/` — LCP spec, connector interface, event types
- **SDK**: `src/lib/sdk/` — conceptual @liafrik/control-sdk modules
- **Backend**: `functions/api/` — server-side operations

Data access is isolated in `repositories.js`.

## Security Checklist

- ✅ Authentication protected (Neon Auth)
- ✅ Authorization enforced (RBAC + admin checks in backend functions)
- ✅ Application isolation (every query scoped by application_id)
- ✅ Environment isolation (every query scoped by environment)
- ✅ Secrets protected (masked hints only, never plaintext in browser)
- ✅ API keys scoped (per-application, per-environment)
- ✅ API keys revocable (status lifecycle)
- ✅ Audit logs immutable (create-only, no update/delete from UI)
- ✅ Dangerous actions confirmed (HIGH/CRITICAL risk levels)
- ✅ Safe Mode implemented (global mutation block)
- ✅ Application lock implemented (per-app mutation block)
- ✅ Maintenance mode implemented (per-app, per-environment)
- ✅ Sessions revocable (SuperAdmin can terminate)
- ✅ Errors sanitized (no stack traces to users)
- ✅ No credentials exposed to browser
- ✅ No fake connection states (all providers honestly labeled)
- ✅ Demo data clearly marked (is_demo flag on all demo records)

## Future (Phase 4)

- Real Neon PostgreSQL connection
- Real GitHub integration (deployments, commits, releases)
- Real Cloudflare integration (Workers, DNS, CDN)
- Real SSO / centralized identity
- Real application API connections via LCP
- Real webhook delivery with signatures
- Real email notifications
- Real monitoring with live metrics
- @liafrik/control-sdk published to npm