const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let failed = false;

function logError(message) {
  console.error(`\x1b[31m[COMPLIANCE FAIL] ${message}\x1b[0m`);
  failed = true;
}

function logWarn(message) {
  console.warn(`\x1b[33m[COMPLIANCE WARN] ${message}\x1b[0m`);
}

function logInfo(message) {
  console.log(`\x1b[32m[COMPLIANCE OK] ${message}\x1b[0m`);
}

// 1. Check package.json for trailing commas or bad format, and forbidden libraries
try {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const parsed = JSON.parse(content);
  logInfo('package.json parses successfully.');

  const deps = { ...parsed.dependencies, ...parsed.devDependencies };
  if (deps['@radix-ui/react-primitive'] || deps['@radix-ui/react-slot'] || deps['@radix-ui/react-dialog']) {
    logError('package.json contains forbidden @radix-ui packages. Primary library must be HeroUI.');
  } else {
    logInfo('package.json dependencies comply with authorized libraries.');
  }
} catch (err) {
  logError(`package.json is invalid JSON (check for trailing commas or syntax errors): ${err.message}`);
}

// 2. Check for missing critical documentation or logs
const criticalFiles = [
  'README.md',
  'TECHNICAL_WIKI.md',
  '.logs/errors.md',
  '.logs/patterns.md',
  'tasks/todo.md'
];

criticalFiles.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  if (!fs.existsSync(filePath)) {
    logError(`Critical documentation/memory file was deleted or is missing: ${file}`);
  } else {
    logInfo(`Verified presence of critical file: ${file}`);
  }
});

// 3. Scan src directory for hardcoded dev credentials or raw console statements
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== 'backups') {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile() && /\.(js|ts|tsx)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for raw console logs without correlation annotations
      const consoleMatches = content.match(/console\.(log|error|warn)\(/g);
      if (consoleMatches) {
        // Just warn for console logs rather than failing the build, to help developers transition
        logWarn(`${path.relative(ROOT_DIR, fullPath)} contains raw console logs. Enforce structured logging or add correlation IDs.`);
      }

      // Check for hardcoded DEV_SEED_PASSWORD or ghostcart_dev passwords in production code
      if (content.includes('ghostcart_dev') && !fullPath.includes('.env.example') && !fullPath.includes('ci.yml') && !fullPath.includes('docker-compose')) {
        logError(`${path.relative(ROOT_DIR, fullPath)} contains reference to development password 'ghostcart_dev'. Use environment variables.`);
      }
    }
  });
}

try {
  const srcPath = path.join(ROOT_DIR, 'src');
  if (fs.existsSync(srcPath)) {
    scanDirectory(srcPath);
  }
} catch (err) {
  logError(`Failed to scan source directory for compliance: ${err.message}`);
}

// 4. Check README.md for version strings
try {
  const readmePath = path.join(ROOT_DIR, 'README.md');
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    if (!/v[0-9]+\.[0-9]+\.[0-9]+/.test(content)) {
      logWarn('README.md does not contain a version string (e.g. v1.0.0). Track version increments as required.');
    }
  }
} catch (err) {
  logWarn(`Failed to check README.md version string: ${err.message}`);
}

if (failed) {
  console.error('\n\x1b[31m[COMPLIANCE CHECK FAILED] Resolve errors before staging/merging changes.\x1b[0m');
  process.exit(1);
} else {
  console.log('\n\x1b[32m[COMPLIANCE CHECK PASSED] All rules verified successfully.\x1b[0m');
  process.exit(0);
}
