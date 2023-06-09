FROM node:18
WORKDIR /app
RUN yarn add prisma-data-proxy-alt
COPY ./schema.prisma ./prisma/schema.prisma
RUN yarn add -D prisma
RUN yarn add @prisma/client
ENV PRISMA_SCHEMA_PATH=/app/node_modules/.prisma/client/schema.prisma

CMD ["yarn", "pdp"]