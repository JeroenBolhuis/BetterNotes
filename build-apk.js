const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if eas.json exists
if (!fs.existsSync(path.join(__dirname, 'eas.json'))) {
  console.error('eas.json not found. Please make sure it exists in the project root.');
  process.exit(1);
}

console.log('Starting APK build process...');

try {
  // Check if EAS CLI is installed
  try {
    execSync('eas --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('Installing EAS CLI...');
    execSync('npm install -g eas-cli', { stdio: 'inherit' });
  }

  // Build the APK
  console.log('Building APK (this may take a while)...');
  execSync('eas build --platform android --profile preview --non-interactive', { 
    stdio: 'inherit',
    timeout: 30 * 60 * 1000 // 30 minutes timeout
  });

  console.log('\nBuild process completed!');
  console.log('You can find the download link for your APK in the EAS Build dashboard.');
  console.log('Visit: https://expo.dev/accounts/[your-account]/projects/[your-project]/builds');
} catch (error) {
  console.error('Error building APK:', error.message);
  process.exit(1);
} 