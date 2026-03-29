export default {
  '**/*.{ts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '**/*.{js,json,md,yml,yaml,css}': ['prettier --write'],
  'packages/database/prisma/schema.prisma': [
    'npx prisma format --schema=packages/database/prisma/schema.prisma',
  ],
};
