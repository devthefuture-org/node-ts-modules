const Module = require('module');
const path = require('path');
const fs = require('fs');

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  // Check if the request is a bare module specifier.
  // Typically, bare specifiers do not start with '.' or a path separator.
  if (!request.startsWith('.') && !path.isAbsolute(request)) {
    // Determine the project root.
    const projectRoot = process.cwd();
    // Build the potential ts_modules path for the package.
    const tsModulePath = path.join(projectRoot, 'ts_modules', request);
    
    // If the package exists in ts_modules, resolve it from there.
    if (fs.existsSync(tsModulePath)) {
      // Let Node resolve the package as if it were a local path.
      return originalResolveFilename.call(this, tsModulePath, parent, isMain, options);
    }
  }
  
  // Fallback to normal resolution.
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

console.log('node-ts-modules loader activated: resolving bare module names via ts_modules if available.');
