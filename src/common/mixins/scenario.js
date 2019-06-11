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
      dataEndYear: 0,
      activePop: "All",
      popOptions: [],
      plotOptions: [],
      plotGroupsListCollapsed: [],
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
      paramGroups: {}, 
      validProgramStartYears: [],
      validSimYears: [],
      scenariosLoaded: false,
      addEditModal: {
        scenSummary: {},
        origName: '',
        mode: 'add',  
        selectedParamGroup: '',   
        selectedParams: [],
        selectedPopulations: [],        
      },
    }
  },

  computed: {
    projectID()    { return utils.projectID(this) },
    hasData()      { return utils.hasData(this) },
    hasPrograms()  { return utils.hasPrograms(this) },
    simStart()     { return utils.simStart(this) },
    simEnd()       { return utils.simEnd(this) },
    projectionYears()     { return utils.projectionYears(this) },
    activePops()   { return utils.activePops(this) },
    sortedParamOverwrites() {
      return this.applyParamOverwriteSorting(this.addEditModal.scenSummary.paramoverwrites)
    },
  },

  created() {
    this.$sciris.addListener(this)
    this.$sciris.createDialogs(this)
    if ((this.$store.state.activeProject.project !== undefined) &&
      (this.$store.state.activeProject.project.hasData)) {
      console.log('created() called')
      this.simStartYear = this.simStart
      this.simEndYear = this.simEnd
      this.validSimYears = []
      for (var year = this.simStartYear; year <= this.simEndYear; year++) {
        this.validSimYears.push(year)
      }      
      this.popOptions = this.activePops
      this.serverDatastoreId = this.$store.state.activeProject.project.id + ':scenario'
      this.getPlotOptions(this.$store.state.activeProject.project.id)
        .then(response => {
          this.updateSets()
            .then(response2 => {
              // The order of execution / completion of these doesn't matter.
              this.getDataEndYear()
              this.getScenSummaries()
              this.getSpendingBaselines()
              this.getParamGroups()
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
    getPlotOptions(project_id)        { return utils.getPlotOptions(this, project_id, false) },
/*    makeGraphs(graphdata)             { return this.$sciris.makeGraphs(this, graphdata, '/scenarios') }, */
    makeGraphs(graphdata)             { return utils.makeGraphs(this, graphdata, '/scenarios') },    
    reloadGraphs(showErr)             { 
      utils.validateYears(this);
      if (this.showPlotControls) {
        this.scaleFigs(1.0)
        this.showPlotControls = false
      }
      // Set to calibration=false, plotbudget=true
      return utils.reloadGraphs(
        this,
        this.projectID,
        this.serverDatastoreId,
        showErr,
        false,
        true)
    }, 
    maximize(legend_id)               { return this.$sciris.maximize(this, legend_id) },
    minimize(legend_id)               { return this.$sciris.minimize(this, legend_id) },
    
    plotGroupActiveToggle(groupname, active) {
      console.log('plotGroupActiveToggle() called for plot group: ', groupname, ' changing from: ', active)
      for (var ind = 0; ind < this.plotOptions.plots.length; ind++) {
        if (this.plotOptions.plots[ind].plot_group == groupname) {
          this.plotOptions.plots[ind].active = !active
        }
      }
    },
    
    plotGroupListCollapseToggle(index) {
      console.log('plotGroupListCollapseToggle() called for plot index: ', index)
      this.plotGroupsListCollapsed[index] = !this.plotGroupsListCollapsed[index]
      // Stupid hack required to update Vue with this data...
      this.plotGroupsListCollapsed.push(false)
      this.plotGroupsListCollapsed.pop()
    },
    
    getPlotsFromPlotGroup(groupname) {
      let members = []
      for (var ind = 0; ind < this.plotOptions.plots.length; ind++) {
        if (this.plotOptions.plots[ind].plot_group == groupname) {
          members.push(this.plotOptions.plots[ind].plot_name)
        }
      }
      return members      
    },
    
    paramGroupMembers(groupname) { 
      let members = []
      for (var ind = 0; ind < this.paramGroups.codenames.length; ind++) {
        if (this.paramGroups.groupnames[ind] == groupname) {
          members.push(this.paramGroups.displaynames[ind])
        }
      }  
      return members
    },
    
    getParamCodeNameFromDisplayName(displayname) {
      for (var ind = 0; ind < this.paramGroups.displaynames.length; ind++) {         
        if (this.paramGroups.displaynames[ind] == displayname) {
          return this.paramGroups.codenames[ind]
        }
      }          
    },

    async getDataEndYear() {
      try {
        let response = await this.$sciris.rpc('get_data_end_year', [this.projectID]);
        this.dataEndYear = response.data;
      } catch (error) {
        this.$sciris.fail(this, 'Could not get scenarios', error);
      }
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
    
    getParamGroups() {
      console.log('getParamGroups() called')
      this.$sciris.start(this)
      this.$sciris.rpc('get_param_groups', [this.projectID, this.toolName()])
        .then(response => {
          this.paramGroups = response.data // Set the parameter groups to what we received.
          this.addEditModal.selectedParamGroup = this.paramGroups.grouplist[0]
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not get parameter groups', error)
        })      
    }, 
    
    changeProgset() {
      // If we've switched off program sets, change the scenario type automatically 
      // to parameters overwrites.
      if (this.addEditModal.scenSummary.progsetname == 'None') {
        this.addEditModal.scenSummary.scentype = 'parameter'
        
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
    
    resetToDefaultValues() {
      this.$sciris.start(this)
      this.$sciris.rpc('scen_reset_values', [this.addEditModal.scenSummary, this.projectID])
        .then(response => {           
          this.addEditModal.scenSummary = response.data
          this.$sciris.succeed(this, 'Value reset completed')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not properly reset the values', error)
        })          
    },
    
    addScenModal(scentype) {
      console.log('addScenModal() called')

      // Get a "template" new scenario from the server.
      this.$sciris.rpc('new_scen', [this.projectID, scentype])
        .then(response => {
          this.new_scen = response.data // Set the scenario to what we received.
          this.addEditModal.scenSummary = _.cloneDeep(this.new_scen)
          this.addEditModal.origName = this.addEditModal.scenSummary.name
          this.addEditModal.mode = 'add'
          this.$modal.show('add-edit-scen')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not open add scenario modal', error)
        })
    },
    
    applyParamOverwriteSorting(paramoverwrites) {
      return this.applyParamOverwriteSorting2(paramoverwrites).slice(0).sort((po1, po2) =>
        {
          return (po1.groupname.toLowerCase() > po2.groupname.toLowerCase())
        }
      )
    },
    
    applyParamOverwriteSorting2(paramoverwrites) {
      return this.applyParamOverwriteSorting3(paramoverwrites).slice(0).sort((po1, po2) =>
        {
          return (po1.paramname.toLowerCase() > po2.paramname.toLowerCase())
        }
      )
    },
    
    applyParamOverwriteSorting3(paramoverwrites) {
      return paramoverwrites.slice(0).sort((po1, po2) =>
        {
          return (this.paramGroups.popnames.lastIndexOf(po1.popname) > this.paramGroups.popnames.lastIndexOf(po2.popname))
        }
      )
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
    
      var newYear
      // If the budget years list is non-empty, add a new budget year which is the maximum 
      // year already there plus 1.
      if (this.addEditModal.scenSummary.budgetyears.length > 0) {
        newYear = Math.max(...this.addEditModal.scenSummary.budgetyears) + 1
      // Otherwise, make the new year the data_end year.
      } else {
        newYear = this.spendingBaselines.data_end
      }
      this.addEditModal.scenSummary.budgetyears.push(newYear)
      
      // For each program, add a null to the end of the list, so we have a blank textbox.
      for (var i = 0; i < this.addEditModal.scenSummary.progs.length; i++) {
        this.addEditModal.scenSummary.progs[i].budgetvals.push(null)
      }      
    },
    
    modalRemoveBudgetYear(yearindex) {
      console.log('modalRemoveBudgetYear() called')
      
      // Delete the budget year itself.
      this.addEditModal.scenSummary.budgetyears.splice(yearindex, 1)
      
      // For each program, delete all spending values corresponding to that budget year.
      for (var i = 0; i < this.addEditModal.scenSummary.progs.length; i++) {
        this.addEditModal.scenSummary.progs[i].budgetvals.splice(yearindex, 1)
      }      
    },   
    
    modalAddCoverageYear() {
      console.log('modalAddCoverageYear() called')
    
      var newYear
      var startingCovs
      
      // If the coverage years list is non-empty, add a new coverage year which is the maximum 
      // year already there plus 1.
      if (this.addEditModal.scenSummary.coverageyears.length > 0) {
        newYear = Math.max(...this.addEditModal.scenSummary.coverageyears) + 1
      // Otherwise, make the new year the program start year.
      } else {
        newYear = this.addEditModal.scenSummary.progstartyear
      }
      this.addEditModal.scenSummary.coverageyears.push(newYear)
      
      // For each program, add a null to the end of the list, so we have a blank textbox.
      for (var i = 0; i < this.addEditModal.scenSummary.progs.length; i++) {
        this.addEditModal.scenSummary.progs[i].coveragevals.push(null)
      }

      // If we now have just one year column...
      if (this.addEditModal.scenSummary.coverageyears.length == 1) {
        // Run the RPC to to pull out the coverages at the program start year.
        this.$sciris.start(this)
        this.$sciris.rpc('get_initial_coverages', [this.projectID, this.addEditModal.scenSummary])
        .then(response => {
          startingCovs = response.data
          
          // For each program, copy the RPC coverages over to the values to be in the textboxes.
          for (var i = 0; i < this.addEditModal.scenSummary.progs.length; i++) {
            this.addEditModal.scenSummary.progs[i].coveragevals[0] = startingCovs[i]
          }
          
          // Hack to get the Vue display of progs[x].coveragevals to update
          this.addEditModal.scenSummary.progs.push(this.addEditModal.scenSummary.progs[0])
          this.addEditModal.scenSummary.progs.pop()
          
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not get initial coverages', error)
        })
      }
    },
    
    modalRemoveCoverageYear(yearindex) {
      console.log('modalRemoveCoverageYear() called')
      
      // Delete the coverage year itself.
      this.addEditModal.scenSummary.coverageyears.splice(yearindex, 1)
      
      // For each program, delete all coverage values corresponding to that coverage year.
      for (var i = 0; i < this.addEditModal.scenSummary.progs.length; i++) {
        this.addEditModal.scenSummary.progs[i].coveragevals.splice(yearindex, 1)
      }      
    }, 
    
    modalAddParamYear() {
      console.log('modalAddParamYear() called')
    
      var newYear
      // If the parameter years list is non-empty, add a new parameter year which is the maximum 
      // year already there plus 1.
      if (this.addEditModal.scenSummary.paramyears.length > 0) {
        newYear = Math.max(...this.addEditModal.scenSummary.paramyears) + 1
      // Otherwise, make the new year the data_end year.
      } else {
        console.log('Using data end year')
        newYear = this.dataEndYear
      }
      this.addEditModal.scenSummary.paramyears.push(newYear)
      
      // For each parameter overwrite, add a null to the end of the list, so we have a blank textbox.
      for (var i = 0; i < this.addEditModal.scenSummary.paramoverwrites.length; i++) {
        this.addEditModal.scenSummary.paramoverwrites[i].paramvals.push(null)
      }   
    },
    
    modalRemoveParamYear(yearindex) {
      console.log('modalRemoveParamYear() called')
      
      // Delete the parameter year itself.
      this.addEditModal.scenSummary.paramyears.splice(yearindex, 1)
      
      // For each parameter overwrite, delete all parameter values corresponding to that parameter 
      // year.
      for (var i = 0; i < this.addEditModal.scenSummary.paramoverwrites.length; i++) {
        this.addEditModal.scenSummary.paramoverwrites[i].paramvals.splice(yearindex, 1)
      }
    },
    
    modalAddParameters(selectedParamGroup, selectedParams, selectedPopulations) {
      console.log('modalAddParameter() called')
      
      var paramname
      var popname
      var newParamOverwrite
      var paramCodeNames
      var popNames
      var paramInterpolations
      
      // Create an array of nulls to be used to set the initial parameter values.
      let newParamvals = []
      if (this.addEditModal.scenSummary.paramoverwrites.length > 0) {
        for (var i = 0; i < this.addEditModal.scenSummary.paramoverwrites[0].paramvals.length; i++) {
          newParamvals.push(null)
        }
      }
      
      // Loop over the selected parameters...
      for (var i = 0; i < selectedParams.length; i++) {
        paramname = selectedParams[i]
        
        // Loop over the selected populations...
        for (var j = 0; j < selectedPopulations.length; j++) {
          popname = selectedPopulations[j]
          
          // Create the overwrite row.
          newParamOverwrite = {
            paramname: paramname,
            paramcodename: this.getParamCodeNameFromDisplayName(paramname), 
            groupname: selectedParamGroup, 
            popname: popname, 
            paramvals: _.cloneDeep(newParamvals) 
          }
          
          // Push the new overwrite to the table.
          this.addEditModal.scenSummary.paramoverwrites.push(newParamOverwrite)
        }
      }
      
      // If we have no year columns yet, add one.
      if (this.addEditModal.scenSummary.paramoverwrites[0].paramvals.length == 0) {
        this.modalAddParamYear()
      }
      
      // Build arguments for an RPC call to get all of the interpolated parameter values 
      // for the first year column.
      paramCodeNames = []
      popNames = []
      paramInterpolations = []
      for (var i = this.addEditModal.scenSummary.paramoverwrites.length - selectedParams.length *   
        selectedPopulations.length; 
        i < this.addEditModal.scenSummary.paramoverwrites.length; i++) {
        paramCodeNames.push(this.addEditModal.scenSummary.paramoverwrites[i].paramcodename)
        popNames.push(this.addEditModal.scenSummary.paramoverwrites[i].popname)
        paramInterpolations.push(1234.5)
      }
      
      // Do the RPC call.
      this.$sciris.start(this)
      this.$sciris.rpc('get_param_interpolations', [this.projectID, this.addEditModal.scenSummary.parsetname, paramCodeNames, popNames, this.addEditModal.scenSummary.paramyears[0]])
        .then(response => {
          paramInterpolations = response.data
            
          // For each of the rows we just added, add the interpolated parameter value for the 
          // first year column.
          for (var i = this.addEditModal.scenSummary.paramoverwrites.length - 
            selectedParams.length * selectedPopulations.length; 
            i < this.addEditModal.scenSummary.paramoverwrites.length; i++) {
            this.addEditModal.scenSummary.paramoverwrites[i].paramvals[0] = 
              paramInterpolations[i - this.addEditModal.scenSummary.paramoverwrites.length + selectedParams.length * selectedPopulations.length]        
          }

          // Hack to get the Vue display of paramoverwrites to update
          this.addEditModal.scenSummary.paramoverwrites.push(this.addEditModal.scenSummary.paramoverwrites[0])
          this.addEditModal.scenSummary.paramoverwrites.pop()
          
          this.$sciris.succeed(this, '')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not get parameter interpolations', error)
        })
    },
    
    modalDeleteParameter(paramoverwrite) {
      console.log('modalDeleteParameter() called')
      for (var i = 0; i < this.addEditModal.scenSummary.paramoverwrites.length; i++) {
        if ((this.addEditModal.scenSummary.paramoverwrites[i].paramname === paramoverwrite.paramname) && 
            (this.addEditModal.scenSummary.paramoverwrites[i].popname === paramoverwrite.popname)) {
          this.addEditModal.scenSummary.paramoverwrites.splice(i, 1);
        }
      }        
    },
    
    editScen(scenSummary) {
      console.log('editScen() called')
      this.addEditModal.scenSummary = _.cloneDeep(scenSummary)     
      this.addEditModal.origName = this.addEditModal.scenSummary.name
      this.addEditModal.mode = 'edit'
      // Open a model dialog for creating a new project
      this.$modal.show('add-edit-scen');
    },

    copyScen(scenSummary) {
      console.log('copyScen() called')
      this.$sciris.start(this)
      var newScen = _.cloneDeep(scenSummary)
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
      for (var i = 0; i< this.scenSummaries.length; i++) {
        if (this.scenSummaries[i].name === scenSummary.name) {
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
            plotyear:this.simEndYear, 
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
