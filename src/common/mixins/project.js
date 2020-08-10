import utils from "../utils"

var ProjectMixin = {
  data() {
    return {
      filterPlaceholder: 'Type here to filter projects', // Placeholder text for table filter box
      filterText: '',  // Text in the table filter box
      allSelected: false, // Are all of the projects selected?
      sortColumn: 'name',  // Column of table used for sorting the projects: name, country, creationTime, updatedTime, dataUploadTime
      sortReverse: false, // Sort in reverse order?
      projectSummaries: [], // List of summary objects for projects the user has
      newProjectData: {
        frameworkID: null,
        name: 'New project',
        num_pops: 1,
        num_transfers: 0,
        data_start: 2015,
        data_end: 2018 ,
      },
      activeuid:  [], // WARNING, kludgy to get create progbook working

      defaultPrograms: [],
      simplertModalUid: '',
    }
  },

  computed: {
    projectID()    { return utils.projectID(this) },
    projectOpen()  { return this.$store.getters.projectOpen },
    userName()     { return this.$store.state.currentUser.username },
    simYears()     { return utils.simYears(this) },
    progStartYear(){ return this.simYears[0] },
    progEndYear()  { return this.simYears[this.simYears.length -1] },
    sortedFilteredProjectSummaries() {
      return this.applyNameFilter(this.applySorting(this.projectSummaries))
    },
  },

  methods: {

    updateSorting(column) { return utils.updateSorting(this, column) },

    async getDefaultPrograms() {
      console.log('getDefaultPrograms() called')
      if (this.toolName() === 'tb') {
        try {
          let response = await this.$sciris.rpc('get_tb_default_program_list') // Get the current user's framework summaries from the server.
          this.defaultPrograms = response.data // Set the frameworks to what we received.
        } catch (error) {
          this.$sciris.fail(this, 'Could not load default programs', error)
        }
      }
    },


    async updateProjectSummaries(setActiveID) {
      // Update project summaries and open a project if possible
      // - If there are no migrated projects, don't open any project
      // - If setActiveID is provided and the project exists and is migrated, open it
      // - Otherwise, open the most recent migrated project

      // Retrieve the updated project summaries
      console.log('updateProjectSummaries() called');
      this.$sciris.start(this);
      try {
        let response = await this.$sciris.rpc('jsonify_projects', [this.userName]); // Get the current user's project summaries from the server.
        for (let i = 0; i < response.data.length; i++) {
          response.data[i].new_name = ''; // Store the string in the edit text box for renaming (create the property here so that the text boxes can bind to it)
          response.data[i].selected = false; // Flag whether the checkbox is checked or not
          response.data[i].renaming = false; // Flag whether to show the edit text box or not
          response.data[i].loaded = false; // Flag whether this project is open (and thus needs to have its row highlighted)

          // Convert times to JS objects
          response.data[i].creationTime = new Date(response.data[i].creationTime);
          response.data[i].updatedTime = new Date(response.data[i].updatedTime);

          // Use `toLocaleString` to convert the project's UTC timestamp to the browser's local time and formatting
          let options = { year: 'numeric', month: 'short', day: 'numeric' , hour:'numeric',minute:'numeric',second:'numeric', timeZoneName:'short'};
          response.data[i].creationTimeString = response.data[i].creationTime.toLocaleString(undefined, options);
          response.data[i].updatedTimeString = response.data[i].updatedTime.toLocaleString(undefined, options);
        }
        this.projectSummaries = response.data; // Set the projects to what we received.
        this.$sciris.succeed(this, '');  // No green popup.
      } catch (error) {
        this.$sciris.fail(this, 'Could not load projects', error);
        return;
      }

      // Return early if there are no valid projects
      let valid_summaries = this.projectSummaries.filter(x => !x.updateRequired); // Projects that can be opened
      if (valid_summaries.length === 0) {
        this.$store.commit('newActiveProject', null);
        return;
      }

      // Try to open the requested project (noting that it may not exist if the project has been deleted in the meantime)
      if (setActiveID !== null) {
        let matchProject = valid_summaries.find(theProj => theProj.id === setActiveID);
        if (matchProject !== undefined) {
          this.openProject(matchProject);
          return;
        }
      }

      // Otherwise, open the most recent project (by modification time)
      let latest = Math.max(...Array.from(valid_summaries, x => x.updatedTime.getTime()));
      let matchProject = valid_summaries.find(x => x.updatedTime.getTime() === latest);
      this.openProject(matchProject);
    },


    createNewProjectModal() {
      console.log('createNewProjectModal() called')
      this.$modal.show('create-project')
    },

    // Open a model dialog for creating a progbook
    createProgbookModal(uid) {
      this.activeuid = uid
      // Find the project that matches the UID passed in.
      let matchProject = this.projectSummaries.find(theProj => theProj.id === uid)
      console.log('createProgbookModal() called for ' + matchProject.name)
      this.$modal.show('create-progbook');
    },

    createNewProject() {
      console.log('createNewProject() called')
      this.$modal.hide('create-project')
      this.$sciris.start(this)
      this.$sciris.download('create_new_project',  // Have the server create a new project.
        [
          this.userName,
          this.newProjectData,
        ], {
          tool: this.toolName()
        })
        .then(response => {
          // Update the project summaries so the new project shows up on the list.
          // Note: There's no easy way to get the new project UID to tell the
          // project update to choose the new project because the RPC cannot pass it back.
          this.updateProjectSummaries(null)
          this.$sciris.succeed(this, 'New project "' + this.newProjectData.name + '" created')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not add new project:' + error.message)
        })
    },

    async uploadProjectFromFile() {
      console.log('uploadProjectFromFile() called');
      try {
        let response = await this.$sciris.upload('upload_project', [this.userName], {}, '.prj');
        this.$sciris.start(this);
        this.updateProjectSummaries(response.data.projectID);
        this.$sciris.succeed(this, 'New project uploaded');
      } catch (error) {
        this.$sciris.fail(this, 'Could not upload project', error);
      }
    },

    projectIsActive(uid) {
      // If the project is undefined, it is not active.
      if (!this.$store.getters.projectOpen) {
        return false
      } else { // Otherwise, the project is active if the UIDs match.
        return (this.$store.state.activeProject.id === uid)
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
        theProject => theProject.name.toLowerCase().indexOf(
          this.filterText.toLowerCase()
        ) !== -1)
    },

    applySorting(projects) {
      return projects.slice(0).sort((proj1, proj2) =>
        {
          let sortDir = this.sortReverse ? -1: 1
          if (this.sortColumn === 'name'){
            return (proj1.name.toLowerCase() > proj2.name.toLowerCase() ? sortDir: -sortDir)
          } else if (this.sortColumn === 'creationTime') {
            return (proj1.creationTime > proj2.creationTime ? sortDir: -sortDir)
          } else if (this.sortColumn === 'updatedTime')  {
            return (proj1.updatedTime > proj2.updatedTime ? sortDir: -sortDir)
          }
        }
      )
    },

    openProject(projectSummary) {
      // Find the project that matches the UID passed in.
      if (projectSummary.updateRequired) {
        this.$sciris.fail(this, 'Project "' + projectSummary.name + '" must be updated before it can be opened', error)
      } else {
        console.log('openProject() called for ' + projectSummary.name);
        this.$store.commit('newActiveProject', projectSummary); // Set the active project to the matched project.
        this.projectSummaries.forEach(proj => proj.loaded = false); // Flag all projects as not loaded
        projectSummary.loaded = true; // Set the loaded project
        this.$sciris.succeed(this, '')  // No green popup.
      }
    },

    async updateProject(projectSummary) {
      // Update project by saving a migrated copy of the project
      this.$sciris.start(this);
      try {
        let response = await this.$sciris.rpc('update_project', [projectSummary.id]);
        this.updateProjectSummaries(response.data.projectID);
        this.$sciris.succeed(this, 'Project "' + projectSummary.name + '" updated');
      } catch (error) {
        this.$sciris.fail(this, 'Could not update project', error)
      }
    },

    async copyProject(projectSummary) {
      this.$sciris.start(this);
      try{
        let response = await this.$sciris.rpc('copy_project', [projectSummary.id]);
        this.updateProjectSummaries(response.data.projectID);
        this.$sciris.succeed(this, 'Project "'+projectSummary.name+'" copied');
      } catch (error) {
        this.$sciris.fail(this, 'Could not update project', error)
      }
    },

    startRename(projectSummary){
      // Display the projectSummary edit name text box
      console.log('renaming');
      console.log(projectSummary);
      projectSummary.renaming = true;
      projectSummary.new_name = projectSummary.name;
    },

    cancelRename(projectSummary){
      // Hide the edit name box without changing anything
      projectSummary.renaming = false;
    },

    async renameProject(projectSummary) {

      // UNCOMMENT TO PREVENT DUPLICATE NAMES
      // Actually perform the renaming. But first check for collisions on the client's end to speed things up
      // and allow the user to continue editing without losing their partial edit
      // for (let i = 0; i < this.projectSummaries.length; i++){
      //   if (projectSummary.new_name === this.projectSummaries[i].name){
      //     this.$sciris.fail(this, 'Duplicate name already exists');
      //     return
      //   }
      // }

      this.$sciris.start(this);
      projectSummary.renaming = false; // End renaming even if there is a server-side error
      try{
        await this.$sciris.rpc('rename_project', [projectSummary.id, projectSummary.new_name]); // This function will error for any DB failure, so if it succeeds then we must have successfully renamed
        projectSummary.name = projectSummary.new_name; // Update the table, no need to refresh the entire page
        this.$sciris.succeed(this, '')  // No green popup.
      } catch (error) {
        this.$sciris.fail(this, 'Could not rename project', error)
      }
    },

    downloadProjectFile(projectSummary) {
      // Find the project that matches the UID passed in.
      console.log('downloadProjectFile() called for ' + projectSummary.name);
      this.$sciris.start(this);

      // Make the server call to download the project to a .prj file.
      this.$sciris.download('download_project', [projectSummary.id])
        .then(response => { // Indicate success.
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not download project', error)
        })
    },

    downloadFramework(uid) {
      // Find the project that matches the UID passed in.
      let matchProject = this.projectSummaries.find(theProj => theProj.id === uid);
      console.log('downloadFramework() called for ' + matchProject.name);
      this.$sciris.start(this, 'Downloading framework...');
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
      let matchProject = this.projectSummaries.find(theProj => theProj.id === uid);
      console.log('downloadProgbook() called for ' + matchProject.name);
      this.$sciris.start(this, 'Downloading program book...');
      this.$sciris.download('download_progbook', [uid])
        .then(response => {
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not download program book', error)
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

    uploadDatabookModal(uid) {
      this.simplertModalUid = uid
      var obj = { // Alert object data
        message: 'This will clear any results in this project, including the results of any optimizations.  Are you sure you want to proceed?',
        useConfirmBtn: true,
        customConfirmBtnClass: 'btn __red',
        customCloseBtnClass: 'btn',
        onConfirm: this.uploadDatabook
      }
      this.$Simplert.open(obj)
    },

    uploadDatabook() {
      let uid = this.simplertModalUid
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

    uploadProgbookModal(uid) {
      this.simplertModalUid = uid
      var obj = { // Alert object data
        message: 'This will delete any cached scenario and optimization results.  Are you sure you want to proceed?',
        useConfirmBtn: true,
        customConfirmBtnClass: 'btn __red',
        customCloseBtnClass: 'btn',
        onConfirm: this.uploadProgbook
      }
      this.$Simplert.open(obj)
    },

    uploadProgbook() {
      let uid = this.simplertModalUid
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
      ).map(theProj => theProj.id)

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
        theProj => theProj.id
      )
      console.log('deleteSelectedProjects() called for ', selectProjectsUIDs)
      // Have the server delete the selected projects.
      if (selectProjectsUIDs.length > 0) {
        this.$sciris.start(this)
        this.$sciris.rpc('delete_projects', [selectProjectsUIDs, this.userName])
          .then(response => {
            // Get the active project ID.
            let activeProjectId = this.$store.state.activeProject.id
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
      ).map(theProj => theProj.id)
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
