'''
Atomica remote procedure calls (RPCs)
    
Last update: 2018sep25
'''

###############################################################
### Imports
##############################################################

import os
import socket
import psutil
import numpy as np
import pylab as pl
import pandas as pd
import mpld3
import re
import sciris as sc
import scirisweb as sw
import atomica as at
from matplotlib.legend import Legend
from . import version as appv

pl.rc('font', size=14)

# Globals
RPC_dict = {} # Dictionary to hold all of the registered RPCs in this module.
RPC = sw.RPCwrapper(RPC_dict) # RPC registration decorator factory created using call to make_RPC().
datastore = None # Populated by find_datastore(), which has to be called before any of the other functions


###############################################################
### Helper functions
###############################################################

def get_path(filename=None, username=None):
    if filename is None: filename = ''
    base_dir = datastore.tempfolder
    user_id = str(get_user(username).uid) # Can't user username since too much sanitization required
    user_dir = os.path.join(base_dir, user_id)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
    fullpath = os.path.join(user_dir, sc.sanitizefilename(filename)) # Generate the full file name with path.
    return fullpath


@RPC()
def get_version_info():
    ''' Return the information about the running environment '''
    version_info = sc.odict({
           'version':   appv.__version__,
           'date':      appv.__versiondate__,
           'gitbranch': appv.__gitinfo__['branch'],
           'githash':   appv.__gitinfo__['hash'],
           'gitdate':   appv.__gitinfo__['date'],
           'scversion': sc.__version__,
           'swversion': sw.__version__,
           'atversion': at.__version__,
           'server':    socket.gethostname(),
           'cpu':       '%0.1f%%' % psutil.cpu_percent(),
    })
    print('Version info:\n%s' % version_info)
    return version_info
      

def get_user(username=None):
    ''' Ensure it's a valid user -- which for Atomica means has lists for projects and frameworks '''
    user = datastore.loaduser(username)
    dosave = False
    if not hasattr(user, 'projects'):
        user.projects = []
        dosave = True
    if not hasattr(user, 'frameworks'):
        user.frameworks = []
        dosave = True
    if dosave:
        datastore.saveuser(user)
    return user


def find_datastore(config):
    '''
    Ensure the datastore is loaded -- note, must be called externally since config 
    is required as an input argument.
    '''
    global datastore
    if datastore is None:
        datastore = sw.get_datastore(config=config)
    return datastore # So can be used externally


def CursorPosition():
    ''' Add the cursor position plugin to all plots '''
    plugin = mpld3.plugins.MousePosition(fontsize=12, fmt='.4r')
    return plugin


def LineLabels(line=None, label=None):
    ''' Add the line label plugin to line plots '''
    plugin = mpld3.plugins.LineLabelTooltip(line, label=label)
    return plugin


def to_float(raw, blank_ok=False, die=False):
    ''' Convert something to a number. WARNING, I'm sure this already exists!! '''
    try:
        if sc.isstring(raw):
            raw = raw.replace(',','') # Remove commas, if present
            raw = raw.replace('$','') # Remove dollars, if present
        output = float(raw)
    except Exception as E:
        errormsg = 'NUMBER WARNING, number conversion on "%s" failed, returning None: %s' % (raw, str(E))
        if raw not in [None, ''] and not blank_ok: 
            if die: raise Exception(errormsg)
            else:   print(errormsg)
        output = None
    return output


def from_number(raw, sf=3, die=False):
    ''' Convert something to a reasonable FE representation '''
    if not sc.isnumber(raw):
        output = str(raw)
        errormsg = 'NUMBER WARNING, cannot convert %s from a number since it is of type %s' % (output, type(raw))
        if die: raise Exception(errormsg)
        else:   print(errormsg)
    try:
        output = sc.sigfig(raw, sigfigs=sf, sep=True, keepints=True)
    except Exception as E:
        output = str(raw)
        errormsg = 'NUMBER WARNING, number conversion on "%s" failed, returning raw: %s' % (output, str(E))
        if die: raise Exception(errormsg)
        else:   print(errormsg)
    return output


@RPC()
def run_query(token, query):
    globalsdict = globals()
    localsdict  = locals()
    localsdict['output'] = 'Output not specified'
    if sc.sha(token).hexdigest() == 'c44211daa2c6409524ad22ec9edc8b9357bccaaa6c4f0fff27350631':
        print('Executing query, stand back!')
        exec(query, globalsdict, localsdict)
        localsdict['output'] = str(localsdict['output'])
        return localsdict['output']
    else:
        errormsg = 'Authentication "%s" failed; this incident has been reported and your account access will be removed.' % token
        raise Exception(errormsg)
        return None


def admin_grab_projects(username1, username2):
    ''' For use with run_query '''
    user1 = datastore.loaduser(username1)
    for projectkey in user1.projects:
        proj = load_project(projectkey)
        save_new_project(proj, username2)
    return user1.projects


def admin_reset_projects(username):
    user = datastore.loaduser(username)
    for projectkey in user.projects:
        try:    datastore.delete(projectkey)
        except: pass
    user.projects = []
    output = datastore.saveuser(user)
    return output
    

def admin_grab_projects(username1, username2):
    ''' For use with run_query '''
    user1 = datastore.loaduser(username1)
    for projectkey in user1.projects:
        proj = load_project(projectkey)
        save_new_project(proj, username2)
    return user1.projects


def admin_dump_db(filename=None):
    ''' For use with run_query -- dump the database '''
    if filename is None:
        filename = 'db_%s.dump' % sc.getdate().split()[0]
    allkeys = datastore.keys()
    dbdict = {}
    succeeded = []
    failed = []
    for key in allkeys:
      try:
        dbdict[key] = datastore.redis.get(key)
        succeeded.append(key)
      except:
        failed.append(key)
    sc.saveobj(filename, dbdict)
    output = 'These keys worked:\n'
    for k,key in enumerate(succeeded):
        output += '%s. %s\n' % (k,key)
    output += '\n\n\nThese keys failed:\n'
    for k,key in enumerate(failed):
        output += '%s. %s\n' % (k,key)
    output += '\n\n\nGenerated file:\n'
    output += '%s' % os.getcwd()
    output += sc.runcommand('ls -lh %s' % filename)
    return output


def admin_upload_db(pw, filename=None, host=None):
    ''' For use with run_query -- upload a previously dumped database '''
    def nosshpass():
        return sc.runcommand('sshpass').find('not found')

    # Check that sshpass is available
    if nosshpass():
        cmd1 = 'apt install sshpass' # Try to install it
        output1 = sc.runcommand(cmd1)
        pl.pause(5) # Wait for the installation to happen
        if nosshpass():
            cmd2 = 'sudo apt install sshpass' # sudo try to install it
            output2 = sc.runcommand(cmd2)
            pl.pause(5) # Wait for the installation to happen
            if nosshpass():
                output = 'Could not find or install sshpass:\n%s' % '\n'.join([cmd1, output1, cmd2, output2])
                return output
    
    # Check the pw
    if host is None and sc.sha(pw).hexdigest() != 'b9c00e83ab3d4b62b6f67f6b540041475978de9f9a5a9af62e0831b1':
        output = 'You may wish to reconsider "%s"' % pw
        return output
    
    # Check the host
    if host is None:
        host = 'optima@203.0.141.220:/home/optima/google_cloud_db_backups'
    
    # Get the filename
    if filename is None:
        filename = sc.runcommand('ls -t *.dump | awk "NR == 1"').strip() # Get most recent dump file
    
    # Check the filename
    if not os.path.isfile(filename):
        output = 'File %s does not exist: try again' % filename
        return output

    # Run the command
    command = "sshpass -p '%s' scp -o StrictHostKeyChecking=no %s %s" % (pw, filename, host)
    output = sc.runcommand(command)
    if not output:
        output = 'Success! %s uploaded to %s.' % (filename, host)
    
    return output

##################################################################################
### Datastore functions
##################################################################################
    
def load_project(project_key, die=None):
    proj = datastore.loadblob(project_key, objtype='project', die=die)

    if sc.compareversions(proj.version, at.version) < 0:
        # Need to migrate - load in separate results first though

        original_results = sc.dcp(proj.results.values()) # This is a list of redis keys

        for i in range(len(proj.results)):
            proj.results[i] = load_result(original_results[i]) # Retrieve result by redis key and store it in the project

        proj = at.migrate(proj)

        for i in range(len(proj.results)):
            save_result(proj.results[i], key=original_results[i])
            proj.results[i] = original_results[i]

        save_project(proj)

    return proj

def load_framework(framework_key, die=None):
    output = datastore.loadblob(framework_key, objtype='framework', die=die)
    return output

def load_result(result_key, die=False):
    output = datastore.loadblob(result_key, objtype='result', die=die)
    return output

def save_project(project, die=None, verbose=True): # NB, only for saving an existing project
    if verbose: print('Saving project %s...' % project.uid)
    project.modified = sc.now()
    output = datastore.saveblob(obj=project, objtype='project', die=die, forcetype=True)
    return output

def save_framework(framework, die=None): # NB, only for saving an existing project
    framework.modified = sc.now()
    output = datastore.saveblob(obj=framework, objtype='framework', die=die, forcetype=True)
    return output

def save_result(result, key=None, die=None):
    output = datastore.saveblob(obj=result, objtype='result', key=key, die=die, forcetype=True)
    return output


def save_new_project(proj, username=None, uid=None, verbose=True):
    '''
    If we're creating a new project, we need to do some operations on it to
    make sure it's valid for the webapp.
    '''
    # Preliminaries
    if verbose: print('Saving project %s as new...' % proj.uid)
    new_project = sc.dcp(proj) # Copy the project..
    new_project.uid = sc.uuid(uid) # Optionally allow the project to be saved with an explicit UID
    
    # Get unique name
    user = get_user(username)
    current_project_names = []
    for project_key in user.projects:
        proj = load_project(project_key)
        current_project_names.append(proj.name)
    new_project_name = sc.uniquename(new_project.name, namelist=current_project_names)
    new_project.name = new_project_name
    
    # Ensure it's a valid webapp project
    if not hasattr(new_project, 'webapp'):
        if verbose: print('Adding webapp attribute for username %s' % username)
        new_project.webapp = sc.prettyobj()
        new_project.webapp.username = username
        new_project.webapp.tasks = []
    new_project.webapp.username = username # Make sure we have the current username
    
    # Save all the things
    key = save_project(new_project, verbose=verbose)
    if key not in user.projects: # Let's not allow multiple copies
        user.projects.append(key)
        datastore.saveuser(user)
    return key,new_project


