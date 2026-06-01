import https from 'https';

const token = process.env.VERCEL_API_TOKEN;
const projectId = 'prj_msng9xi8ILZfNgTl3D6XXrS5A0KH';

if (!token) {
  console.error('Vercel API token not found in VERCEL_API_TOKEN');
  process.exit(1);
}

const options = {
  hostname: 'api.vercel.com',
  path: `/v13/projects/${projectId}/redeploy`,
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': 2,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('Vercel redeploy triggered');
      console.log('Your app is now deploying with Supabase auth!');
    } else {
      console.log('Response status:', res.statusCode);
      console.log(data);
    }
  });
});

req.write('{}');
req.end();
