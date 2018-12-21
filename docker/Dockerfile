FROM continuumio/anaconda3:latest

RUN apt-get update -y

RUN python3 -m ensurepip

# Set up apt-get
RUN apt-get install -y apt-utils gnupg curl libgl1-mesa-glx gcc redis-server 

RUN apt-get install -y python3-matplotlib

RUN apt-get install -y freetype*

RUN mkdir /app

ADD requirements.txt /app

WORKDIR /app

# Install dep 
RUN python3 -m pip install -r requirements.txt
RUN python3 -m pip install --upgrade https://github.com/celery/celery/tarball/master

ARG PORT
ARG REDIS_URL
ARG CLIENT_DIR 
ARG CMD

ENV PORT $PORT
ENV REDIS_URL $REDIS_URL
ENV CLIENT_DIR $CLIENT_DIR

ADD . /app

RUN git clone https://github.com/sciris/mpld3.git
RUN cd mpld3 && python3 setup.py submodule && python3 setup.py install

ENTRYPOINT [$CMD]

