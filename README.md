# How to manage serverless.yml file
> Serverless Framework `serverless.yml` 파일의 중요 설정값을 감춰보자!

## 관련 글
[velog - [Serverless Framework] serverless.yml 설정 정보 숨기기](https://velog.io/@doondoony/Serverless-Framework-serverless.yml-%EC%84%A4%EC%A0%95-%EC%A0%95%EB%B3%B4-%EC%88%A8%EA%B8%B0%EA%B8%B0-2hjmsx7nal)

## 개요
지난 9월에 참여한 *Planet Hackathon* 에서 Serverless Framework를 활용하여 백엔드 API를 만들었었습니다!

해커톤 종료 후 코드 공개를 위해 공개된 레파지토리에 코드를 올렸어야 했는데,
이 때 민감 정보(그냥 내가 감추고 싶은 값)를 어떻게 감출 수 있을까 찾아보다 적용한 방법을 공유합니다.


## API
[참고 링크](https://serverless.com/framework/docs/providers/aws/guide/variables/)
Serverless Framework에서 `serverless.yml` 파일의 변수의 값으로 설정할 수 있는 방법들은 꽤 많습니다

- Environment variables
- CLI options
- Other properties (같은 serverless.yml 파일 내에 정의된)
- CloudFormation Outputs
- Variables from AWS S3
- Variables from AWS SSM Parameter Store
- Properties from Javascript files
- Pseudo parameters reference (AWS cloudformation의 가상 선택자 문법)

목록 중에서 다양한 환경에 따라 동적으로 값을 설정할 수 있는건
자바스크립트 파일 읽어오기(`Properties from Javascript files`) 기능일 것 같습니다
이 기능을 이용한 실제 적용 방법을 설명하겠습니다.

(물론 `serverless.yml` 파일 내에서 custom을 이용하여 분기처리도 가능합니다!)

## 예제

### 목표
	- 데이터베이스 연결 정보 환경변수로 설정함
    - 데이터베이스 연결 정보를 `serverless.yml` 에서 노출하지 않음
    - stage에 따라 데이터베이스 연결 정보를 다르게 제공함


1. 테스트를 위해 Serverless Project를 임의로 하나 생성하겠습니다
```bash
$ mkdir slsTest && cd slsTest
$ yarn init -y && yarn add -D serverless
$ yarn sls create --template aws-nodejs-ecma-script -n slsTest -p tmp
$ mv ./tmp/* .
$ rm -rf ./tmp
$ yarn # 프로젝트 생성되고 추가적인 패키지 설치를 위함
$ mkdir src && mv first.js second.js ./src # src 하위로 소스 코드 이동
$ mkdir config && touch ./config/config.js
```

2. serverless.yml 파일 설정을 다음과 같이 한다고 가정하겠습니다
```yaml
  service:
    name: slsTest

  # Add the serverless-webpack plugin
  plugins:
  - serverless-webpack

  custom:
    STAGE: ${self:provider.stage} # 현재 스테이지 별로 데이터베이스 접속 정보를 달리하기 위함
    DB_CONFIG: ${file(./config/config.js):DB_CONFIG} # config.js 에서 가져올 데이터 베이스 접속정보

  provider:
    name: aws
    runtime: nodejs8.10 # 현재 AWS Lambda node.js 런타임 v8.10 까지 지원, 기본값은 6.10
    stage: ${opt:stage, 'dev'} # -s 옵션을 받으면 사용하고, 그렇지 않으면 기본 dev 스테이지 사용
    region: ap-northeast-2
    environment:
      STAGE: ${self:provider.stage}
      # custom 항목 중 DB_CONFIG를 읽어서 스테이지 별로 해당하는 값을 불러옴
      DB_HOST: ${self:custom.DB_CONFIG.${self:custom.STAGE}.DB_HOST}
      DB_USER: ${self:custom.DB_CONFIG.${self:custom.STAGE}.DB_USER}
      DB_PASSWORD: ${self:custom.DB_CONFIG.${self:custom.STAGE}.DB_PASSWORD}

  functions:
    first:
      handler: src/first.hello # 디렉토리 내의 파일을 실행시킬때의 경로 설정
    second:
      handler: src/second.hello
      events:
      - http:
          method: get
          path: second
```

3. `/config/config.js` 파일을 생성하고, 아래와 같이 작성합니다
```javascript
module.exports.DATABASE_CONFIG = (serverless) => ({
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
```
	1. commonJS 형태로 작성합니다
	2. 반드시 함수로 작성되어야 합니다!
    3. 암시적으로 serverless 인자를 받을 수 있습니다 (serverless API 기능을 사용할 수 있습니다)
		- `node_modules/serverless/lib/Serverless.js` 코드를 참고하세요
        - `serverless.cli.consoleLog()` 와 같은 명령어가 사용 가능 합니다.

4. 설정 값이 잘 적용되었는지 확인할 수 있도록 `src/first.js` 파일을 조금 수정합니다
```javascript
// eslint-disable-next-line import/prefer-default-export
export const hello = (event, context, callback) => {
  // 환경 변수에서 데이터 베이스 접속 정보를 가져옴
  const {DB_HOST, DB_USER, DB_PASSWORD} = process.env;
  const p = new Promise((resolve) => {
    resolve('success');
  });
  p
    .then(() => callback(null, {DB_HOST, DB_USER, DB_PASSWORD})) // 출력
    .catch(e => callback(e));
};
```

5. 결과를 확인합니다.
    - stage: prod (prod 에서 사용할 데이터베이스 설정값이 잘 출력됩니다)

	![image.png](https://images.velog.io/post-images/doondoony/d3ebd460-c727-11e8-a770-8b967d808a7c/image.png)

      - stage: dev (dev 에서 사용할 데이터베이스 설정값이 잘 출력됩니다)

      ![image.png](https://images.velog.io/post-images/doondoony/14b0caf0-c728-11e8-a770-8b967d808a7c/image.png)

6. `config.js` 파일이 공유되지 않도록`.gitignore`에 추가합니다
  ```diff
  +  /config/config.js
  ```

7. `config.js` 파일의 존재와 어떤 항목을 사용하는지 알 수 있도록 `config.sample.js` 파일을 작성합니다
  ```javascript
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
  ```

설정 끗!

## 장•단점
### 장점
1. 동적으로 값을 생성할 수 있습니다 (예제는 그렇지 않았지만)
	- 이를테면 OS 환경에 따라 값을 생성한다거나 하는 것이 가능합니다 👍
2. 비동기로 값을 받아와서 매핑해야 하는 경우에도, `Promise.resolve`값을 반환하면 가능합니다
	- 데이터베이스에 설정 값이 있어 이를 조회해 전달한다거나 하는 경우 등

### 단점
1. 협업시 설정 값을 추가할 경우, 추가된 값을 다른 사람에게 잊지 않고 공지해야 한다
	- `config.sample.js` 파일은 공유되지만, 유심히 읽지 않을 수 있기 때문에 ㅠㅠ
    - 물론 실제로 환경변수로 사용할 값이 자주 추가되거나 변경되지는 않겠지만...
    - 이러한 문제는 `.env` 파일로 관리하더라도 마찬가지일듯 싶습니다! 👻
    - 값의 추가나 변경의 경우, 반드시 sample 파일에도 업데이트 해야 합니다!
    - 환경 변수 키의 변경이 있을 경우, 값을 사용하고 있는 코드를 일일이 찾아 리팩토링 해야합니다
2. (당연하지만) 익숙하지 않다면, 도리어 설정이 복잡해 보일 수 있습니다 😭
3. 자바스크립트로만 작성해야 합니다

## 결론
환경 변수를 자바스크립트 코드로 작성해 동적으로 관리할 수 있다는 건 장점이라고 생각합니다!
(dotenv를 추가로 설치 하지 않아도 되고)

어찌되었건 `serverless.yml` 파일은 무심코 공개 레파지토리에 올릴 경우, 중요한 정보가 많이 노출될 수 있으므로 이러한 방법이 아니더라도, 중요한 정보는 잘 숨겨서 관리하도록 해야겠습니다!

내용 중 잘못된 부분은 언제든 지적해주세요!
읽어주셔서 감사합니당 😀



