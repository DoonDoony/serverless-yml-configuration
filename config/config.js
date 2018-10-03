module.exports.DB_CONFIG = (serverless) => ({
  dev: {
    DB_HOST: 'localhost',
    DB_USER: 'scott',
    DB_PASSWORD: 'tiger'
  },
  prod: {
    DB_HOST: 'fake.database.com',
    DB_USER: 'scott2',
    DB_PASSWORD: 'tiger2'
  }
});
