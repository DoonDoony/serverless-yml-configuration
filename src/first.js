// eslint-disable-next-line import/prefer-default-export
export const hello = (event, context, callback) => {
  // 환경 변수에서 데이터 베이스 접속 정보를 가져옴
  const { DB_HOST, DB_USER, DB_PASSWORD } = process.env;
  const p = new Promise((resolve) => {
    resolve('success');
  });
  p
    .then(() => callback(null, { DB_HOST, DB_USER, DB_PASSWORD })) // 출력
    .catch(e => callback(e));
};
