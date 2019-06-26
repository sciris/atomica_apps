import utils from "../utils"
import sciris from "sciris-js";

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
      this.getPlotOptions(this.$store.state.activeProject.project.id)
      this.updateSets()
      this.getOptimSummaries()
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

    async getOptimTaskState(optimSummary) {
      console.log('getOptimTaskState() called for with: ' + optimSummary.status);
      let statusStr = '';
      try {
        let result = await this.$sciris.rpc('check_task', [optimSummary.serverDatastoreId]); // Check the status of the task.
        statusStr = result.data.task.status;
        optimSummary.status = statusStr;
        optimSummary.pendingTime = result.data.pendingTime;
        optimSummary.executionTime = result.data.executionTime;
        if (optimSummary.status === 'error') {
          optimSummary.errorMsg = result.data.task.errorMsg;
          optimSummary.errorText = result.data.task.errorText;
          console.log('Error in task: ', optimSummary.serverDatastoreId);
          console.log(result.data.task.errorText)
        } else {
          optimSummary.errorMsg = undefined;
          optimSummary.errorText = undefined; // Clear the error
        }
      } catch (error) {
        console.log(error);
        optimSummary.status = 'not started';
        optimSummary.pendingTime = '--';
        optimSummary.executionTime = '--';
        optimSummary.errorMsg = undefined;
        optimSummary.errorText = undefined
      }
    },

    showError(optimSummary){
      console.log(optimSummary.errorText);
      console.log(optimSummary.errorMsg);
      this.$sciris.fail(this,'Optimization error',{message:optimSummary.errorMsg});
    },

    needToPoll() {
      // Check if we're still on the Optimizations page.
      let routePath = (this.$route.path === '/optimizations');

      // Check if we have a queued or started task.
      let runningState = false;
      this.optimSummaries.forEach(optimSum => {
        if ((optimSum.status === 'queued') || (optimSum.status === 'started')) {
          runningState = true
        }
      });

      // We need to poll if we are in the page and a task is going.
      return (routePath && runningState)
    },

    pollAllTaskStates(checkAllTasks) {
      return new Promise((resolve, reject) => {
        console.log('Polling all tasks...');

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

    startPolling(){
      // This function adds the status and execution time fields ot the optim summary
      // Then it starts polling, which will first do a single round to check all optimizations,
      // and then continue polling or not depending on whether any of them are initializing or running
      // It should be called whenever the optimSummaries are updated from an RPC, because after updating in
      // an RPC, they will generally be missing the status/time fields - they may be present due to not
      // explicitly stripping them out, but in that case they would be out of date anyway
      this.optimSummaries.forEach(optimSum => { // For each of the optimization summaries...
        optimSum.serverDatastoreId = this.$store.state.activeProject.project.id + ':opt-' + optimSum.name // Build a task and results cache ID from the project's hex UID and the optimization name.
        optimSum.status = 'not started' // Set the status to 'not started' by default, and the pending and execution times to '--'.
        optimSum.pendingTime = '--'
        optimSum.executionTime = '--'
      })
      this.doTaskPolling(true)  // start task polling, kicking off with running check_task() for all optimizations
    },

    async getOptimSummaries() {
      console.log('getOptimSummaries() called')
      this.$sciris.start(this)
      try{
        let response = await this.$sciris.rpc('get_optim_info', [this.projectID]) // Get the current project's optimization summaries from the server.
        this.optimSummaries = response.data // Set the optimizations to what we received.
        this.optimsLoaded = true
        this.$sciris.succeed(this, '')
        this.startPolling()
      } catch (error) {
        this.$sciris.fail(this, 'Could not load optimizations', error)
      }
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
        this.addEditDialogOldName = null // Explicitly set no old name so that the update_optim RPC knows to append
        this.$modal.show('add-optim')
        console.log(this.defaultOptim)
      })
    },

    async saveOptim() {
      console.log('saveOptim() called');

      // Guard against duplicate names *if renaming*, otherwise de-collide
      let optimNames = this.optimSummaries.map(o => o.name);
      console.log(optimNames)
      if (this.addEditDialogMode === 'edit' && this.modalOptim.name !== this.addEditDialogOldName && optimNames.includes(this.modalOptim.name)){
          this.$sciris.fail(this, 'Another optimization with that name already exists');
          return
      } else if (this.addEditDialogMode === 'add') {
        this.modalOptim.name = this.$sciris.getUniqueName(this.modalOptim.name, optimNames) // De-collide the name. If something else fails validation, this will be made visible to the user
        console.log('Set name to ' + this.modalOptim.name)
      }

      // Save it to the project and recover the sanitized json
      this.$sciris.start(this);

      try{
        let response = await this.$sciris.rpc('update_optim', [this.projectID, this.modalOptim, this.addEditDialogOldName]);
        var newOptim = response.data;
        newOptim.serverDatastoreId = this.$store.state.activeProject.project.id + ':opt-' + newOptim.name;  // Give it a Datastore ID
      } catch (error) {
        this.$sciris.fail(this, 'Could not save optimization', error);
        return
      }

      this.$modal.hide('add-optim'); // Optimization was saved, so we can hide the modal now

      // If we are editing an existing intervention, we need to both replace the summary, and cancel any existing task
      // If the user didn't rename, then they probably changed something else, so the task needs to be deleted
      // If they did rename, then the results won't be accessible under the old task ID, so it should again be cleared
      if (this.addEditDialogMode === 'edit') {
        var idx = this.optimSummaries.findIndex(o => o.name === this.addEditDialogOldName);
        if (this.modalOptim.name === this.addEditDialogOldName) {
          await this.clearTask(this.optimSummaries[idx]) // If the name did NOT change, then we need to wait for this to finish before we can update the new optim's task state
        } else {
          this.clearTask(this.optimSummaries[idx]) // Otherwise, just do it in the background
        }
      }

      // Now, populate the task state. The task generally should NOT be running, this is just to assign the fields
      await this.getOptimTaskState(newOptim);
      this.$sciris.succeed(this, '');

      // Finally, put it in the list
      if (this.addEditDialogMode === 'edit') {
        this.optimSummaries.splice(idx, 1, newOptim); // Using splice updates the DOM
      } else {
        this.optimSummaries.push(newOptim);
      }
    },

    cancelOptim() {
      this.$modal.hide('add-optim')
      this.resetModal(this.defaultOptim)
    },

    resetModal(optimData) {
      console.log('resetModal() called');
      this.modalOptim = _.cloneDeep(optimData);
      console.log(this.modalOptim)
    },

    editOptim(optimSummary) {
      // Open a model dialog for creating a new project
      console.log('editOptim() called');
      this.resetModal(optimSummary);
      this.addEditDialogMode = 'edit';
      this.addEditDialogOldName = this.modalOptim.name;
      this.$modal.show('add-optim');
    },

    async copyOptim(optimSummary) {
      console.log('copyOptim() called');
      this.$sciris.start(this);
      var newOptim = _.cloneDeep(optimSummary);
      newOptim.name = this.$sciris.getUniqueName(newOptim.name, this.optimSummaries.map(o => o.name));
      newOptim.serverDatastoreId = this.$store.state.activeProject.project.id + ':opt-' + newOptim.name;

      try {
        await Promise.all([this.getOptimTaskState(newOptim), this.$sciris.rpc('update_optim', [this.projectID, newOptim])]); // Safe to do both at once, because the task state doesn't matter to the Project
        this.optimSummaries.push(newOptim);
        this.$sciris.succeed(this, 'Optimization copied');
      } catch (error) {
        this.$sciris.fail(this, 'Could not copy optimization', error);
      }
    },

    async deleteOptim(optimSummary) {
      console.log('deleteOptim() called')
      this.$sciris.start(this)

      // If the optimization is running or has results, clear the task
      if (optimSummary.status !== 'not started') {
        this.clearTask(optimSummary)
      }

      try {
        await this.$sciris.rpc('delete_optim', [this.projectID, optimSummary.name])
        this.optimSummaries.splice(this.optimSummaries.findIndex(o => o.name === optimSummary.name), 1);
        this.$sciris.succeed(this, 'Optimization deleted')
      } catch (error) {
        this.$sciris.fail(this, 'Could not delete optimization', error)
      }
    },


    async runOptim(optimSummary, maxtime) {
      console.log('runOptim() called for ' + this.currentOptim + ' for time: ' + maxtime)
      this.validateYears()  // Make sure the end year is sensibly set.
      this.$sciris.start(this)
      var RPCname = this.getOptimizationRPCName();
      try {
        await this.$sciris.rpc('launch_task', [
          optimSummary.serverDatastoreId,
          RPCname,
          [this.projectID, optimSummary.serverDatastoreId, optimSummary.name],
          {'maxtime': maxtime}
        ]);
        this.$sciris.succeed(this, 'Started optimization')
      } catch (error) {
        this.$sciris.fail(this, 'Could not start optimization', error)
      }

      await this.getOptimTaskState(optimSummary); // Get the task state for the optimization.
      if (!this.pollingTasks) {
        this.doTaskPolling(true) // Note we need to set the optimSummary's task state first so that will get picked up by this call
      }
    },

    plotResults(optimSummary) {
      this.displayResultName = optimSummary.name;
      this.displayResultDatastoreId = optimSummary.serverDatastoreId;
      this.reloadGraphs(optimSummary.serverDatastoreId, true)
    },
  }
}

export default OptimizationMixin;
