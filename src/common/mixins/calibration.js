import utils from "../utils"

var CalibrationMixin = {
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
        table: null, // Not actually used on this page
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
        mousex: -1,
        mousey: -1,
        figscale: 1.0,

        // Page-specific data
        parlist: [],
        poplabels:[],
        origParsetName: [],
        showParameters: false,
        calibTime: '30 seconds',
        calibTimes: ['30 seconds', 'Unlimited'],
        filterPlaceholder: 'Type here to filter parameters', // Placeholder text for second table filter box
        filterText: '', // Text in the first table filter box
      }
    },

    computed: {
      projectID()    { return utils.projectID(this) },
      hasData()      { return utils.hasData(this) },
      hasPrograms()  { return utils.hasPrograms(this) },
      simStart()     { return utils.simStart(this) },
      simEnd()       { return utils.simEnd(this) },
      simYears()     { return utils.simYears(this) },
      simCascades()  { return utils.simCascades(this) },
      activePops()   { return utils.activePops(this) },

      filteredParlist() {
        return this.applyParametersFilter(this.parlist)
      }
    },

    created() {
      this.$sciris.addListener(this)
      this.$sciris.createDialogs(this)
      if ((this.$store.state.activeProject.project !== undefined) &&
        (this.$store.state.activeProject.project.hasData) ) {
        console.log('created() called')
        this.simStartYear = this.simStart
        this.simEndYear = this.simEnd
        this.popOptions = this.activePops
        this.activeCascade = this.simCascades[0]
        this.serverDatastoreId = this.$store.state.activeProject.project.id + ':calibration'
        this.getPlotOptions(this.$store.state.activeProject.project.id)
          .then(response => {
            this.updateSets()
              .then(response2 => {
                this.loadParTable()
                  .then(response3 => {
                    this.reloadGraphs(false)
                  })
              })
          })
      }
    },

    watch: {
//      activeParset() {
//        this.loadParTable()
//      }
    },

    methods: {

      validateYears(){ 
        return utils.validateYears(this) 
      },
      updateSets(){ 
        return utils.updateSets(this) 
      },
      exportGraphs() { 
        return utils.exportGraphs(this) 
      },
      exportResults(datastoreID) { 
        return utils.exportResults(this, datastoreID) 
      },
      scaleFigs(frac) { 
        return this.$sciris.scaleFigs(this, frac)
      },
      clearGraphs() { 
        return this.$sciris.clearGraphs(this) 
      },
      togglePlotControls() { 
        return utils.togglePlotControls(this) 
      },
      getPlotOptions(project_id) { 
        return utils.getPlotOptions(this, project_id, true) 
      },
/*      makeGraphs(graphdata) { 
        return this.$sciris.makeGraphs(this, graphdata, '/calibration') 
      }, */
      makeGraphs(graphdata) { 
        return utils.makeGraphs(this, graphdata, '/calibration') 
      },       
      reloadGraphs(showErr) { 
        // Set to calibration=true
        utils.validateYears(this)  // Make sure the start end years are in the right range.
        if (this.showPlotControls) {
          this.scaleFigs(1.0)
          this.showPlotControls = false
        }        
        return utils.reloadGraphs(
          this, 
          this.projectID, 
          this.serverDatastoreId, 
          showErr, 
          true
        ) 
      }, 
      maximize(legend_id) { 
        return this.$sciris.maximize(this, legend_id) 
      },
      minimize(legend_id) { 
        return this.$sciris.minimize(this, legend_id) 
      },

      toggleParams() {
        this.showParameters = !this.showParameters
      },

      loadParTable() {
        return new Promise((resolve, reject) => {
          console.log('loadParTable() called for ' + this.activeParset)
          // TODO: Get spinners working right for this leg of initialization.
          this.$sciris.rpc('get_y_factors', [
            this.projectID, 
            this.activeParset, 
            this.toolName(), 
          ])
          .then(response => {
            this.parlist = response.data.parlist // Get the parameter values
            var tmpParset = _.cloneDeep(this.activeParset)
            this.activeParset = null
            this.$sciris.sleep(500).then(response => {
              this.activeParset = tmpParset
            })
            this.parlist.push('Update Vue DOM')
            this.parlist.pop()
            this.poplabels = response.data.poplabels
            console.log(response)
            console.log(this.poplabels)
            console.log(this.parlist)
            resolve(response)
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not load parameters', error)
            reject(error)
          })
        })
      },

      saveParTable() {
        return new Promise((resolve, reject) => {
          this.$sciris.rpc('set_y_factors', [
            this.projectID, 
            this.activeParset, 
            this.parlist, 
            this.toolName(), 
          ])
          .then(response => {
            this.loadParTable()
              .then(response2 => {
                this.$sciris.succeed(this, 'Parameters updated')
                this.manualCalibration(this.projectID)
                resolve(response2)
              })
            resolve(response)
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not save parameters', error)
            reject(error)
          })
        })
      },

      applyParametersFilter(parlist) {
        return parlist.filter(par => ((par.parcategory.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1)
                                      || (par.parlabel.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1)))
      },

      renameParsetModal() {
        console.log('renameParsetModal() called');
        this.origParsetName = this.activeParset // Store this before it gets overwritten
        this.$modal.show('rename-parset');
      },

      renameParset() {
        console.log('renameParset() called for ' + this.activeParset)
        this.$modal.hide('rename-parset');
        this.$sciris.start(this)
        this.$sciris.rpc('rename_parset', [this.projectID, this.origParsetName, this.activeParset]) // Have the server copy the project, giving it a new name.
          .then(response => {
            this.updateSets() // Update the project summaries so the copied program shows up on the list.
            // TODO: look into whether the above line is necessary
            this.$sciris.succeed(this, 'Parameter set "'+this.activeParset+'" renamed') // Indicate success.
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not rename parameter set', error)
          })
      },

      copyParset() {
        console.log('copyParset() called for ' + this.activeParset)
        this.$sciris.start(this)
        this.$sciris.rpc('copy_parset', [this.projectID, this.activeParset]) // Have the server copy the project, giving it a new name.
          .then(response => {
            this.updateSets() // Update the project summaries so the copied program shows up on the list.
            // TODO: look into whether the above line is necessary
            this.activeParset = response.data
            this.$sciris.succeed(this, 'Parameter set "'+this.activeParset+'" copied') // Indicate success.
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not copy parameter set', error)
          })
      },

      deleteParset() {
        console.log('deleteParset() called for ' + this.activeParset)
        this.$sciris.start(this)
        this.$sciris.rpc('delete_parset', [this.projectID, this.activeParset]) // Have the server delete the parset.
          .then(response => {
            this.updateSets() // Update the project summaries so the deleted parset shows up on the list.
            .then(response2 => {
              this.loadParTable() // Reload the parameters.
              this.$sciris.succeed(this, 'Parameter set "'+this.activeParset+'" deleted') // Indicate success.
            })    
          })
          .catch(error => {
            this.$sciris.fail(this, 'Cannot delete last parameter set: ensure there are at least 2 parameter sets before deleting one', error)
          })
      },

      downloadParset() {
        console.log('downloadParset() called for ' + this.activeParset)
        this.$sciris.start(this)
        this.$sciris.download('download_parset', [this.projectID, this.activeParset]) // Have the server copy the project, giving it a new name.
          .then(response => { // Indicate success.
            this.$sciris.succeed(this, '')  // No green popup message.
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not download parameter set', error)
          })
      },

      uploadParset() {
        console.log('uploadParset() called')
        this.$sciris.upload('upload_parset', [this.projectID], {}, '.par') // Have the server copy the project, giving it a new name.
          .then(response => {
            this.$sciris.start(this)
            this.updateSets() // Update the project summaries so the copied program shows up on the list.
            .then(response2 => {
              this.activeParset = response.data
              this.loadParTable() // Reload the parameters.
              this.$sciris.succeed(this, 'Parameter set "' + this.activeParset + '" uploaded') // Indicate success.
            })
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not upload parameter set', error)
          })
      },

      manualCalibration(project_id) {
        console.log('manualCalibration() called')
        this.validateYears()  // Make sure the start end years are in the right range.
        this.$sciris.start(this)
        this.$sciris.rpc('manual_calibration', [
          project_id, 
          this.serverDatastoreId
        ], {
          'parsetname': this.activeParset, 
          'plot_options': this.plotOptions,
          'plotyear':this.simEndYear, 
          'pops':this.activePop, 
          'tool': this.toolName(), 
          'cascade':null
        }) // Go to the server to get the results
        .then(response => {
          this.makeGraphs(response.data)
          this.table = response.data.table
          this.$sciris.succeed(this, 'Simulation run, graphs now rendering...')
        })
        .catch(error => {
          console.log(error.message)
          this.$sciris.fail(this, 'Could not run manual calibration', error)
        })
      },

      autoCalibrate(project_id) {
        console.log('autoCalibrate() called')
        this.validateYears()  // Make sure the start end years are in the right range.
        this.$sciris.start(this)
        if (this.calibTime === '30 seconds') {
          var maxtime = 30
        } else {
          var maxtime = 9999
        }
        this.$sciris.rpc('automatic_calibration', [
          project_id, 
          this.serverDatastoreId
        ], {
          'parsetname': this.activeParset, 
          'max_time': maxtime, 
          'plot_options': this.plotOptions,
          'plotyear': this.simEndYear, 
          'pops': this.activePop, 
          'tool': this.toolName(), 
          'cascade':null
        }) // Go to the server to get the results from the package set.
        .then(response => {
          this.table = response.data.table
          this.makeGraphs(response.data)
          this.$sciris.succeed(this, 'Simulation run, graphs now rendering...')
        })
        .catch(error => {
          console.log(error.message)
          this.$sciris.fail(this, 'Could not run automatic calibration', error)
        })
      },

      reconcile() {
        console.log('reconcile() called for ' + this.activeParset)
        this.$sciris.start(this)
        this.$sciris.download('reconcile', [this.projectID, this.activeParset]) // Have the server copy the project, giving it a new name.
          .then(response => { // Indicate success.
            this.$sciris.succeed(this, '')  // No green popup message.
          })
          .catch(error => {
            this.$sciris.fail(this, 'Could not reconcile program set', error)
          })
      },
    }
}

export default CalibrationMixin 
