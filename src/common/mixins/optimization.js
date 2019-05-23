import utils from "../utils"

var OptimizationMixin = {
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
      simEndYear: 2018, // TEMP FOR DEMO
      activePop: "All",
      activeCascade: "",
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
      optimSummaries: [],
      optimsLoaded: false,
      pollingTasks: false,
      defaultOptim: {},
      modalOptim: {},
      objectiveOptions: [],
      displayResultName: '',
      displayResultDatastoreId: '',
      addEditDialogMode: 'add',  // or 'edit'
      addEditDialogOldName: '',
    }
  },

  computed: {
    projectID()    { return utils.projectID(this) },
    hasData()      { return utils.hasData(this) },
    hasPrograms()  { return utils.hasPrograms(this) },
    simStart()     { return utils.simStart(this) },
    simEnd()       { return utils.simEnd(this) },
    simCascades()  { return utils.simCascades(this) },
    projectionYears()     { return utils.projectionYears(this) },
    activePops()   { return utils.activePops(this) },
  },

  created() {
    this.$sciris.addListener(this)
    this.$sciris.createDialogs(this)
    if ((this.$store.state.activeProject.project !== undefined) &&
      (this.$store.state.activeProject.project.hasData) &&
      (this.$store.state.activeProject.project.hasPrograms)) {
      console.log('created() called')
      this.simStartYear = this.simStart
      this.simEndYear = this.simEnd
      this.popOptions = this.activePops
      this.activeCascade = this.simCascades[0]
      this.getPlotOptions(this.$store.state.activeProject.project.id)
        .then(response => {
          this.updateSets()
            .then(response2 => {
              this.getOptimSummaries()
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
/*    makeGraphs(graphdata)             { return this.$sciris.makeGraphs(this, graphdata, '/optimizations') }, */
    makeGraphs(graphdata)             { return utils.makeGraphs(this, graphdata, '/optimizations') },reloadGraphs(cache_id, showErr)   { 
      // Make sure the start end years are in the right range.
      utils.validateYears(this);
      if (this.showPlotControls) {
        this.scaleFigs(1.0)
        this.showPlotControls = false
      }      
      // Set to calibration=false, plotbudget=True
      return utils.reloadGraphs(this, this.projectID, cache_id, showErr, false, true); 
    }, 
    maximize(legend_id)               { return this.$sciris.maximize(this, legend_id) },
    minimize(legend_id)               { return this.$sciris.minimize(this, legend_id) },

    statusFormatStr(optimSummary) {
      if      (optimSummary.status === 'not started') {return ''}
      else if (optimSummary.status === 'queued')      {return 'Initializing... '} // + this.timeFormatStr(optimSummary.pendingTime)
      else if (optimSummary.status === 'started')     {return 'Running for '} // + this.timeFormatStr(optimSummary.executionTime)
      else if (optimSummary.status === 'completed')   {return 'Completed after '} // + this.timeFormatStr(optimSummary.executionTime)
      else if (optimSummary.status === 'error')   {return 'Error after '} // + this.timeFormatStr(optimSummary.executionTime)
      else                                            {return ''}
    },

    timeFormatStr(optimSummary) {
      let rawValue = ''
      let is_queued = (optimSummary.status === 'queued')
      let is_executing = ((optimSummary.status === 'started') || 
        (optimSummary.status === 'completed') || (optimSummary.status === 'error'))        
      if      (is_queued)    {rawValue = optimSummary.pendingTime}
      else if (is_executing) {rawValue = optimSummary.executionTime}
      else                   {return ''}

      if (rawValue === '--') {
        return '--'
      } else {
        let numSecs = Number(rawValue).toFixed()
        let numHours = Math.floor(numSecs / 3600)
        numSecs -= numHours * 3600
        let numMins = Math.floor(numSecs / 60)
        numSecs -= numMins * 60
        let output = _.padStart(numHours.toString(), 2, '0') + ':' + _.padStart(numMins.toString(), 2, '0') + ':' + _.padStart(numSecs.toString(), 2, '0')
        return output
      }
    },

    canRunTask(optimSummary)     { return (optimSummary.status === 'not started') },
    canCancelTask(optimSummary)  { return (optimSummary.status !== 'not started') },
    canPlotResults(optimSummary) { return (optimSummary.status === 'completed') },

    getOptimTaskState(optimSummary) {
      return new Promise((resolve, reject) => {
        console.log('getOptimTaskState() called for with: ' + optimSummary.status)
        let statusStr = '';
        this.$sciris.rpc('check_task', [optimSummary.serverDatastoreId]) // Check the status of the task.
          .then(result => {
            statusStr = result.data.task.status
            optimSummary.status = statusStr
            optimSummary.pendingTime = result.data.pendingTime
            optimSummary.executionTime = result.data.executionTime
            if (optimSummary.status == 'error') {
              console.log('Error in task: ', optimSummary.serverDatastoreId)
              console.log(result.data.task.errorText)
            }
            resolve(result)
          })
          .catch(error => {
            optimSummary.status = 'not started'
            optimSummary.pendingTime = '--'
            optimSummary.executionTime = '--'
            resolve(error)  // yes, resolve, not reject, because this means non-started task
          })
      })
    },
    
    needToPoll() {
      // Check if we're still on the Optimizations page.
      let routePath = (this.$route.path === '/optimizations')
      
      // Check if we have a queued or started task.
      let runningState = false
      this.optimSummaries.forEach(optimSum => {
        if ((optimSum.status === 'queued') || (optimSum.status === 'started')) {
          runningState = true
        }
      })
      
      // We need to poll if we are in the page and a task is going.
      return (routePath && runningState)
    },
    
    pollAllTaskStates(checkAllTasks) {
      return new Promise((resolve, reject) => {
        console.log('Polling all tasks...')
        
        // Clear the poll states.
        this.optimSummaries.forEach(optimSum => {
          optimSum.polled = false
        })
        
        // For each of the optimization summaries...
        this.optimSummaries.forEach(optimSum => { 
          console.log(optimSum.serverDatastoreId, optimSum.status)
          
          // If we are to check all tasks OR there is a valid task running, check it.
          if ((checkAllTasks) ||            
            ((optimSum.status !== 'not started') && (optimSum.status !== 'completed') && 
              (optimSum.status !== 'error'))) {
            this.getOptimTaskState(optimSum)
            .then(response => {
              // Flag as polled.
              optimSum.polled = true
              
              // Resolve the main promise when all of the optimSummaries are polled.
              let done = true
              this.optimSummaries.forEach(optimSum2 => {
                if (!optimSum2.polled) {
                  done = false
                }
              })
              if (done) {
                resolve()
              }
            })
          }
          
          // Otherwise (no task to check), we are done polling for it.
          else {
            // Flag as polled.
            optimSum.polled = true
            
            // Resolve the main promise when all of the optimSummaries are polled.
            let done = true
            this.optimSummaries.forEach(optimSum2 => {
              if (!optimSum2.polled) {
                done = false
              }
            })
            if (done) {
              resolve()
            }
          }           
        })   
      })     
    },
    
    doTaskPolling(checkAllTasks) {
      // Flag that we're polling.
      this.pollingTasks = true
      
      // Do the polling of the task states.
      this.pollAllTaskStates(checkAllTasks)
      .then(() => {
        // Hack to get the Vue display of optimSummaries to update
        this.optimSummaries.push(this.optimSummaries[0])
        this.optimSummaries.pop()
          
        // Only if we need to continue polling...
        if (this.needToPoll()) {
          // Sleep waitingtime seconds.
          let waitingtime = 1
          this.$sciris.sleep(waitingtime * 1000)
            .then(response => {
              this.doTaskPolling(false) // Call the next polling, in a way that doesn't check_task() for _every_ task.
            })         
        }
        
        // Otherwise, flag that we're no longer polling.
        else {
          this.pollingTasks = false
        }
      })
    },
    
    clearTask(optimSummary) {
      return new Promise((resolve, reject) => {
        let datastoreId = optimSummary.serverDatastoreId  // hack because this gets overwritten soon by caller
        console.log('clearTask() called for '+this.currentOptim)
        this.$sciris.rpc('del_result', [datastoreId, this.projectID]) // Delete cached result.
          .then(response => {
            this.$sciris.rpc('delete_task', [datastoreId])
              .then(response => {
                this.getOptimTaskState(optimSummary) // Get the task state for the optimization.
                if (!this.pollingTasks) {
                  this.doTaskPolling(true)
                }                  
                resolve(response)
              })
              .catch(error => {
                resolve(error)  // yes, resolve because at least cache entry deletion succeeded
              })
          })
          .catch(error => {
            reject(error)
          })
      })
    },

    getOptimSummaries() {
      console.log('getOptimSummaries() called')
      this.$sciris.start(this)
      this.$sciris.rpc('get_optim_info', [this.projectID]) // Get the current project's optimization summaries from the server.
        .then(response => {
          this.optimSummaries = response.data // Set the optimizations to what we received.
          this.optimSummaries.forEach(optimSum => { // For each of the optimization summaries...
            optimSum.serverDatastoreId = this.$store.state.activeProject.project.id + ':opt-' + optimSum.name // Build a task and results cache ID from the project's hex UID and the optimization name.
            optimSum.status = 'not started' // Set the status to 'not started' by default, and the pending and execution times to '--'.
            optimSum.pendingTime = '--'
            optimSum.executionTime = '--'
          })
          this.doTaskPolling(true)  // start task polling, kicking off with running check_task() for all optimizations
          this.optimsLoaded = true
          this.$sciris.succeed(this, 'Optimizations loaded')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not load optimizations', error)
        })
    },

    setOptimSummaries() {
      console.log('setOptimSummaries() called')
      this.$sciris.start(this)
      this.$sciris.rpc('set_optim_info', [this.projectID, this.optimSummaries])
        .then( response => {
          this.$sciris.succeed(this, 'Optimizations saved')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not save optimizations', error)
        })
    },

    addOptimModal(optim_type) { // Open a model dialog for creating a new project
      console.log('addOptimModal() called for ' + optim_type);
      this.$sciris.rpc('get_default_optim', [
        this.projectID, 
        this.toolName(), 
        optim_type
      ])
      .then(response => {
        this.defaultOptim = response.data // Set the optimization to what we received.
        this.resetModal(response.data)
        this.addEditDialogMode = 'add'
        this.addEditDialogOldName = this.modalOptim.name
        this.$modal.show('add-optim');
        console.log(this.defaultOptim)
      })
    },

    saveOptim() {
      console.log('saveOptim() called')
      this.$modal.hide('add-optim')
      this.$sciris.start(this)
      this.simEndYear = this.modalOptim.end_year
      let newOptim = _.cloneDeep(this.modalOptim) // Get the new optimization summary from the modal.
      let optimNames = [] // Get the list of all of the current optimization names.
      this.optimSummaries.forEach(optimSum => {
        optimNames.push(optimSum.name)
      })
      if (this.addEditDialogMode === 'edit') { // If we are editing an existing optimization...
        let index = optimNames.indexOf(this.addEditDialogOldName) // Get the index of the original (pre-edited) name
        if (index > -1) {
          this.optimSummaries[index].name = newOptim.name  // hack to make sure Vue table updated
          this.optimSummaries[index] = newOptim
          if (newOptim.name !== this.addEditDialogOldName) {  // If we've renamed an optimization
            newOptim.serverDatastoreId = this.$store.state.activeProject.project.id + ':opt-' + newOptim.name // Set a new server DataStore ID.
          }
          if (newOptim.status !== 'not started') { // Clear the present task.
            this.clearTask(newOptim)  // Clear the task from the server.
          }
          newOptim.serverDatastoreId = this.$store.state.activeProject.project.id + ':opt-' + newOptim.name // Build a task and results cache ID from the project's hex UID and the optimization name.
          newOptim.status = 'not started' // Set the status to 'not started' by default, and the pending and execution times to '--'.
          newOptim.pendingTime = '--'
          newOptim.executionTime = '--'
        }
        else {
          this.$sciris.fail(this, 'Could not find optimization "' + this.addEditDialogOldName + '" to edit')
        }
      }
      else { // Else (we are adding a new optimization)...
        newOptim.name = this.$sciris.getUniqueName(newOptim.name, optimNames)
        newOptim.serverDatastoreId = this.$store.state.activeProject.project.id + ':opt-' + newOptim.name
        this.optimSummaries.push(newOptim)
        this.getOptimTaskState(newOptim)
        .then(result => {
          // Hack to get the Vue display of optimSummaries to update
          this.optimSummaries.push(this.optimSummaries[0])
          this.optimSummaries.pop()
        })          
      }

      this.$sciris.rpc('set_optim_info', [this.projectID, this.optimSummaries])
        .then( response => {
          this.$sciris.succeed(this, 'Optimization added')
          this.resetModal(this.defaultOptim)
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not add optimization', error)
        })
    },

    cancelOptim() {
      this.$modal.hide('add-optim')
      this.resetModal(this.defaultOptim)
    },

    resetModal(optimData) {
      console.log('resetModal() called')
      this.modalOptim = _.cloneDeep(optimData)
      console.log(this.modalOptim)
    },

    editOptim(optimSummary) {
      // Open a model dialog for creating a new project
      console.log('editOptim() called');
      this.modalOptim = _.cloneDeep(optimSummary)
      console.log('defaultOptim', this.defaultOptim.obj)
      this.addEditDialogMode = 'edit'
      this.addEditDialogOldName = this.modalOptim.name
      this.$modal.show('add-optim');
    },

    copyOptim(optimSummary) {
      console.log('copyOptim() called')
      this.$sciris.start(this)
      var newOptim = _.cloneDeep(optimSummary);
      var otherNames = []
      this.optimSummaries.forEach(optimSum => {
        otherNames.push(optimSum.name)
      })
      newOptim.name = this.$sciris.getUniqueName(newOptim.name, otherNames)
      newOptim.serverDatastoreId = this.$store.state.activeProject.project.id + ':opt-' + newOptim.name
      this.optimSummaries.push(newOptim)
      this.getOptimTaskState(newOptim)
      this.$sciris.rpc('set_optim_info', [this.projectID, this.optimSummaries])
        .then( response => {
          this.$sciris.succeed(this, 'Optimization copied')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not copy optimization', error)
        })
    },

    deleteOptim(optimSummary) {
      console.log('deleteOptim() called')
      this.$sciris.start(this)
      if (optimSummary.status !== 'not started') {
        this.clearTask(optimSummary)  // Clear the task from the server.
      }
      for(var i = 0; i< this.optimSummaries.length; i++) {
        if(this.optimSummaries[i].name === optimSummary.name) {
          this.optimSummaries.splice(i, 1);
        }
      }
      this.$sciris.rpc('set_optim_info', [this.projectID, this.optimSummaries])
        .then(response => {
          this.$sciris.succeed(this, 'Optimization deleted')
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not delete optimization', error)
        })
    },


    runOptim(optimSummary, maxtime) {
      console.log('runOptim() called for '+this.currentOptim + ' for time: ' + maxtime)
      this.validateYears()  // Make sure the end year is sensibly set.
      this.$sciris.start(this)
      var RPCname = this.getOptimizationRPCName();
      this.$sciris.rpc('set_optim_info', [this.projectID, this.optimSummaries]) // Make sure they're saved first
        .then(response => {
          this.$sciris.rpc('launch_task', [
              optimSummary.serverDatastoreId, 
              RPCname,
              [
                this.projectID, 
                optimSummary.serverDatastoreId, 
                optimSummary.name
              ],
              {
                'plot_options': this.plotOptions, 
                'maxtime': maxtime, 
                'tool': this.toolName(), 
                'plotyear': this.simEndYear, 
                'pops': this.activePop, 
                'cascade': null
              }
            ])  // should this last be null?
            .then(response => {
              this.getOptimTaskState(optimSummary) // Get the task state for the optimization.
              if (!this.pollingTasks) {
                this.doTaskPolling(true)
              }                
              this.$sciris.succeed(this, 'Started optimization')
            })
            .catch(error => {
              this.$sciris.fail(this, 'Could not start optimization', error)
            })
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not save optimizations', error)
        })
    },

    plotResults(optimSummary) {
      this.displayResultName = optimSummary.name;
      this.displayResultDatastoreId = optimSummary.serverDatastoreId;
      this.reloadGraphs(optimSummary.serverDatastoreId, true)
    },
  }
}

export default OptimizationMixin;
