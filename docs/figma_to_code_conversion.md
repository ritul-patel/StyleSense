# Figma-to-Code Conversion
## StyleSense - React Native Implementation Guide

---

## 1. Folder Structure (Scalable)

```
src/
│
├── components/
│   ├── Button.tsx
│   ├── TextButton.tsx
│   ├── ColorChip.tsx
│   ├── OutfitCard.tsx
│   ├── UploadBox.tsx
│   └── Loader.tsx
│
├── screens/
│   ├── HomeScreen.tsx
│   ├── UploadScreen.tsx
│   ├── ManualScreen.tsx
│   ├── ProcessingScreen.tsx
│   └── ResultScreen.tsx
│
├── navigation/
│   └── AppNavigator.tsx
│
├── types/
│   └── index.ts
│
├── constants/
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
│
├── hooks/
│   └── useImagePicker.ts
│
├── utils/
│   └── validators.ts
│
└── App.tsx
```

---

## 2. Types (Type Safety)

### `types/index.ts`

```typescript
export type SkinTone  = 'light' | 'medium' | 'dark';
export type Undertone = 'warm'  | 'cool'   | 'neutral';

export interface AnalysisResult {
  skinTone    : SkinTone;
  undertone   : Undertone;
  bestColors  : string[];
  avoidColors : string[];
  outfits     : string[];
}
```

---

## 3. Reusable Components

### `Button.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

interface Props {
  title    : string;
  onPress  : () => void;
  disabled?: boolean;
  loading? : boolean;
}

export const Button: React.FC<Props> = ({ title, onPress, disabled, loading }) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={styles.text}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    padding        : 14,
    borderRadius   : 10,
    alignItems     : 'center',
  },
  disabled: { opacity: 0.5 },
  text    : { color: '#fff', fontWeight: '600' },
});
```

---

### `ColorChip.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  color: string;
}

export const ColorChip: React.FC<Props> = ({ color }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.circle, { backgroundColor: color }]} />
      <Text style={styles.label}>{color}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', margin: 8 },
  circle   : { width: 40, height: 40, borderRadius: 20 },
  label    : { marginTop: 4, fontSize: 12 },
});
```

---

### `OutfitCard.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  outfit: string;
}

export const OutfitCard: React.FC<Props> = ({ outfit }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{outfit}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding        : 12,
    borderRadius   : 10,
    backgroundColor: '#f5f5f5',
    marginBottom   : 10,
  },
  text: { fontSize: 14 },
});
```

---

### `Loader.tsx`

```typescript
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

export const Loader = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" />
    <Text style={styles.text}>Analyzing your style...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  text     : { marginTop: 10 },
});
```

---

## 4. Screens

### `HomeScreen.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../components/Button';
import { TextButton } from '../components/TextButton';

export const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>StyleSense</Text>

      <Text style={styles.heading}>
        Find what colors and outfits suit you
      </Text>

      <Text style={styles.subtext}>
        Upload your photo and get instant styling advice
      </Text>

      <Button title="Upload Photo" onPress={() => navigation.navigate('Upload')} />
      <TextButton title="Try manually" onPress={() => navigation.navigate('Manual')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title    : { fontSize: 18, fontWeight: 'bold' },
  heading  : { fontSize: 24, marginVertical: 10 },
  subtext  : { color: '#666', marginBottom: 20 },
});
```

---

### `UploadScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Button } from '../components/Button';

