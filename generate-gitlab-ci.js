const fs = require("fs");

const content = `
stages:
  - build
  - deploy

build_app:
  stage: build
  image: node:18
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

deploy_app:
  stage: deploy
  script:
    - echo "Deploy steps go here"
`;

fs.writeFileSync(".gitlab-ci.yml", content.trim());
console.log("✅ .gitlab-ci.yml generated successfully");
