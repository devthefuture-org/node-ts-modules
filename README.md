# DEPRECATED
Finally using `--import tsx/esm` as `--experimental-strip-types` is too buggy (tried to fix the loader introduced too many side effects)



# node-ts-modules

Enable direct TypeScript imports from node_modules using Node.js `--experimental-strip-types` flag without requiring a separate compilation step.

## Motivation

Node.js introduced the `--experimental-strip-types` flag which allows running TypeScript files directly without compilation. However, Node.js doesn't allow direct importing of TypeScript files from `node_modules`. This package provides a workaround by creating a dedicated `ts_modules` folder that mirrors TypeScript-enabled packages.

This project was inspired by discussions in:
- [Node.js Issue #57215: Support for importing TypeScript files from node_modules](https://github.com/nodejs/node/issues/57215)
- [Reddit Discussion on TypeScript publishing practices](https://www.reddit.com/r/programmingcirclejerk/comments/1epsups/to_discourage_package_authors_from_publishing/)

## How It Works

### Key Concepts

#### 1. Single Symlink Approach

Instead of creating individual symlinks for each package, this tool creates a single symlink called `ts_modules` that points to the project's `node_modules` directory. This simplifies the setup and maintenance process.

#### 2. Custom Module Resolution

A custom loader intercepts module imports:
- For CommonJS: Monkey-patches Node's resolution to check `ts_modules` first
- For ESM: Uses an experimental loader hook

When a bare import (e.g., `require('my-package')`) is made, the loader resolves it through the `ts_modules` symlink, which points to `node_modules`.

#### 3. Directory Resolution

For directory imports, the loader looks for a defined entry file using:
1. A custom `"ts:main"` field in package.json
2. Falling back to `"main"` field
3. Looking for `index.ts` or `index.js`

This ensures Node loads a file, not a directory.

## Installation

```bash
# Using npm
npm install node-ts-modules

# Using Yarn
yarn add node-ts-modules
```

## Usage

### For Application Developers

1. Install the package as shown above.

2. Run your application with the appropriate loader:

   **For CommonJS:**
   ```bash
   # Directly with Node.js
   node -r @esbuild-kit/esm-loader your-script.js
   ```

   **For ESM:**
   ```bash
   # Directly with Node.js
   node --experimental-loader=@esbuild-kit/esm-loader your-script.js
   ```

## How Module Resolution Works

1. When a bare import is encountered (e.g., `import { something } from 'package-name'`), the loader intercepts it.
2. The loader resolves the import through the `ts_modules` symlink, which points to `node_modules`.
3. If the package has TypeScript source files, they can be loaded directly.
4. Node.js then uses the `--experimental-strip-types` flag to strip the types and execute the TypeScript file directly.

## Limitations

- Requires Node.js version 22 or higher
- The `--experimental-strip-types` flag is still experimental
- Not all TypeScript features are supported by the type stripping mechanism

## Best Practices

### Add ts_modules to .gitignore

The `ts_modules` directory is created at runtime and contains symlinks specific to your environment. It should not be committed to version control. Make sure to add it to your `.gitignore` file:

```
# ts-modules specific
ts_modules/
```

## License

MIT
