import sciris from 'sciris-js'

/*
 * Small utilities that are shared across pages
 */

function validateYears(vm) {
  if      (vm.startYear > vm.simEnd)   { vm.startYear = vm.simEnd }
  else if (vm.startYear < vm.simStart) { vm.startYear = vm.simStart }
  if      (vm.endYear   > vm.simEnd)   { vm.endYear   = vm.simEnd }
  else if (vm.endYear   < vm.simStart) { vm.endYear   = vm.simStart }
}

function projectID(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return ''
  } else {
    let projectID = vm.$store.state.activeProject.project.id
    return projectID
  }
}

function hasData(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return false
  }
  else {
    return vm.$store.state.activeProject.project.hasData
  }
}

function hasPrograms(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return false
  }
  else {
    return vm.$store.state.activeProject.project.hasPrograms
  }
}

function simStart(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return ''
  } else {
    return vm.$store.state.activeProject.project.sim_start
  }
}

function simEnd(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return ''
  } else {
    return vm.$store.state.activeProject.project.sim_end
  }
}

function simYears(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return []
  } else {
    var sim_start = vm.$store.state.activeProject.project.sim_start
    var sim_end = vm.$store.state.activeProject.project.sim_end
    var years = []
    for (var i = sim_start; i <= sim_end; i++) {
      years.push(i);
    }
    console.log('Sim years: ' + years)
    return years;
  }
}

function dataStart(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return ''
  } else {
    return vm.$store.state.activeProject.project.data_start
  }
}

function dataEnd(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return ''
  } else {
    console.log('dataEnd: ' + vm.$store.state.activeProject.project.data_end)
    return vm.$store.state.activeProject.project.data_end
  }
}

function dataYears(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return []
  } else {
    let data_start = vm.$store.state.activeProject.project.data_start
    let data_end = vm.$store.state.activeProject.project.data_end
    let years = []
    for (let i = data_start; i <= data_end; i++) {
      years.push(i);
    }
    console.log('data years: ' + years)
    return years;
  }
}

// projection years are used for scenario and optimization plot year dropdowns
function projectionYears(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return []
  } else {
    let data_end = vm.$store.state.activeProject.project.data_end
    let sim_end = vm.$store.state.activeProject.project.sim_end
    let years = []
    for (let i = data_end; i <= sim_end; i++) {
      years.push(i);
    }
    console.log('projection years: ' + years)
    return years;
  }
}

function activePops(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return ''
  } else {
    let pop_pairs = vm.$store.state.activeProject.project.pops
    let pop_list = ["All"]
    for(let i = 0; i < pop_pairs.length; ++i) {
      pop_list.push(pop_pairs[i][1]);
    }
    return pop_list
  }
}


function updateSorting(vm, sortColumn) {
  console.log('updateSorting() called')
  if (vm.sortColumn === sortColumn) { // If the active sorting column is clicked...
    vm.sortReverse = !vm.sortReverse // Reverse the sort.
  } else { // Otherwise.
    vm.sortColumn = sortColumn // Select the new column for sorting.
    vm.sortReverse = false // Set the sorting for non-reverse.
  }
}

/*
 * Heftier functions that are shared across pages
 */

function updateSets(vm) {
  return new Promise((resolve, reject) => {
    console.log('updateSets() called')
    sciris.rpcs.rpc('get_parset_info', [vm.projectID]) // Get the current user's parsets from the server.
      .then(response => {
        vm.parsetOptions = response.data // Set the scenarios to what we received.
        if (vm.parsetOptions.indexOf(vm.activeParset) === -1) {
          console.log('Parameter set ' + vm.activeParset + ' no longer found')
          vm.activeParset = vm.parsetOptions[0] // If the active parset no longer exists in the array, reset it
        } else {
          console.log('Parameter set ' + vm.activeParset + ' still found')
        }
        vm.newParsetName = vm.activeParset // WARNING, KLUDGY
        console.log('Parset options: ' + vm.parsetOptions)
        console.log('Active parset: ' + vm.activeParset)
        sciris.rpcs.rpc('get_progset_info', [vm.projectID]) // Get the current user's progsets from the server.
          .then(response => {
            vm.progsetOptions = response.data // Set the scenarios to what we received.
            if (vm.progsetOptions.indexOf(vm.activeProgset) === -1) {
              console.log('Program set ' + vm.activeProgset + ' no longer found')
              vm.activeProgset = vm.progsetOptions[0] // If the active parset no longer exists in the array, reset it
            } else {
              console.log('Program set ' + vm.activeProgset + ' still found')
            }
            vm.newProgsetName = vm.activeProgset // WARNING, KLUDGY
            console.log('Progset options: ' + vm.progsetOptions)
            console.log('Active progset: ' + vm.activeProgset)
            resolve(response)
          })
          .catch(error => {
            sciris.status.fail(this, 'Could not get progset info', error)
            reject(error)
          })
      })
      .catch(error => {
        sciris.status.fail(this, 'Could not get parset info', error)
        reject(error)
      })
  })
    .catch(error => {
      sciris.status.fail(this, 'Could not get parset info', error)
      reject(error)
    })
}