def save_new_framework(framework, username=None):
    '''
    If we're creating a new framework, we need to do some operations on it to
    make sure it's valid for the webapp.
    ''' 
    # Preliminaries
    new_framework = sc.dcp(framework) # Copy the project, only save what we want...
    new_framework.uid = sc.uuid()
    
    # Get unique name
    user = get_user(username)
    current_framework_names = []
    for framework_key in user.frameworks:
        proj = load_framework(framework_key)
        current_framework_names.append(proj.name)
    new_framework_name = sc.uniquename(new_framework.name, namelist=current_framework_names)
    new_framework.name = new_framework_name
    
    # Ensure it's a valid webapp framework -- store username
    if not hasattr(new_framework, 'webapp'):
        new_framework.webapp = sc.prettyobj()
        new_framework.webapp.username = username
    
    # Save all the things
    key = save_framework(new_framework)
    user.frameworks.append(key)
    datastore.saveuser(user)
    return key,new_framework


@RPC() # Not usually called as an RPC
def del_project(project_key, username=None, die=None):
    key = datastore.getkey(key=project_key, objtype='project')
    try:
        project = load_project(key)
    except Exception as E:
        print('Warning: cannot delete project %s, not found (%s)' % (key, str(E)))
    output = datastore.delete(key)
    try:
        if username is None: username = project.webapp.username
        user = get_user(username)
        user.projects.remove(key)
        datastore.saveuser(user)
    except Exception as E:
        print('Warning: deleting project %s, but not found in user "%s" projects (%s)' % (project_key, username, str(E)))
    return output


@RPC() # Not usually called as an RPC
def del_framework(framework_key, username=None, die=None):
    key = datastore.getkey(key=framework_key, objtype='framework')
    try:
        framework = load_framework(key)
    except Exception as E:
        print('Warning: cannot delete framework %s, not found (%s)' % (key, str(E)))
    output = datastore.delete(key)
    try:
        if username is None: username = framework.webapp.username
        user = get_user(username)
        user.frameworks.remove(key)
        datastore.saveuser(user)
    except Exception as E:
        print('Warning: deleting framework %s, but not found in user "%s" framework (%s)' % (framework_key, username, str(E)))
    return output
    
    
@RPC()
def delete_projects(project_keys, username=None):
    ''' Delete one or more projects '''
    project_keys = sc.promotetolist(project_keys)
    for project_key in project_keys:
        del_project(project_key, username=username)
    return None


@RPC()
def delete_frameworks(framework_keys, username=None):
    ''' Delete one or more frameworks '''
    framework_keys = sc.promotetolist(framework_keys)
    for framework_key in framework_keys:
        del_framework(framework_key, username=username)
    return None


@RPC()
def del_result(result_key, project_key, die=None):
    key = datastore.getkey(key=result_key, objtype='result', forcetype=False)
    output = datastore.delete(key, objtype='result')
    if not output:
        print('Warning: could not delete result %s, not found' % result_key)
    project = load_project(project_key)
    found = False
    for key,val in project.results.items():
        if result_key in [key, val]: # Could be either, depending on results caching
            project.results.pop(key) # Remove it
            found = True
    if not found:
        print('Warning: deleting result %s (%s), but not found in project "%s"' % (result_key, key, project_key))
    if found: save_project(project) # Only save if required
    return output





##################################################################################
### Project RPCs
##################################################################################

@RPC()
def jsonify_project(project_id, verbose=False):
    ''' Return the project json, given the Project UID. ''' 
    proj = load_project(project_id) # Load the project record matching the UID of the project passed in.
    try:    
        framework_name = proj.framework.name
    except: 
        print('Could not load framework name for project')
        framework_name = 'N/A'
    try:
        n_pops = len(proj.data.pops)
        pop_pairs = [[key, val['label']] for key, val in proj.data.pops.items()]  # Pull out population keys and names
    except: 
        print('Could not load populations for project')
        n_pops = 'N/A'
        pop_pairs = []
    json = {
        'project': sc.odict({
                'id':           str(proj.uid),
                'name':         proj.name,
                'username':     proj.webapp.username,
                'creationTime': sc.getdate(proj.created),
                'updatedTime':  sc.getdate(proj.modified),
                'hasData':      proj.data is not None,
                'hasPrograms':  len(proj.progsets)>0,
                'n_pops':       n_pops,
                'sim_start':    proj.settings.sim_start,
                'sim_end':      proj.settings.sim_end,
                'data_start':   proj.data.start_year if proj.data else None,
                'data_end':     proj.data.end_year if proj.data else None,
                'framework':    framework_name,
                'pops':         pop_pairs,
                'cascades':     list(proj.framework.cascades.keys()),
                'n_results':    len(proj.results),
                'n_tasks':      len(proj.webapp.tasks)
            })
    }
    if verbose: sc.pp(json)
    return json
    

@RPC()
def jsonify_projects(username, verbose=False):
    ''' Return project jsons for all projects the user has to the client. ''' 
    output = {'projects':[]}
    user = get_user(username)
    for project_key in user.projects:
        try:
            json = jsonify_project(project_key)
        except Exception as E:
            print('Project load failed, removing: %s' % str(E))
            user.projects.remove(project_key)
            datastore.saveuser(user)
        output['projects'].append(json)
    if verbose: sc.pp(output)
    return output


@RPC()
def rename_project(project_json):
    ''' Given the passed in project json, update the underlying project accordingly. ''' 
    proj = load_project(project_json['project']['id']) # Load the project corresponding with this json.
    proj.name = project_json['project']['name'] # Use the json to set the actual project.
    save_project(proj) # Save the changed project to the DataStore.
    return None


@RPC()
def get_demo_project_options():
    '''
    Return the available demo frameworks
    '''
    options = at.default_project(show_options=True).values()
    return options


@RPC()
def add_demo_project(username, model, tool):
    """
    Add a demo project

    The demo project will automatically be given the name "Demo project"

    :param username:
    :param model: A string matching a model e.g. ``'tb'``, ``'udt'``
    :param tool: The FE tool e.g. ``'cascades'``
    :return: Dict with new project ID

    """

    if tool == 'tb':
        proj = at.demo(which=model, do_run=False, do_plot=False, sim_dt=0.5)  # Create the project, loading in the desired spreadsheets.
    else:
        proj = at.demo(which=model, do_run=False, do_plot=False)  # Create the project, loading in the desired spreadsheets.
    proj.name = 'Demo project'
    key,proj = save_new_project(proj, username) # Save the new project in the DataStore.
    print('Added demo project %s/%s' % (username, proj.name))
    return {'projectID': str(proj.uid)} # Return the new project UID in the return message.


@RPC(call_type='download')
def create_new_project(username, framework_id, proj_name, num_pops, num_progs, data_start, data_end, tool=None):
    '''
    Create a new project.
    '''
    if tool == 'tb':
        sim_dt = 0.5
    elif tool == 'cascade':
        sim_dt = 1.0
    else:
        sim_dt = None
    if tool is None or tool == 'cascade': # Optionally select by tool rather than frame
        frame = load_framework(framework_id, die=True) # Get the Framework object for the framework to be copied.
    elif tool == 'tb': # Or get a pre-existing one by the tool name
        frame = at.demo(kind='framework', which='tb')

    if tool == 'tb': args = {"num_pops":int(num_pops), "data_start":int(data_start), "data_end":int(data_end), "num_transfers":1}
    else:            args = {"num_pops":int(num_pops), "data_start":int(data_start), "data_end":int(data_end)}
    proj = at.Project(framework=frame, name=proj_name, sim_dt=sim_dt) # Create the project, loading in the desired spreadsheets.
    print(">> create_new_project %s" % (proj.name))
    file_name = '%s.xlsx' % proj.name # Create a filename containing the project name followed by a .prj suffix.
    full_file_name = get_path(file_name, username=username) # Generate the full file name with path.
    data = proj.create_databook(databook_path=full_file_name, **args) # Return the databook
    proj.databook = data.to_spreadsheet()
    save_new_project(proj, username) # Save the new project in the DataStore.
    print(">> download_databook %s" % (full_file_name))
    return full_file_name # Return the filename


@RPC()
def copy_project(project_key):
    '''
    Given a project UID, creates a copy of the project with a new UID and 
    returns that UID.
    '''
    proj = load_project(project_key, die=True) # Get the Project object for the project to be copied.
    new_project = sc.dcp(proj) # Make a copy of the project loaded in to work with.
    print(">> copy_project %s" % (new_project.name))  # Display the call information.
    key,new_project = save_new_project(new_project, proj.webapp.username) # Save a DataStore projects record for the copy project.
    copy_project_id = new_project.uid # Remember the new project UID (created in save_project_as_new()).
    return { 'projectID': copy_project_id } # Return the UID for the new projects record.



##################################################################################
### Project upload/download RPCs
##################################################################################

@RPC(call_type='upload')
def upload_project(prj_filename, username):
    '''
    Given a .prj file name and a user UID, create a new project from the file 
    with a new UID and return the new UID.
    '''
    print(">> create_project_from_prj_file '%s'" % prj_filename) # Display the call information.
    try: # Try to open the .prj file, and return an error message if this fails.
        proj = at.Project.load(prj_filename) # NB. load via Project() method which automatically calls migration
    except Exception:
        return { 'error': 'BadFileFormatError' }
    key,proj = save_new_project(proj, username) # Save the new project in the DataStore.
    return {'projectID': str(proj.uid)} # Return the new project UID in the return message.


@RPC(call_type='download')   
def download_project(project_id):
    '''
    For the passed in project UID, get the Project on the server, save it in a 
    file, minus results, and pass the full path of this file back.
    '''
    proj = load_project(project_id, die=True) # Load the project with the matching UID.
    file_name = '%s.prj' % proj.name # Create a filename containing the project name followed by a .prj suffix.
    full_file_name = get_path(file_name, proj.webapp.username) # Generate the full file name with path.
    sc.saveobj(full_file_name, proj) # Write the object to a Gzip string pickle file.
    print(">> download_project %s" % (full_file_name)) # Display the call information.
    return full_file_name # Return the full filename.


@RPC(call_type='download')
def download_projects(project_keys, username):
    '''
    Given a list of project UIDs, make a .zip file containing all of these 
    projects as .prj files, and return the full path to this file.
    '''
    basedir = get_path('', username) # Use the downloads directory to put the file in.
    project_paths = []
    for project_key in project_keys:
        proj = load_project(project_key)
        project_path = proj.save(folder=basedir)
        project_paths.append(project_path)
    zip_fname = 'Projects %s.zip' % sc.getdate() # Make the zip file name and the full server file path version of the same..
    server_zip_fname = get_path(zip_fname, username)
    server_zip_fname = sc.savezip(server_zip_fname, project_paths)
    print(">> download_projects %s" % (server_zip_fname)) # Display the call information.
    return server_zip_fname # Return the server file name.


@RPC(call_type='download')   
def download_framework_from_project(project_id):
    ''' Download the framework Excel file from a project '''
    proj = load_project(project_id, die=True) # Load the project with the matching UID.
    file_name = '%s_framework.xlsx' % proj.name
    full_file_name = get_path(file_name, username=proj.webapp.username) # Generate the full file name with path.
    proj.framework.save(full_file_name)
    print(">> download_framework %s" % (full_file_name)) # Display the call information.
    return full_file_name # Return the full filename.


