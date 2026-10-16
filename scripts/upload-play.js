/**
 * Upload the built AAB to Google Play Console via the Play Developer API.
 *
 * Prerequisites (one-time):
 *   1. Google Cloud Console → create project → enable "Google Play Android
 *      Developer API" → create service account → download JSON key.
 *   2. Play Console → Users & permissions → invite that service account
 *      with "Release apps to testing tracks" permission (or higher).
 *   3. Save the JSON key at keystore/play-service-account.json
 *      (gitignored) or set PLAY_SERVICE_ACCOUNT_JSON to its path.
 *
 * Tracks:
 *   internal  → Internal testing
 *   closed    → Closed testing; the actual track name is whatever you named
 *               it in Play Console (e.g. "alpha", "qa"). Set PLAY_CLOSED_TRACK
 *               or pass --track <name> to override. Default: alpha.
 *   Any other value is passed through verbatim (beta, production, qa, ...).
 *
 * Usage:
 *   node scripts/upload-play.js --track internal
 *   node scripts/upload-play.js --track closed
 *   node scripts/upload-play.js --track qa --aab dist/solisspread-1.0.0-release.aab
 */
const fs = require('fs');
const path = require('path');
const { androidpublisher_v3 } = require('@googleapis/androidpublisher');
const { GoogleAuth } = require('google-auth-library');

const ROOT = path.resolve(__dirname, '..');
const IS_WIN = process.platform === 'win32';

function log(msg) { console.log(`\x1b[36m[play]\x1b[0m ${msg}`); }
function fail(msg) { console.error(`\x1b[31m[play] ERROR:\x1b[0m ${msg}`); process.exit(1); }

function parseArgs(argv) {
  const out = { track: 'internal', aab: null, notes: null, status: 'completed' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--track') out.track = argv[++i];
    else if (a === '--aab') out.aab = argv[++i];
    else if (a === '--notes') out.notes = argv[++i];
    else if (a === '--draft') out.status = 'draft';
    else if (a === '--halted') out.status = 'halted';
  }
  if (out.track === 'closed') out.track = process.env.PLAY_CLOSED_TRACK || 'alpha';
  return out;
}

function latestAab() {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) return null;
  const files = fs
    .readdirSync(dist)
    .filter((f) => f.endsWith('.aab'))
    .map((f) => ({ f, mtime: fs.statSync(path.join(dist, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length ? path.join(dist, files[0].f) : null;
}

function keyPath() {
  const candidates = [
    process.env.PLAY_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(ROOT, 'keystore', 'play-service-account.json'),
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo;
  const packageName = appJson.android?.package || 'com.solisspread.app';

  const aab = args.aab || latestAab();
  if (!aab || !fs.existsSync(aab)) fail('no AAB found — run npm run build:aab first (or pass --aab <path>)');
  log(`AAB: ${path.relative(ROOT, aab)}  (${(fs.statSync(aab).size / 1024 / 1024).toFixed(1)} MB)`);
  log(`package: ${packageName}  track: ${args.track}  status: ${args.status}`);

  const key = keyPath();
  if (!key) {
    fail(
      'service-account key not found.\n' +
        '  Save it at keystore/play-service-account.json or set PLAY_SERVICE_ACCOUNT_JSON=<path>.\n' +
        '  Setup: Google Cloud → enable "Google Play Android Developer API" → create service account →\n' +
        '  Play Console → Users & permissions → invite it with release permissions.',
    );
  }

  const auth = new GoogleAuth({
    keyFile: key,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const play = new androidpublisher_v3.Androidpublisher({ auth });

  log('creating edit...');
  const edit = await play.edits.insert({ packageName, requestBody: {} });
  const editId = edit.data.id;

  log('uploading AAB (this can take a few minutes)...');
  const upload = await play.edits.bundles.upload({
    packageName,
    editId,
    media: { mimeType: 'application/octet-stream', body: fs.createReadStream(aab) },
  });
  const versionCode = upload.data.versionCode;
  log(`uploaded — versionCode ${versionCode}`);

  const notes = args.notes || `Solisspread ${appJson.version}`;
  log(`assigning to track "${args.track}"...`);
  await play.edits.tracks.update({
    packageName,
    editId,
    track: args.track,
    requestBody: {
      track: args.track,
      releases: [
        {
          name: `${versionCode} (${appJson.version})`,
          versionCodes: [String(versionCode)],
          status: args.status,
          releaseNotes: [{ language: 'en-US', text: notes }],
        },
      ],
    },
  });

  log('committing edit...');
  await play.edits.commit({ packageName, editId });
  log(`done — versionCode ${versionCode} is live on the ${args.track} track`);
  if (args.status === 'draft') log('release committed as DRAFT — publish it from Play Console when ready.');
}

main().catch((e) => {
  const detail = e?.errors?.[0]?.message || e?.message || String(e);
  if (/app.*not.*found|notBeenAccepted|insufficient/i.test(detail)) {
    fail(`${detail}\n  Check: service account invited in Play Console Users & permissions, app exists, package name matches.`);
  }
  fail(detail);
});
