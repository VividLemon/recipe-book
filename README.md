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

Server persistence is provided by typed engines in `server/storage`. Recipe
documents and photos use the filesystem by default under `STORAGE_DIR`
(`.data`), while tests select the in-memory engines through Nuxt's `$test`
runtime configuration. The repository layer keeps API handlers independent of
the backend. A native Mongo collection can be supplied to
`MongoDocumentEngine` when a deployment already provides MongoDB; Mongo is
intentionally an optional adapter and is not required by this application.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
