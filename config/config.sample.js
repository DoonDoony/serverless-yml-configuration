// 이 파일은 샘플입니다. 파일을 config.js 로 변경 후 사용해 주세요
// 필요한 항목을 기입해야 정상적으로 실행됩니다
module.exports.DB_CONFIG = (serverless) => ({
  dev: {
    DB_HOST: '<Please fill in this information>',
    DB_USER: '<Please fill in this information>',
    DB_PASSWORD: '<Please fill in this information>'
  },
  prod: {
    DB_HOST: '<Please fill in this information>',
    DB_USER: '<Please fill in this information>',
    DB_PASSWORD: '<Please fill in this information>'
  }
});
