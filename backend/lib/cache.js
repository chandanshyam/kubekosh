'use strict';

const fs   = require('fs');
const path = require('path');
const { loadAddonManifests, validateGraph } = require('./addons');

// ── Directory paths (env-overridable for testability) ─────────────────────────
const SCENARIOS_DIR = process.env.SCENARIOS_DIR || path.join(__dirname, '../../scenarios/data');
const BUNDLES_DIR   = process.env.BUNDLES_DIR   || path.join(__dirname, '../../scenarios/bundles');
const TRACKS_DIR    = process.env.TRACKS_DIR     || path.join(__dirname, '../../scenarios/tracks');
const ADDONS_DIR    = process.env.ADDONS_DIR     || path.join(__dirname, '../../addons');

// ── In-memory caches ──────────────────────────────────────────────────────────
let tracksCache   = [];
let bundlesCache  = [];
let scenariosCache = [];
let addonsCache   = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read every *.json file in `dir` and parse it.
 * Returns an array of parsed objects.
 */
function loadJsonDir(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Reload all in-memory caches from disk.
 * Safe to call at any time; errors are logged but not thrown.
 */
function reloadCache() {
  try {
    tracksCache    = fs.existsSync(TRACKS_DIR)   ? loadJsonDir(TRACKS_DIR)   : [];
    bundlesCache   = fs.existsSync(BUNDLES_DIR)  ? loadJsonDir(BUNDLES_DIR)  : [];
    scenariosCache = fs.existsSync(SCENARIOS_DIR) ? loadJsonDir(SCENARIOS_DIR) : [];

    const { addons, errors } = loadAddonManifests(ADDONS_DIR);
    addonsCache = addons;
    errors.forEach(e => console.warn(`Addon manifest issue: ${e}`));
    validateGraph(addonsCache).forEach(e => console.warn(`Addon dependency issue: ${e}`));

    console.log(
      `Loaded ${scenariosCache.length} scenarios, ${bundlesCache.length} bundles, ` +
      `${tracksCache.length} tracks, and ${addonsCache.length} addons into cache.`
    );
  } catch (e) {
    console.error('Failed to reload cache:', e.message);
  }
}

/** Return the current in-memory scenarios list. */
function loadScenarios() { return scenariosCache; }

/** Return the current in-memory bundles list. */
function loadBundles()   { return bundlesCache; }

/** Return the current in-memory tracks list. */
function loadTracks()    { return tracksCache; }

/** Return the current in-memory addons list. */
function loadAddons()    { return addonsCache; }

module.exports = { reloadCache, loadScenarios, loadBundles, loadTracks, loadAddons };