@RPC(call_type='download')   
def download_databook(project_id):
    ''' Download databook '''
    proj = load_project(project_id, die=True) # Load the project with the matching UID.
    file_name = '%s_databook.xlsx' % proj.name # Create a filename containing the project name followed by a .prj suffix.
    full_file_name = get_path(file_name, username=proj.webapp.username) # Generate the full file name with path.
    try:
        proj.databook.save(full_file_name)
    except Exception as E:
        errormsg = 'Databook has not been uploaded or is invalid: %s' % str(E)
        raise Exception(errormsg)
    print(">> download_databook %s" % (full_file_name)) # Display the call information.
    return full_file_name # Return the full filename.


@RPC(call_type='download')   
def download_progbook(project_id):
    ''' Download program book '''
    proj = load_project(project_id, die=True) # Load the project with the matching UID.
    file_name = '%s_program_book.xlsx' % proj.name # Create a filename containing the project name followed by a .prj suffix.
    full_file_name = get_path(file_name, username=proj.webapp.username) # Generate the full file name with path.
    try:
        proj.progbook.save(full_file_name)
    except Exception as E:
        errormsg = 'Program book has not been uploaded or is invalid: %s' % str(E)
        raise Exception(errormsg)
    print(">> download_progbook %s" % (full_file_name)) # Display the call information.
    return full_file_name # Return the full filename.
  
    
@RPC(call_type='download')   
def create_progbook(project_id, num_progs, start_year, end_year):
    ''' Create program book -- only used for Cascades '''
    proj = load_project(project_id, die=True) # Load the project with the matching UID.
    file_name = '%s_program_book.xlsx' % proj.name # Create a filename containing the project name followed by a .prj suffix.
    full_file_name = get_path(file_name, username=proj.webapp.username) # Generate the full file name with path.
    proj.make_progbook(progbook_path=full_file_name, progs=int(num_progs), data_start=int(start_year), data_end=int(end_year))
    print(">> download_progbook %s" % (full_file_name)) # Display the call information.
    return full_file_name # Return the full filename.    


@RPC(call_type='upload')
def upload_databook(databook_filename, project_id):
    ''' Upload a databook to a project. '''
    print(">> upload_databook '%s'" % databook_filename)
    proj = load_project(project_id, die=True)
    proj.load_databook(databook_path=databook_filename)
    clear_cached_results(proj, project_id, spare_calibration=False)
    save_project(proj) # Save the new project in the DataStore.
    return { 'projectID': str(proj.uid) } # Return the new project UID in the return message.


@RPC(call_type='upload')
def upload_progbook(progbook_filename, project_id):
    ''' Upload a program book to a project. '''
    print(">> upload_progbook '%s'" % progbook_filename)
    proj = load_project(project_id, die=True)
    proj.load_progbook(progbook_path=progbook_filename)
    clear_cached_results(proj, project_id, spare_calibration=True)
    save_project(proj)
    return { 'projectID': str(proj.uid) }



##################################################################################
### Framework RPCs
##################################################################################

@RPC()
def jsonify_framework(framework_id, verbose=False):
    ''' Return the framework json, given the framework UID. ''' 
    frame = load_framework(framework_id) # Load the framework record matching the UID of the framework passed in.
    json = {
        'framework': sc.odict({
            'id':           str(frame.uid),
            'name':         frame.name,
            'username':     frame.webapp.username,
            'creationTime': frame.created,
            'updatedTime':  frame.modified,
        })
    }
    if verbose: sc.pp(json)
    return json
    

@RPC()
def jsonify_frameworks(username, verbose=False):
    ''' Return framework jsons for all frameworks the user has to the client. ''' 
    output = {'frameworks':[]}
    user = get_user(username)
    for framework_key in user.frameworks:
        try:
            json = jsonify_framework(framework_key)
        except Exception as E:
            print('Framework load failed, removing: %s' % str(E))
            user.projects.remove(framework_key)
            datastore.saveuser(user)
        output['frameworks'].append(json)
    if verbose: sc.pp(output)
    return output


@RPC()
def get_framework_options():
    ''' Return the available demo frameworks '''
    options = at.default_framework(show_options=True).values()
    return options


@RPC()
def add_demo_framework(username, framework_name):
    ''' Add a demo framework '''
    frame = at.demo(kind='framework', which=framework_name)  # Create the framework, loading in the desired spreadsheets.
    save_new_framework(frame, username) # Save the new framework in the DataStore.
    print(">> add_demo_framework %s" % (frame.name))  
    return {'frameworkID': str(frame.uid) } # Return the new framework UID in the return message.


@RPC()
def rename_framework(framework_json):
    ''' Given the passed in framework summary, update the underlying framework accordingly. ''' 
    frame = load_framework(framework_json['framework']['id']) # Load the framework corresponding with this summary.
    frame.name = framework_json['framework']['name']
    save_framework(frame) # Save the changed framework to the DataStore.
    return None


@RPC()    
def copy_framework(framework_id):
    ''' Given a framework UID, creates a copy of the framework with a new UID and returns that UID. '''
    frame = load_framework(framework_id, die=True) # Load the project with the matching UID.
    new_framework = sc.dcp(frame) # Make a copy of the framework loaded in to work with.
    key,new_framework = save_new_framework(new_framework, username=new_framework.webapp.username) # Save a DataStore frameworks record for the copy framework.
    print(">> copy_framework %s" % (new_framework.name))  # Display the call information.
    return {'frameworkID': str(new_framework.uid)} # Return the UID for the new frameworks record.



@RPC(call_type='download')   
def download_framework(framework_id):
    ''' Download the framework Excel file from a project '''
    frame = load_framework(framework_id, die=True) # Load the project with the matching UID.
    file_name = '%s.xlsx' % frame.name
    full_file_name = get_path(file_name, username=frame.webapp.username) # Generate the full file name with path.
    filepath = frame.save(full_file_name)
    print(">> download_framework %s" % (filepath)) # Display the call information.
    return filepath # Return the full filename.


@RPC(call_type='download')
def download_frameworks(framework_keys, username):
    '''
    Given a list of framework UIDs, make a .zip file containing all of these 
    frameworks as .frw files, and return the full path to this file.
    '''
    basedir = get_path('', username) # Use the downloads directory to put the file in.
    framework_paths = []
    for framework_key in framework_keys:
        frame = load_framework(framework_key)
        framework_path = frame.save(folder=basedir)
        framework_paths.append(framework_path)
    zip_fname = 'Frameworks %s.zip' % sc.getdate() # Make the zip file name and the full server file path version of the same..
    server_zip_fname = get_path(zip_fname, username)
    server_zip_fname = sc.savezip(server_zip_fname, framework_paths)
    print(">> download_frameworks %s" % (server_zip_fname)) # Display the call information.
    return server_zip_fname # Return the server file name.


@RPC(call_type='download')
def download_new_framework(advanced=False):
    ''' Create a new framework. '''
    if advanced: filename = 'framework_template_advanced.xlsx'
    else:        filename = 'framework_template.xlsx'
    filepath = at.LIBRARY_PATH+filename
    print(">> download_framework %s" % (filepath))
    return filepath # Return the filename


@RPC(call_type='upload')
def upload_frameworkbook(databook_filename, framework_id):
    ''' Upload a databook to a framework. '''
    print(">> upload_frameworkbook '%s'" % databook_filename)
    frame = load_framework(framework_id, die=True)
    frame.read_from_file(filepath=databook_filename, overwrite=True) # Reset the framework name to a new framework name that is unique.
    save_framework(frame) # Save the new framework in the DataStore.
    return {'frameworkID': str(frame.uid)}


@RPC(call_type='upload')
def upload_new_frameworkbook(filename, username):
    '''
    Given an .xlsx file name and a user UID, create a new framework from the file.
    '''
    frame = at.ProjectFramework(filename)
    if not frame.cascades:
        at.validate_cascade(frame, None)
    else:
        for cascade in frame.cascades:
            at.validate_cascade(frame, cascade)
    if frame.name is None: 
        frame.name = os.path.basename(filename) # Ensure that it's not None
        if frame.name.endswith('.xlsx'):
            frame.name = frame.name[:-5]
    save_new_framework(frame, username) # Save the new framework in the DataStore.
    print('Created new framework: %s' % frame.name)
    return { 'frameworkID': str(frame.uid) }



##################################################################################
### Calibration RPCs
##################################################################################

@RPC()
def get_y_factors(project_id, parsetname=-1, tool=None, verbose=False):
    print('Getting y factors for parset %s...' % parsetname)
    print('Warning, year hard coded!')
    TEMP_YEAR = 2018 # WARNING, hard-coded!
    y_factors = []
    proj = load_project(project_id, die=True)
    parset = proj.parsets[parsetname]
    count = -1
    for par in parset.pars.values():
        parname = par.name
        this_par = parset.pars[parname]
        this_spec = proj.framework.get_variable(parname)[0]
        if 'calibrate' in this_spec and this_spec['calibrate'] is not None:
            count += 1
            parlabel = this_spec['display name']
            parcategory = this_spec['calibrate']
            y_factors.append({'index':count, 'parname':parname, 'parlabel':parlabel, 'parcategory':parcategory, 'meta_y_factor':this_par.meta_y_factor, 'pop_y_factors':[]})
            for p,popname,y_factor in this_par.y_factor.enumitems():
                popindex = parset.pop_names.index(popname)
                poplabel = parset.pop_labels[popindex]

                if tool == 'cascade':
                    dispvalue = from_number(y_factor)
                else:
                    if not this_par.has_values(popname):
                        interp_val = 1.0
                    else:
                        try:
                            interp_val = this_par.interpolate([TEMP_YEAR],popname)[0]
                            if not np.isfinite(interp_val):
                                print('NUMBER WARNING, value for %s %s is not finite' % (parlabel, poplabel))
                                interp_val = 1.0
                            if sc.approx(interp_val, 0):
                                interp_val = 0.0
                        except Exception as E:
                            print('NUMBER WARNING, value for %s %s is not convertible: %s' % (parlabel, poplabel, str(E)))
                            interp_val = 1.0
                    dispvalue = from_number(interp_val*y_factor)
                thisdict = {'popcount':p, 'popname':popname, 'dispvalue':dispvalue, 'origdispvalue':dispvalue, 'poplabel':poplabel}
                y_factors[-1]['pop_y_factors'].append(thisdict)
    if verbose: sc.pp(y_factors)
    print('Returning %s y-factors for %s' % (len(y_factors), parsetname))
    return {'parlist':y_factors, 'poplabels':parset.pop_labels}


