import { DeutscheBahnAdapter } from './src/adapters/deutschebahn';
import { SNCFAdapter } from './src/adapters/sncf';
import { NationalRailAdapter } from './src/adapters/nationalrail';
import { SBBAdapter } from './src/adapters/sbb';
import { OEBBAdapter } from './src/adapters/oebb';
import { RailtimeAdapter } from './src/adapters/railtime';

async function testAPIs() {
  console.log('🚂 Railmate API Test Suite\n');
  
  const results: any[] = [];
  
  // 1. Deutsche Bahn (Germany)
  console.log('1️⃣ Testing Deutsche Bahn (v6.db.transport.rest)...');
  try {
    const db = new DeutscheBahnAdapter();
    const start = Date.now();
    const healthy = await db.healthCheck();
    const healthTime = Date.now() - start;
    
    const searchStart = Date.now();
    const stations = await db.searchStations('Berlin', 3);
    const searchTime = Date.now() - searchStart;
    
    results.push({
      name: 'Deutsche Bahn',
      country: '🇩🇪 Germany',
      endpoint: 'v6.db.transport.rest',
      healthCheck: healthy ? '✅ PASS' : '❌ FAIL',
      healthTime: `${healthTime}ms`,
      searchTest: stations.length > 0 ? '✅ PASS' : '❌ FAIL',
      searchTime: `${searchTime}ms`,
      stationsFound: stations.length,
      sample: stations[0]?.name || 'N/A'
    });
  } catch (error: any) {
    results.push({
      name: 'Deutsche Bahn',
      country: '🇩🇪 Germany',
      endpoint: 'v6.db.transport.rest',
      error: error.message
    });
  }
  
  // 2. SNCF (France) - no token, will fail auth
  console.log('2️⃣ Testing SNCF (api.sncf.com)...');
  try {
    const sncf = new SNCFAdapter('demo-token');
    const start = Date.now();
    const healthy = await sncf.healthCheck();
    const healthTime = Date.now() - start;
    
    results.push({
      name: 'SNCF',
      country: '🇫🇷 France',
      endpoint: 'api.sncf.com (Navitia)',
      healthCheck: healthy ? '✅ PASS' : '❌ FAIL (Auth required)',
      healthTime: `${healthTime}ms`,
      note: 'Requires API token for full access'
    });
  } catch (error: any) {
    results.push({
      name: 'SNCF',
      country: '🇫🇷 France',
      endpoint: 'api.sncf.com (Navitia)',
      error: error.message,
      note: 'Requires API token'
    });
  }
  
  // 3. National Rail UK - no token
  console.log('3️⃣ Testing National Rail UK (Darwin SOAP)...');
  try {
    const nr = new NationalRailAdapter('demo-token');
    const start = Date.now();
    const healthy = await nr.healthCheck();
    const healthTime = Date.now() - start;
    
    results.push({
      name: 'National Rail',
      country: '🇬🇧 UK',
      endpoint: 'Darwin SOAP API',
      healthCheck: healthy ? '✅ PASS' : '❌ FAIL (Auth required)',
      healthTime: `${healthTime}ms`,
      note: 'Requires API token for full access'
    });
  } catch (error: any) {
    results.push({
      name: 'National Rail',
      country: '🇬🇧 UK',
      endpoint: 'Darwin SOAP API',
      error: error.message,
      note: 'Requires API token'
    });
  }
  
  // 4. SBB (Switzerland)
  console.log('4️⃣ Testing SBB (transport.opendata.ch)...');
  try {
    const sbb = new SBBAdapter();
    const start = Date.now();
    const healthy = await sbb.healthCheck();
    const healthTime = Date.now() - start;
    
    const searchStart = Date.now();
    const stations = await sbb.searchStations('Zurich', 3);
    const searchTime = Date.now() - searchStart;
    
    results.push({
      name: 'SBB',
      country: '🇨🇭 Switzerland',
      endpoint: 'transport.opendata.ch',
      healthCheck: healthy ? '✅ PASS' : '❌ FAIL',
      healthTime: `${healthTime}ms`,
      searchTest: stations.length > 0 ? '✅ PASS' : '❌ FAIL',
      searchTime: `${searchTime}ms`,
      stationsFound: stations.length,
      sample: stations[0]?.name || 'N/A'
    });
  } catch (error: any) {
    results.push({
      name: 'SBB',
      country: '🇨🇭 Switzerland',
      endpoint: 'transport.opendata.ch',
      error: error.message
    });
  }
  
  // 5. ÖBB (Austria)
  console.log('5️⃣ Testing ÖBB (oebb.macistry.com)...');
  try {
    const oebb = new OEBBAdapter();
    const start = Date.now();
    const healthy = await oebb.healthCheck();
    const healthTime = Date.now() - start;
    
    const searchStart = Date.now();
    const stations = await oebb.searchStations('Vienna', 3);
    const searchTime = Date.now() - searchStart;
    
    results.push({
      name: 'ÖBB',
      country: '🇦🇹 Austria',
      endpoint: 'oebb.macistry.com/api',
      healthCheck: healthy ? '✅ PASS' : '❌ FAIL',
      healthTime: `${healthTime}ms`,
      searchTest: stations.length > 0 ? '✅ PASS' : '❌ FAIL',
      searchTime: `${searchTime}ms`,
      stationsFound: stations.length,
      sample: stations[0]?.name || 'N/A'
    });
  } catch (error: any) {
    results.push({
      name: 'ÖBB',
      country: '🇦🇹 Austria',
      endpoint: 'oebb.macistry.com/api',
      error: error.message
    });
  }
  
  // 6. Railtime.io - no secret
  console.log('6️⃣ Testing Railtime.io...');
  try {
    const rt = new RailtimeAdapter('demo-secret');
    const start = Date.now();
    const healthy = await rt.healthCheck();
    const healthTime = Date.now() - start;
    
    results.push({
      name: 'Railtime',
      country: '🌍 Multi-country',
      endpoint: 'railtime.io',
      healthCheck: healthy ? '✅ PASS' : '❌ FAIL (Auth required)',
      healthTime: `${healthTime}ms`,
      note: 'Requires API secret for full access'
    });
  } catch (error: any) {
    results.push({
      name: 'Railtime',
      country: '🌍 Multi-country',
      endpoint: 'railtime.io',
      error: error.message,
      note: 'Requires API secret'
    });
  }
  
  // Print results
  console.log('\n📊 RESULTS:\n');
  results.forEach((r, i) => {
    console.log(`${i+1}. ${r.country} - ${r.name}`);
    console.log(`   Endpoint: ${r.endpoint}`);
    if (r.error) {
      console.log(`   ❌ ERROR: ${r.error}`);
    } else {
      console.log(`   Health Check: ${r.healthCheck} (${r.healthTime})`);
      if (r.searchTest) {
        console.log(`   Search Test: ${r.searchTest} (${r.searchTime})`);
        console.log(`   Stations Found: ${r.stationsFound}`);
        console.log(`   Sample: ${r.sample}`);
      }
    }
    if (r.note) console.log(`   Note: ${r.note}`);
    console.log('');
  });
}

testAPIs().catch(console.error);
