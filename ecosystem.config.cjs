module.exports = {
  apps: [
    {
      name: 'gogov-api',
      script: 'apps/api/dist/index.js',
      cwd: '/home/GoGov',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        API_PORT: '3001'
      }
    },
    {
      name: 'gogov-web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/home/GoGov',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    }
  ]
};
