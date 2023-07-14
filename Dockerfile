 
FROM node:14.15.0
RUN useradd -ms /bin/bash dev
RUN usermod -aG root dev

#ENV HOME /home/dev
#WORKDIR /home/dev
ENV NODE_ENV=prd
ARG COMMITID
ENV COMMITID ${COMMITID}
ENV GOOGLE_PRJ_ID=bwing-230309

ADD . /home/dev
COPY package.json /home/dev/package.json
RUN cd /home/dev; npm install; npm audit fix
RUN cd /home/dev; npm rebuild --target=10.0.0 --target_platform=linux --target_arch=x64 --target_libc=glibc --update-binary
COPY . /home/dev


USER dev

EXPOSE 8080
CMD ["node", "/home/dev/bin/www"]