export const UploadScreen = ({ navigation }: any) => {
  const [image, setImage] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload your photo</Text>

      <View style={styles.uploadBox}>
        <Text>Select Image</Text>
      </View>

      {image && <Image source={{ uri: image }} style={styles.preview} />}

      <Text style={styles.helper}>
        Use clear lighting. Face should be visible.
      </Text>

      <Button
        title="Continue"
        onPress={() => navigation.navigate('Processing')}
        disabled={!image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container : { flex: 1, padding: 20 },
  title     : { fontSize: 20, marginBottom: 10 },
  uploadBox : { height: 150, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  preview   : { height: 150, marginVertical: 10 },
  helper    : { fontSize: 12, color: '#666', marginVertical: 10 },
});
```

---

### `ManualScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../components/Button';

export const ManualScreen = ({ navigation }: any) => {
  const [skinTone,  setSkinTone]  = useState<string | null>(null);
  const [undertone, setUndertone] = useState<string | null>(null);

  const isValid = skinTone && undertone;

  return (
    <View style={styles.container}>
      <Text>Select your details</Text>

      <Text>Skin Tone</Text>
      <Text onPress={() => setSkinTone('light')}>Light</Text>
      <Text onPress={() => setSkinTone('medium')}>Medium</Text>
      <Text onPress={() => setSkinTone('dark')}>Dark</Text>

      <Text>Undertone</Text>
      <Text onPress={() => setUndertone('warm')}>Warm</Text>
      <Text onPress={() => setUndertone('cool')}>Cool</Text>
      <Text onPress={() => setUndertone('neutral')}>Neutral</Text>

      <Button
        title="Get Results"
        onPress={() => navigation.navigate('Processing')}
        disabled={!isValid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
```

---

### `ProcessingScreen.tsx`

```typescript
import React, { useEffect } from 'react';
import { Loader } from '../components/Loader';

export const ProcessingScreen = ({ navigation }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Result');
    }, 2000);
    return () => clearTimeout(timer); // cleanup
  }, []);

  return <Loader />;
};
```

---

### `ResultScreen.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ColorChip } from '../components/ColorChip';
import { OutfitCard } from '../components/OutfitCard';
import { Button } from '../components/Button';

export const ResultScreen = ({ navigation }: any) => {
  const data = {
    skinTone   : 'medium',
    undertone  : 'warm',
    bestColors : ['olive', 'beige'],
    avoidColors: ['neon'],
    outfits    : ['Olive shirt + beige chinos'],
  };

  return (
    <View style={styles.container}>
      <Text>Result Summary</Text>

      <Text>{data.skinTone}, {data.undertone}</Text>

      <Text>Best Colors</Text>
      <View style={styles.row}>
        {data.bestColors.map((c) => <ColorChip key={c} color={c} />)}
      </View>

      <Text>Avoid Colors</Text>
      <View style={styles.row}>
        {data.avoidColors.map((c) => <ColorChip key={c} color={c} />)}
      </View>

      <Text>Outfits</Text>
      {data.outfits.map((o) => <OutfitCard key={o} outfit={o} />)}

      <Button title="Try Again" onPress={() => navigation.navigate('Upload')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  row      : { flexDirection: 'row', flexWrap: 'wrap' },
});
```

---

## 5. Navigation

### `AppNavigator.tsx`

```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen }       from '../screens/HomeScreen';
import { UploadScreen }     from '../screens/UploadScreen';
import { ManualScreen }     from '../screens/ManualScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { ResultScreen }     from '../screens/ResultScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home"       component={HomeScreen} />
    <Stack.Screen name="Upload"     component={UploadScreen} />
    <Stack.Screen name="Manual"     component={ManualScreen} />
    <Stack.Screen name="Processing" component={ProcessingScreen} />
    <Stack.Screen name="Result"     component={ResultScreen} />
  </Stack.Navigator>
);
```

---

## 6. Best Practices Applied

| Practice | Details |
|---|---|
| Clear separation of concerns | Screen logic stays in screens, UI logic stays in components |
| Reusable UI components | `Button`, `ColorChip`, `OutfitCard`, `Loader` shared across screens |
| Type-safe data structures | `SkinTone`, `Undertone`, `AnalysisResult` defined in `types/index.ts` |
| No inline styling chaos | All styles via `StyleSheet.create()` |
| Minimal state complexity | Local `useState` only, no global state in MVP |
| Scalable folder structure | Easy to extend into services, hooks, and store layers |

---

*Code Guide Version: 1.0 | Product: StyleSense MVP | March 2026*