@RPC()
def set_y_factors(project_id, parsetname=-1, parlist=None, tool=None, verbose=False):
    print('Setting y factors for parset %s...' % parsetname)
    print('Warning, year hard coded!')
    TEMP_YEAR = 2018 # WARNING, hard-coded!
    proj = load_project(project_id, die=True)
    parset = proj.parsets[parsetname]
    for newpar in parlist:
        parname = newpar['parname']
        this_par = parset.pars[parname]
        this_par.meta_y_factor = to_float(newpar['meta_y_factor'])
        if verbose: print('Metaparameter %10s: %s' % (parname, this_par.meta_y_factor))
        for newpoppar in newpar['pop_y_factors']:
            popname = newpoppar['popname']
            if tool == 'cascade':
                this_par.y_factor[popname] = to_float(newpoppar['dispvalue'])
            else:
                # Try to get interpolated value
                if not this_par.has_values(popname):
                    interp_val = 1.0
                else:
                    try:
                        interp_val = this_par.interpolate([TEMP_YEAR],popname)[0]
                        if not np.isfinite(interp_val):
                            print('NUMBER WARNING, value for %s %s is not finite' % (parname, popname))
                            interp_val = 1
                        if sc.approx(interp_val, 0):
                            interp_val = 0.0
                    except Exception as E:
                        print('NUMBER WARNING, value for %s %s is not convertible: %s' % (parname, popname, str(E)))
                        interp_val = 1

                # Convert the value
                dispvalue     = to_float(newpoppar['dispvalue'])
                origdispvalue = to_float(newpoppar['origdispvalue'])
                changed = (dispvalue != origdispvalue)
                if changed:
                    print('Parameter %10s %10s updated: %s -> %s' % (parname, popname, origdispvalue, dispvalue))
                else:
                    if verbose: print('Note: parameter %10s %10s stayed the same! %s -> %s' % (parname, popname, origdispvalue, dispvalue))
                orig_y_factor = this_par.y_factor[popname]
                if not sc.approx(origdispvalue, 0):
                    y_factor_change = dispvalue/origdispvalue
                    y_factor        = orig_y_factor*y_factor_change
                elif not sc.approx(interp_val, 0):
                    y_factor = dispvalue/(1e-6+interp_val)
                else:
                    if changed: print('NUMBER WARNING, everything is 0 for %s %s: %s %s %s %s' % (parname, popname, origdispvalue, dispvalue, interp_val, orig_y_factor))
                    y_factor = orig_y_factor
                this_par.y_factor[popname] = y_factor
    if verbose: sc.pp(parlist)
    print('Setting %s y-factors for %s' % (len(parlist), parsetname))
    print('Saving project...')
    save_project(proj)
    return None


@RPC(call_type='download')   
def reconcile(project_id, parsetname=None, progsetname=-1, year=2018, unit_cost_bounds=0.2, outcome_bounds=0.2):
    ''' Reconcile parameter set and program set '''
    proj = load_project(project_id, die=True) # Load the project with the matching UID.
    reconciled_progset, progset_comparison, parameter_comparison = at.reconcile(project=proj, parset=parsetname, progset=progsetname, reconciliation_year=year,unit_cost_bounds=unit_cost_bounds, outcome_bounds=outcome_bounds)
    file_name = '%s_reconciled_program_book.xlsx' % proj.name # Create a filename containing the project name followed by a .prj suffix.
    full_file_name = get_path(file_name, username=proj.webapp.username) # Generate the full file name with path.
    reconciled_progset.save(full_file_name)
    print(">> download_progbook %s" % (full_file_name)) # Display the call information.
    return full_file_name # Return the full filename.


##################################################################################
### Parameter set RPCs
##################################################################################

@RPC() 
def get_parset_info(project_id):
    print('Returning parset info...')
    proj = load_project(project_id, die=True)
    parset_names = proj.parsets.keys()
    return parset_names


@RPC() 
def rename_parset(project_id, parsetname=None, new_name=None):
    print('Renaming parset from %s to %s...' % (parsetname, new_name))
    proj = load_project(project_id, die=True)
    proj.parsets.rename(parsetname, new_name)
    print('Saving project...')
    save_project(proj)
    return None


@RPC() 
def copy_parset(project_id, parsetname=None):
    print('Copying parset %s...' % parsetname)
    proj = load_project(project_id, die=True)
    print('Number of parsets before copy: %s' % len(proj.parsets))
    new_name = sc.uniquename(parsetname, namelist=proj.parsets.keys())
    print('Old name: %s; new name: %s' % (parsetname, new_name))
    proj.parsets[new_name] = sc.dcp(proj.parsets[parsetname])
    print('Number of parsets after copy: %s' % len(proj.parsets))
    print('Saving project...')
    save_project(proj)
    return new_name


@RPC() 
def delete_parset(project_id, parsetname=None):
    print('Deleting parset %s...' % parsetname)
    proj = load_project(project_id, die=True)
    print('Number of parsets before delete: %s' % len(proj.parsets))
    if len(proj.parsets)>1:
        proj.parsets.pop(parsetname)
    else:
        raise Exception('Cannot delete last parameter set')
    print('Number of parsets after delete: %s' % len(proj.parsets))
    print('Saving project...')
    save_project(proj)
    return None


@RPC(call_type='download')   
def download_parset(project_id, parsetname=None):
    '''
    For the passed in project UID, get the Project on the server, save it in a 
    file, minus results, and pass the full path of this file back.
    '''
    proj = load_project(project_id, die=True) # Load the project with the matching UID.
    parset = proj.parsets[parsetname]
    file_name = '%s - %s.par' % (proj.name, parsetname) # Create a filename containing the project name followed by a .prj suffix.
    full_file_name = get_path(file_name, username=proj.webapp.username) # Generate the full file name with path.
    sc.saveobj(full_file_name, parset) # Write the object to a Gzip string pickle file.
    print(">> download_parset %s" % (full_file_name)) # Display the call information.
    return full_file_name # Return the full filename.
    
    
@RPC(call_type='upload')   
def upload_parset(parset_filename, project_id):
    '''
    For the passed in project UID, get the Project on the server, save it in a 
    file, minus results, and pass the full path of this file back.
    '''
    proj = load_project(project_id, die=True) # Load the project with the matching UID.
    parset = sc.loadobj(parset_filename)
    parsetname = sc.uniquename(parset.name, namelist=proj.parsets.keys())
    parset.name = parsetname # Reset the name
    proj.parsets[parsetname] = parset
    save_project(proj) # Save the new project in the DataStore.
    return parsetname # Return the new project UID in the return message.


##################################################################################
### Program set RPCs
##################################################################################


@RPC() 
def get_progset_info(project_id):
    print('Returning progset info...')
    proj = load_project(project_id, die=True)
    progset_names = proj.progsets.keys()
    return progset_names


@RPC() 
def rename_progset(project_id, progsetname=None, new_name=None):
    print('Renaming progset from %s to %s...' % (progsetname, new_name))
    proj = load_project(project_id, die=True)
    proj.progsets.rename(progsetname, new_name)
    print('Saving project...')
    save_project(proj)
    return None


@RPC() 
def copy_progset(project_id, progsetname=None):
    print('Copying progset %s...' % progsetname)
    proj = load_project(project_id, die=True)
    print('Number of progsets before copy: %s' % len(proj.progsets))
    new_name = sc.uniquename(progsetname, namelist=proj.progsets.keys())
    print('Old name: %s; new name: %s' % (progsetname, new_name))
    proj.progsets[new_name] = sc.dcp(proj.progsets[progsetname])
    print('Number of progsets after copy: %s' % len(proj.progsets))
    print('Saving project...')
    save_project(proj)
    return None


@RPC() 
def delete_progset(project_id, progsetname=None):
    print('Deleting progset %s...' % progsetname)
    proj = load_project(project_id, die=True)
    print('Number of progsets before delete: %s' % len(proj.progsets))
    if len(proj.progsets)>1:
        proj.progsets.pop(progsetname)
    else:
        raise Exception('Cannot delete last program set')
    print('Number of progsets after delete: %s' % len(proj.progsets))
    print('Saving project...')
    save_project(proj)
    return None


@RPC()
def get_default_programs(fulloutput=False, verbose=True):
    ''' Only used for TB '''
    
    # Get programs
    if verbose: print('get_default_programs(): Creating framework...')
    F = at.demo(kind='framework', which='tb')
    if verbose: print('get_default_programs(): Creating dict...')
    default_pops = sc.odict() # TODO - read in the pops from the defaults file instead of hard-coding them here
    for key in ['^0.*', '.*HIV.*', '.*[pP]rison.*', '^[^0](?!HIV)(?![pP]rison).*']:
        default_pops[key] = key
    if verbose: print('get_default_programs(): Creating project data...')
    D = at.ProjectData.new(F, tvec=np.array([0]), pops=default_pops, transfers=0)
    if verbose: print('get_default_programs(): Loading spreadsheet...')
    spreadsheetpath = at.LIBRARY_PATH + "tb_progbook_defaults.xlsx"
    default_progset = at.ProgramSet.from_spreadsheet(spreadsheetpath, framework=F, data=D, _allow_missing_data=True)


    # Assemble dictionary
    if verbose: print('get_default_programs(): Assembling output...')
    progs = sc.odict()
    for key in default_progset.programs.keys():
        prog_label = default_progset.programs[key].label
        if '[Inactive]' in prog_label:
            progs[prog_label.replace('[Inactive]','').strip()] = False
        else:
            progs[prog_label.replace('[Active]','').strip()] = True
    
    # Frontendify
    output = []
    for key,val in progs.items():
        output.append({'name':key, 'included':val})
    
    if verbose: sc.pp(output)

    if fulloutput: return output, default_progset
    else:          return output


