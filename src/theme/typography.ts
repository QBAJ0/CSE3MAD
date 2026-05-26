import type { TextStyle } from 'react-native';

export const typography = {
  heading: { fontSize: 28, fontWeight: '800', lineHeight: 36 } as TextStyle,
  title:   { fontSize: 22, fontWeight: '800' } as TextStyle,
  subtitle:{ fontSize: 18, fontWeight: '700' } as TextStyle,
  body:    { fontSize: 15, fontWeight: '400', lineHeight: 22 } as TextStyle,
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 } as TextStyle,
  label:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 } as TextStyle,
};
