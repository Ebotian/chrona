export default {
  '*.{ts,tsx,js,jsx,css,md}': [
    'pnpm exec prettier --write',
    'pnpm exec eslint --max-warnings=0'
  ]
};
