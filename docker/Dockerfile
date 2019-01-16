FROM continuumio/anaconda3:latest

RUN apt-get update -y

RUN python3 -m ensurepip

# Set up apt-get
RUN apt-get install -y apt-utils gnupg curl libgl1-mesa-glx gcc redis-server supervisor 

RUN apt-get install -y freetype*

RUN mkdir /app

ADD requirements.txt /app

WORKDIR /app

# Install dep 
RUN python3 -m pip install -r requirements.txt
RUN python3 -m pip install --upgrade https://github.com/celery/celery/tarball/master # Because Celery isn't compatible with python3!!

ARG PORT
ARG REDIS_URL
ARG CLIENT_DIR 
ARG SUPERVISOR_CONF 

ENV SUPERVISOR_CONF $SUPERVISOR_CONF
ENV PORT $PORT
ENV REDIS_URL $REDIS_URL
ENV CLIENT_DIR $CLIENT_DIR

ADD . /app

RUN python3 setup.py develop 

RUN git clone https://github.com/sciris/mpld3.git
RUN cd mpld3 && python3 setup.py submodule && python3 setup.py install

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs
RUN npm i
RUN npm rebuild node-sass
RUN npm run build

CMD supervisord -c $SUPERVISOR_CONF
