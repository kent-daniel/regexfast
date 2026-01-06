# Regex Editor Interface - Design Specification

## Overview

An editor-like interface that renders when the AI agent generates a regex. Users can edit the pattern, test against input text, and get code snippets. Supports both `match` and `capture` modes.

---

## Design

```
┌──────────────────────────────────────────────────────────────┐
│ PATTERN                                         [📋] [▶ Run] │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ^(\w+)@(\w+)\.(\w+)$                                     │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ FLAGS  [g ●] [i ○] [m ○]       RUNTIME  [● JS] [TS] [Py]    │
│ MODE   [● match] [capture]                                   │
├──────────────────────────────────────────────────────────────┤
│ TEST INPUT                                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ user@example.com                                         │ │
│ │ test@domain.org                                          │ │
│ │ not-an-email                                             │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ RESULTS                                          2 of 3 ✓   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ✓ user@example.com                                       │ │
│ │   └─ Groups: [user] [example] [com]                      │ │
│ │ ✓ test@domain.org                                        │ │
│ │   └─ Groups: [test] [domain] [org]                       │ │
│ │ ✗ not-an-email                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ CODE SNIPPET                                          [📋]   │
│ ┌─ JavaScript ────────────────────────────────────────────┐  │
│ │ const regex = /^(\w+)@(\w+)\.(\w+)$/g;                  │  │
│ │ const matches = text.match(regex);                      │  │
│ └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Pattern Input** | Editable regex (no delimiters). Inline validation errors. |
| **Flag Toggles** | `g`, `i`, `m` as pill buttons. |
| **Mode Selector** | `match` or `capture` — determines API mode and result display. |
| **Runtime Selector** | JS, TS, Python. Affects code snippet + backend runtime. |
| **Test Input** | Textarea. Each line = one test string. |
| **Results** | Shows ✓/✗ per line. In capture mode, shows extracted groups. |
| **Code Snippet** | Read-only, one-click copy. |
| **Run Button** | Triggers `/api/regex/test` with current state. |

---

## Integration with Agent Tool Output

### Current Flow

```
Agent generates regex
       ↓
ToolInvocationCard detects regex tool output
       ↓
getRegexResult() extracts: pattern, flags, testResults, mode, etc.
       ↓
Renders <RegexResultCard /> (current component)
```

### New Flow

```
Agent generates regex
       ↓
ToolInvocationCard calls getRegexResult()
       ↓
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   <RegexResultCard>          <RegexEditorCard>          │
│   (chat, left side)          (right panel)              │
│   - Shows pattern            - Initialized with same    │
│   - Shows pass/fail badge      data, then independent   │
│   - Collapsible details      - Editable pattern         │
│                              - Flag toggles             │
│   (read-only, unchanged)     - Mode selector            │
│                              - Test input textarea      │
│                              - Results list             │
│                              - Code snippets            │
│                              - Run button               │
│                                                         │
│   No sync ←───────────────── Independent state          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Two Interfaces (No Sync)

| Component | Location | Behavior |
|-----------|----------|----------|
| `<RegexResultCard>` | Chat (left) | Read-only. Shows agent output. Never changes. |
| `<RegexEditorCard>` | Right panel | Initialized from agent output. Fully independent after. |

### Data Shape (Already Exists)

The agent already returns this via `getRegexResult()`:

```typescript
interface RegexToolOutput {
  pattern: string;
  flags: string;
  success: boolean;
  iterations: number;
  runtime: string;  // "javascript" | "python"
  testResults?: {
    passed: number;
    failed: number;
    total: number;
    mode?: "match" | "capture";
    details?: Array<{
      input: string;
      passed: boolean;
      expected?: string | (string | null)[];
      actual?: string | (string | null)[] | null;
    }>;
  };
  example?: string;
}
```

---

## Backend Compatibility

### Existing Endpoint: `POST /api/regex/test`

```typescript
// Request
interface RegexTestRequest {
  pattern: string;
  flags?: string;
  mode: "match" | "capture";
  runtime?: "javascript" | "python";
  
  // For match mode
  shouldMatch?: string[];
  shouldNotMatch?: string[];
  
  // For capture mode
  captureTests?: Array<{
    input: string;
    expectedGroups: (string | null)[];
  }>;
}

// Response
interface RegexTestResponse {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: MatchTestCaseResult[] | CaptureTestCaseResult[];
  sandboxId: string;
  runtime: "javascript" | "python";
  testMode: "match" | "capture";
}
```

### Frontend → Backend Mapping

