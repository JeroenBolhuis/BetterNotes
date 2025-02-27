const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting development server...');

try {
  // Check if any Metro bundler processes are running and kill them
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /f /im node.exe /fi "WINDOWTITLE eq Metro"', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "metro"', { stdio: 'ignore' });
    }
    console.log('Killed existing Metro processes');
  } catch (error) {
    // It's okay if no processes were found to kill
  }

  // Clear Metro cache
  console.log('Clearing Metro cache...');
  try {
    execSync('npx react-native start --reset-cache --no-interactive', { 
      stdio: 'ignore',
      timeout: 5000
    });
  } catch (error) {
    // It's okay if this fails, we just want to make sure the cache is cleared
  }

  // Start the development server
  console.log('Starting Expo development server...');
  execSync('npx expo start --clear', { 
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Error starting development server:', error.message);
  process.exit(1);
} 