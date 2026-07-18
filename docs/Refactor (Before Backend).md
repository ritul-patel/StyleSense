# Code Review: Color & Style Analyzer - Frontend
> Reviewer: Senior Engineer · Scope: Reusability, Naming, Coupling, Performance, Technical Debt

---

## Summary

The codebase has a clean folder structure and correct type definitions. However, several patterns will cause real problems at integration time - particularly the hardcoded mock data in `ResultScreen`, the navigation-based coupling across all screens, and the missing implementation in `UploadScreen`. These need to be fixed before the backend is wired.

**Verdict:** Structure is sound. Execution has 4 critical issues and 6 moderate issues.

---

## 1. Reusability Issues

### `ColorChip` - no `variant` prop
**File:** `components/ColorChip.tsx`

The component renders identically for "best" and "avoid" colors. On `ResultScreen`, both lists use the same chip with no visual distinction. A `variant` prop is needed.

```tsx
// Current - caller cannot distinguish best from avoid
<ColorChip color="olive" />
<ColorChip color="neon" />

// Fix - add variant
interface Props {
  color: string;
  variant: 'best' | 'avoid';
}
// Then apply a border/opacity style based on variant
```

---

### `Button` - loading state uses hardcoded spinner color
**File:** `components/Button.tsx`

```tsx
<ActivityIndicator color="#fff" />
```

This hardcodes white. If the button ever uses a light background, the spinner is invisible. Use `COLORS` constant.

```tsx
<ActivityIndicator color={COLORS.buttonText} />
```

---

### `OutfitCard` - no icon or secondary content slot
**File:** `components/OutfitCard.tsx`

The card renders a single text string. The PRD calls for outfit suggestions - a common V2 extension is adding a category icon or tag. Without a `children` slot or `icon` prop, every extension requires editing this file.

**Recommendation:** Add an optional `tag?: string` prop now. Zero breaking change.

---

## 2. Naming Inconsistencies

### `outfit` vs `suggestion` - prop name mismatch with types
**File:** `components/OutfitCard.tsx`, `types/index.ts`

`AnalysisResult` defines the field as `outfits: string[]`. The `OutfitCard` prop is named `outfit`. The `ResultScreen` maps with `outfit={o}`. This is consistent _by accident_ - a rename in types would break silently.

```tsx
// types/index.ts
outfits: string[];     // array element is a "suggestion" conceptually

// OutfitCard.tsx
interface Props {
  outfit: string;      // should match: suggestion: string, or outfit: string consistently
}
```

**Fix:** Decide on one term - `outfit` or `suggestion` - and use it in both `types/index.ts` and the component prop. `outfit` is fine; just make it explicit.

---

### `TextButton` - defined in folder structure, never implemented or imported
**Files:** `components/TextButton.tsx` (absent from code), `screens/HomeScreen.tsx`

`HomeScreen` imports and uses `TextButton`, but no implementation was provided. This is a silent build break. Even if it exists, it's not reviewed here - it needs to be treated as incomplete.

---

### `UploadBox` component - exists in folder, never used
**File:** `components/UploadBox.tsx`

`UploadScreen.tsx` renders an inline `<View>` with `<Text>Select Image</Text>` instead of using the `UploadBox` component that exists in `components/`. This means `UploadBox` is dead code, and `UploadScreen` has no real upload logic.

```tsx
// UploadScreen.tsx - current (wrong)
<View style={styles.uploadBox}>
  <Text>Select Image</Text>
</View>

// Fix - use the actual component
import { UploadBox } from '../components/UploadBox';
<UploadBox onImageSelected={(uri) => setImage(uri)} />
```

---

## 3. Component Coupling

### `ProcessingScreen` - hardcoded `setTimeout` navigation ⚠️ Critical
**File:** `screens/ProcessingScreen.tsx`

```tsx
useEffect(() => {
  setTimeout(() => {
    navigation.replace('Result');
  }, 2000);
}, []);
```

This is the most dangerous pattern in the codebase. The screen:
- Does not make any API call
- Does not wait for a real result
- Navigates after an arbitrary 2-second delay unconditionally

When the backend is wired, this screen must watch actual async state - not a timer. If the API takes 3 seconds, the app navigates to `ResultScreen` before data exists.

**Fix:** `ProcessingScreen` should watch a `status` value from context, not use a timeout.

```tsx
// Correct pattern
const { status } = useAnalysisContext();
useEffect(() => {
  if (status === 'done') navigation.replace('Result');
  if (status === 'error') navigation.replace('Home'); // or show error
}, [status]);
```

---

### `ResultScreen` - hardcoded mock data ⚠️ Critical
**File:** `screens/ResultScreen.tsx`

```tsx
const data = {
  skinTone: 'medium',
  undertone: 'warm',
  bestColors: ['olive', 'beige'],
  avoidColors: ['neon'],
  outfits: ['Olive shirt + beige chinos'],
};
```

