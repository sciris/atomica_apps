import os

# A secret key value used by Python Flask.
SECRET_KEY = 'somethingsomthingsomthingelse'

# Directory containing the client code.
CLIENT_DIR = './client/dist'

# Flag for setting whether we use the datastore functionality provided by
# Sciris in the webapp.
USE_DATASTORE = True

# URL for the Redis database that the web app will use to manage
# persistence.  Note that the /N/ number at the end should match the
# database number you want to use.  (N=0 is the default Redis database.)
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1')

# Flag for setting whether we use the users functionality provided by
# Sciris in the webapp.
USE_USERS = True

# Flag for setting whether registration of a new account automatically
# spawns a new active account.  If this is set False, then an admin user has
# to manually activate the account for the user.
REGISTER_AUTOACTIVATE = True

# Default server port
SERVER_PORT = int(os.getenv('PORT', 8093))

# Matplotlib backend
MATPLOTLIB_BACKEND = 'Agg'

# Flag for setting whether we use the tasks functionality provided by
# Sciris in the webapp.
USE_TASKS = True

# URL for the Redis database that Celery will use as the broker.
# Note that the /N number at the end should match the
# database number you want to use.  (N=0 is the default Redis database.)
BROKER_URL = REDIS_URL

# URL for the Redis database that Celery will use to hold task results.
# Note that the /N number at the end should match the
# database number you want to use.  (N=0 is the default Redis database.)
CELERY_RESULT_BACKEND = REDIS_URL