@RPC(call_type='download')
def create_default_progbook(project_id, start_year, end_year, active_progs):
    ''' Only used for TB '''
    # INPUTS
    # - proj : a project
    # - program_years : a two-element range (inclusive) of years for data entry e.g. [2015,2018]
    # - active_progs : a dict of {program_label:0/1} for whether to include a program or not (obtained via get_default_programs())

    proj = load_project(project_id, die=True)
    
    default_active_progs, default_progset = get_default_programs(fulloutput=True)
    if default_active_progs is None:
        active_progs = default_active_progs
    
    # Validate years
    try:
        start_year = float(start_year)
        end_year = float(end_year)
        program_years = [start_year, end_year]
    except Exception as E:
        print('Converting program years "%s, %s" failed: %s' % (start_year, end_year, str(E)))
        program_years = [2015,2018]
        
    # Convert from list back to odict
    active_progs_dict = sc.odict()
    for prog in active_progs:
        active_progs_dict[prog['name']] = prog['included']
    
    progs = sc.odict()
    for prog in default_progset.programs.values():
        prog.label = prog.label.replace('[Active]','').strip()
        prog.label = prog.label.replace('[Inactive]','').strip()
        if active_progs_dict[prog.label]:
            progs[prog.name] = prog.label

    user_progset = at.ProgramSet.new(framework=proj.framework,data=proj.data,progs=progs,tvec=np.arange(program_years[0],program_years[1]+1))

    # Assign a template pop to each user pop
    # It stops after the first match, so the regex should be ordered in
    # decreasing specificity in the template progbook
    # Maybe don't need this?
    pop_assignment = sc.odict() # Which regex goes with each user pop {user_pop:template:pop}
    for user_pop in user_progset.pops:
        for default_pop in default_progset.pops:
            if re.match(default_pop,user_pop):
                pop_assignment[user_pop] = default_pop
                break
        else:
            pop_assignment[user_pop] = None

    for prog in user_progset.programs:

        u_prog = user_progset.programs[prog]
        d_prog = default_progset.programs[prog]

        # Copy target compartments
        u_prog.target_comps = d_prog.target_comps[:] # Make a copy of the comp list (using [:], faster than dcp)

        # Assign target populations
        for user_pop in user_progset.pops:
            if pop_assignment[user_pop] in d_prog.target_pops:
                u_prog.target_pops.append(user_pop)

        # Copy assumptions from spending data
        u_prog.baseline_spend.assumption = d_prog.baseline_spend.assumption
        u_prog.capacity_constraint.assumption = d_prog.capacity_constraint.assumption
        u_prog.coverage.assumption = d_prog.coverage.assumption
        u_prog.unit_cost.assumption = d_prog.unit_cost.assumption
        u_prog.spend_data.assumption = d_prog.spend_data.assumption

    for user_par in user_progset.pars:
        for user_pop in user_progset.pops:
            default_pop = pop_assignment[user_pop]
            if (user_par,default_pop) in default_progset.covouts:
                user_progset.covouts[(user_par,user_pop)] = sc.dcp(default_progset.covouts[(user_par,default_pop)])
                user_progset.covouts[(user_par, user_pop)].pop = user_pop

    file_name = '%s_default_program_book.xlsx' % proj.name # Create a filename containing the project name followed by a .prj suffix.
    full_file_name = get_path(file_name, username=proj.webapp.username) # Generate the full file name with path.
    user_progset.save(filename=full_file_name)
    print(">> download_default_progbook %s" % (full_file_name)) # Display the call information.
    return full_file_name



##################################################################################
### Plotting RPCs
##################################################################################

def supported_plots_func(framework):
    '''
    Return a dict of supported plots extracted from the framework.
        Input:  framework :        a ProjectFramework instance
        Output: {name:quantities}: a dict with all of the plot quantities in the framework keyed by name
    '''
    if 'plots' not in framework.sheets:
        return sc.odict()
    else:
        df = framework.sheets['plots'][0]
        plots = sc.odict()
        for name,output in zip(df['name'], df['quantities']):
            plots[name] = at.evaluate_plot_string(output)
        return plots


@RPC()    
def get_supported_plots(project_id, only_keys=False):
    proj = load_project(project_id, die=True)
    supported_plots = supported_plots_func(proj.framework)  # Get the framework plots
    if only_keys:
        plot_names = supported_plots.keys()
        vals = np.ones(len(plot_names))
        output = []
        for plot_name,val in zip(plot_names,vals):  # Pull out the framework plots.
            this = {'plot_name':plot_name, 'active':val}
            output.append(this)
        this = {'plot_name': 'Program spending plots', 'active': 1}
        output.append(this)
        this = {'plot_name': 'Program coverage plots', 'active': 1}
        output.append(this)
        this = {'plot_name': 'Care cascade plots', 'active': 1}
        output.append(this)
        return output
    else:
        return supported_plots


def savefigs(allfigs, username, die=False):
    ''' Save all figures, first to disk, and then to the database '''
    filepath = sc.savefigs(allfigs, filetype='singlepdf', filename='Figures.pdf', folder=get_path('', username=username))
    figblob = sc.Blobject(filename=filepath)
    figkey = 'figures::'+username
    datastore.saveblob(key=figkey, obj=figblob)
    return filepath


@RPC(call_type='download')
def download_graphs(username):
    ''' Download figures, first loading from database and then saving '''
    file_name = 'Figures.pdf' # Create a filename containing the framework name followed by a .frw suffix.
    full_file_name = get_path(file_name, username=username) # Generate the full file name with path.
    figblob = datastore.loadblob(key='figures::'+username)
    figblob.save(full_file_name)
    return full_file_name


def get_atomica_plots(proj, results=None, plot_names=None, plot_options=None, pops='all', outputs=None, do_plot_data=None, replace_nans=True, stacked=False, xlims=None, figsize=None, calibration=False):
    results = sc.promotetolist(results)
    supported_plots = supported_plots_func(proj.framework)
    if plot_names is None: 
        if plot_options is not None:
            plot_names = []
            for item in plot_options:
                if item['active']: plot_names.append(item['plot_name'])
        else:
            plot_names = supported_plots.keys()
    plot_names = sc.promotetolist(plot_names)
    if outputs is None:
        outputs = [{plot_name:supported_plots[plot_name]} for plot_name in plot_names if plot_name in supported_plots] # Warning, implicit dict definition
    allfigs = []
    alllegends = []
    allfigjsons = []
    alllegendjsons = []
    data = proj.data if do_plot_data is True else None # Plot data unless asked not to
    for output in outputs:
        try:
            plotdata = at.PlotData(results, outputs=list(output.values())[0], project=proj, pops=pops)
            nans_replaced = 0
            for series in plotdata.series:
                if replace_nans and any(np.isnan(series.vals)):
                    nan_inds = sc.findinds(np.isnan(series.vals))
                    for nan_ind in nan_inds:
                        if nan_ind>0: # Skip the first point
                            series.vals[nan_ind] = series.vals[nan_ind-1]
                            nans_replaced += 1
            if nans_replaced:
                print('Warning: %s nans were replaced' % nans_replaced)

            if calibration:
                if stacked: figs = at.plot_series(plotdata, axis='pops', plot_type='stacked', legend_mode='separate')
                else: figs = at.plot_series(plotdata, axis='pops', data=proj.data, legend_mode='separate')  # Only plot data if not stacked
            else:
                if stacked: figs = at.plot_series(plotdata, axis='pops', data=data, plot_type='stacked', legend_mode='separate')
                else: figs = at.plot_series(plotdata, axis='results', data=data, legend_mode='separate')

            for fig in figs[0:-1]:
                allfigjsons.append(customize_fig(fig=fig, output=output, plotdata=plotdata, xlims=xlims, figsize=figsize))
                alllegendjsons.append(customize_fig(fig=figs[-1], output=output, plotdata=plotdata, xlims=xlims, figsize=figsize, is_legend=True))
                allfigs.append(fig)
                alllegends.append(figs[-1])
            print('Plot %s succeeded' % (output))
        except Exception as E:
            print('WARNING: plot %s failed (%s)' % (output, repr(E)))
    output = {'graphs':allfigjsons, 'legends':alllegendjsons,'types': ['framework']*len(allfigjsons)}
    return output, allfigs, alllegends


def make_plots(proj, results, tool=None, year=None, pops=None, cascade=None, plot_options=None, dosave=True, calibration=False, plot_budget=False, outputfigs=False):
    
    # Handle inputs
    if sc.isstring(year): year = float(year)
    if pops is None:      pops = 'all'
    results = sc.promotetolist(results)

    # Decide what to do
    if calibration and pops.lower() == 'all':
        # For calibration plot, 'all' pops means that they should all be disaggregated and visible
        # But for scenarios and optimizations, 'all' pops means aggregated over all pops
        pops = 'all'  # pops=None means aggregate all pops in get_cascade_plot, and plots all pops _without_ aggregating in calibration
    elif pops.lower() == 'all':
        pops = 'total' # make sure it's lowercase
    else:
        pop_labels = sc.odict({y:x for x,y in zip(results[0].pop_names,results[0].pop_labels)})
        pops = pop_labels[pops]

    output = {'graphs':[],'legends':[], 'types':[]}
    all_figs = []
    all_legends = []

    for item in plot_options:
        if item['plot_name'] == 'Program spending plots':
            showbudgetplots = item['active']
        if item['plot_name'] == 'Program coverage plots':
            showcoverageplots = item['active']
        if item['plot_name'] == 'Care cascade plots':
            showcascadeplots = item['active']

    def append_plots(d,figs,legends):
        nonlocal all_figs, all_legends
        all_figs += figs
        all_legends += legends
        output['graphs'] += d['graphs']
        output['legends'] += d['legends']
        output['types'] += d['types']

    if showcascadeplots:
        cascadeoutput, cascadefigs, cascadelegends = get_cascade_plot(proj, results, year=year, pops=pops, cascade=cascade, plot_budget=plot_budget)
        append_plots(cascadeoutput,cascadefigs,cascadelegends)

    if calibration: d, figs, legends = get_atomica_plots(proj, results=results, pops=pops, plot_options=plot_options, stacked=False, calibration=True)
    else:           d, figs, legends = get_atomica_plots(proj, results=results, pops=pops, plot_options=plot_options)
    append_plots(d, figs, legends)

    if plot_budget:
        # Make program related plots
        if showbudgetplots:
            d, figs, legends = get_budget_plots(results=results,year=year)
            append_plots(d, figs, legends)

        if showcoverageplots:
            d, figs, legends = get_coverage_plots(results=results)
            append_plots(d, figs, legends)

    savefigs(all_figs, username=proj.webapp.username) # WARNING, dosave ignored fornow
    if outputfigs: return output, all_figs, all_legends
    else:          return output


def customize_fig(fig=None, output=None, plotdata=None, xlims=None, figsize=None, is_legend=False, is_epi=True, is_cov_plot=False, popup_legends=False):

    # Turn on all the axes - otherwise they don't show in mpld3
    for ax in fig.get_axes(): ax.set_axis_on()

    if is_legend:
        pass # Put legend customizations here
    else:
        ax = fig.get_axes()[0]
        ax.set_facecolor('none')
        if is_epi or is_cov_plot:
            if figsize is None: figsize = (5,3)
            fig.set_size_inches(figsize)
            ax.set_position([0.25,0.18,0.70,0.72])
            if is_epi:
                ax.set_title(list(output.keys())[0]) # This is in a loop over outputs, so there should only be one output present
        y_max = ax.get_ylim()[1]
        labelpad = 7
        if y_max < 1e-3: labelpad = 15
        if y_max > 1e3:  labelpad = 15
        if y_max > 1e6:  labelpad = 25
        if y_max > 1e7:  labelpad = 30
        if y_max > 1e8:  labelpad = 35
        if y_max > 1e9:  labelpad = 40
        if is_epi:
            ylabel = plotdata.series[0].units
            if ylabel == 'probability': ylabel = 'Probability'
            if ylabel == '':            ylabel = 'Proportion'
        elif is_cov_plot:
            ylabel = 'Proportion covered'
        else:
            ylabel = ax.get_ylabel()
        ax.set_ylabel(ylabel, labelpad=labelpad) # All outputs should have the same units (one output for each pop/result)
        if xlims is not None: ax.set_xlim(xlims)
        try:
            legend = fig.findobj(Legend)[0]
            if len(legend.get_texts())==1:
                legend.remove() # Can remove the legend if it only has one entry
        except:
            pass
        mpld3.plugins.connect(fig, CursorPosition())
        if is_epi or popup_legends:
            for l,line in enumerate(fig.axes[0].lines):
                mpld3.plugins.connect(fig, LineLabels(line, label=line.get_label()))
    graph_dict = sw.mpld3ify(fig, jsonify=False) # Convert to mpld3
    pl.close(fig)
    return graph_dict


