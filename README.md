LIAFRIK Command Center

Private Enterprise Control Plane for the LIAFRIK SaaS Ecosystem

LIAFRIK Command Center is the centralized administration, security, operations, analytics and infrastructure control plane for the LIAFRIK ecosystem.

One ecosystem. One command center. One secure control layer.

The Command Center is designed to centrally manage authorized LIAFRIK applications, users, administrators, permissions, environments, integrations, payments, communications, monitoring, analytics, AI operations and infrastructure.

Core Architecture
Founder / Super Admin
        ↓
LIAFRIK Command Center
        ↓
Central Identity • RBAC • Audit • Analytics • Monitoring
        ↓
Application Registry / Control Protocol / Connectors
        ↓
LIAFRIK Applications & Services
        ↓
GitHub + Cloudflare + Neon PostgreSQL
Infrastructure Principles

The project is designed to remain independent from any single application builder or vendor.

Production Source of Truth

Neon PostgreSQL is the authoritative production database.

Application / Command Center
        ↓
Secure Backend / API
        ↓
Neon PostgreSQL

There must be no Base44 database mirror, mock database or parallel source of truth.

All production data, migrations, schemas, indexes, constraints and persistent application state must be managed through the production backend and Neon.

Source Control

GitHub is the authoritative source-code repository.

All production-ready code must be committed and maintained in GitHub.

Repository structure, environment configuration, migrations and deployment configuration must remain reproducible from the repository.

Deployment

The application must be deployable to Cloudflare using production-ready configuration.

Target architecture:

GitHub
   ↓
Cloudflare
   ↓
LIAFRIK Command Center
   ↓
Secure Backend / APIs
   ↓
Neon PostgreSQL

No vendor-specific builder dependency should be required for production operation.

Development
Prerequisites

Install:

Node.js
npm
Git
GitHub CLI (optional)
Neon CLI (optional but recommended)
Cloudflare Wrangler

Install dependencies:

npm install

Run the application using the project's configured development command:

npm run dev

The exact development command may vary according to the current application configuration.

Environment Configuration

Never commit secrets to GitHub.

Production secrets must be stored securely through the deployment environment.

Typical configuration includes:

DATABASE_URL=
GEMINI_API_KEY=

Additional provider credentials must also remain server-side.

Never expose:

database credentials
API keys
PSP secret keys
webhook secrets
authentication secrets
private tokens

in frontend code, Git commits, logs or client-side storage.

Database

LIAFRIK Command Center uses Neon PostgreSQL as the production source of truth.

Database changes must be handled through controlled migrations.

Before production deployment, verify:

database connectivity
migrations
schema integrity
indexes
constraints
authentication data
RBAC data
audit logs
application registry
integration configuration
environment isolation
Authentication & Security

The Command Center is a private, invite-only enterprise platform.

There is no public account creation.

Administrators and staff members are created or invited by authorized Super Administrators.

Security architecture includes:

secure authentication
server-side RBAC
application-level permissions
environment-level permissions
secure sessions
password recovery
MFA readiness
audit logging
security events
invitation management
least-privilege access
production action confirmation

The Founder / Super Admin maintains the highest level of control.

Application Control

Applications connect to the Command Center through secure APIs, connectors and the LIAFRIK Control Protocol.

The Command Center must remain application-agnostic.

Applications dynamically expose their capabilities.

For example:

LIAFRIK
 ├── Products
 ├── Orders
 ├── Customers
 ├── Payments
 └── Analytics

POS Flow
 ├── Applications
 ├── Customers
 ├── Documents
 └── Payments

Atlas CRM
 ├── Staff
 ├── Branches
 ├── Reviews
 └── Performance

Applications do not need to expose the same modules.

Only authorized and actually supported capabilities should appear.

AI

The Command Center includes an AI-native architecture using a provider-agnostic AI Gateway.

Gemini may be used as the primary AI provider.

AI capabilities include:

natural-language Command Center interaction
system analysis
AIOps
incident analysis
security analysis
application onboarding
operational summaries
analytics interpretation
anomaly detection
assisted troubleshooting
action recommendations

AI must never receive unrestricted access to production infrastructure.

All AI actions must respect:

RBAC
application permissions
environment permissions
audit requirements
human confirmation for sensitive production operations

AI responses must distinguish between verified data, analysis, recommendations and unknown information.

Payments

The Command Center supports a provider-agnostic payment architecture.

Supported or planned providers may include:

NexaPay
Stripe
Paystack
Flutterwave
PayUnit
Paddle
additional providers

Provider credentials are stored server-side only.

Payment Links use USD as the default currency, while authorized users can select another supported currency.

The platform's base/default currency is controlled exclusively by the Super Admin.

Exchange rates must come from a reliable live exchange-rate provider and must not be hardcoded or fabricated.

Communication

The Command Center may provide:

internal messaging
direct messages
groups
application channels
notifications
mentions
file attachments
Slack integrations
Telegram integrations

All integrations must display their real connection status and actual capabilities.

No simulated integrations are permitted in production.

Audit & Governance

Sensitive operations must be auditable.

Audit records may include:

authentication events
administrator changes
permission changes
application registration
configuration changes
payment operations
PSP configuration
API key changes
automation executions
AI requests
AI-assisted actions
production deployments
security events

Each relevant operation should support correlation and traceability.

Environments

The platform must maintain clear separation between:

Development
Staging
Production

Production credentials and production data must never be exposed to development environments.

Git Workflow

Use Git as the authoritative source-control system.

Typical workflow:

git status
git add .
git commit -m "Describe change"
git push origin main

Production deployment should occur through the configured Cloudflare deployment pipeline.

Never commit secrets.

Production Requirements

Before considering the system production-ready, verify:

GitHub repository is current

Neon production database is connected

Neon is the authoritative source of truth

No Base44 database dependency remains

Authentication is private and invite-only

RBAC works server-side

Audit logging works

AI provider is securely configured

Payment providers use server-side credentials

Live exchange-rate provider is configured

Cloudflare deployment works

Environment variables are securely configured

No secrets exist in the repository

Production build succeeds

Critical API endpoints have been verified

Database migrations are reproducible

Application connectors are functional

Monitoring and error handling are operational

Project Ownership

This project is part of the LIAFRIK ecosystem.

LIAFRIK Command Center
Private Enterprise Control Plane
LIAFRIK — African roots, global vision.

The project should not contain third-party builder branding, signatures, documentation references, deployment instructions or proprietary tooling requirements that are unnecessary for the operation of the LIAFRIK platform.

Official Ecosystem

LIAFRIK
Founder Vincent Nogue
Global SaaS Ecosystem
https://liafrik.com

LIAFRIK Command Center
Private internal administration and operations platform.

License

Private and proprietary.

Unauthorized copying, redistribution, resale or commercial use is prohibited unless explicitly authorized by LIAFRIK.
