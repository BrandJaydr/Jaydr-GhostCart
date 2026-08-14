# Repository Manifest

**Version:** v[MAJOR].[MINOR].[PATCH]  
**Last Updated:** [YYYY-MM-DD]  
**Total Files:** [N]  
**Total Lines of Code:** [N]  
**Language:** [Primary language]

---

## 📂 Project Structure Overview

```
[project-name]/
├── 📄 Configuration & Meta
│   ├── README.md                  ← Start here
│   ├── REPO_MANIFEST.md           ← This file
│   ├── WIKI.md                    ← Technical docs
│   ├── CONVENTIONS.md             ← Code standards
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── .gitignore
│   └── .env.example
│
├── 📁 Source Code
│   └── /src/
│       ├── /index.ts              [Entry point]
│       ├── /api/                  [API routes]
│       ├── /services/             [Business logic]
│       ├── /utils/                [Utilities]
│       ├── /types/                [TypeScript types]
│       └── /config/               [Configuration]
│
├── 🧪 Tests
│   └── /tests/
│       ├── /unit/                 [Unit tests]
│       ├── /integration/          [Integration tests]
│       ├── /e2e/                  [End-to-end tests]
│       └── /fixtures/             [Test data]
│
├── 📚 Documentation
│   └── /.docs/
│       ├── ARCHITECTURE.md        [System design]
│       ├── API_REFERENCE.md       [API docs]
│       ├── SETUP.md               [Setup guide]
│       ├── DEPLOYMENT.md          [Deploy guide]
│       ├── SECURITY.md            [Security guide]
│       └── TROUBLESHOOTING.md     [Common issues]
│
├── 📋 Logs & Tasks
│   ├── /.logs/
│   │   ├── errors.md              [Error catalog]
│   │   ├── vulnerabilities.md     [Security issues]
│   │   ├── patterns.md            [Recurring patterns]
│   │   └── hooks.md               [Hook logs]
│   │
│   └── /tasks/
│       ├── plan.md                [Current plan]
│       ├── todo.md                [Task queue]
│       └── history.md             [Completed tasks]
│
└── 🔧 Build & Deploy
    ├── /dist/                     [Build output]
    ├── Dockerfile                 [Container config]
    ├── docker-compose.yml         [Services config]
    └── .github/workflows/         [CI/CD]
```

---

## 📊 File Statistics

| Category | Files | Lines | Comment % |
|----------|-------|-------|-----------|
| Source Code | [N] | [N] | [%] |
| Tests | [N] | [N] | [%] |
| Documentation | [N] | [N] | [%] |
| Configuration | [N] | [N] | [%] |
| **Total** | **[N]** | **[N]** | **[%]** |

---

## 🔑 Key Files & Directories

### Core Application

| File/Directory | Purpose | Key Files |
|---|---|---|
| `/src/index.ts` | Application entry point | Main startup logic |
| `/src/api/` | API endpoints and routes | `routes.ts`, `controllers/` |
| `/src/services/` | Business logic and services | `auth.service.ts`, `user.service.ts` |
| `/src/utils/` | Shared utilities | `helpers.ts`, `validators.ts` |
| `/src/types/` | TypeScript type definitions | `index.d.ts`, `models.ts` |
| `/src/config/` | Configuration management | `index.ts`, `env.ts` |

### Testing

| Directory | Purpose | Test Types |
|---|---|---|
| `/tests/unit/` | Unit tests | Single module tests |
| `/tests/integration/` | Integration tests | Multi-module tests |
| `/tests/e2e/` | End-to-end tests | Full workflow tests |
| `/tests/fixtures/` | Test data | Mock data, factories |

### Documentation

| File | Purpose |
|---|---|
| `README.md` | Quick start and overview |
| `REPO_MANIFEST.md` | This file - repository structure |
| `WIKI.md` | Technical deep dives |
| `CONVENTIONS.md` | Code style and patterns |
| `/.docs/ARCHITECTURE.md` | System design and architecture |
| `/.docs/API_REFERENCE.md` | Complete API documentation |
| `/.docs/SETUP.md` | Detailed setup instructions |
| `/.docs/DEPLOYMENT.md` | Deployment procedures |
| `/.docs/SECURITY.md` | Security guidelines |
| `/.docs/TROUBLESHOOTING.md` | Common issues and solutions |

### Logs & Tracking

| File | Purpose | Type |
|---|---|---|
| `/.logs/errors.md` | Error catalog | Append-only |
| `/.logs/vulnerabilities.md` | Security issues | Append-only |
| `/.logs/patterns.md` | Recurring patterns | Append-only |
| `/.logs/hooks.md` | Hook execution log | Session log |
| `/tasks/plan.md` | Current task plan | Mutable |
| `/tasks/todo.md` | Task queue | Mutable |
| `/tasks/history.md` | Completed tasks | Append-only |

---

## 🏗️ Architecture Overview

### Layers

```
┌─────────────────────────────────┐
│   Presentation Layer             │
│   (API endpoints, Controllers)   │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Service Layer                 │
│   (Business logic)              │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Data Layer                    │
│   (Database, External APIs)     │
└─────────────────────────────────┘
```

### Components

| Component | Location | Responsibility |
|-----------|----------|-----------------|
| API Routes | `/src/api/routes.ts` | HTTP endpoint definitions |
| Controllers | `/src/api/controllers/` | Request handling |
| Services | `/src/services/` | Business logic |
| Models | `/src/types/models.ts` | Data models |
| Utilities | `/src/utils/` | Shared functions |
| Config | `/src/config/` | Environment & settings |