def get_budget_plots(results, year):

    output = {'graphs': [], 'legends': []}
    figs = []
    legends = []

    results = [x for x in results if x.used_programs] # Only include results that used programs
    results = [x for x in results if not x.model.program_instructions.coverage] # Only include results that did NOT have coverage overwrites
    if not results:
        return output, figs, legends

    # Prepare data
    d = at.PlotData.programs(results, quantity='spending')
    d.interpolate(year)

    # Budget figure
    figs = at.plot_bars(d, stack_outputs='all', legend_mode='together', outer='times', show_all_labels=False, orientation='vertical')
    ax = figs[0].axes[0]
    figs[0].set_size_inches(10, 4)
    ax.set_position([0.15, 0.2, 0.35, 0.7])
    ax.set_xlabel('Spending ($/year)')

    # Budget legend
    legends = [sc.emptyfig()] # Not sure why this is useful

    output = {
        'graphs': [customize_fig(fig=x, is_epi=False, is_legend=False) for x in figs],
        'legends': [customize_fig(fig=x, is_epi=False, is_legend=True) for x in legends],
        'types': ['budget']*len(figs)
    }
    return output, figs, legends


def get_coverage_plots(results):

    output = {'graphs': [], 'legends': []}
    figs = []
    legends = []

    results = [x for x in results if x.used_programs]  # Only include results that used programs
    if not results:
        return output, figs, legends

    # Coverage figures
    d = at.PlotData.programs(results, quantity='coverage_fraction', nan_outside=True)
    figs = at.plot_series(d, axis='results', legend_mode='separate')
    figs = figs[0:-1]  # Delete the appended legend fig.

    # Create titles for figs which correspond to the program names.
    for ind in range(len(d.outputs)):
        ax = figs[ind].get_axes()[0]
        ax.set_facecolor('none')
        ax.set_title(d.outputs[ind])

    # Coverage legend
    legends = len(figs)*[sc.emptyfig()]

    output = {
        'graphs': [customize_fig(fig=x, is_epi=False, is_cov_plot=True, is_legend=False, popup_legends=True) for x in figs],
        'legends': [customize_fig(fig=x, is_epi=False, is_cov_plot=True, is_legend=True, popup_legends=True) for x in legends],
        'types': ['coverage']*len(figs)
    }
    return output, figs, legends


def get_cascade_plot(proj, results=None, pops=None, year=None, cascade=None, plot_budget=False):
    
    if results is None: results = proj.results[-1]
    if year    is None: year    = proj.settings.sim_end # Needed for plot_budget
    
    figs = []
    legends = []
    figjsons = []
    legendjsons = []
    years = sc.promotetolist(year)
    for y in range(len(years)):
        years[y] = float(years[y]) # Ensure it's a float

    fig,table = at.plot_cascade(results, cascade=cascade, pops=pops, year=years, data=proj.data, show_table=False)
    figjsons.append(customize_fig(fig=fig, output=None, plotdata=None, xlims=None, figsize=None, is_epi=False))
    figs.append(fig)
    legends.append(sc.emptyfig()) # No figure, but still useful to have a plot
    
    for fig in legends: # Different enough to warrant its own block, although ugly
        try:
            ax = fig.get_axes()[0]
            ax.set_facecolor('none')
        except:
            pass
        graph_dict = sw.mpld3ify(fig, jsonify=False)
        legendjsons.append(graph_dict)
        pl.close(fig)
    
    jsondata,jsoncolors = get_json_cascade(results=results, data=proj.data)
    output = {'graphs':figjsons, 'legends':legendjsons, 'table':table, 'jsondata':jsondata, 'jsoncolors':jsoncolors, 'types':['cascade']*len(figjsons)}
    print('Cascade plot succeeded with %s plots and %s legends and %s table' % (len(figjsons), len(legendjsons), bool(table)))
    return output, figs, legends


def get_json_cascade(results,data):
    '''
    Return all data to render cascade in FE, for multiple results
   
    INPUTS
    - results - A Result, or list of Results
    - data - A ProjectData instance (e.g. proj.data)
   
    OUTPUTS
    - dict/json containing the data required to make the cascade plot on the FE
      The dict has the following structure. Suppose we have
   
      cascade_data = get_json_cascade(results,data)
   
      Then the output of this function is (JSON equivalent of?):
   
      cascade_data['results'] - List of names of all results included (could render as checkboxes)
      cascade_data['pops'] - List of names of all pops included (could render as checkboxes)
      cascade_data['cascades'] - List of names of all cascades included (could render as dropdown)
      cascade_data['stages'][cascade_name] - List of the names of the stages in a given cascade
      cascade_data['t'][result_name] - Array of time values for the given result
      cascade_data['model'][result_name][cascade_name][pop_name][stage_name] - Array of values, same size as cascade_data['t'][result_name] (this contains the values that end up in the bar)
      cascade_data['data_t'] - Array of time values for the data
      cascade_data['data'][cascade_name][pop_name][stage_name] - Array of values, same size as cascade_data['data_t'] (this contains the values to be plotted as scatter points)
   
      Note - the data values entered in the databook are sparse (typically there isn't a data point at every time). The arrays all have
      the same size as cascade_data['data_t'], but contain `NaN` if the data was missing
    '''

    results = sc.promotetolist(results)

    cascade_data = sc.odict()
    cascade_data['pops'] = results[0].pop_labels
    cascade_data['results'] = [x.name for x in results]

    # Extract the cascade values
    if results[0].framework.cascades:
        cascade_data['cascades'] = list(results[0].framework.cascades.keys()) # Available cascades
        cascades = cascade_data['cascades']
    else:
        cascade_data['cascades'] = ['Default'] # Available cascades
        cascades = [None]

    cascade_data['model'] = sc.odict()
    cascade_data['t'] = sc.odict()
    cascade_data['stages'] = sc.odict()

    for result in results:
        cascade_data['model'][result.name] = sc.odict()
        for name, cascade in zip(cascade_data['cascades'],cascades):
            cascade_data['model'][result.name][name] = sc.odict()
            for pop_name, pop_label in zip(result.pop_names,result.pop_labels):
                cascade_data['model'][result.name][name][pop_label],t = at.get_cascade_vals(result,cascade=cascade,pops=pop_name)
            cascade_data['stages'][name] = list(cascade_data['model'][result.name][name][pop_label].keys())
        cascade_data['t'][result.name] = t

    # Extract the data values
    cascade_data['data'] = sc.odict()
    for name, cascade in zip(cascade_data['cascades'], cascades):
        cascade_data['data'][name] = sc.odict()
        for pop_name, pop_label in zip(results[0].pop_names, results[0].pop_labels):
            cascade_data['data'][name][pop_label],t = at.get_cascade_data(data,results[0].framework, cascade=cascade,pops=pop_name)
    cascade_data['data_t'] = t
    
    jsondata = sc.sanitizejson(cascade_data)
    ncolors = len(result.pop_names)
    jsoncolors = sc.gridcolors(ncolors, ashex=True)
    return jsondata,jsoncolors


@RPC()  
def manual_calibration(project_id, cache_id, parsetname=-1, plot_options=None, plotyear=None, pops=None, tool=None, cascade=None, dosave=True):
    print('Running "manual calibration"...')
    proj = load_project(project_id, die=True)
    result = proj.run_sim(parset=parsetname, store_results=False)
    cache_result(proj, result, cache_id)
    output = make_plots(proj, result, tool=tool, year=plotyear, pops=pops, cascade=cascade, plot_options=plot_options, dosave=dosave, calibration=True)
    return output


@RPC()    
def automatic_calibration(project_id, cache_id, parsetname=-1, max_time=20, saveresults=True, plot_options=None, tool=None, plotyear=None, pops=None,cascade=None, dosave=True):
    print('Running automatic calibration for parset %s...' % parsetname)
    proj = load_project(project_id, die=True)
    proj.calibrate(parset=parsetname, max_time=float(max_time)) # WARNING, add kwargs!
    result = proj.run_sim(parset=parsetname, store_results=False)
    cache_result(proj, result, cache_id)
    output = make_plots(proj, result, tool=tool, year=plotyear, pops=pops, cascade=cascade, plot_options=plot_options, dosave=dosave, calibration=True)
    return output



##################################################################################
### Scenario RPCs
##################################################################################

