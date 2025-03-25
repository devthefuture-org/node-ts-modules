import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

/**
 * Resolve the entry point for a package in ts_modules.
 * First, it checks for a package.json with a "ts:main" field.
 * If not found, it falls back to the "main" field.
 * Otherwise, it tries index.ts or index.js.
 */
function resolveEntry(tsModulePath) {
  const pkgJsonPath = path.join(tsModulePath, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkg['ts:main']) {
        return path.join(tsModulePath, pkg['ts:main']);
      }
      if (pkg.main) {
        return path.join(tsModulePath, pkg.main);
      }
    } catch (err) {
      // If package.json can't be parsed, we continue to fallback.
      console.error(`Error parsing package.json in ${tsModulePath}: ${err.message}`);
    }
  }
  // Fallback: try index.ts then index.js
  const indexTs = path.join(tsModulePath, 'index.ts');
  if (fs.existsSync(indexTs)) {
    return indexTs;
  }
  const indexJs = path.join(tsModulePath, 'index.js');
  if (fs.existsSync(indexJs)) {
    return indexJs;
  }
  throw new Error(`Cannot resolve entry point for module at ${tsModulePath}`);
}

export async function resolve(specifier, context, defaultResolve) {
  // Only intercept bare specifiers.
  if (
    !specifier.startsWith('.') &&
    !specifier.startsWith('/') &&
    !/^[A-Za-z]:\\/.test(specifier)
  ) {
    const projectRoot = process.cwd();
    const tsModulePath = path.join(projectRoot, 'ts_modules', specifier);

    if (fs.existsSync(tsModulePath)) {
      let resolvedPath = tsModulePath;
      const stats = fs.statSync(tsModulePath);
      if (stats.isDirectory()) {
        // Resolve the directory to its actual entry file.
        resolvedPath = resolveEntry(tsModulePath);
      }
      const resolvedUrl = pathToFileURL(resolvedPath).href;
      return { url: resolvedUrl, shortCircuit: true };
    }
  }
  // Fall back to default resolution.
  return defaultResolve(specifier, context, defaultResolve);
}
