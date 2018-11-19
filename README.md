# `atomica_app`
## Installation 
To install this tool you need docker and access to [GitHub - atomicateam/atomica: Atomica](https://github.com/atomicateam/atomica).

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

To build and run `tb`:

```
docker-compose -f docker-compose.tb.local.yml build
docker-compose -f docker-compose.tb.local.yml up
```

To build and run `cascade`:

```
docker-compose -f docker-compose.tb.local.yml build
docker-compose -f docker-compose.tb.local.yml up
```

## Developing the front end
## Running for local development 
