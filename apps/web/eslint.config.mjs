import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            'attach',
            'args',
            'rotation',
            'sizeAttenuation',
            'vertexColors',
            'blending',
            'depthWrite',
            'transparent',
            'intensity',
            'opacity',
            'toneMapped',
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/home/Preloader.tsx'],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
]);

export default eslintConfig;
