/**
 * Build a signed Google Play Store AAB from this repo.
 *
 * What it does:
 *   1. Generates a JKS release keystore in ./keystore (outside android/ so
 *      `expo prebuild --clean` can never delete it).
 *   2. Runs `expo prebuild -p android --clean` to (re)generate android/.
 *   3. Injects release signing config into android/gradle.properties and
 *      android/app/build.gradle.
 *   4. Runs `gradlew :app:bundleRelease` and copies the AAB into ./dist.
 *
 * Credentials (in priority order):
 *   - Env: SOLIS_KEYSTORE_PASSWORD, SOLIS_KEY_ALIAS, SOLIS_KEY_PASSWORD
 *   - keystore/credentials.json (created on first interactive run)
 *   - Interactive prompt when stdin is a TTY
 *
 * Usage:
 *   node scripts/build-aab.js
 *   SOLIS_KEYSTORE_PASSWORD=*** SOLIS_KEY_PASSWORD=*** node scripts/build-aab.js
 */
const { spawnSync, execSync, execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const IS_WIN = process.platform === 'win32';

/**
 * Windows MAX_PATH (260) kills CMake native builds under deep project paths —
 * generated object names embed the absolute node_modules path, so subst/junction
 * tricks all break somewhere in the Expo toolchain. Bulletproof fix: mirror the
 * repo to a short staging path (robocopy /MIR — incremental, fast after first
 * run) and build there as a completely normal directory.
 */
const BUILD_ROOT = IS_WIN && ROOT.length > 40 ? 'E:\\sb' : ROOT;

const KEYSTORE_DIR = path.join(ROOT, 'keystore');
const KEYSTORE_PATH = path.join(KEYSTORE_DIR, 'solisspread-release.jks');
const CREDS_PATH = path.join(KEYSTORE_DIR, 'credentials.json');
const B_KEYSTORE_DIR = path.join(BUILD_ROOT, 'keystore');
const B_KEYSTORE_PATH = path.join(B_KEYSTORE_DIR, 'solisspread-release.jks');
const ANDROID_DIR = path.join(BUILD_ROOT, 'android');
const GRADLE_PROPS = path.join(ANDROID_DIR, 'gradle.properties');
const APP_BUILD_GRADLE = path.join(ANDROID_DIR, 'app', 'build.gradle');
const AAB_OUT = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');

function log(msg) { console.log(`\x1b[36m[aab]\x1b[0m ${msg}`); }
function fail(msg) {
  console.error(`\x1b[31m[aab] ERROR:\x1b[0m ${msg}`);
  process.exit(1);
}

function run(cmd, args, opts = {}) {
  log(`$ ${cmd} ${args.join(' ')}`);
  // cmd.exe needs args with spaces quoted; spawnSync with shell:true joins raw.
  const safeArgs = IS_WIN ? args.map((a) => (/\s|["'&<>|]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)) : args;
  const res = spawnSync(cmd, safeArgs, { stdio: 'inherit', cwd: ROOT, shell: IS_WIN, ...opts });
  const ok = opts.okCodes ? opts.okCodes.includes(res.status) : res.status === 0;
  if (!ok) fail(`command failed (${res.status}): ${cmd} ${args.join(' ')}`);
}

/** Mirror the repo to the short build path. robocopy exits 0-7 on success. */
function stageRepo() {
  if (BUILD_ROOT === ROOT) return;
  log(`staging repo -> ${BUILD_ROOT} (incremental)`);
  const skipDirs = ['.git', 'dist', '.expo', 'android', '.cxx'].map((d) =>
    d === '.cxx' ? d : path.join(ROOT, d),
  );
  run('robocopy', [
    ROOT, BUILD_ROOT, '/MIR',
    '/XD', ...skipDirs,
    '/XF', '*.log',
    '/NFL', '/NDL', '/NP', '/NJH', '/NJS', '/R:2', '/W:2',
  ], { okCodes: [0, 1, 2, 3, 4, 5, 6, 7] });
}

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden && process.stdin.isTTY) {
      process.stdin.on('data', (ch) => { /* noop */ });
    }
    rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); });
  });
}

