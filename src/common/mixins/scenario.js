import utils from "../utils"

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
      simStartYear: 0,
      simEndYear: 2035,
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
      spendingBaselines: {},
      validProgramStartYears: [],
      validSimYears: [],
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
    projectID()    { return utils.projectID(this) },
    hasData()      { return utils.hasData(this) },
    hasPrograms()  { return utils.hasPrograms(this) },
    simStart()     { return utils.dataEnd(this) },
    simEnd()       { return utils.simEnd(this) },
    projectionYears()     { return utils.projectionYears(this) },
    activePops()   { return utils.activePops(this) },
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
              this.getSimParams()
              this.getSpendingBaselines()
              this.reloadGraphs(false)
            })
        })
    }
  },

  methods: {

    validateYears()                   { return utils.validateYears(this) },
    updateSets()                      { return utils.updateSets(this) },
    exportGraphs()                    { return utils.exportGraphs(this) },
    exportResults(datastoreID)        { return utils.exportResults(this, datastoreID) },
    scaleFigs(frac)                   { return this.$sciris.scaleFigs(this, frac)},
    clearGraphs()                     { return this.$sciris.clearGraphs(this) },
    togglePlotControls()              { return utils.togglePlotControls(this) },
    getPlotOptions(project_id)        { return utils.getPlotOptions(this, project_id) },
    makeGraphs(graphdata)             { return this.$sciris.makeGraphs(this, graphdata, '/scenarios') },
    reloadGraphs(showErr)             { 
      utils.validateYears(this);
      // Set to calibration=false, plotbudget=true
      return utils.reloadGraphs(this, this.projectID, this.serverDatastoreId, showErr, false, true) 
    }, 
    maximize(legend_id)               { return this.$sciris.maximize(this, legend_id) },
    minimize(legend_id)               { return this.$sciris.minimize(this, legend_id) },
    
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
    
    getSpendingBaselines() {
      console.log('getSpendingBaselines() called')
      this.$sciris.start(this)
      this.$sciris.rpc('get_baseline_spending', [this.projectID])
        .then(response => {
          this.spendingBaselines = response.data // Set the spending baselines to what we received.
          this.validProgramStartYears = []
          for (var year = this.spendingBaselines.data_start; 
            year <= this.spendingBaselines.data_end + 10; year++) {
              this.validProgramStartYears.push(year)
          }
          this.$sciris.succeed(this, 'Spending baselines loaded')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not get spending baselines', error)
        })      
    },
    
    getSimParams() {
      console.log('getSimParams() called')
      this.$sciris.start(this)
      this.$sciris.rpc('get_sim_params', [this.projectID])
        .then(response => {
          this.validSimYears = []
          for (var year = response.data.sim_start_year; 
              year <= response.data.sim_end_year; year++) {
            this.validSimYears.push(year)
          }
          this.$sciris.succeed(this, 'Simulation params loaded')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not load simulation params', error)
        })         
    },
    
    changeProgset() {
      // If we've switched off program sets, change the modal mode to parameters overwrites.
      if (this.addEditModal.scenSummary.progsetname == 'None') {
        this.addEditModal.scenEditMode = 'parameters'
        
      // Otherwise...
      } else {
        this.$sciris.start(this)
        this.$sciris.rpc('scen_change_progset', [this.addEditModal.scenSummary, this.addEditModal.scenSummary.progsetname, this.projectID])
          .then(response => {           
            this.addEditModal.scenSummary = response.data
            this.$sciris.succeed(this, 'Progset change completed')
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not properly change the progset', error)
          })           
      }
    },
    
    resetToProgbook() {
      this.$sciris.start(this)
      this.$sciris.rpc('scen_reset_spending', [this.addEditModal.scenSummary, this.projectID])
        .then(response => {           
          this.addEditModal.scenSummary = response.data
          this.$sciris.succeed(this, 'Spending reset completed')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not properly reset the spending', error)
        })          
    },
    
    initModal() {
      if (this.addEditModal.scenSummary.progsetname == 'None') {
        this.addEditModal.scenEditMode = 'parameters'
      } else {
        this.addEditModal.scenEditMode = 'progbudget'
      }
    },

    addScenModal() {
      console.log('addScenModal() called');

      // Get a "template" new scenario from the server.
      this.$sciris.rpc('new_scen', [this.projectID])
        .then(response => {
          this.new_scen = response.data // Set the scenario to what we received.
          this.addEditModal.scenSummary = _.cloneDeep(this.new_scen)
          this.addEditModal.origName = this.addEditModal.scenSummary.name
          this.addEditModal.mode = 'add'
          this.initModal()
          this.$modal.show('add-edit-scen')
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
    
    modalAddBudgetYear() {
      console.log('modalAddBudgetYear() called')
      
      // Add a new budget year which is the maximum year already there plus 1.
      let newYear = Math.max(...this.addEditModal.scenSummary.budgetyears) + 1
      this.addEditModal.scenSummary.budgetyears.push(newYear)
      
      // For each program, add a null to the end of the list, so we have a blank textbox.
      for (var i = 0; i < this.addEditModal.scenSummary.progvals.length; i++) {
        this.addEditModal.scenSummary.progvals[i].budgetvals.push(null)
      }      
    },
    
    modalRemoveBudgetYear(yearindex) {
      console.log('modalRemoveBudgetYear() called')
      
      // Delete the budget year itself.
      this.addEditModal.scenSummary.budgetyears.splice(yearindex, 1)
      
      // For each program, delete all spending values corresponding to that budget year.
      for (var i = 0; i < this.addEditModal.scenSummary.progvals.length; i++) {
        this.addEditModal.scenSummary.progvals[i].budgetvals.splice(yearindex, 1)
      }      
    },    
    
    editScen(scenSummary) {
      console.log('editScen() called');
      this.addEditModal.scenSummary = _.cloneDeep(scenSummary)     
      this.addEditModal.origName = this.addEditModal.scenSummary.name
      this.addEditModal.mode = 'edit'
      this.initModal()
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
