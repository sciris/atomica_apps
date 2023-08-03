#!/usr/bin/env python

# Temporary fix until scirisweb is updated
import werkzeug.serving
werkzeug.serving.run_with_reloader = None

# Imports
import sys
import atomica_apps.apptasks_tb as at

# If running on Windows, use eventlets
if 'win' in sys.platform: args = [__file__, '-l', 'info', '-P', 'eventlet']
else:                     args = [__file__, '-l', 'info']

# Run Celery
at.celery_instance.worker_main(args)
