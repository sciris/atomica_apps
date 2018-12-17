FROM continuumio/anaconda3:latest

RUN apt-get update \
  && apt-get install -y python3-pip python3-dev \
  && cd /usr/local/bin \
  && ln -s /usr/bin/python3.5 python \
  && python3 -m ensurepip

# Set up apt-get
RUN apt-get update -y 

RUN apt-get install -y apt-utils gnupg curl libgl1-mesa-glx gcc redis-server 

RUN apt-get install -y python3-matplotlib

RUN apt-get install -y freetype*

RUN mkdir /app

ADD requirements.txt /app

WORKDIR /app

# Install dep 
RUN python3.5 -m pip install -r requirements.txt

ARG PORT
ARG REDIS_URL
ARG CLIENT_DIR 

ENV PORT $PORT
ENV REDIS_URL $REDIS_URL
ENV CLIENT_DIR $CLIENT_DIR

ADD . /app

RUN git clone https://github.com/sciris/mpld3.git
RUN cd mpld3 && python3.5 setup.py submodule && python3.5 setup.py install

# Install atomica
RUN python3.5 setup.py develop
RUN python3.5 -m pip install redis==2.10.6 
