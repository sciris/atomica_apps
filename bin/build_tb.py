#!/usr/bin/env python
import os
parentfolder = os.path.dirname(os.path.dirname(__file__))
os.chdir(parentfolder)
os.system('npm run buildtb')
