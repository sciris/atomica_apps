# atomica_app
## Installation 
To install this tool you need nodejs, docker and access to [GitHub - atomicateam/atomica: Atomica](https://github.com/atomicateam/atomica).

**Step 1:**  Clone the repos

``` bash
git clone git@github.com:atomicateam/atomica.git
git clone git@github.com:sciris/atomica_apps.git
```

**Step 2:** Move the `atomica/atomica` folder to `atomica_apps`

```bash
move atomica/atomica atomica_apps/
```

**Step 3:** Install `docker-machine` and `docker-compose`

Instructions for `docker-machine` installation can be found here: [Install Docker Machine | Docker Documentation](https://docs.docker.com/machine/install-machine/). For MacOS you can use homebrew if you have it installed using `brew install docker-machine`

Instruction for docker-compose installation can be found here: [Install Docker Compose | Docker Documentation](https://docs.docker.com/compose/install/#master-builds) . For MacOS you can use homebrew if you have it installed using `brew install docker-compose`

**Step 4:**  Build the images locally
Change to the root of the `atomica_apps` dir:

```
cd atomica_apps
```

To build and run `cascade`:

```
docker-compose -f docker-compose.cascade.local.yml build
docker-compose -f docker-compose.cascade.local.yml up
```

To build and run `tb`:

```
docker-compose -f docker-compose.tb.local.yml build
docker-compose -f docker-compose.tb.local.yml up
```

## Developing the front end

The front end code for `tb` and `cascade` is inside the `static/` folder in the `atomica_apps` repo.

To install the dependencies required for front end development:

**Step 1:** Install Node.js on your local machine https://nodejs.org/en/download/

**Step 2:** Install the npm dependencies

Go to the the root of `atomica_apps` repo and then:

```
cd static
npm install 
```  

**Step 3:** Build or Watch

Once that’s done you can run `npm run watchtb` or `npm run watchcascade` in order to track changes  and rebuild the specific app in `static/debug/<app_name>`. 

## Building the frontend for distribution
In order to build a minified copy of `cascade` and `tb` you will need to go to the static folder and run `npm run build`. This will create minified copies of the apps and place them in `static/dist`
