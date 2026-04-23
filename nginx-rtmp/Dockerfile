FROM tiangolo/nginx-rtmp:latest

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 1935 80

CMD ["nginx", "-g", "daemon off;"]
