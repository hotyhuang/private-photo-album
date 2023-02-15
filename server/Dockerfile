FROM public.ecr.aws/lambda/nodejs:18

ENV PKG_CONFIG_PATH=/opt/lib/pkgconfig

RUN yum groupinstall "Development Tools" -y

RUN yum install -y python3

COPY package.json tsconfig.json ./

COPY src/commonService.ts src/constants.ts src/upload.ts ./src/

RUN npm install

COPY Makefile ./

RUN make build-SharpLayer

RUN npm run build:typescript

CMD ["dist/upload.handler"]
