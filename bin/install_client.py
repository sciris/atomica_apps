#!/usr/bin/env python
# Install any missing client modules.
# Version: 2019jan15

import os, shutil
parentfolder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(parentfolder)
if os.path.exists('package-lock.json'):
    os.remove('package-lock.json')
if os.path.exists('./dist'):    
    shutil.rmtree('./dist')
if os.path.exists('./node_modules/'):
    shutil.rmtree('./node_modules/')
os.system('npm install')