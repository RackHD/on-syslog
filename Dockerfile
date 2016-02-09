# Copyright 2016, EMC, Inc.

FROM rackhd/on-core

RUN mkdir -p /RackHD/on-syslog
WORKDIR /RackHD/on-syslog

COPY ./package.json /tmp/
RUN cd /tmp \
  && ln -s /RackHD/on-core /tmp/node_modules/on-core \
  && ln -s /RackHD/on-core/node_modules/di /tmp/node_modules/di \
  && npm install --ignore-scripts --production

COPY . /RackHD/on-syslog/
RUN cp -a /tmp/node_modules /RackHD/on-syslog/

EXPOSE 514
EXPOSE 514/udp

CMD [ "node", "/RackHD/on-syslog/index.js" ]
