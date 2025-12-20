FROM nginx:latest

# copy all files from nginx/conf.d to /etc/nginx/conf.d
COPY nginx/conf.d/ /etc/nginx/conf.d/

#copy all nginx/html to /usr/share/nginx/html
COPY nginx/html/ /usr/share/nginx/html/

# run nginx
CMD ["nginx", "-g", "daemon off;"]