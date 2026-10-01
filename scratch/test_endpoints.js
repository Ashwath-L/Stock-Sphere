const http = require('http');

const request = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- Starting API Testing ---');
  try {
    // 1. Login as owner
    console.log('Testing login...');
    const loginRes = await request('POST', '/api/users/login', {
      username: 'owner',
      password: 'owner123'
    });
    console.log('Login response:', loginRes.statusCode, loginRes.body);
    if (loginRes.statusCode !== 200) {
      throw new Error('Login failed');
    }
    const token = loginRes.body.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 2. Retrieve products list
    console.log('\nTesting GET /api/products...');
    const productsRes = await request('GET', '/api/products', null, authHeaders);
    console.log('GET /api/products response:', productsRes.statusCode, productsRes.body);

    // 3. Retrieve dashboard stats
    console.log('\nTesting GET /api/products/stats...');
    const statsRes = await request('GET', '/api/products/stats', null, authHeaders);
    console.log('GET /api/products/stats response:', statsRes.statusCode, statsRes.body);

    // 4. Retrieve reports stats
    console.log('\nTesting GET /api/products/reports-stats...');
    const reportsRes = await request('GET', '/api/products/reports-stats', null, authHeaders);
    console.log('GET /api/products/reports-stats response:', reportsRes.statusCode, reportsRes.body);

    // 5. Retrieve activity logs
    console.log('\nTesting GET /api/activity-logs...');
    const logsRes = await request('GET', '/api/activity-logs', null, authHeaders);
    console.log('GET /api/activity-logs response:', logsRes.statusCode, Array.isArray(logsRes.body) ? `Array of size ${logsRes.body.length}` : logsRes.body);

  } catch (error) {
    console.error('Test run error:', error);
  }
};

runTests();
