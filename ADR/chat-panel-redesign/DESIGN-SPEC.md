# Chat Panel Redesign: Copilot Coding Agent Style

**Status:** Proposed  
**Created:** 2026-01-04  
**Author:** Design Team  

---

## 1. Executive Summary

This document outlines the design specification for overhauling the chat panel on the main page (left side - `RegexGeneratorForm`) to adopt a modern **Copilot Coding Agent** style design, migrating patterns from the new agent app (`/new-agent-app/`) while introducing refined copy, error states, and a cohesive color system.

---

## 2. Current State Analysis

### 2.1 Main Page Chat (`RegexGeneratorForm`)
- **Style:** Form-based input with static labels
- **Colors:** Dark zinc background (`bg-zinc-800`), gray text
- **Error handling:** Simple red text list
- **UX:** Traditional form submission pattern
- **Copy:** Static labels like "I want to generate regex for"

### 2.2 New Agent App Chat
- **Style:** Conversational UI with avatars
- **Colors:** Purple gradient accents, neutral grays
- **Error handling:** Minimal current implementation
- **UX:** Streaming messages, tool invocations, thinking states
- **Copy:** Generic "How can I help you today?"

---

## 3. Design Goals

1. **Unify** the visual language between main page and agent app
2. **Elevate** the experience to match GitHub Copilot's coding agent aesthetic
3. **Improve** error states with actionable, friendly messaging
4. **Refine** copy to be context-aware and conversational
5. **Modernize** the color palette with a professional, dev-focused feel

---

## 4. Visual Design Specification

### 4.1 Color Palette

#### Primary Colors (Agent/AI Identity)
```css
/* Copilot-inspired gradient - subtle blue-to-purple */
--agent-gradient-start: 221 83% 53%;    /* #3B82F6 - Blue 500 */
--agent-gradient-end: 271 81% 56%;       /* #8B5CF6 - Violet 500 */

/* Accent for interactive elements */
--agent-accent: 217 91% 60%;             /* #3B82F6 - Bright blue */
--agent-accent-hover: 217 91% 50%;       /* Darker on hover */
```

#### Background Colors (Dark Mode First)
```css
/* Main surfaces */
--chat-bg-primary: 220 13% 5%;           /* #0A0C10 - Deep dark */
--chat-bg-secondary: 220 13% 8%;         /* #0D1117 - GitHub dark */
--chat-bg-tertiary: 220 13% 11%;         /* #161B22 - Elevated surface */

/* Cards and overlays */
--chat-surface: 220 13% 14%;             /* #1C2128 - Card background */
--chat-surface-hover: 220 13% 18%;       /* Hover state */
```

#### Text Colors
```css
/* Primary content */
--text-primary: 210 17% 95%;             /* #F0F3F6 - High emphasis */
--text-secondary: 215 14% 65%;           /* #8B949E - Medium emphasis */
--text-tertiary: 215 14% 45%;            /* #6E7681 - Low emphasis */
--text-muted: 215 14% 35%;               /* #484F58 - Disabled/hints */
```

#### State Colors
```css
/* Success states */
--success-bg: 142 76% 10%;               /* Dark green tint */
--success-text: 142 76% 60%;             /* #22C55E - Green 500 */
--success-border: 142 76% 20%;

/* Error states */
--error-bg: 0 84% 10%;                   /* Dark red tint */
--error-text: 0 84% 65%;                 /* #EF4444 - Red 500 */
--error-border: 0 84% 20%;

/* Warning states */
--warning-bg: 38 92% 10%;                /* Dark amber tint */
--warning-text: 38 92% 60%;              /* #F59E0B - Amber 500 */
--warning-border: 38 92% 20%;

/* Info/Processing states */
--info-bg: 217 91% 10%;                  /* Dark blue tint */
--info-text: 217 91% 60%;                /* #3B82F6 - Blue 500 */
--info-border: 217 91% 20%;
```

#### Border Colors
```css
--border-subtle: 215 14% 15%;            /* Barely visible */
--border-default: 215 14% 20%;           /* Normal borders */
--border-emphasis: 215 14% 30%;          /* Focus/active states */
```

### 4.2 Typography

```css
/* Font family - System stack optimized for code/dev environments */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;

/* Font sizes */
--text-xs: 0.75rem;      /* 12px - timestamps, metadata */
--text-sm: 0.875rem;     /* 14px - body text, messages */
--text-base: 1rem;       /* 16px - headings, emphasis */
--text-lg: 1.125rem;     /* 18px - section titles */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
```

