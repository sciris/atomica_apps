import os
ATOMICA_APP = os.getenv('ATOMICA_APP', 'cascade')
from atomica_apps.main import make_app
app = make_app(which=ATOMICA_APP).flask_app
