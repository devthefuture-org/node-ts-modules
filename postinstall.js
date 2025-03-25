#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Finds the project root by looking at the current working directory.
 * If the current directory is inside a "node_modules" folder, then the project root
 * is assumed to be the parent of that "node_modules" directory.
 */
function findProjectRoot() {
  const cwd = process.cwd();
  const parts = cwd.split(path.sep);
  const nmIndex = parts.lastIndexOf('node_modules');
  if (nmIndex !== -1) {
    return parts.slice(0, nmIndex).join(path.sep) || '/';
  }
  return cwd;
}

/**
 * Ensures that the ts_modules folder exists in the given project root.
 * Returns the absolute path to the ts_modules folder.
 */
function ensureTsModulesFolder(projectRoot) {
  const tsModulesDir = path.join(projectRoot, 'ts_modules');
  if (!fs.existsSync(tsModulesDir)) {
    fs.mkdirSync(tsModulesDir);
    console.log(`Created ts_modules folder at ${tsModulesDir}`);
  }
  return tsModulesDir;
}

/**
 * Creates (or replaces) a symlink in ts_modules for the given package.
 * @param {string} tsModulesDir - Absolute path to the ts_modules folder.
 * @param {string} packageName - The name under which this package will be registered.
 * @param {string} targetPath - Absolute path to the package's TS entry file or directory.
 */
function createSymlink(tsModulesDir, packageName, targetPath) {
  const symlinkPath = path.join(tsModulesDir, packageName);
  try {
    // Remove existing symlink (or file) if it exists.
    if (fs.existsSync(symlinkPath)) {
      fs.unlinkSync(symlinkPath);
    }
    // Create the symlink.
    // Use "junction" on Windows for directory symlinks.
    fs.symlinkSync(targetPath, symlinkPath, 'junction');
    console.log(`Created symlink: ${symlinkPath} -> ${targetPath}`);
  } catch (error) {
    console.error(`Failed to create symlink: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Gets the package name from package.json in the current directory.
 * @returns {string} The package name or null if not found.
 */
function getPackageName() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.name;
    }
  } catch (error) {
    console.error(`Error reading package.json: ${error.message}`);
  }
  return null;
}

/**
 * Main CLI entry point.
 * Can be used in two ways:
 * 1. As a postinstall script: node-ts-modules-postinstall
 * 2. With explicit arguments: node-ts-modules-postinstall add <package-name> <relative-path-to-ts-entry>
 */
function main() {
  const args = process.argv.slice(2);
  let packageName, relativeTsEntry;
  
  // Check if running with explicit arguments
  if (args.length >= 1) {
    if (args[0] === 'add' && args.length >= 3) {
      packageName = args[1];
      relativeTsEntry = args[2];
    } else {
      console.error('Usage: node-ts-modules-postinstall');
      console.error('   or: node-ts-modules-postinstall add <package-name> <relative-path-to-ts-entry>');
      process.exit(1);
    }
  } else {
    // Running as postinstall script, try to determine package name and use default path
    packageName = getPackageName();
    if (!packageName) {
      console.error('Could not determine package name from package.json');
      process.exit(1);
    }
    
    // Default to the package root, or check for src directory
    relativeTsEntry = fs.existsSync(path.join(process.cwd(), 'src')) ? './src' : '.';
  }
  
  const projectRoot = findProjectRoot();
  const tsModulesDir = ensureTsModulesFolder(projectRoot);
  // Resolve the target path relative to the current package's directory.
  const targetPath = path.resolve(process.cwd(), relativeTsEntry);
  
  createSymlink(tsModulesDir, packageName, targetPath);
}

main();