### 4.3 Spacing & Layout

```css
/* Container padding */
--space-chat-container: 1rem;            /* 16px */
--space-message-gap: 1rem;               /* 16px between messages */
--space-section-gap: 1.5rem;             /* 24px between sections */

/* Input area */
--input-min-height: 48px;
--input-max-height: 200px;
--input-border-radius: 12px;

/* Message bubbles */
--bubble-padding-x: 1rem;
--bubble-padding-y: 0.75rem;
--bubble-border-radius: 16px;
--bubble-max-width: 85%;
```

---

## 5. Component Specifications

### 5.1 Chat Header

```
┌─────────────────────────────────────────────────────────────────┐
│  ╭────╮                                                         │
│  │ ✧  │  Regex Copilot          • Ready            ⚙️  🗑️      │
│  ╰────╯                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Logo:** 32x32px gradient icon with sparkle/brain motif
- **Title:** "Regex Copilot" in `--text-primary`, `font-semibold`
- **Status indicator:** Pulsing dot with status text
  - 🟢 Ready (green pulse)
  - 🔵 Thinking (blue pulse + animation)
  - 🟡 Awaiting input (amber static)
  - 🔴 Error (red static)
- **Actions:** Ghost buttons, 32px touch target

### 5.2 Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        ╭──────────────╮                         │
│                        │      ✧       │                         │
│                        │   COPILOT    │                         │
│                        ╰──────────────╯                         │
│                                                                 │
│                    Hi! I'm your Regex Copilot.                  │
│                                                                 │
│           Describe what you want to match, and I'll             │
│           generate the perfect regular expression.              │
│                                                                 │
│        ┌─────────────────────────────────────────────┐          │
│        │  💡 "Match email addresses ending in .edu"  │          │
│        └─────────────────────────────────────────────┘          │
│                                                                 │
│        ┌─────────────────────────────────────────────┐          │
│        │  💡 "Extract phone numbers from text"       │          │
│        └─────────────────────────────────────────────┘          │
│                                                                 │
│        ┌─────────────────────────────────────────────┐          │
│        │  💡 "Validate URLs with optional protocol"  │          │
│        └─────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Logo:** 64x64px animated gradient icon
- **Headline:** "Hi! I'm your Regex Copilot." - warm, personal
- **Subtext:** `--text-secondary`, single-purpose description
- **Suggestion chips:** Clickable, subtle border, hover lift effect
  - Background: `--chat-surface`
  - Border: `--border-subtle`
  - Icon: 💡 emoji or Lightbulb icon
  - On hover: `--chat-surface-hover` + slight shadow

### 5.3 Message Bubbles

#### User Message
```
                                    ┌────────────────────────────┐
                                    │ Match all phone numbers    │
                                    │ that start with +61        │
                                    └────────────────────────────┘
                                                            ╭──╮
                                                            │👤│
                                                            ╰──╯
```

**Specifications:**
- **Alignment:** Right-aligned with avatar
- **Background:** Gradient from `--agent-gradient-start` to `--agent-gradient-end`
- **Text:** White (#FFFFFF)
- **Border radius:** `16px 16px 4px 16px` (notched bottom-right)
- **Avatar:** 28px, `--chat-surface` background, user icon

#### Assistant Message
```
╭──╮
│✧ │
╰──╯
┌────────────────────────────────────────────────────────────────┐
│ I'll help you match phone numbers starting with +61.           │
│                                                                │
│ Here's a regex pattern:                                        │
│                                                                │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ^\+61\d{9,10}$                                     📋 Copy │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                │
│ This matches:                                                  │
│ • +61 followed by 9-10 digits                                  │
│ • Start (^) and end ($) anchors for full string match         │
└────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Alignment:** Left-aligned with avatar
- **Background:** `--chat-surface`
- **Text:** `--text-primary`
- **Border radius:** `16px 16px 16px 4px` (notched bottom-left)
- **Avatar:** 28px, gradient background, sparkle icon
- **Code blocks:** `--chat-bg-secondary`, monospace font, copy button

### 5.4 Tool Invocation States

#### Processing State
```
┌─────────────────────────────────────────────────────────────────┐
│  ⟳ Generating match regex...                                   │
│  ├── Analyzing pattern requirements                             │
│  ├── Testing against examples                                   │
│  └── Optimizing for performance                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Container:** `--info-bg` background, `--info-border` border
- **Icon:** Animated spinner in `--info-text`
- **Steps:** Indented with tree connectors, fade-in animation
- **Progress:** Optional subtle progress bar at bottom

#### Success State
```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Regex generated successfully                                 │
│                                                                 │
│  Pattern: ^\+61\d{9,10}$                                        │
│  Tests passed: 5/5                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Container:** `--success-bg` background, `--success-border` border
- **Icon:** Checkmark in `--success-text`
- **Metrics:** Test results with pass/fail counts

