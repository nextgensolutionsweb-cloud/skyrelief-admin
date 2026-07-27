const http = require('http');

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '72.61.246.157',
      port: 3000,
      path: path,
      method: method,
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ path, method, status: res.statusCode, data: data.substring(0, 200) });
      });
    });
    req.on('error', (err) => {
      resolve({ path, method, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ path, method, error: 'timeout' });
    });
    req.end();
  });
}

async function run() {
  const endpoints = [
    { path: '/api/member/create', method: 'POST' },
    { path: '/api/member/update', method: 'POST' },
    { path: '/api/member/delete', method: 'POST' },
    { path: '/api/member/status', method: 'POST' },
  ];
  for (const ep of endpoints) {
    const res = await testEndpoint(ep.path, ep.method);
    console.log(JSON.stringify(res, null, 2));
  }
}

run();