---

## 📦 Dependencies

### Production Dependencies

[List major dependencies with versions and purpose]

```
Framework: [Framework] v[version] - [Purpose]
Database: [DB] v[version] - [Purpose]
Authentication: [Auth library] v[version] - [Purpose]
Validation: [Validator] v[version] - [Purpose]
```

See `package.json` for complete list.

### Development Dependencies

```
Build: [Bundler] v[version]
Testing: [Test framework] v[version]
Linting: ESLint, Prettier
Type Checking: TypeScript v[version]
```

---

## 🔄 Build & Deploy

### Build Process

```
Source Code (/src/)
        ↓
TypeScript Compilation
        ↓
Linting & Type Checking
        ↓
Testing
        ↓
Bundle & Minify
        ↓
Production Build (/dist/)
```

### Build Output

```
/dist/
├── index.js           [Main bundle]
├── index.js.map       [Source maps]
└── package.json       [Metadata]
```

### Deployment Options

| Environment | Method | Config |
|---|---|---|
| Development | `npm run dev` | `.env.development` |
| Production | Docker | `docker-compose.yml` |
| Testing | Jest | `jest.config.js` |

---

## 🧪 Test Coverage

### Unit Tests
- Location: `/tests/unit/`
- Files: [Number of files]
- Coverage: [X]%
- Run: `npm test -- --testPathPattern=unit`

### Integration Tests
- Location: `/tests/integration/`
- Files: [Number of files]
- Coverage: [X]%
- Run: `npm test -- --testPathPattern=integration`

### E2E Tests
- Location: `/tests/e2e/`
- Files: [Number of files]
- Coverage: [X]%
- Run: `npm test -- --testPathPattern=e2e`

---

## 🔗 Module Dependencies

### Core Modules

```
src/
├── index.ts                    [imports everything below]
├── config/
│   └── index.ts               [imported by: services, api]
├── types/
│   └── index.d.ts             [imported by: all modules]
├── utils/
│   └── validators.ts          [imported by: services, api]
├── services/
│   ├── auth.service.ts        [imports: config, types, utils]
│   └── user.service.ts        [imports: config, types, utils]
└── api/
    ├── routes.ts              [imports: controllers]
    └── controllers/           [imports: services, types, utils]
```

---

## 📝 Configuration Files

| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `jest.config.js` | Test framework configuration |
| `.eslintrc.json` | Linting rules |
| `.prettierrc` | Code formatting rules |
| `.gitignore` | Git exclusions |
| `.env.example` | Environment variable template |
| `Dockerfile` | Container image definition |
| `docker-compose.yml` | Multi-container orchestration |

---

## 🚀 Scripts Overview

| Script | Purpose | Command |
|--------|---------|---------|
| dev | Start development server | `npm run dev` |
| build | Build for production | `npm run build` |
| start | Start production server | `npm start` |
| test | Run all tests | `npm test` |
| test:watch | Run tests in watch mode | `npm run test:watch` |
| lint | Check code style | `npm run lint` |
| lint:fix | Fix code style issues | `npm run lint:fix` |
| type-check | Check TypeScript types | `npm run type-check` |
| format | Format code | `npm run format` |

See `package.json` for complete list.

---

## 🔐 Security & Compliance

### Security Measures

- [Measure 1]
- [Measure 2]
- [Measure 3]

See [/.docs/SECURITY.md](.docs/SECURITY.md) for details.

### Compliance

- [Standard 1] - [Compliance level]
- [Standard 2] - [Compliance level]

---

## 📊 Code Quality Metrics

| Metric | Score | Target |
|--------|-------|--------|
| Test Coverage | [X]% | > 80% |
| Linting | [Grade] | A |
| Type Safety | [Grade] | Strict |
| Performance | [Score] | [Target] |
| Security | [Score] | A+ |

---

## 🔄 Version History

### Latest: v[VERSION]
- [Change 1]
- [Change 2]

### v[Previous]
- [Previous changes]

See [CHANGELOG.md](CHANGELOG.md) for full history.

---

## 📚 Related Documentation

- **README.md** - Quick start and overview
- **WIKI.md** - Technical documentation
- **CONVENTIONS.md** - Code standards
- **/.docs/ARCHITECTURE.md** - System design
- **/.docs/API_REFERENCE.md** - API details

---

## 🎯 Navigation Guide

**I want to...**

| Goal | Document |
|------|----------|
| Get started quickly | [README.md](README.md#quick-start) |
| Understand the codebase | [WIKI.md](WIKI.md) |
| Follow code standards | [CONVENTIONS.md](CONVENTIONS.md) |
| Learn the architecture | [/.docs/ARCHITECTURE.md](.docs/ARCHITECTURE.md) |
| Use the API | [/.docs/API_REFERENCE.md](.docs/API_REFERENCE.md) |
| Deploy to production | [/.docs/DEPLOYMENT.md](.docs/DEPLOYMENT.md) |
| Fix a problem | [/.docs/TROUBLESHOOTING.md](.docs/TROUBLESHOOTING.md) |
| Review project structure | This file (REPO_MANIFEST.md) |

---

## 📋 Change Log

**Last Updated:** [DATE]  
**Last Modified By:** [Agent/Human]

### Changes in v[Latest]
- Updated: [What changed?]
- Added: [What's new?]
- Removed: ~~[What's deprecated?]~~

---

**This manifest is auto-updated when file structure changes.**  
For detailed changes, see [/tasks/history.md](/tasks/history.md)
