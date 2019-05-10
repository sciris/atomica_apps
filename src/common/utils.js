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

function simCascades(vm) {
  if (vm.$store.state.activeProject.project === undefined) {
    return ''
  } else {
    return vm.$store.state.activeProject.project.cascades
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
    sciris.status.start(vm) // Start indicating progress.
    sciris.rpcs.rpc('get_supported_plots', [project_id, true])
      .then(response => {
        vm.plotOptions = response.data // Get the parameter values
        sciris.status.succeed(vm, '')
        resolve(response)
      })
      .catch(error => {
        sciris.status.fail(vm, 'Could not get plot options', error)
        reject(error)
      })
  })
}

function togglePlotControls(vm) {
  vm.showPlotControls = !vm.showPlotControls
}

function reloadGraphs(vm, project_id, cache_id, showNoCacheError, iscalibration, plotbudget) {
  console.log('reloadGraphs() called')
  sciris.status.start(vm)
  sciris.rpcs.rpc('plot_results', [
    project_id, 
    cache_id, 
    vm.plotOptions
  ], {
    tool: vm.toolName(), 
    cascade: vm.activeCascade,
    plotyear: vm.simEndYear,
    pops: vm.activePop, 
    calibration: iscalibration, 
    plotbudget: plotbudget
  }).then(response => {
    vm.table = response.data.table
    vm.makeGraphs(response.data)
    sciris.status.succeed(vm, 'Data loaded, graphs now rendering...')
  }).catch(error => {
    if (showNoCacheError) {
      sciris.status.fail(vm, 'Could not make graphs', error)
    }
    else {
      sciris.status.succeed(vm, '')  // Silently stop progress bar and spinner.
    }
  })
}

function makeGraphs(vm, data, routepath) {
  if (typeof d3 === 'undefined'){
    console.log("please include d3 to use the makeGraphs function")
    return false;
  }
  if (routepath && routepath !== vm.$route.path) { // Don't render graphs if we've changed page
    console.log('Not rendering graphs since route changed: ' + routepath + ' vs. ' + vm.$route.path)
  }
  else { // Proceed...
    let waitingtime = 0.5
    var graphdata = data.graphs
    var graphtypes = data.types
    // var legenddata = data.legends
    sciris.status.start(vm) // Start indicating progress.
    vm.hasGraphs = true
    sciris.utils.sleep(waitingtime * 1000)
      .then(response => {
        let n_plots = graphdata.length
        // let n_legends = legenddata.length
        console.log('Rendering ' + n_plots + ' graphs')
        // if (n_plots !== n_legends) {
        //   console.log('WARNING: different numbers of plots and legends: ' + n_plots + ' vs. ' + n_legends)
        // }
        for (var index = 0; index <= n_plots; index++) {
          console.log('Rendering plot ' + index)
          var figlabel    = 'fig' + index
          var figdiv  = document.getElementById(figlabel); // CK: Not sure if this is necessary? To ensure the div is clear first
          if (figdiv) {
            while (figdiv.firstChild) {
              figdiv.removeChild(figdiv.firstChild);
            }
          } else {
            console.log('WARNING: figdiv not found: ' + figlabel)
          }

          // Show figure containers
          if (index>=1 && index<n_plots) {
            var figcontainerlabel = 'figcontainer' + index
            var figcontainerdiv = document.getElementById(figcontainerlabel); // CK: Not sure if this is necessary? To ensure the div is clear first
            if (figcontainerdiv) {
              figcontainerdiv.style.display = 'flex'
            } else {
              console.log('WARNING: figcontainerdiv not found: ' + figcontainerlabel)
            }

            // var legendlabel = 'legend' + index
            // var legenddiv  = document.getElementById(legendlabel);
            // if (legenddiv) {
            //   while (legenddiv.firstChild) {
            //     legenddiv.removeChild(legenddiv.firstChild);
            //   }
            // } else {
            //   console.log('WARNING: legenddiv not found: ' + legendlabel)
            // }
          }

          // Draw the figure
          try {
            // If we are dealing with a cascade or budget figure... 
            if (graphtypes[index] == "cascade" || graphtypes[index] == "budget") {
              sciris.graphs.mpld3.draw_figure(figlabel, graphdata[index], function (fig, element) {
                fig.axes[0].axisList[0].props.tickformat_formatter = "fixed"         
              }, true);
              
            // Otherwise (if we are dealing with a framework or coverage figure)...
            } else {
              sciris.graphs.mpld3.draw_figure(figlabel, graphdata[index], function (fig, element) {
                fig.setXTicks(6, function (d) {
                  return d3.format('.0f')(d);
                });
              }, true);                
            }
          } catch (error) {
            console.log('Could not plot graph: ' + error.message)
          }

          // Draw legends
          // if (index>=1 && index<n_plots) {
          //   try {
          //     mpld3.draw_figure(legendlabel, legenddata[index], function (fig, element) {
          //     });
          //   } catch (error) {
          //     console.log(error)
          //   }
          //
          // }
          vm.showGraphDivs[index] = true;
        }
        sciris.status.succeed(vm, 'Graphs created') // CK: This should be a promise, otherwise this appears before the graphs do
      })
  }
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
  simCascades,
  dataStart,
  dataEnd,
  dataYears,
  projectionYears,
  activePops,
  updateSorting,

  reloadGraphs,
  togglePlotControls,
  getPlotOptions,
  
  makeGraphs,
}
