const http = require('http');

function postRequest(path, body, headers = {}) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: '72.61.246.157',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });

    req.write(postData);
    req.end();
  });
}

function getRequest(path, headers = {}) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '72.61.246.157',
      port: 3000,
      path: path,
      method: 'GET',
      headers: headers,
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });

    req.end();
  });
}

async function test() {
  const passwords = ['mulesh@1999', 'Mulesh@1999', '123456', 'password', 'Pass@123'];
  for (const pwd of passwords) {
    console.log(`Trying login with password: ${pwd}`);
    const res = await postRequest('/api/auth/login', {
      phone: '7698778390',
      password: pwd,
      platform: 'agent'
    });
    if (res.data && res.data.s === 1) {
      console.log('Login Success!', JSON.stringify(res.data, null, 2));
      const auth = res.data.r.auth;
      const details = await getRequest('/api/user/get-details', {
        apikey: auth.apikey,
        token: auth.token
      });
      console.log('Get Details Response:', JSON.stringify(details.data, null, 2));
      return;
    } else {
      console.log('Login failed:', res.data);
    }
  }
}

test();
