export default {
  '*.{ts,tsx,js,jsx,css,md}': ['pnpm exec prettier --write'],
  '*.{ts,tsx,js,jsx}': 'pnpm exec eslint --max-warnings=0',
};
