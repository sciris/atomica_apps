var ScenarioMixin = {

  data() {
    return {
      // Parameter and program set information
      activeParset:  -1,
      activeProgset: -1,
      parsetOptions: [],
      progsetOptions: [],   

      // Plotting data
      showPlotControls: false,
      hasGraphs: false,
      table: null,
      startYear: 0,
      endYear: 2018, // TEMP FOR DEMO
      activePop: "All",
      popOptions: [],
      plotOptions: [],
      yearOptions: [],
      serverDatastoreId: '',
      openDialogs: [],
      showGraphDivs: [], // These don't actually do anything, but they're here for future use
      showLegendDivs: [],
      mousex:-1,
      mousey:-1,
      figscale: 1.0,

      // Page-specific data
      scenSummaries: [],
      defaultBudgetScen: {},
      scenariosLoaded: false,
      addEditModal: {
        scenSummary: {},
        origName: '',
        mode: 'add',
        scenEditMode: 'parameters'       
      },
    }
  },

  computed: {
    projectID()    { return this.$sciris.projectID(this) },
    hasData()      { return this.$sciris.hasData(this) },
    hasPrograms()  { return this.$sciris.hasPrograms(this) },
    simStart()     { return this.$sciris.dataEnd(this) },
    simEnd()       { return this.$sciris.simEnd(this) },
    projectionYears()     { return this.$sciris.projectionYears(this) },
    activePops()   { return this.$sciris.activePops(this) },
    placeholders() { return this.$sciris.placeholders(this, 1) },
  },

  created() {
    this.$sciris.addListener(this)
    this.$sciris.createDialogs(this)
    if ((this.$store.state.activeProject.project !== undefined) &&
      (this.$store.state.activeProject.project.hasData) &&
      (this.$store.state.activeProject.project.hasPrograms)) {
      console.log('created() called')
      this.startYear = this.simStart
      this.endYear = this.simEnd
      this.popOptions = this.activePops
      this.serverDatastoreId = this.$store.state.activeProject.project.id + ':scenario'
      this.getPlotOptions(this.$store.state.activeProject.project.id)
        .then(response => {
          this.updateSets()
            .then(response2 => {
              // The order of execution / completion of these doesn't matter.
              this.getScenSummaries()
              this.getDefaultBudgetScen()
              this.reloadGraphs(false)
            })
        })
    }
  },

  methods: {

    validateYears()                   { return this.$sciris.validateYears(this) },
    updateSets()                      { return this.$sciris.updateSets(this) },
    exportGraphs()                    { return this.$sciris.exportGraphs(this) },
    exportResults(datastoreID)        { return this.$sciris.exportResults(this, datastoreID) },
    scaleFigs(frac)                   { return this.$sciris.scaleFigs(this, frac)},
    clearGraphs()                     { return this.$sciris.clearGraphs(this) },
    togglePlotControls()              { return this.$sciris.togglePlotControls(this) },
    getPlotOptions(project_id)        { return this.$sciris.getPlotOptions(this, project_id) },
    makeGraphs(graphdata)             { return this.$sciris.makeGraphs(this, graphdata, '/scenarios') },
    reloadGraphs(showErr)             { return this.$sciris.reloadGraphs(this, this.projectID, this.serverDatastoreId, showErr, false, true) }, // Set to calibration=false, plotbudget=true
    maximize(legend_id)               { return this.$sciris.maximize(this, legend_id) },
    minimize(legend_id)               { return this.$sciris.minimize(this, legend_id) },

    getDefaultBudgetScen() {
      console.log('getDefaultBudgetScen() called')
      this.$sciris.rpc('get_default_budget_scen', [this.projectID])
        .then(response => {
          this.defaultBudgetScen = response.data // Set the scenario to what we received.
          console.log('This is the default:')
          console.log(this.defaultBudgetScen);
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not get default budget scenario', error)
        })
    },
    
    getScenSummaries() {
      console.log('getScenSummaries() called')
      this.$sciris.start(this)
      this.$sciris.rpc('get_scen_info', [this.projectID])
        .then(response => {
          this.scenSummaries = response.data // Set the scenarios to what we received.
          console.log('Scenario summaries:')
          console.log(this.scenSummaries)
          this.scenariosLoaded = true
          this.$sciris.succeed(this, 'Scenarios loaded')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not get scenarios', error)
        })
    },

    setScenSummaries() {
      console.log('setScenSummaries() called')
      this.$sciris.start(this)
      this.$sciris.rpc('set_scen_info', [this.projectID, this.scenSummaries])
        .then( response => {
          this.$sciris.succeed(this, 'Scenarios saved')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not save scenarios', error)
        })
    },

    addScenModal() {
      // Open a model dialog for creating a new project
      console.log('addScenModal() called');
      // TODO: I'm thinking we don't really need this RPC call, since the default budget
      // scenario gets loaded on creation of the page.
      // Or, alternatively, we should take the call out of the create() function.
      this.$sciris.rpc('new_scen', [this.projectID])
        .then(response => {
          this.new_scen = response.data // Set the scenario to what we received.
          this.addEditModal.scenSummary = _.cloneDeep(this.new_scen)
          
          this.addEditModal.origName = this.addEditModal.scenSummary.name
          this.addEditModal.mode = 'add'
          this.$modal.show('add-edit-scen');
          console.log(this.defaultBudgetScen)
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not open add scenario modal', error)
        })
    },

    modalSave() {
      console.log('modalSave() called')
      this.$modal.hide('add-edit-scen')
      this.$sciris.start(this)
      let newScen = _.cloneDeep(this.addEditModal.scenSummary) // Get the new scenario summary from the modal.
      let scenNames = [] // Get the list of all of the current scenario names.
      this.scenSummaries.forEach(scenSum => {
        scenNames.push(scenSum.name)
      })
      if (this.addEditModal.mode == 'edit') { // If we are editing an existing scenario...
        let index = scenNames.indexOf(this.addEditModal.origName) // Get the index of the original (pre-edited) name
        if (index > -1) {
          this.scenSummaries[index].name = newScen.name  // hack to make sure Vue table updated
          this.scenSummaries[index] = newScen
          
          // Hack to get the Vue display of scenSummaries to update
          this.scenSummaries.push(this.scenSummaries[0])
          this.scenSummaries.pop()          
        }
        else {
          console.log('Error: a mismatch in editing keys')
        }
      }
      else { // Else (we are adding a new scenario)...
        newScen.name = this.$sciris.getUniqueName(newScen.name, scenNames)
        this.scenSummaries.push(newScen)
      }
      console.log(newScen)
      console.log(this.scenSummaries)
      this.$sciris.rpc('set_scen_info', [this.projectID, this.scenSummaries])
        .then( response => {
          this.$sciris.succeed(this, 'Scenario saved')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not save scenario', error)
        })
    },
    
    editScen(scenSummary) {
      console.log('editScen() called');
      this.addEditModal.scenSummary = _.cloneDeep(scenSummary)     
      this.addEditModal.origName = this.addEditModal.scenSummary.name
      this.addEditModal.mode = 'edit'
      // Open a model dialog for creating a new project
      this.$modal.show('add-edit-scen');
    },

    copyScen(scenSummary) {
      console.log('copyScen() called')
      this.$sciris.start(this)
      var newScen = _.cloneDeep(scenSummary);
      var otherNames = []
      this.scenSummaries.forEach(scenSum => {
        otherNames.push(scenSum.name)
      })
      newScen.name = this.$sciris.getUniqueName(newScen.name, otherNames)
      this.scenSummaries.push(newScen)
      this.$sciris.rpc('set_scen_info', [this.projectID, this.scenSummaries])
        .then( response => {
          this.$sciris.succeed(this, 'Scenario copied')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not copy scenario', error)
        })
    },

    deleteScen(scenSummary) {
      console.log('deleteScen() called')
      this.$sciris.start(this)
      for(var i = 0; i< this.scenSummaries.length; i++) {
        if(this.scenSummaries[i].name === scenSummary.name) {
          this.scenSummaries.splice(i, 1);
        }
      }
      this.$sciris.rpc('set_scen_info', [this.projectID, this.scenSummaries])
        .then( response => {
          this.$sciris.succeed(this, 'Scenario deleted')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not delete scenario', error)
        })
    },

    runScens() {
      console.log('runScens() called')
      this.validateYears()  // Make sure the start end years are in the right range.
      this.$sciris.start(this)
      this.$sciris.rpc('set_scen_info', [this.projectID, this.scenSummaries]) // Make sure they're saved first
        .then(response => {
          // Go to the server to get the results from the package set.
          this.$sciris.rpc('run_scenarios', [
            this.projectID, 
            this.serverDatastoreId, 
            this.plotOptions
          ],
          {
            saveresults: false, 
            tool: this.toolName(),
            plotyear:this.endYear, 
            pops:this.activePop
          })
            .then(response => {
              this.table = response.data.table
              this.makeGraphs(response.data)
              this.$sciris.succeed(this, '') // Success message in graphs function
            })
            .catch(error => {
              this.$sciris.fail(this, 'Could not run scenarios', error)
            })
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not set scenarios', error)
        })
    },
  }
}
export default ScenarioMixin;
