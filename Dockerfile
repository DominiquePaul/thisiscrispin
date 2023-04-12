FROM node:17-alpine as build
WORKDIR /app
COPY . . 
RUN npm install && npm run build

FROM node:17-alpine
COPY --from=build /app/build /build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build"]
