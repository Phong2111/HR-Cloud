FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG REACT_APP_IDENTITY_URL=http://localhost:8081
ARG REACT_APP_ORG_URL=http://localhost:8082
ARG REACT_APP_LEAVE_URL=http://localhost:8083
ARG REACT_APP_RECRUIT_URL=http://localhost:8084
ENV REACT_APP_IDENTITY_URL=$REACT_APP_IDENTITY_URL
ENV REACT_APP_ORG_URL=$REACT_APP_ORG_URL
ENV REACT_APP_LEAVE_URL=$REACT_APP_LEAVE_URL
ENV REACT_APP_RECRUIT_URL=$REACT_APP_RECRUIT_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
