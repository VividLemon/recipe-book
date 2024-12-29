// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintConfigPrettier from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

export default withNuxt({
  plugins: {
    prettier: prettierPlugin
  },
  rules: {
    ...eslintConfigPrettier.rules,
    'prettier/prettier': ['error']
  }
})
