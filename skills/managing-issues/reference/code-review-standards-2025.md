# Code Review Standards 2025

Code review standards. The stack-specific sections (Electron, Node.js, React, TypeScript) apply only when that stack is detected; the general, SOLID, and severity sections apply to every project. Applies to all operations that modify files.

## Contents

- [Mandatory enforcement](#mandatory-enforcement)
- [1. General code review standards](#1-general-code-review-standards)
- [2. Electron security checklist](#2-electron-security-checklist) (Electron projects)
- [3. Node.js code review checklist](#3-nodejs-code-review-checklist) (Node projects)
- [4. React code review checklist](#4-react-code-review-checklist) (React projects)
- [5. TypeScript code review checklist](#5-typescript-code-review-checklist) (TypeScript projects)
- [6. SOLID principles checklist](#6-solid-principles-checklist)
- [Sources](#sources)
- Continued in [code-review-standards-2025-dimensions.md](code-review-standards-2025-dimensions.md): code smells, complexity, test coverage, documentation, severity matrix, automated checks, review workflow (sections 7–13)

---

## MANDATORY ENFORCEMENT

**This reference is NOT optional. ALL file-modifying operations MUST complete these reviews.**

| Review Type | Gate | Can Override |
|-------------|------|--------------|
| Security Review | QG-7 | **NO** |
| Architecture Review | QG-6 | Tier 2 only |
| Quality Review | QG-8 | Tier 2 only |
| Comprehensive Review | QG-8 | **NO** for critical issues |

---

## 1. General Code Review Standards

### 1.1 Process standards

| Metric | Threshold | Action |
|--------|-----------|--------|
| PR size | 200-400 lines max | Split larger PRs |
| Review time | 1-5 hours response | Block if exceeded |
| Inspection rate | 150-500 LOC/hour | Slow down if faster |
| Files per review | ≤20 files | Split if larger |

### 1.2 Feedback labels

**MANDATORY: Use these prefixes for all findings:**

| Prefix | Meaning | Blocking |
|--------|---------|----------|
| `Blocker:` | Must fix before merge | YES |
| `Critical:` | Security/data issue | YES |
| `High:` | Should fix before merge | YES (Tier 2) |
| `Medium:` | Should fix, can document | NO |
| `Low:` | Optional improvement | NO |
| `Nit:` | Style/preference | NO |

### 1.3 Review focus areas (Google standard)

1. **Design** - Does it integrate well with the system?
2. **Functionality** - Does it work correctly for users?
3. **Complexity** - Can another developer understand it?
4. **Tests** - Correct, well-designed, comprehensive?
5. **Naming** - Clear, consistent, meaningful?
6. **Comments** - Explain "why", not "what"?
7. **Style** - Follows established conventions?
8. **Documentation** - Updated where needed?

---

## 2. Electron Security Checklist

### 2.1 webPreferences validation (MANDATORY)

**STOP if ANY of these are misconfigured:**

```javascript
// REQUIRED SECURE CONFIGURATION
webPreferences: {
  nodeIntegration: false,           // MUST be false
  contextIsolation: true,           // MUST be true
  sandbox: true,                    // SHOULD be true
  webSecurity: true,                // MUST be true
  allowRunningInsecureContent: false,
  nodeIntegrationInWorker: false,
  nodeIntegrationInSubFrames: false,
  webviewTag: false,                // Unless explicitly needed
  enableRemoteModule: false,        // Deprecated
}
```

**Detection pattern:**
```
Grep(pattern="nodeIntegration:\\s*true", path="src/main/")
Grep(pattern="contextIsolation:\\s*false", path="src/main/")
Grep(pattern="webSecurity:\\s*false", path="src/main/")
```

### 2.2 Electron fuses validation

| Fuse | Required State | Purpose |
|------|----------------|---------|
| RunAsNode | false | Prevents ELECTRON_RUN_AS_NODE attacks |
| EnableNodeOptionsEnvironmentVariable | false | Blocks NODE_OPTIONS injection |
| EnableNodeCliInspectArguments | false | Disables --inspect flag |

### 2.3 IPC security

**CRITICAL - Always validate:**

```typescript
// ❌ BAD: No sender validation
ipcMain.on('sensitive-action', (event, data) => {
  doSensitiveAction(data);
});

// ✅ GOOD: Validate sender
ipcMain.on('sensitive-action', (event, data) => {
  if (event.senderFrame.url !== expectedUrl) return;
  if (!validateData(data)) return;
  doSensitiveAction(data);
});
```

**Detection patterns:**
```
Grep(pattern="ipcMain\\.on|ipcMain\\.handle", path="src/main/")
→ Verify each handler validates event.sender or event.senderFrame
```

### 2.4 Dangerous patterns to flag

| Pattern | Risk | Severity |
|---------|------|----------|
| `shell.openExternal` with user input | Command injection | CRITICAL |
| `eval()` or `new Function()` | Code injection | CRITICAL |
| `innerHTML` with untrusted data | XSS | HIGH |
| `child_process.exec` with variables | Command injection | CRITICAL |
| Disabled certificate validation | MITM attacks | HIGH |

---

## 3. Node.js Code Review Checklist

### 3.1 Code quality

| Check | Pattern | Severity |
|-------|---------|----------|
| No `var` usage | `Grep(pattern="\\bvar\\s")` | Medium |
| Prefer `const` | Variables that aren't reassigned | Low |
| ES Modules | `import/export` vs `require` | Low |
| Naming conventions | camelCase functions, PascalCase classes | Medium |

### 3.2 Security

| Check | Detection | Severity |
|-------|-----------|----------|
| No hardcoded secrets | `Grep(pattern="api[_-]?key|secret|password|token")` | CRITICAL |
| Input validation | Boundary checks present | HIGH |
| SQL injection | Parameterized queries used | CRITICAL |
| Path traversal | `path.resolve` + validation | HIGH |
| Command injection | No `exec` with user input | CRITICAL |

### 3.3 Async/await patterns

**REQUIRED patterns:**

```typescript
// ✅ GOOD: Proper error handling
async function fetchData(): Promise<Data> {
  try {
    const result = await api.get('/data');
    return result;
  } catch (error) {
    logger.error('Fetch failed', { error });
    throw new AppError('DATA_FETCH_FAILED', error);
  }
}

// ✅ GOOD: Concurrent operations
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);

// ❌ BAD: Unhandled rejection
await api.get('/data'); // No try/catch!

// ❌ BAD: Sequential when parallel possible
const users = await fetchUsers();
const posts = await fetchPosts(); // Could run in parallel
```

### 3.4 Performance

| Issue | Detection | Severity |
|-------|-----------|----------|
| O(n²) loops | Nested loops on arrays | HIGH |
| Blocking event loop | Sync operations in async context | HIGH |
| Memory leaks | Unclosed resources, growing arrays | HIGH |
| Missing cleanup | Event listeners not removed | MEDIUM |

### 3.5 Dependencies

| Check | Tool/Command | Threshold |
|-------|--------------|-----------|
| Security audit | `npm audit` | 0 high/critical |
| License compatibility | Check package.json | MIT/Apache OK, AGPL flag |
| Bundle size | `size-limit` | Project-specific |
| Outdated packages | `npm outdated` | Review major versions |

---

## 4. React Code Review Checklist

### 4.1 Component design

| Principle | Check | Severity |
|-----------|-------|----------|
| Single Responsibility | Component does one thing | HIGH |
| Small components | < 200 lines preferred | MEDIUM |
| Props interface | Well-typed, documented | MEDIUM |
| Error boundaries | Present at key points | HIGH |

### 4.2 Hooks rules

```typescript
// ✅ GOOD: Proper dependency array
useEffect(() => {
  fetchData(id);
}, [id]);

// ❌ BAD: Missing dependency
useEffect(() => {
  fetchData(id);
}, []); // Missing 'id'

// ❌ BAD: Conditional hook call
if (condition) {
  useState(); // NEVER conditional hooks
}
```

### 4.3 Performance optimization

| Hook | When to Use | When NOT to Use |
|------|-------------|-----------------|
| `React.memo` | Expensive re-renders with same props | Simple components |
| `useMemo` | Expensive calculations | Simple values |
| `useCallback` | Callbacks passed to memoized children | Not passed down |

**Detection:**
```
Grep(pattern="React\\.memo|useMemo|useCallback", path="src/renderer/")
→ Verify each usage is justified
```

### 4.4 Security

| Issue | Detection | Severity |
|-------|-----------|----------|
| `dangerouslySetInnerHTML` | Direct grep | CRITICAL if unsanitized |
| XSS vectors | User input in JSX | HIGH |
| Exposed secrets | Environment variables in client | CRITICAL |

### 4.5 Anti-patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Prop drilling > 3 levels | Maintenance nightmare | Use Context |
| Inline object/array props | Causes re-renders | Extract to constant or useMemo |
| Inline function props | New reference each render | useCallback |
| Missing key prop | Incorrect reconciliation | Add unique key |
| Index as key | Poor performance on reorder | Use stable ID |

---

## 5. TypeScript Code Review Checklist

### 5.1 Type safety

| Rule | Check | Severity |
|------|-------|----------|
| No `any` | `Grep(pattern=": any")` | HIGH |
| No `as` assertions | `Grep(pattern="as [A-Z]")` | MEDIUM |
| Strict mode enabled | tsconfig.json | HIGH |
| No `!` non-null | `Grep(pattern="!\\.")` | MEDIUM |

### 5.2 Configuration requirements

```jsonc
// tsconfig.json - REQUIRED settings
{
  "compilerOptions": {
    "strict": true,              // MANDATORY
    "strictNullChecks": true,    // MANDATORY
    "noImplicitAny": true,       // MANDATORY
    "noUncheckedIndexedAccess": true  // RECOMMENDED
  }
}
```

### 5.3 Type patterns

**GOOD patterns:**
```typescript
// ✅ Explicit return types on public APIs
function calculateTotal(items: Item[]): number { }

// ✅ Union types for states
type Status = 'loading' | 'success' | 'error';

// ✅ Generic constraints
function process<T extends BaseType>(item: T): T { }

// ✅ Discriminated unions
type Result =
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error };
```

**BAD patterns:**
```typescript
// ❌ any defeats TypeScript purpose
function process(data: any): any { }

// ❌ Type assertion without validation
const data = response as UserData;

// ❌ Non-null assertion hides bugs
const name = user!.profile!.name;
```

### 5.4 API boundaries

**MANDATORY: Validate at system boundaries:**

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

// ✅ GOOD: Runtime validation at boundary
function handleApiResponse(response: unknown): User {
  return UserSchema.parse(response);
}

// ❌ BAD: Trust external data
function handleApiResponse(response: User): User {
  return response; // What if API changed?
}
```

---

## 6. SOLID Principles Checklist

### 6.1 Single Responsibility Principle (SRP)

**Question:** Does this class/module have only ONE reason to change?

| Violation | Detection | Severity |
|-----------|-----------|----------|
| Class > 300 lines | Line count | HIGH |
| Multiple unrelated imports | Import analysis | MEDIUM |
| "Manager/Handler/Processor" names | Naming | MEDIUM |
| Methods that don't use class state | Static candidates | LOW |

**Detection pattern:**
```
# Count lines per file
wc -l src/**/*.ts | sort -n

# Check for mixed concerns
Grep(pattern="import.*from.*(api|store|service)", path="<component>")
→ Flag if component imports from multiple layers
```

### 6.2 Open/Closed Principle (OCP)

**Question:** Can new behavior be added WITHOUT modifying existing code?

| Violation | Detection | Severity |
|-----------|-----------|----------|
| Growing switch statements | `Grep(pattern="switch.*type")` | HIGH |
| Multiple if/else on type | `Grep(pattern="if.*typeof")` | HIGH |
| Hardcoded lists that grow | Manual review | MEDIUM |

**Fix pattern:**
```typescript
// ❌ BAD: Violates OCP
function getIcon(type: string) {
  switch(type) {
    case 'file': return FileIcon;
    case 'folder': return FolderIcon;
    // Must modify to add new type
  }
}

// ✅ GOOD: Open for extension
const iconMap: Record<string, IconComponent> = {
  file: FileIcon,
  folder: FolderIcon,
};
function getIcon(type: string) {
  return iconMap[type] ?? DefaultIcon;
}
```

### 6.3 Liskov Substitution Principle (LSP)

**Question:** Can subclasses be used interchangeably with their base class?

| Violation | Detection | Severity |
|-----------|-----------|----------|
| Methods throwing "not implemented" | `Grep(pattern="not implemented")` | HIGH |
| Type checks after interface use | `Grep(pattern="instanceof")` | MEDIUM |
| Overrides with different behavior | Manual review | HIGH |

### 6.4 Interface Segregation Principle (ISP)

**Question:** Are interfaces focused and minimal?

| Violation | Detection | Severity |
|-----------|-----------|----------|
| Interface > 7 methods | Interface analysis | MEDIUM |
| Optional methods (?) | `Grep(pattern="\\?:")` in interfaces | LOW |
| Empty method implementations | Manual review | HIGH |

### 6.5 Dependency Inversion Principle (DIP)

**Question:** Do high-level modules depend on abstractions?

| Violation | Detection | Severity |
|-----------|-----------|----------|
| Direct instantiation | `Grep(pattern="new [A-Z]")` | MEDIUM |
| Concrete imports across layers | Import analysis | HIGH |
| Global singletons | `Grep(pattern="getInstance")` | MEDIUM |

**Detection pattern:**
```
# Check for concrete dependencies
Grep(pattern="import.*Service|import.*Repository", path="src/renderer/")
→ Should import interfaces, not implementations
```

See [code-review-standards-2025-dimensions.md](code-review-standards-2025-dimensions.md) for detailed dimension criteria (sections 7–13: code smells, complexity metrics, test coverage, documentation, severity matrix, automated checks, review workflow).

---

## Sources

- [Google Engineering Practices](https://google.github.io/eng-practices/review/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Code Review Checklist](https://pagepro.co/blog/18-tips-for-a-better-react-code-review-ts-js/)
- [TypeScript Best Practices 2025](https://dev.to/mitu_mariam/typescript-best-practices-in-2025-57hb)
- [SOLID Principles](https://blog.jetbrains.com/upsource/2015/08/31/what-to-look-for-in-a-code-review-solid-principles-2/)
- [Code Smells Detection](https://blog.codacy.com/code-smells-and-anti-patterns)
- [Clean Code by Robert C. Martin](https://gist.github.com/wojteklu/73c6914cc446146b8b533c0988cf8d29)