#### Error State
```
┌─────────────────────────────────────────────────────────────────┐
│  ✕ Unable to generate regex                                     │
│                                                                 │
│  I couldn't create a pattern that matches all your examples.    │
│  Here's what went wrong:                                        │
│                                                                 │
│  • "+611234" matched but shouldn't have                         │
│  • "0412345678" didn't match but should have                   │
│                                                                 │
│  💡 Try providing more specific examples or adding              │
│     constraints to help me understand the pattern better.       │
│                                                                 │
│  ┌─────────────────┐                                            │
│  │  🔄 Try Again   │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Container:** `--error-bg` background, `--error-border` border
- **Icon:** X mark in `--error-text`
- **Message:** Human-friendly explanation
- **Details:** Bullet list of specific issues
- **Help tip:** 💡 with actionable suggestion
- **Action:** Prominent retry button

#### Approval Required State
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Approval Required                                           │
│                                                                 │
│  I'd like to run custom code to solve this problem:             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ function validatePattern(input) {                         │ │
│  │   // Custom validation logic...                           │ │
│  │ }                                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🔒 This runs in a sandboxed environment with no network access │
│                                                                 │
│  ┌───────────┐  ┌───────────┐                                   │
│  │  Deny     │  │  Approve  │                                   │
│  └───────────┘  └───────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Container:** `--warning-bg` background, `--warning-border` border
- **Icon:** Warning triangle in `--warning-text`
- **Code preview:** Collapsible, syntax highlighted
- **Security note:** Lock icon with reassurance
- **Actions:** Ghost "Deny", Primary "Approve"

### 5.5 Chat Input

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Describe what you want to match...                      │   │
│  │                                                         │   │
│  │                                            ⬆️ Send      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⌨️ Enter to send • Shift+Enter for new line                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Container:** Sticky bottom, gradient fade at top edge
- **Input field:** 
  - Background: `--chat-surface`
  - Border: `--border-default`, focus: `--agent-accent`
  - Placeholder: `--text-tertiary`
  - Auto-resize up to `--input-max-height`
- **Send button:**
  - Gradient background (agent colors)
  - White icon
  - Disabled state: 50% opacity
  - Loading: Spinner replaces icon
- **Stop button:** (during generation)
  - Red background
  - Square icon
- **Keyboard hint:** `--text-muted`, disappears on focus

---

## 6. Copy & Microcopy

### 6.1 Headers & Labels

| Current | Proposed |
|---------|----------|
| "Regex Generator" | "Regex Copilot" |
| "I want to generate regex for" | "What would you like to match?" |
| "It should match strings like" | "Examples that should match" |
| "It should NOT match strings like" | "Examples that shouldn't match" |
| "More info" | "Additional context (optional)" |
| "Send a message..." | "Describe what you want to match..." |

### 6.2 Empty State Copy

```
Headline: "Hi! I'm your Regex Copilot."
Subtext: "Describe what you want to match, and I'll generate the perfect regular expression."

