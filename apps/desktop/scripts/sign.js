// Code signing script for Electron Builder
// Requires: SIGNTOOL_PATH, CERTIFICATE_PATH, CERTIFICATE_PASSWORD env variables
exports.default = async function (configuration) {
  // Skip signing in dev or CI without credentials
  if (!process.env.CERTIFICATE_PATH) {
    console.log('[SIGN] Skipping code signing (no certificate configured)');
    return;
  }

  const { execSync } = require('child_process');
  const path = require('path');

  const signtool = process.env.SIGNTOOL_PATH || 'signtool.exe';
  const certPath = process.env.CERTIFICATE_PATH;
  const certPassword = process.env.CERTIFICATE_PASSWORD;
  const timestamp = process.env.TIMESTAMP_URL || 'http://timestamp.digicert.com';

  const command = `"${signtool}" sign /fd SHA256 /a /f "${certPath}" /p "${certPassword}" /tr "${timestamp}" /td SHA256 /v "${configuration.path}"`;

  console.log(`[SIGN] Signing: ${configuration.path}`);
  execSync(command, { stdio: 'inherit' });
};
