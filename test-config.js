// Configuration Test Script
// Run this in the browser console to verify settings are working

console.log('🔧 Testing Configuration System...\n');

// Test 1: Environment Variables
console.log('1️⃣ Environment Variables (import.meta.env):');
const envVars = {
  VITE_AGORA_APP_ID: import.meta.env.VITE_AGORA_APP_ID,
  VITE_AGORA_TOKEN: import.meta.env.VITE_AGORA_TOKEN,
  VITE_AGORA_CHANNEL: import.meta.env.VITE_AGORA_CHANNEL,
  VITE_AUTH_CODE: import.meta.env.VITE_AUTH_CODE,
  VITE_RESTFUL_API_KEY: import.meta.env.VITE_RESTFUL_API_KEY,
  VITE_RESTFUL_PASSWORD: import.meta.env.VITE_RESTFUL_PASSWORD,
  VITE_CONVOAI_AGENT_NAME: import.meta.env.VITE_CONVOAI_AGENT_NAME,
  VITE_CONVOAI_AGENT_UID: import.meta.env.VITE_CONVOAI_AGENT_UID,
  VITE_LLM_API_KEY: import.meta.env.VITE_LLM_API_KEY,
  VITE_TTS_API_KEY: import.meta.env.VITE_TTS_API_KEY,
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✅ SET' : '❌ NOT SET'}`);
});

// Test 2: SessionStorage Values
console.log('\n2️⃣ SessionStorage Values:');
const sessionVars = {
  VITE_AGORA_APP_ID: sessionStorage.getItem('VITE_AGORA_APP_ID'),
  VITE_AGORA_TOKEN: sessionStorage.getItem('VITE_AGORA_TOKEN'),
  VITE_AGORA_CHANNEL: sessionStorage.getItem('VITE_AGORA_CHANNEL'),
  VITE_AUTH_CODE: sessionStorage.getItem('VITE_AUTH_CODE'),
  VITE_RESTFUL_API_KEY: sessionStorage.getItem('VITE_RESTFUL_API_KEY'),
  VITE_RESTFUL_PASSWORD: sessionStorage.getItem('VITE_RESTFUL_PASSWORD'),
  VITE_CONVOAI_AGENT_NAME: sessionStorage.getItem('VITE_CONVOAI_AGENT_NAME'),
  VITE_CONVOAI_AGENT_UID: sessionStorage.getItem('VITE_CONVOAI_AGENT_UID'),
  VITE_LLM_API_KEY: sessionStorage.getItem('VITE_LLM_API_KEY'),
  VITE_TTS_API_KEY: sessionStorage.getItem('VITE_TTS_API_KEY'),
};

Object.entries(sessionVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✅ SET' : '❌ NOT SET'}`);
});

// Test 3: Priority System (SessionStorage > Environment)
console.log('\n3️⃣ Final Resolved Values (SessionStorage > Environment):');
const getConfigValue = (key, defaultValue = null) => {
  const sessionValue = sessionStorage.getItem(key);
  const envValue = import.meta.env[key];
  return sessionValue || envValue || defaultValue;
};

const resolvedVars = {
  VITE_AGORA_APP_ID: getConfigValue('VITE_AGORA_APP_ID'),
  VITE_AGORA_TOKEN: getConfigValue('VITE_AGORA_TOKEN'),
  VITE_AGORA_CHANNEL: getConfigValue('VITE_AGORA_CHANNEL'),
  VITE_AUTH_CODE: getConfigValue('VITE_AUTH_CODE'),
  VITE_RESTFUL_API_KEY: getConfigValue('VITE_RESTFUL_API_KEY'),
  VITE_RESTFUL_PASSWORD: getConfigValue('VITE_RESTFUL_PASSWORD'),
  VITE_CONVOAI_AGENT_NAME: getConfigValue('VITE_CONVOAI_AGENT_NAME'),
  VITE_CONVOAI_AGENT_UID: getConfigValue('VITE_CONVOAI_AGENT_UID'),
  VITE_LLM_API_KEY: getConfigValue('VITE_LLM_API_KEY'),
  VITE_TTS_API_KEY: getConfigValue('VITE_TTS_API_KEY'),
};

Object.entries(resolvedVars).forEach(([key, value]) => {
  const source = sessionStorage.getItem(key) ? 'SESSION' : 
                 import.meta.env[key] ? 'ENV' : 'DEFAULT';
  console.log(`  ${key}: ${value ? '✅ SET' : '❌ NOT SET'} (${source})`);
});

// Test 4: Required Fields Check
console.log('\n4️⃣ Required Fields Validation:');
const requiredFields = [
  'VITE_AGORA_APP_ID',
  'VITE_AGORA_TOKEN', 
  'VITE_AGORA_CHANNEL',
  'VITE_AUTH_CODE',
  'VITE_RESTFUL_API_KEY',
  'VITE_RESTFUL_PASSWORD',
  'VITE_LLM_API_KEY',
  'VITE_TTS_API_KEY'
];

let allValid = true;
requiredFields.forEach(field => {
  const value = getConfigValue(field);
  const isValid = value && value.length > 0;
  if (!isValid) allValid = false;
  console.log(`  ${field}: ${isValid ? '✅ VALID' : '❌ MISSING'}`);
});

console.log(`\n🎯 Overall Status: ${allValid ? '✅ ALL GOOD' : '❌ MISSING REQUIRED FIELDS'}`);

// Test 5: Settings Save/Load Test
console.log('\n5️⃣ Settings Save/Load Test:');
console.log('To test settings save/load:');
console.log('1. Open Settings panel (⚙️ button)');
console.log('2. Fill in some test values');
console.log('3. Click "Save Settings"');
console.log('4. Refresh the page');
console.log('5. Open Settings again to verify persistence');
console.log('6. Check that the UI status indicators are green ✅');

console.log('\n🔧 Configuration Test Complete!');
