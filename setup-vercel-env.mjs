import https from 'https';

// Get token from environment variable - do not commit!
const token = process.env.VERCEL_API_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID || 'prj_msng9xi8ILZfNgTl3D6XXrS5A0KH';

const envVars = [
  {
    key: 'VITE_APP_NAME',
    value: 'Olive Branch',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'VITE_APP_URL',
    value: 'https://olivebranch.yourdomain.com',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'VITE_SUPABASE_URL',
    value: 'https://lhpoqyqnaahoietagmbr.supabase.co',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    value: 'sb_publishable_gU4CQtFgFqp30fHDkxZj7Q_HynFlsgi',
    type: 'plain',
    target: ['production', 'preview', 'development']
  }
];

async function setEnvVar(envVar) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(envVar);
    
    const options = {
      hostname: 'api.vercel.com',
      path: `/v10/projects/${projectId}/env`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(`✅ ${envVar.key} added to Vercel`);
        } else {
          reject(`❌ Failed to add ${envVar.key}: ${data}`);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🔄 Setting Vercel environment variables...\n');
  for (const envVar of envVars) {
    try {
      const result = await setEnvVar(envVar);
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
  console.log('\n✅ All environment variables set!');
}

main();
