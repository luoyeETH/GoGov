module.exports = {
  apps: [
    {
      name: 'gogov-api',
      script: 'dist/index.js',
      cwd: '/home/GoGov/apps/api',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        API_PORT: '3031'
      }
    },
    {
      name: 'gogov-web',
      script: '/home/GoGov/node_modules/.bin/next',
      args: 'start -p 3030',
      cwd: '/home/GoGov/apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3030'
      }
    }
  ]
};
