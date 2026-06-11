`# ContaCLWEB — Contexto del proyecto

Sistema contable web para contadores chilenos que atienden clientes pequeños.
Versión web de ContaCL (app de escritorio), alineada bajo la marca ContaCLWEB.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Estado servidor | React Query (TanStack Query v5) |
| Formularios | React Hook Form + Zod |
| Routing | React Router v6 |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Auth | JWT (bcryptjs + jsonwebtoken) |
| Email | Resend |
| Storage | Cloudflare R2 (local: carpeta uploads/) |
| Deploy | Railway |

---

## Estructura de carpetas

```
ContaCLWEB/
├── apps/
│   ├── web/                        # React + Vite
│   │   └── src/
│   │       ├── components/         # UI reutilizable
│   │       ├── pages/              # Login, Dashboard, Empresas, etc.
│   │       ├── hooks/              # useEmpresas, useClientes, etc.
│   │       ├── lib/                # api.ts (axios), queryClient.ts
│   │       └── types/              # tipos locales si se necesitan
│   └── api/                        # Express + Prisma
│       ├── src/
│       │   ├── routes/             # auth, empresas, clientes, documentos, cuentas
│       │   ├── services/           # lógica de negocio, integración SII
│       │   ├── middlewares/        # auth.ts, validate.ts, errorHandler.ts
│       │   └── lib/                # prisma.ts (singleton)
│       └── prisma/
│           ├── schema.prisma
│           ├── migrations/
│           └── seed/
│               └── index.ts        # Plan de Cuentas chileno
├── packages/
│   ├── shared-types/               # Interfaces TypeScript compartidas
│   │   └── src/index.ts
│   └── validations/                # Schemas Zod compartidos
│       └── src/index.ts
├── CLAUDE.md
├── package.json                    # workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml              # PostgreSQL local
└── .env.example
```

---

## Modelo de datos (Prisma)

Tablas principales:
- `usuarios` — auth, rol (ADMIN | CONTADOR | VISOR)
- `empresas` — RUT, razón social, giro, actividad económica
- `clientes` — por empresa, RUT único por empresa
- `documentos_tributarios` — boletas, facturas, notas de crédito/débito
- `lineas_documento` — detalle de cada documento
- `cuentas_contables` — Plan de Cuentas, código jerárquico (1, 1.1, 1.1.01)
- `asientos_contables` — libro diario, puede venir de un documento
- `lineas_asiento` — debe/haber por cuenta

**Reglas críticas de base de datos:**
- Todos los campos de dinero: `Decimal(19,4)` — NUNCA Float
- RUT único por empresa en tabla clientes: `@@unique([empresaId, rut])`
- Folio único por empresa+tipo en documentos: `@@unique([empresaId, tipo, folio])`

### Enums

```prisma
enum RolUsuario        { ADMIN CONTADOR VISOR }
enum TipoDocumento     { BOLETA_ELECTRONICA FACTURA_ELECTRONICA NOTA_CREDITO NOTA_DEBITO }
enum EstadoDocumento   { BORRADOR EMITIDO ACEPTADO_SII RECHAZADO_SII ANULADO }
enum TipoCuenta        { ACTIVO PASIVO PATRIMONIO INGRESO GASTO }
enum NaturalezaCuenta  { DEUDORA ACREEDORA }
enum EstadoAsiento     { BORRADOR CONTABILIZADO }
```

---

## Requerimientos específicos Chile

1. **Validación RUT chileno** con dígito verificador en `@contaweb/validations` (Zod)
2. **Plan de Cuentas** estándar chileno en el seed (clases 1–5, mínimo 40 cuentas)
3. Al crear una `Empresa`, llamar automáticamente a `seedPlanDeCuentas(empresaId)`
4. **Asiento contable** valida en Zod que `sum(debe) === sum(haber)`
5. **IVA Chile**: 19% — calcular automáticamente en documentos
6. Integración SII: preparada pero no implementada en v1 (dejar servicio stub en `services/sii.ts`)

---

## Packages compartidos

### `@contaweb/shared-types`
Interfaces TypeScript: Usuario, Empresa, Cliente, DocumentoTributario, LineaDocumento,
CuentaContable, AsientoContable, LineaAsiento, AuthResponse, ApiResponse<T>, PaginatedResponse<T>

### `@contaweb/validations`
Schemas Zod: loginSchema, registroSchema, empresaSchema, clienteSchema,
documentoSchema, lineaDocumentoSchema, asientoSchema (con validación debe=haber),
rutSchema (con verificador dígito chileno)

---

## API REST

```
POST   /api/auth/registro
POST   /api/auth/login
GET    /api/auth/me

GET    /api/empresas
POST   /api/empresas
GET    /api/empresas/:id
PUT    /api/empresas/:id

GET    /api/empresas/:id/clientes
POST   /api/empresas/:id/clientes
PUT    /api/empresas/:id/clientes/:clienteId

GET    /api/empresas/:id/documentos
POST   /api/empresas/:id/documentos
GET    /api/empresas/:id/documentos/:docId

GET    /api/empresas/:id/cuentas
POST   /api/empresas/:id/cuentas               # crear subcuenta (código derivado del padre)
PUT    /api/empresas/:id/cuentas/:cuentaId     # editar (no toca código/tipo/padre)
DELETE /api/empresas/:id/cuentas/:cuentaId     # borrar (rechaza si tiene movimientos o subcuentas)
GET    /api/empresas/:id/asientos
POST   /api/empresas/:id/asientos
```

---

## Frontend — Rutas

El frontend usa **rutas planas** + modelo de **empresa activa global**
(`EmpresaProvider`, persistida en `localStorage` como `cw-empresa-id`).
NO hay rutas anidadas `/empresas/:id/...`: cada módulo opera sobre la empresa
activa y las llamadas al API usan su id internamente.

```
/                → Landing pública (login embebido); si hay sesión → /dashboard
/login           → Login (también accesible directo)
/registro        → Registro de usuario
/dashboard       → Dashboard (resumen, protegido)
/empresas        → Lista y alta de empresas
/clientes        → Gestión de clientes
/documentos      → Ventas (emisión y listado)
/compras         → Compras / facturas recibidas
/contabilidad    → Libro diario
/plan-cuentas    → Plan de cuentas (alta/edición/borrado)
/banco           → Conciliación bancaria
/honorarios · /rrhh · /f29 · /f22 · /dj1887 · /dj1879 · /libros-iva · …
```

---

## Convenciones de código

- TypeScript estricto en todo el proyecto (`"strict": true`)
- Sin `any` — usar tipos o `unknown`
- Nombres de archivos: `camelCase.ts` para utils, `PascalCase.tsx` para componentes
- Nombres de tablas en español snake_case (ya definidos en `@@map`)
- Errores del API siempre con forma `{ error: string, details?: Record<string, string[]> }`
- Respuestas exitosas siempre con forma `{ data: T, message?: string }`

---

## Variables de entorno (.env)

```
DATABASE_URL=postgresql://contaweb:contaweb_dev@localhost:5432/contaweb
JWT_SECRET=secreto-seguro-minimo-32-chars
JWT_EXPIRES_IN=7d
API_PORT=3001
VITE_API_URL=http://localhost:3001
RESEND_API_KEY=
STORAGE_PROVIDER=local
```

---

## Comandos útiles

```bash
pnpm dev          # Arranca web + api en paralelo
pnpm build        # Build de todos los packages
pnpm db:migrate   # Corre migraciones Prisma
pnpm db:seed      # Carga Plan de Cuentas
pnpm db:studio    # Abre Prisma Studio
```
