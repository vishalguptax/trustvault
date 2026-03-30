---
name: vercel-react-native-skills
description: React Native and Expo best practices for performance, animation, navigation, and UI patterns. Use when building, reviewing, or optimizing React Native/Expo apps. Triggers on tasks involving list performance, animations, navigation, or mobile UI patterns.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# React Native & Expo Best Practices

Comprehensive best practices for React Native and Expo development. Organized by priority with 8 rule categories covering performance, animation, navigation, and UI patterns.

## When to Apply

Reference these guidelines when:
- Building React Native or Expo apps
- Optimizing list and scroll performance
- Implementing animations
- Setting up navigation
- Reviewing mobile UI patterns
- Working with monorepo structures

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | List Performance | CRITICAL | `list-performance-` |
| 2 | Animation | HIGH | `animation-` |
| 3 | Navigation | HIGH | `navigation-` |
| 4 | UI Patterns | HIGH | `ui-` |
| 5 | State Management | MEDIUM | `state-` |
| 6 | Rendering | MEDIUM | `rendering-` |
| 7 | Monorepo | MEDIUM | `monorepo-` |
| 8 | Configuration | LOW | `config-` |

## Quick Reference

### 1. List Performance (CRITICAL)

- `list-performance-flashlist` - Use FlashList for large lists instead of FlatList
- `list-performance-memoize` - Memoize list item components with React.memo
- `list-performance-callbacks` - Stabilize callbacks with useCallback to prevent re-renders
- `list-performance-key-extractor` - Use stable, unique keys for list items
- `list-performance-estimate-size` - Provide estimatedItemSize for FlashList
- `list-performance-avoid-inline-styles` - Move styles outside render to prevent object recreation

### 2. Animation (HIGH)

- `animation-gpu-properties` - Animate only transform and opacity for GPU acceleration
- `animation-shared-values` - Use Reanimated shared values, not state, for animations
- `animation-derived-values` - Use useDerivedValue for computed animation values
- `animation-worklets` - Run animation logic on UI thread with worklets
- `animation-layout-animations` - Use Reanimated layout animations for enter/exit

### 3. Navigation (HIGH)

- `navigation-native-stack` - Use native stack navigator over JS stack
- `navigation-deep-linking` - Configure deep linking for all key screens
- `navigation-type-safety` - Use TypeScript for navigation params
- `navigation-lazy-screens` - Lazy load screens that aren't immediately needed

### 4. UI Patterns (HIGH)

- `ui-expo-image` - Use expo-image for all images (better caching, formats)
- `ui-safe-area` - Handle safe areas with SafeAreaView/useSafeAreaInsets
- `ui-native-modal` - Use native modals when available
- `ui-pressable` - Use Pressable over TouchableOpacity for better customization
- `ui-context-menu` - Use native context menus for long-press actions
- `ui-keyboard-avoiding` - Handle keyboard properly with KeyboardAvoidingView

### 5. State Management (MEDIUM)

- `state-minimize-subscriptions` - Subscribe to minimal state slices
- `state-external-stores` - Use useSyncExternalStore for external state
- `state-compiler-compat` - Ensure React Compiler compatibility with shared values

### 6. Rendering (MEDIUM)

- `rendering-text-wrapper` - Always wrap strings in Text components
- `rendering-conditional` - Use proper conditional rendering patterns
- `rendering-destructure-props` - Destructure props for React Compiler optimization

### 7. Monorepo (MEDIUM)

- `monorepo-dependencies` - Organize dependencies correctly in multi-package projects
- `monorepo-shared-config` - Share configuration across packages

### 8. Configuration (LOW)

- `config-fonts` - Set up custom fonts with expo-font
- `config-imports` - Use path aliases for clean imports

## How to Use

Read individual rule files for detailed explanations and code examples. Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
