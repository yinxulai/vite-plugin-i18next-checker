# Contributing to vite-plugin-i18next-checker

Thank you for your interest in contributing to vite-plugin-i18next-checker! We welcome contributions from the community.

## Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/vite-plugin-i18next-checker.git
   cd vite-plugin-i18next-checker
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Project**

   ```bash
   npm run build
   ```

## Development Workflow

### Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format
```

### Type Checking

```bash
npm run typecheck
```

### Development Mode

```bash
# Build in watch mode
npm run dev
```

## Making Changes

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Your Changes**

   - Write clear, concise commit messages
   - Add tests for new features
   - Update documentation as needed
   - Ensure all tests pass
   - Follow the existing code style

3. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with..."
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test changes
   - `chore:` for maintenance tasks
   - `refactor:` for code refactoring

4. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**

   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template with details about your changes

## Pull Request Guidelines

- **Keep PRs focused**: One feature or fix per PR
- **Write tests**: All new features should have corresponding tests
- **Update documentation**: Keep README and docs up to date
- **Pass CI checks**: Ensure all automated checks pass
- **Be descriptive**: Explain what your PR does and why

## Code Style

- Use TypeScript for all source files
- Follow the existing code style (enforced by ESLint and Prettier)
- Write clear, self-documenting code
- Add comments for complex logic
- Use meaningful variable and function names

## Testing

- Write unit tests for all new features
- Ensure test coverage remains high
- Test edge cases
- Use descriptive test names

## Documentation

- Update README.md for user-facing changes
- Update code comments for internal changes
- Keep examples up to date
- Document breaking changes clearly

## Reporting Issues

When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Your environment (Node version, OS, etc.)
- Relevant code samples or error messages

## Questions?

Feel free to open an issue for:

- Questions about the codebase
- Feature requests
- Bug reports
- General discussion

## License

By contributing to vite-plugin-i18next-checker, you agree that your contributions will be licensed under the MIT License.
