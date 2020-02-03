# atomica_apps

## Installation
To install this tool you need nodejs, docker and access to [GitHub - atomicateam/atomica: Atomica](https://github.com/atomicateam/atomica).

**Step 1:**  Clone the repo

``` bash
git clone git@github.com:sciris/atomica_apps.git
```

**Step 2:** Install `docker-machine` and `docker-compose`

Instructions for `docker-machine` installation can be found here: [Install Docker Machine | Docker Documentation](https://docs.docker.com/machine/install-machine/). For MacOS you can use homebrew if you have it installed using `brew install docker-machine`.

Instruction for docker-compose installation can be found here: [Install Docker Compose | Docker Documentation](https://docs.docker.com/compose/install/#master-builds) . For MacOS you can use homebrew if you have it installed using `brew install docker-compose`; on Linux, `sudo apt install docker-compose`.

**Step 3:**  Build the images locally

Change to the root of the `atomica_apps` dir:

```
cd atomica_apps
```

To build and run `cascade` (NB, on Linux may need to be run as `sudo`):

```
docker-compose -f docker/docker-compose.cascade.local.yml build
docker-compose -f docker/docker-compose.cascade.local.yml up
```

To build and run `tb`:

```
docker-compose -f docker/docker-compose.tb.local.yml build
docker-compose -f docker/docker-compose.tb.local.yml up
```

**Step 5:** follow the instructions on the next section ("Developing the front end") to build the front end.

## Developing the front end

The front end code for `tb` and `cascade` is inside the `src/` folder in the `atomica_apps` repo.

To install the dependencies required for front end development:

**Step 1:** Install Node.js on your local machine https://nodejs.org/en/download/

**Step 2:** Install the npm dependencies

Go to the the root of `atomica_apps` repo and then:

```
npm install
```  

**Step 3:** Build or Watch

Once that’s done you can run `npm run watchtb` or `npm run watchcascade` in order to track changes  and rebuild the specific app in `dist/<app_name>/`.

## Building the frontend for distribution

In order to build a minified copy of `cascade` and `tb` you will need to go to the static folder and run `npm run build`. This will create minified copies of the apps and place them in `dist/<app_name>/`

## FE Windows express setup

To test the FE without docker, follow these steps

1. Install Redis https://github.com/microsoftarchive/redis/releases/download/win-3.0.504/Redis-x64-3.0.504.msi
2. Install node.js https://www.npmjs.com/get-npm
3. Create a Python 3.7 Anaconda environment (`conda create -n myenv python=3.7`)
4. Install standard packages `conda install mkl` and `conda install numpy scipy matplotlib`
5. Install Twisted `conda install twisted`
6. Clone and do `python setup.py develop` these repos in order:
    - `sciris`
    - `scirisweb`
    - `sciris/mpld3` (NOT the main public mpld3 release)
    - `atomica`
    - `atomica_apps`
7. Go into the `atomica_apps` folder and do `npm install` in the terminal. It should make a `node_modules` folder and download a collection of node packages
8. To run the FE, open a command prompt, activate your conda environment, and run each of these files
    - `bin/server_tb.py`
    - `bin/devclient_tb.py`
    - `bin/worker_tb.py`
    
On Windows you can write a `.bat` file with contents similar to

```
call C:\ProgramData\Miniconda3\Scripts\activate.bat C:\ProgramData\Miniconda3
call activate atomica37
cd /D E:\projects\atomica_apps\bin
python server_tb.py
pause
```

replacing the Anaconda path for `activate.bat`, the name of the environment, and the path to `atomica_apps` as required. Make one file for each of the three `.py` files to run.
To run the client, close all windows and run those three batch scripts. 