function exportGraphs(vm) {
  return new Promise((resolve, reject) => {
    console.log('exportGraphs() called')
    sciris.rpcs.download('download_graphs', [vm.$store.state.currentUser.username])
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        sciris.status.fail(vm, 'Could not download graphs', error)
        reject(error)
      })
  })
}

function exportResults(vm, serverDatastoreId) {
  return new Promise((resolve, reject) => {
    console.log('exportResults()')
    sciris.rpcs.download('export_results', [serverDatastoreId, vm.$store.state.currentUser.username])
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        sciris.status.fail(vm, 'Could not export results', error)
        reject(error)
      })
  })
}

function updateDatasets(vm) {
  return new Promise((resolve, reject) => {
    console.log('updateDatasets() called')
    sciris.rpcs.rpc('get_dataset_keys', [vm.projectID]) // Get the current user's datasets from the server.
      .then(response => {
        vm.datasetOptions = response.data // Set the scenarios to what we received.
        if (vm.datasetOptions.indexOf(vm.activeDataset) === -1) {
          console.log('Dataset ' + vm.activeDataset + ' no longer found')
          vm.activeDataset = vm.datasetOptions[0] // If the active dataset no longer exists in the array, reset it
        } else {
          console.log('Dataset ' + vm.activeDataset + ' still found')
        }
        vm.newDatsetName = vm.activeDataset // WARNING, KLUDGY
        console.log('Datset options: ' + vm.datasetOptions)
        console.log('Active dataset: ' + vm.activeDataset)
      })
      .catch(error => {
        sciris.status.fail(this, 'Could not get dataset info', error)
        reject(error)
      })
  })
}

function getPlotOptions(vm, project_id) {
  return new Promise((resolve, reject) => {
    console.log('getPlotOptions() called')
    status.start(vm) // Start indicating progress.
    rpcs.rpc('get_supported_plots', [project_id, true])
      .then(response => {
        vm.plotOptions = response.data // Get the parameter values
        status.succeed(vm, '')
        resolve(response)
      })
      .catch(error => {
        status.fail(vm, 'Could not get plot options', error)
        reject(error)
      })
  })
}

function togglePlotControls(vm) {
  vm.showPlotControls = !vm.showPlotControls
}

function reloadGraphs(vm, project_id, cache_id, showNoCacheError, iscalibration, plotbudget) {
  console.log('reloadGraphs() called')
  status.start(vm)
  rpcs.rpc('plot_results', [
    project_id, 
    cache_id, 
    vm.plotOptions
  ], {
    tool: vm.toolName(), 
    'cascade': null, 
    plotyear: vm.endYear, 
    pops: vm.activePop, 
    calibration: iscalibration, 
    plotbudget: plotbudget
  }).then(response => {
    vm.table = response.data.table
    vm.makeGraphs(response.data)
    status.succeed(vm, 'Data loaded, graphs now rendering...')
  }).catch(error => {
    if (showNoCacheError) {
      status.fail(vm, 'Could not make graphs', error)
    }
    else {
      status.succeed(vm, '')  // Silently stop progress bar and spinner.
    }
  })
}

export default {
  updateSets,
  updateDatasets,
  exportGraphs,
  exportResults,

  validateYears,
  projectID,
  hasData,
  hasPrograms,
  simStart,
  simEnd,
  simYears,
  dataStart,
  dataEnd,
  dataYears,
  projectionYears,
  activePops,
  updateSorting,

  reloadGraphs,
  togglePlotControls,
  getPlotOptions,
}