| UI Element | Maps To |
|------------|---------|
| Pattern input | `pattern` |
| Flag toggles | `flags` |
| Mode selector | `mode` |
| Runtime selector | `runtime` |
| Test input lines | `shouldMatch[]` (match mode) or `captureTests[]` (capture mode) |

**Match mode:** All lines go to `shouldMatch[]`, we interpret `actual: true/false` as matched/not.

**Capture mode:** Each line becomes a `captureTest` with empty `expectedGroups` (we just want to see what's captured, not validate).

---

## Component Structure

```
<RegexEditorCard>
  ├── <PatternSection>
  │   ├── <PatternInput />       // input field
  │   ├── <FlagToggles />        // g, i, m pills
  │   ├── <ModeSelector />       // match | capture
  │   ├── <RuntimeSelector />    // JS | TS | Python
  │   ├── <CopyButton />
  │   └── <RunButton />
  │
  ├── <TestInputSection>
  │   └── <TestTextarea />       // multi-line input
  │
  ├── <ResultsSection>
  │   └── <ResultRow />[]        // ✓/✗ + groups (if capture mode)
  │
  └── <CodeSnippetSection>
      ├── <LanguageTabs />       // JS | TS | Python
      └── <CodeBlock />          // syntax highlighted
```

---

## Interactions

| Action | Behavior |
|--------|----------|
| Edit pattern | No auto-run. Wait for Run button. |
| Toggle flag | No auto-run. Wait for Run button. |
| Switch mode | No auto-run. Updates UI labels. |
| Switch runtime | No auto-run. Updates code snippet. |
| Edit test input | No auto-run. Wait for Run button. |
| **Click Run** | POST to `/api/regex/test`, show loading, render results. |
| Click Copy | Copy regex/code, show ✓ feedback for 2s. |

---

## Result Display

### Match Mode
```
✓ user@example.com        (matched)
✓ test@domain.org         (matched)
✗ not-an-email            (no match)
```

### Capture Mode
```
✓ user@example.com
  └─ Groups: [user] [example] [com]
✓ test@domain.org
  └─ Groups: [test] [domain] [org]
✗ not-an-email
  └─ No capture
```

---

## Code Snippet Templates

### JavaScript
```javascript
const regex = /^(\w+)@(\w+)\.(\w+)$/g;
const matches = text.match(regex);
```

### TypeScript
```typescript
const regex: RegExp = /^(\w+)@(\w+)\.(\w+)$/g;
const matches: RegExpMatchArray | null = text.match(regex);
```

### Python
```python
import re
pattern = r'^(\w+)@(\w+)\.(\w+)$'
matches = re.findall(pattern, text)
```

---

## Implementation Plan

### Phase 1: Hook + Types

1. Create `useRegexEditor` hook (local state + `runTest()`)
2. Create types in `types.ts`

### Phase 2: Right Panel Editor

1. Create `<RegexEditorCard>` — accepts initial data as props
2. Add pattern input, flag toggles, mode/runtime selectors
3. Add test input textarea
4. Add results panel (match/capture aware)
5. Add code snippets with JS/TS/Python tabs
6. Wire Run button to hook's `runTest()`

### Phase 3: Integration

1. Pass agent's regex output to right panel as initial props
2. Right panel manages its own state independently
3. `RegexResultCard` unchanged — stays read-only in chat

---

## File Changes

### New Files
| File | Purpose |
|------|---------|
| `src/hooks/useRegexEditor.ts` | Local state + test execution logic |
| `src/components/regex-editor/RegexEditorCard.tsx` | Full editor (right panel) |
| `src/components/regex-editor/PatternInput.tsx` | Pattern + flags + mode + runtime |
| `src/components/regex-editor/ResultsPanel.tsx` | Match/capture results |
| `src/components/regex-editor/CodeSnippet.tsx` | Code output with copy |
| `src/components/regex-editor/types.ts` | Shared types |

### Modified Files
| File | Change |
|------|--------|
| `src/app/new-agent-app/page.tsx` (or layout) | Render `<RegexEditorCard>` in right panel, pass initial data |

### No Backend Changes Required

---

## Decision

**Two independent interfaces:**

| Component | Location | Behavior |
|-----------|----------|----------|
| `RegexResultCard` | Chat (left) | Read-only. Shows agent output. Unchanged. |
| `RegexEditorCard` | Right panel | Initialized from agent output. Independent after. |

**Simple props-based initialization:**
- Agent output → passed as props to `RegexEditorCard`
- Right panel manages its own local state
- No shared context, no bidirectional sync

**No backend changes required.**
