
FROM nginx:1.28-alpine

RUN rm -f /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
