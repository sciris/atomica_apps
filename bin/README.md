# Bin folder

This folder contains the executable files for various tasks. On Mac/Linux, files have executable permission, so you can just type `./the-file.py`; you don't need to type `python the-file.py` (although that works too).

## The scripts

### Setup scripts

* `install_client.py` installs the node modules; it's simply a link to `npm install` in the client folder.

* `build_cascade.py` (or `build_tb.py`) builds the client; it's a link to `npm run build` in the client folder.

### Run scripts

* `server_cascade.py` starts the main server. Note, this will only work after `build_client.py` has been run.

* `worker_cascade.py` starts the Celery worker, which is necessary for optimizations.

### Other scripts

* `resetdb_cascade.py` deletes all data from the database: all users, projects, blobs, etc.

## Examples

For developing Cascade:

```
python install_client.py # only necessary the first time, or if package.json changes
python devclient_cascade.py # in a dedicated terminal
python server_cascade.py # in a 2nd terminal
python worker_cascade.py # in a 3rd terminal
```

For production TB:

```
python install_client.py # only necessary the first time, or if package.json changes
python build_tb.py
python server_tb.py # in a dedicated terminal
python worker_tb.py # in a 2nd terminal
```
