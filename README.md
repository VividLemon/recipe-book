# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```

## Testing

Unit and component tests are colocated with the code they cover under `app/`.
Run them with:

```bash
npm run test:unit
npm run test:nuxt
```

End-to-end tests live under `test/e2e` and use Playwright:

```bash
npm run test:e2e
```

The end-to-end suite currently covers application-shell navigation. API-dependent
flows can be added once an API mocking engine is available.bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## Storage

Server persistence is provided by typed engines in `server/storage`. Configure
`NUXT_DOCUMENT_BACKEND` and `NUXT_FILE_BACKEND` as `filesystem` or `memory`;
documents may also use `mongodb`. Filesystem data is stored under
`NUXT_STORAGE_DIR` (default `.data`). MongoDB additionally requires
`NUXT_MONGODB_URI` and `NUXT_MONGODB_DATABASE` (collection names are
configurable). The repository layer keeps API handlers independent of the
backend, and the `$test` configuration selects memory engines.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