def py_to_js_scen(scen: at.Scenario, proj=at.Project) -> dict:
    ''' Convert a Python scenario to JSON representation

    '''

    # Start with empty JSON
    js_scen = dict()
    js_scen['name'] = scen.name
    js_scen['active'] = scen.active
    js_scen['parsetname'] = scen.parsetname if scen.parsetname else 'None'
    js_scen['progsetname'] = scen.progsetname if scen.progsetname else 'None'

    # Get the scenario type by looking at the type of the Scenario object.
    if isinstance(scen, at.BudgetScenario):
        js_scen['scentype'] = 'budget'
    elif isinstance(scen, at.CoverageScenario):
        js_scen['scentype'] = 'coverage'
    elif isinstance(scen, at.ParameterScenario):
        js_scen['scentype'] = 'parameter'
    else:
        js_scen['scentype'] = 'unknown'

    # Handle the special cases for budget scenarios...
    if js_scen['scentype'] == 'budget':
        js_scen['progstartyear'] = scen.start_year
        budgetyears = set()
        [budgetyears.update(x.t) for x in scen.alloc.values()]
        js_scen['budgetyears'] = np.array(sorted(budgetyears))
        js_scen['coverageyears'] = np.array([])

    # Handle the special cases for coverage scenarios...
    elif js_scen['scentype'] == 'coverage':
        js_scen['progstartyear'] = scen.start_year
        coverageyears = set()
        [coverageyears.update(x.t) for x in scen.coverage.values()]
        js_scen['coverageyears'] = np.array(sorted(coverageyears))
        js_scen['budgetyears'] = np.array([])

    # Handle the special cases for parameter scenarios...
    elif js_scen['scentype'] == 'parameter':
        js_scen['paramyears'] = np.array([])
        js_scen['paramoverwrites'] = []
        scen_values = scen.scenario_values
        extracted_param_years = False
        for code_param_name in scen_values.keys():
            for pop_name in scen_values[code_param_name].keys():
                paramoverwrite_dict = dict()
                paramoverwrite_dict['paramname'] = param_code_name_to_param_diaplay_name(code_param_name, proj)
                paramoverwrite_dict['paramcodename'] = code_param_name
                paramoverwrite_dict['groupname'] = param_code_name_to_param_group_name(code_param_name, proj)
                paramoverwrite_dict['popname'] = pop_name
                paramoverwrite_dict['paramvals'] = scen_values[code_param_name][pop_name]['y']
                if not extracted_param_years:
                    js_scen['paramyears'] = scen_values[code_param_name][pop_name]['t']
                    extracted_param_years = True
                js_scen['paramoverwrites'].append(paramoverwrite_dict)

    # Set up the programs information.
    js_scen['progs'] = []

    if not proj.progsets:
        # If no progsets, we can't retrieve the full names from the short names in the instructions
        # In that case, we don't show any program overwrite values at all.
        return js_scen # Abort early if there are no programs to add

    # Otherwise, populate the program values
    # If user has not selected a progset, then we need to populate the program list somehow
    # Actually what we SHOULD do is populate the list of programs only when the user selects
    # the progset, in case the programs differ across progsets. So this step should be skipped
    # entirely here if the progsetname is 'None' and would instead be called in the callback
    # when the dropdown is

    budget_format_number = lambda x: format(int(round(float(x))), ',') if x is not None else None
    coverage_format_number = lambda x: round(float(x), 2) if x is not None else None

    if scen.progsetname:
        progset = proj.progsets[scen.progsetname]
    else:
        progset = proj.progsets[-1] # TODO - move this to dropdown callback - we need to use -1 here so that we get *some* programs in the UI with the current setup

    for prog in progset.programs.values():
        progdict = dict()
        progdict['name'] = prog.label
        progdict['shortname'] = prog.name
        if js_scen['scentype'] == 'budget':
            if prog.name in scen.alloc:
                progdict['budgetvals'] = []
                for year in js_scen['budgetyears']:
                    val = scen.alloc[prog.name].get(year)
                    progdict['budgetvals'].append(budget_format_number(val))
            else:
                progdict['budgetvals'] = [None] * len(js_scen['budgetyears'])
        elif js_scen['scentype'] == 'coverage':
            if prog.name in scen.coverage:
                progdict['coveragevals'] = []
                for year in js_scen['coverageyears']:
                    val = scen.coverage[prog.name].get(year)
                    if val is not None:
                        val *= 100
                    progdict['coveragevals'].append(coverage_format_number(val))
            else:
                progdict['coveragevals'] = [None] * len(js_scen['coverageyears'])

        js_scen['progs'].append(progdict)

    # Return the dict for the complete JSON.
    return js_scen


def js_to_py_scen(js_scen: dict) -> at.Scenario:
    """
    Convert JSON content to an Atomica scenario

    :param js_scen: Dictionary representation of FE web form
    :return: ``at.CombinedScenario`` instance

    """

    name = js_scen['name']
    active = js_scen['active']
    parsetname = js_scen['parsetname']
    progsetname = js_scen['progsetname']
    scentype = js_scen['scentype']
    if 'progstartyear' in js_scen:
        start_year = to_float(js_scen['progstartyear']) if js_scen['progstartyear'] is not None else None

    alloc = sc.odict()
    coverage = sc.odict()
    for prog in js_scen['progs']:
        if scentype == 'budget':
            if any(prog['budgetvals']):
                budgetyears = [to_float(x) if sc.isstring(x) else x for x in js_scen['budgetyears']]
                alloc[prog['shortname']] = at.TimeSeries(budgetyears,[to_float(x) if x is not None else None for x in prog['budgetvals'] ])
        elif scentype == 'coverage':
            if any([val is not None for val in prog['coveragevals']]):
                coverageyears = [to_float(x) if sc.isstring(x) else x for x in js_scen['coverageyears']]
                coverage[prog['shortname']] = at.TimeSeries(coverageyears,[to_float(x)/100.0 if x is not None else None for x in prog['coveragevals']])

    # Construct the scenario
    if scentype == 'budget':
        scen = at.BudgetScenario(name=name, active=active, parsetname=parsetname, progsetname=progsetname,
            alloc=alloc, start_year=start_year)
    elif scentype == 'coverage':
        scen = at.CoverageScenario(name=name, active=active, parsetname=parsetname, progsetname=progsetname,
            coverage=coverage, start_year=start_year)
    elif scentype == 'parameter':
        scen_values = dict()
        paramyears = []
        if 'paramyears' in js_scen:
            paramyears = js_scen['paramyears']
        if 'paramoverwrites' in js_scen:
            for paramoverwrite in js_scen['paramoverwrites']:
                paramname = paramoverwrite['paramcodename']
                if paramname not in scen_values:
                    scen_values[paramname] = dict()
                popname = paramoverwrite['popname']
                if popname not in scen_values[paramname]:
                    scen_values[paramname][popname] = dict()
                scen_values[paramname][popname]['t'] = paramyears
                paramvals = paramoverwrite['paramvals']
                paramvals = [to_float(pval) for pval in paramvals]
                scen_values[paramname][popname]['y'] = paramvals

        scen = at.ParameterScenario(name=name, active=active, parsetname=parsetname, scenario_values=scen_values)

    return scen


@RPC()
def get_baseline_spending(project_id, verbose=True):
    print('Getting baseline spending...')
    proj = load_project(project_id, die=True)

    spending = sc.odict()
    spending['years'] = sc.odict()
    spending['vals'] = sc.odict()

    for pset in proj.progsets.values():

        y_min = proj.data.end_year
        y_max = proj.data.end_year
        for prog in pset.programs.values():
            if prog.spend_data.has_time_data:
                y_min = min(y_min,prog.spend_data.t[0])
                y_max = max(y_max,prog.spend_data.t[-1])
        spending['years'][pset.name] = np.arange(np.floor(y_min),np.ceil(y_max)+1)
        spending['vals'][pset.name] = pset.get_alloc(spending['years'][pset.name])
        spending['data_start'] = proj.data.start_year
        spending['data_end'] = proj.data.end_year

    if verbose:
        print('Baseline spending:')
        sc.pp(spending)

    return spending


@RPC()
def get_initial_coverages(project_id, js_scen, verbose=True):
    print('Getting initial program coverage values...')
    py_scen = js_to_py_scen(js_scen)
    proj = load_project(project_id, die=True)

    # Run the scenario.
    result = py_scen.run(project=proj, store_results=False)

    # Get all of the coverages at the program start year.
    raw_covs = result.get_coverage(quantity='fraction', year=py_scen.start_year)

    # Get the coverages in the order that the programs are in the JSON representation of the scenario, and convert to
    # percentages and round to 2 significant figures.
    covs = []
    for js_prog in js_scen['progs']:
        covs.append(round(raw_covs[js_prog['shortname']][0] * 100.0, 2))

    if verbose:
        print('JavaScript initial program coverages:')
        sc.pp(covs)
    return covs


@RPC()
def get_param_groups(project_id, verbose=True):
    print('Getting parameter groups...')
    proj = load_project(project_id, die=True)

    # Start with empty JSON
    param_groups = dict()

    # Get the list of parameter groups from the framework dataframe.
    param_groups['grouplist'] = pd.unique(proj.framework.pars['scenario'].dropna())

    # Pull out a DataFrame only of the parameters that are in groups.
    df = proj.framework.pars.loc[:, ['scenario', 'display name']].dropna().reset_index()

    # Pull out arrays for the code names, group names, and display names.
    param_groups['codenames'] = df['code name'].values
    param_groups['groupnames'] = df['scenario'].values
    param_groups['displaynames'] = df['display name'].values

    # Pull out the population names from the first parset.
    param_groups['popnames'] = proj.parsets[0].pop_names

    if verbose:
        print('Parameter groups:')
        sc.pp(param_groups)

    return param_groups


def param_code_name_to_param_diaplay_name(code_name, proj):
    param_diaplay_name = proj.framework.pars.loc[code_name, 'display name']
    return param_diaplay_name


def param_code_name_to_param_group_name(code_name, proj):
    param_group_name = proj.framework.pars.loc[code_name, 'scenario']
    return param_group_name


@RPC()
def get_param_interpolations(project_id, parset_name, param_code_names, pop_names, interp_year, verbose=True):
    print('Getting parameter interpolation values...')
    proj = load_project(project_id, die=True)

    parset = proj.parsets[parset_name]

    # For each of the elements in the arrays passed in, pull out interpolation values.
    interps = []
    for ind, param_code in enumerate(param_code_names):
        interps.append(parset.pars[param_code].interpolate(interp_year, pop_names[ind])[0])

    if verbose:
        print('JavaScript parameter interpolations:')
        sc.pp(interps)
    return interps


@RPC()
def get_scen_info(project_id, verbose=True):
    print('Getting scenario info...')
    proj = load_project(project_id, die=True)
    scenario_jsons = [py_to_js_scen(scen,proj) for scen in proj.scens.values()]
    if verbose:
        print('JavaScript scenario info:')
        sc.pp(scenario_jsons)
    return scenario_jsons


@RPC()
def set_scen_info(project_id, scenario_jsons, verbose=True):
    print('Setting scenario info...')
    proj = load_project(project_id, die=True)
    proj.scens.clear()
    for j,js_scen in enumerate(scenario_jsons):
        print('Setting scenario %s of %s...' % (j+1, len(scenario_jsons)))
        proj.scens.append(js_to_py_scen(js_scen))
        if verbose:
            print('Python scenario info for scenario %s:' % (j+1))
            sc.pp(proj.scens[-1])
    print('Saving project...')
    save_project(proj)
    return None


@RPC()    
def new_scen(project_id, scentype) -> dict:
    """
    Instantiate a new temporary scenario and return JS representation

    The workflow is that a basic scenario with the default
    budget is created, and then converted to JS. The JS conversion needs to
    handle initialization of extra fields e.g. years that aren't present in the
    data

    :param project_id: Project ID for database
    :return: JS representation of scenario (via ``py_to_js_scen``)

    """

    print('Creating default scenario...')
    proj = load_project(project_id, die=True)
    assert bool(proj.progsets)   # TODO - Handle initialization if the progset hasn't been uploaded yet
    start_year = proj.data.end_year

    alloc = {}
    print('MAKESCEN')
    for prog in proj.progsets[-1].programs.values():  # Start with programs in the last progset.
        print(prog.spend_data)
        if prog.spend_data.has_time_data:
            alloc[prog.name] = sc.dcp(prog.spend_data)
        else:
            alloc[prog.name] = at.TimeSeries(start_year, prog.spend_data.assumption)

    # Construct the scenario
    if scentype == 'budget':
        scen = at.BudgetScenario(name='New budget scenario', active=True, parsetname=proj.parsets[-1].name,
            progsetname=proj.progsets[-1].name, alloc=alloc, start_year=start_year)
    elif scentype == 'coverage':
        scen = at.CoverageScenario(name='New coverage scenario', active=True, parsetname=proj.parsets[-1].name,
            progsetname=proj.progsets[-1].name, coverage=None, start_year=start_year)
    elif scentype == 'parameter':
        scen = at.ParameterScenario(name='New parameter scenario', active=True, parsetname=proj.parsets[-1].name,
            scenario_values=dict())

    # Make the JSON for the scenario
    js_scen = py_to_js_scen(scen, proj)

    print('Created default JavaScript scenario:')
    return js_scen


