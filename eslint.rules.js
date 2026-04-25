export const generatedAndVendorIgnores = [
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/node_modules/**',
  '**/*.generated.ts',
  '**/bun.lock',
];

export const runtimeCompositionRootImports = ['apps/runtime/*', '@prismhub/runtime/*'];
export const coreForbiddenImports = [
  '@prismhub/http-server',
  '@prismhub/app-api',
  '@prismhub/mcp-host',
  '@prismhub/mcp-client',
  '@prismhub/web-assets',
];
export const dbForbiddenImports = [
  '@prismhub/core',
  '@prismhub/http-server',
  '@prismhub/app-api',
  '@prismhub/mcp-core',
  '@prismhub/mcp-host',
  '@prismhub/mcp-client',
  '@prismhub/web-assets',
];

export const typeSafetyRules = {
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/consistent-type-exports': 'error',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'warn',
  '@typescript-eslint/prefer-optional-chain': 'warn',
  '@typescript-eslint/prefer-readonly': 'warn',
  '@typescript-eslint/no-unnecessary-condition': 'warn',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
};

export const qualityRules = {
  'no-console': 'error',
  'max-lines': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
  'promise/param-names': 'error',
  'promise/no-return-wrap': 'error',
  'promise/no-multiple-resolved': 'error',
  'unicorn/no-for-loop': 'error',
  'unicorn/prefer-includes': 'error',
  'unicorn/throw-new-error': 'error',
  'unicorn/no-useless-promise-resolve-reject': 'error',
  'unicorn/prefer-string-trim-start-end': 'error',
  'unicorn/no-unnecessary-await': 'error',
  'unicorn/no-array-push-push': 'error',
};

export function restrictedImportRule(group, message) {
  return ['error', { patterns: [{ group, message }] }];
}