Suggestions:
- "Match email addresses ending in .edu"
- "Extract phone numbers from text"
- "Validate URLs with optional protocol"
- "Find dates in MM/DD/YYYY format"
```

### 6.3 Processing States

| State | Copy |
|-------|------|
| Starting | "Understanding your requirements..." |
| Generating | "Crafting the perfect pattern..." |
| Testing | "Testing against your examples..." |
| Optimizing | "Fine-tuning for accuracy..." |
| Reflecting | "Double-checking the results..." |

### 6.4 Success States

```
Primary: "Here's your regex! ✨"
Secondary: "All {n} test cases passed."
Action: "Copy to clipboard"
```

### 6.5 Error States

| Error Type | Headline | Description | Action |
|------------|----------|-------------|--------|
| No match found | "Hmm, that's a tricky one" | "I couldn't find a pattern that matches all your examples. Could you provide more details?" | "Add more examples" |
| Conflicting examples | "I'm a bit confused" | "Some of your 'should match' and 'shouldn't match' examples overlap. Can you clarify?" | "Review examples" |
| API error | "Something went wrong" | "I ran into a technical issue. This isn't your fault—let's try again." | "Try again" |
| Rate limit | "Let's take a breather" | "I'm handling a lot of requests right now. Please wait a moment." | "Retry in {n}s" |
| Timeout | "That took too long" | "The pattern was too complex to generate quickly. Try simplifying your requirements." | "Simplify & retry" |

### 6.6 Thinking Indicators

```
• "Thinking..."
• "Working on it..."
• "Analyzing patterns..."
• "Almost there..."
```

---

## 7. Interaction Patterns

### 7.1 Input Behavior
- **Auto-focus** on page load
- **Auto-resize** textarea as user types
- **Enter** to submit, **Shift+Enter** for newline
- **Escape** to clear input (with confirmation if > 20 chars)

### 7.2 Message Streaming
- Characters appear with 10ms delay for natural feel
- Code blocks render fully (no partial)
- Scroll follows new content unless user scrolled up

### 7.3 Tool States
- Expand/collapse with smooth 200ms animation
- Auto-expand errors, auto-collapse success after 3s
- Approval dialogs block input until resolved

### 7.4 Suggestions
- Click to populate input (don't auto-submit)
- Fade out once user starts typing
- Return on input clear

---

## 8. Responsive Considerations

### Desktop (> 1024px)
- Side panel: 400px fixed width
- Full feature set

### Tablet (768px - 1024px)
- Side panel: 50% width, collapsible
- Floating trigger button when collapsed

### Mobile (< 768px)
- Full-screen modal chat
- Trigger: Floating action button
- Simplified tool cards

---

## 9. Accessibility

- **Color contrast:** All text meets WCAG AA (4.5:1 minimum)
- **Focus states:** Visible outlines on all interactive elements
- **Screen readers:** 
  - `aria-live="polite"` for new messages
  - `role="status"` for processing states
  - `aria-busy="true"` during generation
- **Keyboard navigation:** Full tab support, Escape closes modals
- **Reduced motion:** Respect `prefers-reduced-motion`

---

## 10. Implementation Phases

### Phase 1: Foundation
- [ ] Update CSS variables with new color palette
- [ ] Create shared component library (buttons, inputs, cards)
- [ ] Implement new typography system

### Phase 2: Components
- [ ] Redesign ChatHeader with status indicator
- [ ] Build new EmptyState with suggestions
- [ ] Update MessageRow styling
- [ ] Enhance ToolInvocationCard states

### Phase 3: Integration
- [ ] Migrate RegexGeneratorForm to conversational UI
- [ ] Implement streaming message display
- [ ] Add keyboard shortcuts
- [ ] Connect to new agent app backend

### Phase 4: Polish
- [ ] Add animations and transitions
- [ ] Implement responsive layouts
- [ ] Accessibility audit
- [ ] User testing and iteration

---

## 11. Files to Modify

```
src/
├── app/
│   ├── globals.css                    # Add new CSS variables
│   └── new-agent-app/
│       ├── components/
│       │   ├── chat-header.tsx        # Status indicator, new styling
│       │   ├── chat-input.tsx         # New design, keyboard hints
│       │   ├── empty-state.tsx        # Suggestions, new copy
│       │   └── message-list.tsx       # Spacing, animations
│       └── chat.tsx                   # Layout adjustments
├── components/
│   ├── RegexPlaygroundSection.tsx     # Replace form with chat
│   ├── RegexGeneratorForm.tsx         # Deprecate or repurpose
│   └── chat/
│       ├── message-row.tsx            # New bubble styling
│       └── tool-invocation-card.tsx   # State-specific designs
└── lib/
    └── design-tokens.ts               # Export CSS vars as TS constants
```

---

## 12. Success Metrics

- **User engagement:** Time spent in chat ↑ 20%
- **Task completion:** Successful regex generations ↑ 15%
- **Error recovery:** Users retrying after error ↑ 30%
- **Accessibility:** 0 WCAG AA violations
- **Performance:** First Contentful Paint < 1.5s

---

## Appendix A: Figma/Design Mockups

*To be added: Link to Figma file with visual mockups*

## Appendix B: Animation Specifications

### Thinking Pulse
```css
@keyframes thinking-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}
.thinking-indicator {
  animation: thinking-pulse 1.5s ease-in-out infinite;
}
```

### Message Entrance
```css
@keyframes message-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.message {
  animation: message-enter 0.2s ease-out;
}
```

### Tool Card Expand
```css
@keyframes expand {
  from { max-height: 0; opacity: 0; }
  to { max-height: 500px; opacity: 1; }
}
.tool-card {
  animation: expand 0.3s ease-out;
}
```

---

*Last updated: 2026-01-04*
