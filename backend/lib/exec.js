'use strict';

const { exec }  = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ADDONS_BIN_DIR is prepended to PATH so that addon-installed binaries (e.g.
// helm, istioctl) are reachable from every kubectl validation command.
// Matches the env var used by lib/cache.js and server.js for consistency.
const ADDONS_BIN_DIR = process.env.ADDONS_BIN_DIR || '/data/addons/bin';

/**
 * Run a shell command and return a normalised result object.
 * Never throws — the caller always receives { success, output, error? }.
 *
 * @param {string} cmd
 * @param {number} [timeoutMs=15000]
 * @returns {Promise<{ success: boolean, output: string, error?: string }>}
 */
async function runCommand(cmd, timeoutMs = 15000) {
  try {
    const { stdout } = await execAsync(cmd, {
      timeout:  timeoutMs,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH:       `${ADDONS_BIN_DIR}:${process.env.PATH || ''}`,
        KUBECONFIG: process.env.KUBECONFIG || '/root/.kube/config',
      },
    });
    return { success: true, output: stdout.trim() };
  } catch (e) {
    return {
      success: false,
      output: (e.stdout || '').trim(),
      error:  (e.stderr || e.message || '').trim(),
    };
  }
}

/**
 * Compare an actual command output string against an expected value using
 * one of four supported match strategies.
 *
 * @param {string} actual
 * @param {string} expected
 * @param {'exact'|'contains'|'not_contains'|'regex'} matchType
 * @returns {boolean}
 */
function checkMatch(actual, expected, matchType) {
  const a = String(actual).trim();
  const e = String(expected).trim();
  if (matchType === 'exact')        return a === e;
  if (matchType === 'contains')     return a.includes(e);
  if (matchType === 'not_contains') return !a.includes(e);
  if (matchType === 'regex')        return new RegExp(e).test(a);
  return a === e; // default: exact
}

module.exports = { runCommand, checkMatch };
