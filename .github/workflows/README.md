# GitHub Actions Workflows

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to main/master/develop branches.

**Jobs:**

- **Lint**: Runs ESLint and Prettier checks
- **Type Check**: Runs TypeScript type checking
- **Test**: Runs unit tests on Node.js 18 and 20
  - Generates coverage report
  - Uploads coverage to Codecov
- **Build**: Builds the package and verifies output files

### PR Check Workflow (`.github/workflows/pr-check.yml`)

Runs on pull request events (opened, synchronize, reopened).

**Features:**

- Comprehensive quality checks
- Automatic PR comments with check results
- Validates code quality before merge

### Publish Workflow (`.github/workflows/publish.yml`)

Runs when a new release is created.

**Steps:**

1. Runs all tests and checks
2. Builds the package
3. Publishes to npm with provenance

## Status Badges

The following badges are displayed in the README:

- **CI Status**: Shows if CI checks are passing
- **npm Version**: Current published version
- **Code Coverage**: Test coverage percentage
- **License**: MIT license badge

## Required Secrets

To use the Publish workflow, you need to set up the following secret in your GitHub repository:

- `NPM_TOKEN`: Your npm authentication token
  - Go to Settings → Secrets and variables → Actions
  - Click "New repository secret"
  - Add your npm token

## Local Testing

Before pushing, you can run the same checks locally:

```bash
# Lint
npm run lint

# Format check
npm run format:check

# Type check
npm run typecheck

# Tests
npm test

# Build
npm run build
```

## Troubleshooting

### CI Fails on Lint

Run locally and fix:

```bash
npm run lint:fix
npm run format
```

### CI Fails on Tests

Run tests locally with verbose output:

```bash
npm test -- --reporter=verbose
```

### Build Output Missing

Check if the build directory name matches the package.json exports:

```bash
npm run build
ls -la output/
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines.