This data is hardcoded. The screen will always show `medium/warm` regardless of what the user selected or what the API returns. When backend integration begins, this will silently show wrong results - not an error.

**Fix:** Read from context.

```tsx
const { result } = useAnalysisContext();
if (!result) return <Loader />;
```

---

### `ManualScreen` - local state instead of context ⚠️ Critical
**File:** `screens/ManualScreen.tsx`

`skinTone` and `undertone` are stored in local `useState`. When the user taps "Get Results" and navigates to `ProcessingScreen`, this data is lost - nothing passes it to the API or to shared state.

```tsx
// Current - data dies on navigation
const [skinTone, setSkinTone] = useState<string | null>(null);
```

**Fix:** Dispatch to `AnalysisContext` on selection, not on submit. Or at minimum, pass as route params. Either way, the API call must be made _in this screen_, not silently expected to happen elsewhere.

---

### All screens take `navigation: any` ⚠️ Moderate
**Files:** All `screens/*.tsx`

Using `any` for the navigation prop removes all type safety from route names. A typo like `navigation.navigate('Procesing')` fails silently at runtime.

**Fix:** Type the navigation prop using React Navigation's `NativeStackScreenProps`.

```tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Manual'>;
```

And export `RootStackParamList` from `AppNavigator.tsx`.

---

## 4. Performance Risks

### `ResultScreen` - inline `map` with `key={c}` on color strings
**File:** `screens/ResultScreen.tsx`

```tsx
{data.bestColors.map((c) => <ColorChip key={c} color={c} />)}
```

Using the color name as a key works only if color names are unique within the list. If the same color ever appears in both `bestColors` and `avoidColors` in the same rendered context, React will have key conflicts. Use index as secondary fallback, or prefix keys:

```tsx
{data.bestColors.map((c, i) => <ColorChip key={`best-${c}-${i}`} color={c} />)}
```

---

### `UploadScreen` - `image` state initialized to `null`, no `useImagePicker` hook used
**File:** `screens/UploadScreen.tsx`

The hook `hooks/useImagePicker.ts` exists but is not imported here. The screen manually manages an image state that never gets set (no picker is invoked). This means `disabled={!image}` on the Continue button will always be `true`.

**Fix:** Wire `useImagePicker` into this screen. This is the hook's entire purpose.

---

## 5. Technical Debt

### `constants/colors.ts` - referenced but `COLORS.primary` value is unknown
**File:** `components/Button.tsx`

```tsx
backgroundColor: COLORS.primary,
```

`colors.ts` is not provided in this review. If `COLORS.primary` is undefined at runtime, the button background falls back to transparent. Define and export at minimum: `primary`, `background`, `text`, `buttonText`, `muted`.

---

### `validators.ts` - not connected to any screen
**File:** `utils/validators.ts`

The file exists in the folder structure but is not imported anywhere in the provided screens. Validation currently happens only via `disabled={!isValid}` boolean checks. Before backend wiring, `validators.ts` needs to export and be used for:
- Image file type + size (`UploadScreen`)
- Required field check (`ManualScreen`)

---

### `useImagePicker.ts` - not implemented in this review
**File:** `hooks/useImagePicker.ts`

Permissions handling for camera/media library must be in this hook, not in the screen. On iOS and Android, calling the image picker without requesting permission first throws a runtime error. The hook must:
1. Check existing permission status
2. Request if not granted
3. Handle denial gracefully (return `null` + trigger a user-facing message)

---

## Issue Priority Table

| # | File | Issue | Priority |
|---|------|-------|----------|
| 1 | `ProcessingScreen.tsx` | Hardcoded setTimeout - no API wait | 🔴 Critical |
| 2 | `ResultScreen.tsx` | Hardcoded mock data - never reads real result | 🔴 Critical |
| 3 | `ManualScreen.tsx` | Local state never reaches API or context | 🔴 Critical |
| 4 | `UploadScreen.tsx` | `UploadBox` component unused; picker never invoked | 🔴 Critical |
| 5 | All screens | `navigation: any` - no type safety on routes | 🟡 Moderate |
| 6 | `ColorChip.tsx` | No `variant` prop - best/avoid visually identical | 🟡 Moderate |
| 7 | `useImagePicker.ts` | Permissions not handled | 🟡 Moderate |
| 8 | `validators.ts` | Exists but wired to nothing | 🟡 Moderate |
| 9 | `Button.tsx` | Hardcoded spinner color `#fff` | 🟢 Low |
| 10 | `ResultScreen.tsx` | `key` collision risk on color chip lists | 🟢 Low |

---

## What NOT to Change

The following are correct and should not be modified:

- `types/index.ts` - `SkinTone`, `Undertone`, `AnalysisResult` are properly typed
- `AppNavigator.tsx` - Stack structure and screen order are correct
- `components/Loader.tsx` - Simple and sufficient for V1
- Folder structure - Clean separation, scales correctly
- `Button.tsx` - `disabled || loading` guard is correct

---

*End of review. Fix items 1–4 before any backend integration work begins.*
