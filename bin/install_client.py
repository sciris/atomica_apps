#!/usr/bin/env python
# Install any missing client modules.
# Version: 2019jan15

import os
parentfolder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(parentfolder)
os.system('rm -rf node_modules')
os.system('npm install')