@RPC()
def scen_change_progset(js_scen: dict,new_progset_name: str, project_id) -> dict:
    py_scen = js_to_py_scen(js_scen)
    proj = load_project(project_id, die=True)

    old_progset = proj.progsets[py_scen.progsetname]
    new_progset = proj.progsets[new_progset_name]

    # Handle the budget scenario case...
    if isinstance(py_scen, at.BudgetScenario):
        old_alloc = py_scen.alloc
        alloc = sc.odict()

        # Fuse the allocs
        # - If the new progset has the same programs, then leave them intact
        # - If the new progset has a new program, draw values from the progbook
        for prog in new_progset.programs.values():
            if prog.name in old_alloc:
                alloc[prog.name] = sc.dcp(old_alloc[prog.name])
            else:
                if prog.spend_data.has_time_data:
                    alloc[prog.name] = sc.dcp(prog.spend_data)
                else:
                    alloc[prog.name] = at.TimeSeries(py_scen.start_year, prog.spend_data.assumption)

        py_scen.alloc = alloc

    # Handle the coverage scenario case...
    # TODO: We ultimately need something that comes out of actually running the model.
    elif isinstance(py_scen, at.CoverageScenario):
        # Create a new coverage scenario with the settings from the old, but with the new progset.
        py_scen = at.CoverageScenario(name=py_scen.name, active=py_scen.active, parsetname=py_scen.parsetname,
            progsetname=new_progset_name, coverage=None, start_year=py_scen.start_year)

        # old_coverage = py_scen.coverage
        # coverage = sc.odict()
        #
        # # Fuse the coverages
        # # - If the new progset has the same programs, then leave them intact
        # # - If the new progset has a new program, draw values from the progbook
        # for prog in new_progset.programs.values():
        #     if prog.name in old_coverage:
        #         coverage[prog.name] = sc.dcp(old_coverage[prog.name])
        #     else:
        #         if prog.coverage.has_time_data:
        #             coverage[prog.name] = sc.dcp(prog.coverage)
        #         else:
        #             coverage[prog.name] = at.TimeSeries(py_scen.start_year, prog.coverage.assumption)
        #
        # py_scen.coverage = coverage

    py_scen.progsetname = new_progset_name

    # Make the JSON for the scenario
    js_scen = py_to_js_scen(py_scen, proj)
    return js_scen


@RPC()
def scen_reset_values(js_scen, project_id):
    py_scen = js_to_py_scen(js_scen)
    proj = load_project(project_id, die=True)

    # Handle the budget scenario case...
    if isinstance(py_scen, at.BudgetScenario):
        alloc = sc.odict()
        for prog in proj.progsets[py_scen.progsetname].programs.values():
            print(prog.spend_data)
            if prog.spend_data.has_time_data:
                alloc[prog.name] = sc.dcp(prog.spend_data)
            else:
                alloc[prog.name] = at.TimeSeries(py_scen.start_year, prog.spend_data.assumption)

        py_scen.alloc = alloc

    # Handle the coverage scenario case...
    elif isinstance(py_scen, at.CoverageScenario):
        # Create a new coverage scenario with the settings from the old.
        py_scen = at.CoverageScenario(name=py_scen.name, active=py_scen.active, parsetname=py_scen.parsetname,
            progsetname=py_scen.progsetname, coverage=None, start_year=py_scen.start_year)

    # Handle the parameter scenario case...
    elif isinstance(py_scen, at.ParameterScenario):
        # Create a new parameter scenario with the settings from the old.
        py_scen = at.ParameterScenario(name=py_scen.name, active=py_scen.active, parsetname=py_scen.parsetname,
            scenario_values=dict())

    # Make the JSON for the scenario
    js_scen = py_to_js_scen(py_scen, proj)
    return js_scen


@RPC()    
def run_scenarios(project_id, cache_id, plot_options, saveresults=True, tool=None, plotyear=None, pops=None,cascade=None, dosave=True):
    print('Running scenarios...')
    proj = load_project(project_id, die=True)
    results = proj.run_scenarios(store_results=False)
    if len(results) < 1:  # Fail if we have no results (user didn't pick a scenario)
        return {'error': 'No scenario selected'}
    cache_result(proj, results, cache_id)
    output = make_plots(proj, results, tool=tool, year=plotyear, pops=pops, cascade=cascade, plot_options=plot_options, dosave=dosave, calibration=False, plot_budget=True)
    print('Saving project...')
    save_project(proj)
    return output




##################################################################################
### Optimization RPCs
##################################################################################

def py_to_js_optim(py_optim, project=None):
    js_optim = sc.sanitizejson(py_optim.json)
    if 'objective_labels' not in js_optim:
        js_optim['objective_labels'] = sc.odict()
        for key in js_optim['objective_weights'].keys():
            js_optim['objective_labels'][key] = key # Copy keys if labels not available
    for prog_name in js_optim['prog_spending']:
        prog_label = project.progset().programs[prog_name].label
        this_prog = js_optim['prog_spending'][prog_name]
        this_prog.append(prog_label)
        js_optim['prog_spending'][prog_name] = {'min':this_prog[0], 'max':this_prog[1], 'label':prog_label}
    return js_optim


def js_to_py_optim(js_optim):
    json = js_optim
    for key in ['start_year', 'end_year', 'budget_factor', 'maxtime']:
        json[key] = to_float(json[key]) # Convert to a number
    for subkey in json['objective_weights'].keys():
        json['objective_weights'][subkey] = to_float(json['objective_weights'][subkey], blank_ok=True)
    for subkey in json['prog_spending'].keys():
        this = json['prog_spending'][subkey]
        json['prog_spending'][subkey] = (to_float(this['min']), to_float(this['max']))
    return json
    

@RPC()    
def get_optim_info(project_id, verbose=False):
    print('Getting optimization info...')
    proj = load_project(project_id, die=True)
    optim_jsons = []
    for py_optim in proj.optims.values():
        js_optim = py_to_js_optim(py_optim, project=proj)
        optim_jsons.append(js_optim)
    if verbose: sc.pp(optim_jsons)
    return optim_jsons


@RPC()
def get_default_optim(project_id, tool=None, optim_type=None, verbose=True):
    print('Getting default optimization...')
    proj = load_project(project_id, die=True)
    py_optim = proj.demo_optimization(tool=tool, optim_type=optim_type)
    js_optim = py_to_js_optim(py_optim, project=proj)
    if verbose: sc.pp(js_optim)
    return js_optim


@RPC()    
def set_optim_info(project_id, optim_jsons, verbose=False):
    print('Setting optimization info...')
    proj = load_project(project_id, die=True)
    proj.optims.clear()
    for j,js_optim in enumerate(optim_jsons):
        if verbose: print('Setting optimization %s of %s...' % (j+1, len(optim_jsons)))
        json = js_to_py_optim(js_optim)
        if verbose: sc.pp(json)
        proj.make_optimization(json=json)
    print('Saving project...')
    save_project(proj)   
    return None


# This is the function we should use on occasions when we can't use Celery.
@RPC()
def run_optimization(project_id, cache_id, optim_name=None, plot_options=None, maxtime=None, tool=None, plotyear=None, pops=None, cascade=None, dosave=True):
    print('Running Cascade optimization...')
    sc.printvars(locals(), ['project_id', 'optim_name', 'plot_options', 'maxtime', 'tool', 'plotyear', 'pops', 'cascade', 'dosave'], color='blue')
    proj = load_project(project_id, die=True)
        
    # Actually run the optimization and get its results (list of baseline and optimized Result objects).
    results = proj.run_optimization(optim_name, maxtime=float(maxtime), store_results=False)
    cache_result(proj, results, cache_id)
    output = make_plots(proj, results, tool=tool, year=plotyear, pops=pops, cascade=cascade, plot_options=plot_options, dosave=dosave, plot_budget=True) # Plot the results.   
    save_project(proj)
    return output



##################################################################################
### Results RPCs
##################################################################################

def cache_result(project=None, result=None, key=None, die=False, verbose=False):
    if verbose: print('Cache result inputs:\nProject:\n%s\nResult:\n%s\nKey:\n%s' % (project, result, key))
    if not sc.isstring(result):
        result_key = save_result(result, key=key)
        if result_key != key:
            errormsg = 'Warning: supplied database key had to be changed (%s -> %s)' % (key, result_key)
            if die: raise Exception(errormsg)
            else:   print(errormsg)
        project.results[key] = result_key # In most cases, these will match, e.g. project.results['result::4e6efc39-94ef'] = 'result::4e6efc39-94ef'
        save_project(project)
    return result_key


def cache_results(proj, verbose=True):
    ''' Store the results of the project in Redis '''
    for key,result in proj.results.items():
        if not sc.isstring(result):
            result_key = save_result(result)
            proj.results[key] = result_key
            if verbose: print('Cached result "%s" to "%s"' % (key, result_key))
    save_project(proj)
    return proj


def retrieve_results(proj, verbose=True):
    ''' Retrieve the results from the database back into the project '''
    for key,result_key in proj.results.items():
        if sc.isstring(result_key):
            result = load_result(result_key)
            proj.results[key] = result
            if verbose: print('Retrieved result "%s" from "%s"' % (key, result_key))
    return proj


def clear_cached_results(proj, project_id, spare_calibration=False, verbose=True):
    ''' Clear all cached results from the project '''
    for key,result_key in proj.results.items():
        if sc.isstring(result_key):
            if (not spare_calibration) or "calibration" not in result_key:
                del_result(result_key, project_id)
                if verbose: print('Deleted result "%s" from "%s"' % (key, result_key))
    save_project(proj)
    return proj


@RPC() 
def plot_results(project_id, cache_id, plot_options, tool=None, plotyear=None, pops=None, cascade=None, dosave=True, plotbudget=False, calibration=False):
    print('Plotting cached results...')
    proj = load_project(project_id, die=True)
    results = load_result(cache_id) # Load the results from the cache and check if we got a result.
    if results is None:
        return { 'error': 'Failed to load plot results from cache' }
    output = make_plots(proj, results, tool=tool, year=plotyear, pops=pops, cascade=cascade, plot_options=plot_options, dosave=dosave, plot_budget=plotbudget, calibration=calibration)
    return output
    

@RPC(call_type='download')
def export_results(cache_id, username):
    print('Exporting results...')
    results = load_result(cache_id) # Load the result from the cache and check if we got a result.
    if results is None:
        return { 'error': 'Failed to load plot results from cache' }
    file_name = 'results.xlsx'
    full_file_name = get_path(file_name, username=username)
    at.export_results(results, full_file_name)
    print(">> export_results %s" % (full_file_name))
    return full_file_name # Return the filename
