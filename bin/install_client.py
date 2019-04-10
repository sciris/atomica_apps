#!/usr/bin/env python
# Install any missing client modules.
# Version: 2019jan15

import os, shutil
parentfolder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(parentfolder)
for to_delete in ['package-lock.json', 'dist', 'node_modules']:
    if os.path.exists(to_delete):
        print('Removing %s' % to_delete)
        try:
            os.remove(to_delete)
        except:
            shutil.rmtree(to_delete)
os.system('npm install')