async function getCredentials() {
  const envAlias = process.env.SOLIS_KEY_ALIAS || 'solisspread';
  const envStore = process.env.SOLIS_KEYSTORE_PASSWORD;
  const envKey = process.env.SOLIS_KEY_PASSWORD || envStore;

  if (fs.existsSync(CREDS_PATH)) {
    const saved = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    return {
      alias: envAlias !== 'solisspread' ? envAlias : saved.alias,
      storePassword: envStore || saved.storePassword,
      keyPassword: envKey || saved.keyPassword,
    };
  }
  if (envStore) return { alias: envAlias, storePassword: envStore, keyPassword: envKey };

  if (!process.stdin.isTTY) {
    const generated = crypto.randomBytes(18).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    return { alias: envAlias, storePassword: generated, keyPassword: generated, generated: true };
  }
  const storePassword = await ask('Release keystore password (min 6 chars): ');
  if (storePassword.length < 6) fail('keystore password must be at least 6 characters');
  const keyPassword = (await ask('Key password [Enter = same as keystore]: ')) || storePassword;
  const alias = (await ask(`Key alias [${envAlias}]: `)) || envAlias;
  return { alias, storePassword, keyPassword };
}

function ensureKeystore(creds) {
  // Keystore + credentials live in the REAL repo root (survives restaging);
  // the stage sync copies them into the build dir.
  if (fs.existsSync(KEYSTORE_PATH)) {
    log(`keystore exists: ${path.relative(ROOT, KEYSTORE_PATH)}`);
    return;
  }
  fs.mkdirSync(KEYSTORE_DIR, { recursive: true });
  const args = [
    '-genkeypair', '-v',
    '-storetype', 'JKS',
    '-keystore', KEYSTORE_PATH,
    '-alias', creds.alias,
    '-keyalg', 'RSA',
    '-keysize', '2048',
    '-validity', '10950', // ~30 years
    '-storepass', creds.storePassword,
    '-keypass', creds.keyPassword,
    '-dname', 'CN=Solisspread, OU=Mobile, O=Solisspread, L=Jaipur, S=Rajasthan, C=IN',
  ];
  run('keytool', args);

  fs.writeFileSync(
    CREDS_PATH,
    JSON.stringify({ alias: creds.alias, storePassword: creds.storePassword, keyPassword: creds.keyPassword }, null, 2),
  );
  log(`credentials saved to ${path.relative(ROOT, CREDS_PATH)} — keep this file private, it is gitignored`);
}

function prebuild() {
  run('npx', ['expo', 'prebuild', '-p', 'android', '--clean', '--no-install'], { cwd: BUILD_ROOT });
}

