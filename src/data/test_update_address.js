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

async function test() {
  console.log("Logging in to get auth keys...");
  const loginRes = await postRequest('/api/auth/login', {
    phone: '7698778390',
    password: 'mulesh@1999',
    platform: 'agent'
  });

  if (loginRes.data && loginRes.data.s === 1) {
    const auth = loginRes.data.r.auth;
    console.log("Login Success. Auth keys obtained.");
    console.log("Sending update address request...");
    const res = await postRequest('/api/agent/address-add-update', {
      agent_id: '6',
      address_line_1: 'Paldi Crossing, Near Vasna',
      address_line_2: 'Ashram Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380007'
    }, {
      apikey: auth.apikey,
      token: auth.token
    });
    console.log("Update Address Response:", res.data);
  } else {
    console.log("Login failed:", loginRes.data);
  }
}

test();
