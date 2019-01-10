#!/usr/bin/env python
# Install any missing client modules.
# Version: 2019jan10

import os
parentfolder = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(parentfolder)
os.system('npm install')