function injectSigning(creds, cxxDir) {
  if (!fs.existsSync(GRADLE_PROPS) || !fs.existsSync(APP_BUILD_GRADLE)) {
    fail('android/ not generated — prebuild did not produce gradle files');
  }

  // 1) gradle.properties — credentials as properties (android/ is gitignored)
  let props = fs.readFileSync(GRADLE_PROPS, 'utf8').replace(/\r\n/g, '\n');
  props = props
    .split('\n')
    .filter((l) => !l.startsWith('SOLISSPREAD_UPLOAD_'))
    .join('\n');
  const storeFilePath = B_KEYSTORE_PATH.split(path.sep).join('/');
  props += [
    '',
    '# Release signing (injected by scripts/build-aab.js — do not commit real secrets)',
    `SOLISSPREAD_UPLOAD_STORE_FILE=${storeFilePath}`,
    `SOLISSPREAD_UPLOAD_KEY_ALIAS=${creds.alias}`,
    `SOLISSPREAD_UPLOAD_STORE_PASSWORD=${creds.storePassword}`,
    `SOLISSPREAD_UPLOAD_KEY_PASSWORD=${creds.keyPassword}`,
    '',
    '# Gradle memory (injected by scripts/build-aab.js)',
    'org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g',
    '',
  ].join('\n');
  fs.writeFileSync(GRADLE_PROPS, props);
  log('gradle.properties updated with signing properties');

  // 2) app/build.gradle — add release signingConfig + use it in release buildType
  let gradle = fs.readFileSync(APP_BUILD_GRADLE, 'utf8').replace(/\r\n/g, '\n');

  const debugBlock = /(debug\s*\{\s*storeFile\s+file\('debug\.keystore'\)[^}]*\})/;
  if (!debugBlock.test(gradle)) {
    if (!/signingConfigs[\s\S]*release\s*\{[\s\S]*SOLISSPREAD_UPLOAD_STORE_FILE/.test(gradle)) {
      fail('could not locate debug signingConfig in app/build.gradle — template may have changed');
    }
  } else if (!/release\s*\{\s*storeFile\s+file\(SOLISSPREAD_UPLOAD_STORE_FILE\)/.test(gradle)) {
    gradle = gradle.replace(
      debugBlock,
      `$1
        release {
            storeFile file(SOLISSPREAD_UPLOAD_STORE_FILE)
            storePassword SOLISSPREAD_UPLOAD_STORE_PASSWORD
            keyAlias SOLISSPREAD_UPLOAD_KEY_ALIAS
            keyPassword SOLISSPREAD_UPLOAD_KEY_PASSWORD
        }`,
    );
  }

  // Point the release buildType at the release signing config.
  const releaseBuildType = /(buildTypes\s*\{[\s\S]*?release\s*\{)([\s\S]*?)(\n\s*\})/;
  const m = gradle.match(releaseBuildType);
  if (m) {
    let inner = m[2];
    if (/signingConfig\s+signingConfigs\.\w+/.test(inner)) {
      inner = inner.replace(/signingConfig\s+signingConfigs\.\w+/, 'signingConfig signingConfigs.release');
    } else {
      inner = `\n            signingConfig signingConfigs.release${inner}`;
    }
    gradle = gradle.replace(releaseBuildType, `$1${inner}$3`);
  } else {
    fail('could not locate release buildType in app/build.gradle — template may have changed');
  }

  // Relocate the CMake staging dir to the shortest possible path (MAX_PATH fix).
  if (cxxDir && !/buildStagingDirectory/.test(gradle)) {
    const cxxGradle = cxxDir.split(path.sep).join('/');
    gradle = gradle.replace(
      /\n(\s*)signingConfigs\s*\{/,
      `\n$1externalNativeBuild {
$1    cmake {
$1        buildStagingDirectory = file("${cxxGradle}")
$1    }
$1}
$1signingConfigs {`,
    );
    if (!/buildStagingDirectory/.test(gradle)) {
      log('WARN: could not inject buildStagingDirectory — deep-path CMake build may fail on Windows');
    }
  }

  fs.writeFileSync(APP_BUILD_GRADLE, gradle);
  log('app/build.gradle patched with release signing config');
}

function buildAab(buildAndroidDir) {
  const gradlew = IS_WIN ? 'gradlew.bat' : './gradlew';
  run(gradlew, [':app:bundleRelease'], { cwd: buildAndroidDir });
}

function collect() {
  if (!fs.existsSync(AAB_OUT)) fail(`AAB not found at ${AAB_OUT}`);
  const { version } = require(path.join(ROOT, 'app.json')).expo;
  const dist = path.join(ROOT, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  const dest = path.join(dist, `solisspread-${version}-release.aab`);
  fs.copyFileSync(AAB_OUT, dest);
  const sizeMb = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
  log(`✅ AAB ready: ${path.relative(ROOT, dest)} (${sizeMb} MB)`);
  log('Upload this file to Google Play Console → Release → Production.');
}

(async () => {
  log('Solisspread release AAB build');
  if (BUILD_ROOT !== ROOT) log(`staging build at ${BUILD_ROOT} (Windows MAX_PATH workaround)`);
  const creds = await getCredentials();
  ensureKeystore(creds);
  stageRepo();
  prebuild();
  injectSigning(creds, BUILD_ROOT !== ROOT ? 'E:\\cxx' : null);
  buildAab(ANDROID_DIR);
  collect();
})().catch((e) => fail(e.message));
