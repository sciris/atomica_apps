import utils from "../utils"

var ProjectMixin = {
  data() {
    return {
      filterPlaceholder: 'Type here to filter projects', // Placeholder text for table filter box
      filterText: '',  // Text in the table filter box
      allSelected: false, // Are all of the projects selected?
      projectToRename: null, // What project is being renamed?
      sortColumn: 'name',  // Column of table used for sorting the projects: name, country, creationTime, updatedTime, dataUploadTime
      sortReverse: false, // Sort in reverse order?
      projectSummaries: [], // List of summary objects for projects the user has
      proj_name:  'New project', // For creating a new project: number of populations
      num_pops:   5, // For creating a new project: number of populations
      num_progs:  5, // For creating a new project: number of populations
      activeuid:  [], // WARNING, kludgy to get create progbook working
      frameworkSummaries: [],
      currentFramework: '',
      demoOptions: [],
      demoOption: '',
      defaultPrograms: [],
      progStartYear: [],
      progEndYear: [],
    }
  },

  computed: {
    projectID()    { return utils.projectID(this) },
    userName()     { return this.$store.state.currentUser.username },
    simYears()     { return utils.simYears(this) },
    sortedFilteredProjectSummaries() {
      return this.applyNameFilter(this.applySorting(this.projectSummaries))
    },
  },

  methods: {

    updateSorting(column) { return utils.updateSorting(this, column) },

    projectLoaded(uid) {
      console.log('projectLoaded called')
      if (this.$store.state.activeProject.project !== undefined) {
        if (this.$store.state.activeProject.project.id === uid) {
          console.log('Project ' + uid + ' is loaded')
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    },

    getDemoOptions() {
      console.log('getDemoOptions() called')
      this.$sciris.rpc('get_demo_project_options') // Get the current user's framework summaries from the server.
        .then(response => {
          this.demoOptions = response.data // Set the frameworks to what we received.
          this.demoOption = this.demoOptions[0]
          console.log('Loaded demo options:')
          console.log(this.demoOptions)
          console.log(this.demoOption)
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not load demo project options', error)
        })
    },

    getDefaultPrograms() {
      console.log('getDefaultPrograms() called')
      this.$sciris.rpc('get_default_programs') // Get the current user's framework summaries from the server.
        .then(response => {
          this.defaultPrograms = response.data // Set the frameworks to what we received.
          console.log('Loaded default programs:')
          console.log(this.defaultPrograms)
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not load default programs', error)
        })
    },

    updateFrameworkSummaries() {
      console.log('updateFrameworkSummaries() called')

      // Get the current user's framework summaries from the server.
      this.$sciris.rpc('jsonify_frameworks', [this.userName])
        .then(response => {
          // Set the frameworks to what we received.
          this.frameworkSummaries = response.data.frameworks

          if (this.frameworkSummaries.length) {
            console.log('Framework summaries found')
            console.log(this.frameworkSummaries)
            this.currentFramework = this.frameworkSummaries[0].framework.name
            console.log('Current framework: '+this.currentFramework)
          } else {
            console.log('No framework summaries found')
          }
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not load frameworks', error)
        })
    },

    updateProjectSummaries(setActiveID) {
      console.log('updateProjectSummaries() called')
      this.$sciris.start(this)
      this.$sciris.rpc('jsonify_projects', [this.userName]) // Get the current user's project summaries from the server.
        .then(response => {
          let lastCreationTime = null
          let lastCreatedID = null
          this.projectSummaries = response.data.projects // Set the projects to what we received.
          if (this.projectSummaries.length > 0) { // Initialize the last creation time stuff if we have a non-empty list.
            lastCreationTime = new Date(this.projectSummaries[0].project.creationTime)
            lastCreatedID = this.projectSummaries[0].project.id
          }
          this.projectToRename = null  // Unset the link to a project being renamed.
          this.projectSummaries.forEach(theProj => { // Preprocess all projects.
            theProj.selected = false // Set to not selected.
            theProj.renaming = '' // Set to not being renamed.
            if (theProj.project.creationTime >= lastCreationTime) { // Update the last creation time and ID if what se see is later.
              lastCreationTime = theProj.project.creationTime
              lastCreatedID = theProj.project.id
            }
          })
          if (this.projectSummaries.length > 0) { // If we have a project on the list...
            if (setActiveID === null) { // If no ID is passed in, set the active project to the last-created project.
              this.openProject(lastCreatedID)
            } else { // Otherwise, set the active project to the one passed in.
              this.openProject(setActiveID)
            }
          }
          this.$sciris.succeed(this, '')  // No green popup.
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not load projects', error)
        })
    },

    addDemoProject() {
      console.log('addDemoProject() called')
      this.$modal.hide('demo-project')
      this.$sciris.start(this)

      if (this.toolName() === 'cascade') {
        var demoOption = this.demoOption
      }
      else {
        var demoOption = 'tb'
      }

      // Have the server create a new project.
      this.$sciris.rpc('add_demo_project', [
        this.userName, 
        demoOption, 
        this.toolName(),
      ])
      .then(response => {
        // Update the project summaries so the new project shows up on the list.
        this.updateProjectSummaries(response.data.projectID) 
        // Already have notification from project
        this.$sciris.succeed(this, '') 
      })
      .catch(error => {
        this.$sciris.fail(this, 'Could not add demo project', error)
      })
    },

    addDemoProjectModal() {
      // Open a model dialog for creating a new project
      console.log('addDemoProjectModal() called');
      this.$modal.show('demo-project');
    },

    createNewProjectModal() {
      console.log('createNewProjectModal() called')
      this.$modal.show('create-project')
    },

    // Open a model dialog for creating a progbook
    createProgbookModal(uid) {
      this.activeuid = uid
      // Find the project that matches the UID passed in.
      let matchProject = this.projectSummaries.find(theProj => theProj.project.id === uid)
      console.log('createProgbookModal() called for ' + matchProject.project.name)
      this.$modal.show('create-progbook');
    },

    createNewProject() {
      console.log('createNewProject() called')
      this.$modal.hide('create-project')
      this.$sciris.start(this)
      var frameworkID = this.getFrameworkID()
      this.$sciris.download('create_new_project',  // Have the server create a new project.
        [
          this.userName, 
          frameworkID, 
          this.proj_name, 
          this.num_pops, 
          this.num_progs, 
          this.data_start, 
          this.data_end
        ], {
          tool: this.toolName()
        })
        .then(response => {
          // Update the project summaries so the new project shows up on the list. 
          // Note: There's no easy way to get the new project UID to tell the 
          // project update to choose the new project because the RPC cannot pass it back.
          this.updateProjectSummaries(null) 
          this.$sciris.succeed(this, 'New project "' + this.proj_name + '" created')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not add new project:' + error.message)
        })
    },

    uploadProjectFromFile() {
      console.log('uploadProjectFromFile() called')
      this.$sciris.upload('upload_project', [this.userName], {}, '.prj') 
        // Have the server upload the project.
        .then(response => { 
          // This line needs to be here to avoid the spinner being up during the user modal.
          this.$sciris.start(this) 

          // Update the project summaries so the new project shows up on the list.
          this.updateProjectSummaries(response.data.projectID) 
          this.$sciris.succeed(this, 'New project uploaded')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not upload file', error)
        })
    },

    projectIsActive(uid) {
      // If the project is undefined, it is not active.
      if (this.$store.state.activeProject.project === undefined) { 
        return false
      } else { // Otherwise, the project is active if the UIDs match.
        return (this.$store.state.activeProject.project.id === uid)
      }
    },

    selectAll() {
      console.log('selectAll() called')

      // For each of the projects, set the selection of the project to the
      // _opposite_ of the state of the all-select checkbox's state.
      // NOTE: This function depends on it getting called before the
      // v-model state is updated.  If there are some cases of Vue
      // implementation where these happen in the opposite order, then
      // this will not give the desired result.
      this.projectSummaries.forEach(theProject => theProject.selected = !this.allSelected)
    },

    uncheckSelectAll() {
      this.allSelected = false
    },

    applyNameFilter(projects) {
      return projects.filter(
        theProject => theProject.project.name.toLowerCase().indexOf(
          this.filterText.toLowerCase()
        ) !== -1)
    },

    applySorting(projects) {
      return projects.slice(0).sort((proj1, proj2) =>
        {
          let sortDir = this.sortReverse ? -1: 1
          if (this.sortColumn === 'name'){ 
            return (proj1.project.name.toLowerCase() > proj2.project.name.toLowerCase() ? sortDir: -sortDir)
          } else if (this.sortColumn === 'creationTime') { 
            return (proj1.project.creationTime > proj2.project.creationTime ? sortDir: -sortDir)
          } else if (this.sortColumn === 'updatedTime')  { 
            return (proj1.project.updatedTime > proj2.project.updatedTime ? sortDir: -sortDir)
          }
        }
      )
    },

    openProject(uid) {
      // Find the project that matches the UID passed in.
      let matchProject = this.projectSummaries.find(theProj => theProj.project.id === uid)
      console.log('openProject() called for ' + matchProject.project.name)
      this.$store.commit('newActiveProject', matchProject) // Set the active project to the matched project.
      this.$sciris.succeed(this, 'Project "'+matchProject.project.name+'" loaded') // Success popup.
    },

    copyProject(uid) {
      let matchProject = this.projectSummaries.find(theProj => theProj.project.id === uid) // Find the project that matches the UID passed in.
      console.log('copyProject() called for ' + matchProject.project.name)
      this.$sciris.start(this)
      this.$sciris.rpc('copy_project', [uid]) // Have the server copy the project, giving it a new name.
        .then(response => {
          // Update the project summaries so the copied program shows up on the list.
          this.updateProjectSummaries(response.data.projectID) 

          // Indicate success.
          this.$sciris.succeed(
            this, 'Project "'+matchProject.project.name+'" copied'
          )
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not copy project', error)
        })
    },

    finishRename(event) {
      // Grab the element of the open textbox for the project name to be renamed.
      let renameboxElem = document.querySelector('.renamebox')

      // If the click is outside the textbox, rename the remembered project.
      if (!renameboxElem.contains(event.target)) {
        this.renameProject(this.projectToRename)
      }
    },

    renameProject(projectSummary) {
      console.log('renameProject() called for ' + projectSummary.project.name)
      if (projectSummary.renaming === '') { // If the project is not in a mode to be renamed, make it so.
        projectSummary.renaming = projectSummary.project.name
        // Add a click listener to run the rename when outside the input box is click, and remember
        // which project needs to be renamed.
//        window.addEventListener('click', this.finishRename)
        this.projectToRename = projectSummary
      } else { // Otherwise (it is to be renamed)...
        // Remove the listener for reading the clicks outside the input box, and null out the project
        // to be renamed.
//        window.removeEventListener('click', this.finishRename)
        this.projectToRename = null
        // Make a deep copy of the projectSummary object by 
        // JSON-stringifying the old object, and then parsing 
        // the result back into a new object.

        let newProjectSummary = _.cloneDeep(projectSummary)
        // Rename the project name in the client list from what's in the textbox.
        newProjectSummary.project.name = projectSummary.renaming
        this.$sciris.start(this)

        // Have the server change the name of the project by passing in the new copy of the summary.
        this.$sciris.rpc('rename_project', [newProjectSummary]) 
          .then(response => {
            // Update the project summaries so the rename shows up on the list.
            this.updateProjectSummaries(newProjectSummary.project.id) 

            // Turn off the renaming mode.
            projectSummary.renaming = ''
            this.$sciris.succeed(this, '')
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not rename project', error)
          })
      }

      // This silly hack is done to make sure that the Vue component gets updated by this function call.
      // Something about resetting the project name informs the Vue component it needs to
      // update, whereas the renaming attribute fails to update it.
      // We should find a better way to do this.
      let theName = projectSummary.project.name
      projectSummary.project.name = 'newname'
      projectSummary.project.name = theName
    },

    downloadProjectFile(uid) {
      // Find the project that matches the UID passed in.
      let matchProject = this.projectSummaries.find(theProj => theProj.project.id === uid) 
      console.log('downloadProjectFile() called for ' + matchProject.project.name)
      this.$sciris.start(this)

      // Make the server call to download the project to a .prj file.
      this.$sciris.download('download_project', [uid]) 
        .then(response => { // Indicate success.
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not download project', error)
        })
    },

    downloadFramework(uid) {
      // Find the project that matches the UID passed in.
      let matchProject = this.projectSummaries.find(theProj => theProj.project.id === uid)
      console.log('downloadFramework() called for ' + matchProject.project.name)
      this.$sciris.start(this, 'Downloading framework...')
      this.$sciris.download('download_framework_from_project', [uid])
        .then(response => {
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not download framework', error)
        })
    },

    downloadDatabook(uid) {
      console.log('downloadDatabook() called')
      this.$sciris.start(this, 'Downloading data book...')
      this.$sciris.download('download_databook', [uid])
        .then(response => {
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not download databook', error)
        })
    },

    downloadProgbook(uid) {
      // Find the project that matches the UID passed in.
      let matchProject = this.projectSummaries.find(theProj => theProj.project.id === uid)
      console.log('downloadProgbook() called for ' + matchProject.project.name)
      this.$sciris.start(this, 'Downloading program book...')
      this.$sciris.download('download_progbook', [uid])
        .then(response => {
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not download program book', error)
        })
    },

    createProgbook() {
      // Find the project that matches the UID passed in.
      let uid = this.activeuid
      console.log('createProgbook() called')
      this.$modal.hide('create-progbook')
      this.$sciris.start(this, 'Creating program book...')
      this.$sciris.download('create_progbook', [uid, this.num_progs, this.progStartYear, this.progEndYear])
        .then(response => {
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not create program book', error)
        })
    },

    createDefaultProgbook() {
      // Find the project that matches the UID passed in.
      let uid = this.activeuid
      console.log('createDefaultProgbook() called')
      this.$modal.hide('create-progbook')
      this.$sciris.start(this, 'Creating default program book...')
      this.$sciris.download(
        'create_default_progbook', [
          uid, 
          this.progStartYear, 
          this.progEndYear, 
          this.defaultPrograms
        ]) // TODO: set years
        .then(response => {
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not create program book', error)
        })
    },

    uploadDatabook(uid) {
      console.log('uploadDatabook() called')
      this.$sciris.upload('upload_databook', [uid], {}, '.xlsx')
        .then(response => {
          this.$sciris.start(this, 'Uploading databook...')
          // Update the project summaries so the copied program shows up on the list.
          this.updateProjectSummaries(uid)
          this.$sciris.succeed(this, 'Data uploaded')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not upload databook', error)
        })
    },

    uploadProgbook(uid) {
      // Find the project that matches the UID passed in.
      console.log('uploadProgbook() called')
      this.$sciris.upload('upload_progbook', [uid], {}, '.xlsx')
        .then(response => {
          this.$sciris.start(this)
          // Update the project summaries so the copied program shows up on the list.
          this.updateProjectSummaries(uid) 
          this.$sciris.succeed(this, 'Programs uploaded')   // Indicate success.
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not upload program book', error)
        })
    },

    // Confirmation alert
    deleteModal() {
      // Pull out the names of the projects that are selected.
      let selectProjectsUIDs = this.projectSummaries.filter(
        theProj => theProj.selected
      ).map(theProj => theProj.project.id)

      if (selectProjectsUIDs.length > 0) { // Only if something is selected...
        var obj = { // Alert object data
          message: 'Are you sure you want to delete the selected projects?',
          useConfirmBtn: true,
          customConfirmBtnClass: 'btn __red',
          customCloseBtnClass: 'btn',
          onConfirm: this.deleteSelectedProjects
        }
        this.$Simplert.open(obj)
      }
    },

    deleteSelectedProjects() {
      // Pull out the names of the projects that are selected.
      let selectProjectsUIDs = this.projectSummaries.filter(
        theProj => theProj.selected
      ).map(
        theProj => theProj.project.id
      )
      console.log('deleteSelectedProjects() called for ', selectProjectsUIDs)
      // Have the server delete the selected projects.
      if (selectProjectsUIDs.length > 0) { 
        this.$sciris.start(this)
        this.$sciris.rpc('delete_projects', [selectProjectsUIDs, this.userName])
          .then(response => {
            // Get the active project ID.
            let activeProjectId = this.$store.state.activeProject.project.id 
            if (activeProjectId === undefined) {
              activeProjectId = null
            }
            // If the active project ID is one of the ones deleted...
            if (selectProjectsUIDs.find(theId => theId === activeProjectId)) { 
              // Set the active project to an empty project.
              this.$store.commit('newActiveProject', {}) 
              // Null out the project.
              activeProjectId = null 
            }
            // Update the project summaries so the deletions show up on the list.
            // Make sure it tries to set the project that was active (if any).
            this.updateProjectSummaries(activeProjectId) 
            this.$sciris.succeed(this, '')
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not delete project/s', error)
          })
      }
    },

    downloadSelectedProjects() {
      // Pull out the names of the projects that are selected.
      let selectProjectsUIDs = this.projectSummaries.filter(
        theProj => theProj.selected
      ).map(theProj => theProj.project.id)
      console.log('downloadSelectedProjects() called for ', selectProjectsUIDs)
      // Have the server download the selected projects.
      if (selectProjectsUIDs.length > 0) {
        this.$sciris.start(this)
        this.$sciris.download('download_projects', [selectProjectsUIDs, this.userName])
          .then(response => {
            this.$sciris.succeed(this, '')
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not download project/s', error)
          })
      }
    }
  }
}

export default ProjectMixin;
