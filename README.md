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
configurable, including `NUXT_MONGODB_USERS_COLLECTION`). Users and their
favorites are stored through the same document backend. Accounts can be
self-registered; passwords are stored as scrypt hashes. Configure
`NUXT_LEGACY_RECIPE_OWNER_ID` (optional account ID that is assigned any recipes
created before ownership existed, at startup), and
`NUXT_SESSION_PASSWORD` with a secret of at least 32 characters in every
deployed environment to encrypt authentication cookies. The repository layer keeps API handlers independent of the
backend, and the `$test` configuration selects memory engines.

Server code follows bounded contexts: `server/recipes`, `server/recipe-tags`,
and `server/photos` contain context types, repositories, and application
services. `server/storage` is infrastructure and exposes backend-neutral ports;
legacy `server/utils` modules remain compatibility facades for existing imports.

## Docker and TrueNAS

The [Dockerfile](Dockerfile) follows the [Nuxt Docker guide](https://nuxt.com/deploy/docker).
The image defaults to MongoDB for documents and stores photos as files under
`/data`, running as TrueNAS's `apps` user (568; override with the `APP_UID` and
`APP_GID` build args). Secrets are supplied when the container starts, never at
build time.

```bash
docker build -t <dockerhub-user>/recipe-book:latest .
docker push <dockerhub-user>/recipe-book:latest
```

[deploy/truenas/compose.yaml](deploy/truenas/compose.yaml) installs it as a
TrueNAS custom app: it points at the local MongoDB app and mounts a dataset on
`/data`. Fill in the placeholders before installing.

HTTPS comes from a Caddy container in the same app, using certificates from
Caddy's own local certificate authority: the app is served at
`https://192.168.1.194:8443` and nothing leaves the local network. HTTPS is
required to sign in (the session cookie is HTTPS-only) and to install the app
for offline use.

1. In the dataset `/mnt/main-mirrored/recipe-book`, create `data` and `caddy`
   folders; give `data` to the `apps` user (568).
2. Install the app, then copy the CA root certificate from
   `/mnt/main-mirrored/recipe-book/caddy/caddy/pki/authorities/local/root.crt`.
3. Trust that certificate once on each device that uses the app:
   - Windows/macOS/Linux: import it as a trusted root CA (Firefox has its own
     certificate store).
   - iOS: install it as a profile, then enable it under Settings > General >
     About > Certificate Trust Settings.
   - Android: Settings > Security > Encryption & credentials > Install a
     certificate > CA certificate.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
