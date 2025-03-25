# node-ts-modules

Enable direct TypeScript imports from node_modules using Node.js `--experimental-strip-types` flag without requiring a separate compilation step.

## Motivation

Node.js introduced the `--experimental-strip-types` flag which allows running TypeScript files directly without compilation. However, Node.js doesn't allow direct importing of TypeScript files from `node_modules`. This package provides a workaround by creating a dedicated `ts_modules` folder that mirrors TypeScript-enabled packages.

This project was inspired by discussions in:
- [Node.js Issue #57215: Support for importing TypeScript files from node_modules](https://github.com/nodejs/node/issues/57215)
- [Reddit Discussion on TypeScript publishing practices](https://www.reddit.com/r/programmingcirclejerk/comments/1epsups/to_discourage_package_authors_from_publishing/)

## How It Works

### Key Concepts

#### 1. Decentralized Registration

Each TypeScript-enabled package adds a postinstall step (using the CLI tool from this package) to create its own symlink in the project's `ts_modules` folder. This avoids scanning the entire `node_modules` directory.

#### 2. Custom Module Resolution

A custom loader intercepts module imports:
- For CommonJS: Monkey-patches Node's resolution to check `ts_modules` first
- For ESM: Uses an experimental loader hook

When a bare import (e.g., `require('my-package')`) is made, the loader checks if a corresponding symlink exists in `ts_modules` and, if so, resolves the package from there.

#### 3. Directory Resolution

If the symlinked package is a directory, the loader looks for a defined entry file using:
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
   node -r ./node_modules/node-ts-modules/loader-cjs.js your-script.js
   ```

   **For ESM:**
   ```bash
   # Directly with Node.js
   node --experimental-loader=node_modules/node-ts-modules/loader-esm.mjs --experimental-strip-types your-script.js
   ```

### For Package Authors

To make your TypeScript package compatible with `node-ts-modules`:

1. Add `node-ts-modules` as a dependency:
   ```bash
   # Using npm
   npm install node-ts-modules
   
   # Using Yarn
   yarn add node-ts-modules
   ```

2. Add a postinstall script to your package.json:
   ```json
   {
     "scripts": {
       "postinstall": "node-ts-modules-postinstall"
     }
   }
   ```

3. Optionally, add a `"ts:main"` field to your package.json to specify the TypeScript entry point:
   ```json
   {
     "main": "dist/index.js",
     "ts:main": "src/index.ts"
   }
   ```

## How Module Resolution Works

1. When a bare import is encountered (e.g., `import { something } from 'package-name'`), the loader intercepts it.
2. The loader checks if a corresponding symlink exists in the `ts_modules` directory.
3. If found, it resolves the import to the TypeScript source file instead of the compiled JavaScript in `node_modules`.
4. Node.js then uses the `--experimental-strip-types` flag to strip the types and execute the TypeScript file directly.

## Limitations

- Requires Node.js version 22 or higher
- The `--experimental-strip-types` flag is still experimental
- Not all TypeScript features are supported by the type stripping mechanism
- Package authors need to explicitly opt-in by adding the postinstall script

## Best Practices

### Add ts_modules to .gitignore

The `ts_modules` directory is created at runtime and contains symlinks specific to your environment. It should not be committed to version control. Make sure to add it to your `.gitignore` file:

```
# ts-modules specific
ts_modules/
```

## License

MIT
