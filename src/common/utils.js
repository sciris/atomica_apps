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
  if (vm.$store.state.activeProject === undefined) {
    return ''
  } else {
    let projectID = vm.$store.state.activeProject.id
    return projectID
  }
}

function hasData(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return false
  }
  else {
    return vm.$store.state.activeProject.hasData
  }
}

function hasPrograms(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return false
  }
  else {
    return vm.$store.state.activeProject.hasPrograms
  }
}

function simStart(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return ''
  } else {
    return vm.$store.state.activeProject.sim_start
  }
}

function simEnd(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return ''
  } else {
    return vm.$store.state.activeProject.sim_end
  }
}

function simYears(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return []
  } else {
    var sim_start = vm.$store.state.activeProject.sim_start
    var sim_end = vm.$store.state.activeProject.sim_end
    var years = []
    for (var i = sim_start; i <= sim_end; i++) {
      years.push(i);
    }
    console.log('Sim years: ' + years)
    return years;
  }
}

function simCascades(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return ''
  } else {
    return vm.$store.state.activeProject.cascades
  }
}

function dataStart(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return ''
  } else {
    return vm.$store.state.activeProject.data_start
  }
}

function dataEnd(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return ''
  } else {
    console.log('dataEnd: ' + vm.$store.state.activeProject.data_end)
    return vm.$store.state.activeProject.data_end
  }
}

function dataYears(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return []
  } else {
    let data_start = vm.$store.state.activeProject.data_start
    let data_end = vm.$store.state.activeProject.data_end
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
  if (vm.$store.state.activeProject === undefined) {
    return []
  } else {
    let data_end = vm.$store.state.activeProject.data_end
    let sim_end = vm.$store.state.activeProject.sim_end
    let years = []
    for (let i = data_end; i <= sim_end; i++) {
      years.push(i);
    }
    console.log('projection years: ' + years)
    return years;
  }
}

function activePops(vm) {
  if (vm.$store.state.activeProject === undefined) {
    return ''
  } else {
    let pop_pairs = vm.$store.state.activeProject.pops
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

async function updateSets(vm) {

  // Simultaneously request the parset and progset data, taking advantage of server-side multiprocessing
  let [parset_response, progset_response] = await Promise.all([sciris.rpcs.rpc('get_parset_names', [vm.projectID]), sciris.rpcs.rpc('get_progset_names', [vm.projectID])]);

  // Assign parsets
  vm.parsetOptions = parset_response.data // Assign the parset options
  if (vm.parsetOptions.indexOf(vm.activeParset) === -1) {
    console.log('Parameter set ' + vm.activeParset + ' no longer found')
    vm.activeParset = vm.parsetOptions[0] // If the active parset no longer exists in the array, reset it
  } else {
    console.log('Parameter set ' + vm.activeParset + ' still found')
  }
  vm.newParsetName = vm.activeParset // WARNING, KLUDGY

  // Assign progsets
  vm.progsetOptions = progset_response.data // Set the scenarios to what we received.
  if (vm.progsetOptions.indexOf(vm.activeProgset) === -1) {
    console.log('Program set ' + vm.activeProgset + ' no longer found')
    vm.activeProgset = vm.progsetOptions[0] // If the active parset no longer exists in the array, reset it
  } else {
    console.log('Program set ' + vm.activeProgset + ' still found')
  }
  vm.newProgsetName = vm.activeProgset // WARNING, KLUDGY

  console.log('Parset options: ' + vm.parsetOptions)
  console.log('Active parset: ' + vm.activeParset)
  console.log('Progset options: ' + vm.progsetOptions)
  console.log('Active progset: ' + vm.activeProgset)

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

function getPlotOptions(vm, project_id, calibration_page) {
  return new Promise((resolve, reject) => {
    console.log('getPlotOptions() called')
    sciris.status.start(vm) // Start indicating progress.
    sciris.rpcs.rpc('get_supported_plots', [project_id, vm.toolName(), calibration_page, true])
      .then(response => {
        vm.plotOptions = response.data // Get the parameter values
        vm.plotGroupsListCollapsed = []
        for (var ind = 0; ind < vm.plotOptions.plotgroups.length; ind++) {
          vm.plotGroupsListCollapsed.push(true)
        }
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
  // Exit if the d3 library is not not included.
  if (typeof d3 === 'undefined'){ 
    console.log("please include d3 to use the makeGraphs function")
    return false;
  }
  
  // Don't render graphs if we've changed page
  if (routepath && routepath !== vm.$route.path) { 
    console.log('Not rendering graphs since route changed: ' + routepath + ' vs. ' + vm.$route.path)
  }
  
  // Otherwise, proceed...
  else {
    let waitingtime = 0.5
    let graphdata = data.graphs
    // let legenddata = data.legends
    let graphtypes = data.types
    
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
        
        // Remove all existing plots for all of the graph types.
        let outcomeGraphsDivs = document.getElementsByClassName("outcome-graphs")
        if (outcomeGraphsDivs) {
          while (outcomeGraphsDivs[0].children[0]) {
            outcomeGraphsDivs[0].removeChild(outcomeGraphsDivs[0].children[0])
          }
        }
        let budgetGraphsDivs = document.getElementsByClassName("budget-graphs")
        if (budgetGraphsDivs) {
          while (budgetGraphsDivs[0].children[0]) {
            budgetGraphsDivs[0].removeChild(budgetGraphsDivs[0].children[0])
          }
        }        
        let coverageGraphsDivs = document.getElementsByClassName("coverage-graphs")
        if (coverageGraphsDivs) {
          while (coverageGraphsDivs[0].children[0]) {
            coverageGraphsDivs[0].removeChild(coverageGraphsDivs[0].children[0])
          }
        }        
        let cascadeGraphsDivs = document.getElementsByClassName("cascade-graphs")
        if (cascadeGraphsDivs) {
          while (cascadeGraphsDivs[0].children[0]) {
            cascadeGraphsDivs[0].removeChild(cascadeGraphsDivs[0].children[0])
          }
        }

        if (vm.toolName() === 'tb') {
          var tbCalibrationDivs = document.getElementsByClassName("tb-calibration-graphs")
          if (tbCalibrationDivs) {
            while (tbCalibrationDivs[0].children[0]) {
              tbCalibrationDivs[0].removeChild(tbCalibrationDivs[0].children[0])
            }
          }
          var tbCascadeDivs = document.getElementsByClassName("tb-cascade-graphs")
          if (tbCascadeDivs) {
            while (tbCascadeDivs[0].children[0]) {
              tbCascadeDivs[0].removeChild(tbCascadeDivs[0].children[0])
            }
          }
          var tbAdvancedDivs = document.getElementsByClassName("tb-advanced-graphs")
          if (tbAdvancedDivs) {
            while (tbAdvancedDivs[0].children[0]) {
              tbAdvancedDivs[0].removeChild(tbAdvancedDivs[0].children[0])
            }
          }
        }

        // Remove all existing graph-header (class) elements.
        let headers = document.getElementsByClassName("graph-header")
        while (headers[0]) {
          headers[0].parentNode.removeChild(headers[0])
        }
        
        // Initialize the indices for the first occurrences of graph types.
        let firstOutcomeInd = -1
        let firstBudgetInd = -1
        let firstCoverageInd = -1
        let firstCascadeInd = -1
        let firstTBCalibrationInd = -1
        let firstTBCascadeInd = -1
        let firstTBAdvancedInd = -1

        // Loop over all of the plots...
        for (var index = 0; index < n_plots; index++) {
          console.log('Rendering plot ' + index + '. Type is ' + graphtypes[index])
          var figlabel = 'fig' + index
          var newfigdiv
          var figcontainerlabel = 'figcontainer' + index
          var newfigcontdiv
          
          if ((graphtypes[index] == "framework") && (outcomeGraphsDivs)) {
            // Create the figure container and put it in the outcome graphs div.
            newfigcontdiv = document.createElement("DIV")
            newfigcontdiv.id = figcontainerlabel
            newfigcontdiv.style.display = 'flex'
            newfigcontdiv.style.justifyContent = 'flex-start'
            newfigcontdiv.style.padding = '5px'
            newfigcontdiv.style.border = '1px solid #ddd'
            outcomeGraphsDivs[0].appendChild(newfigcontdiv)
            
            // Create a new figure and put it in that fig container.
            newfigdiv = document.createElement("DIV")
            newfigdiv.id = figlabel
            newfigcontdiv.appendChild(newfigdiv)           
          } else if ((graphtypes[index] == "budget") && (budgetGraphsDivs)) {
            // Create the figure container and put it in the budget graphs div.
            newfigcontdiv = document.createElement("DIV")
            newfigcontdiv.id = figcontainerlabel
            newfigcontdiv.style.display = 'flex'
            newfigcontdiv.style.justifyContent = 'flex-start'
            newfigcontdiv.style.padding = '5px'
            newfigcontdiv.style.border = '1px solid #ddd'
            budgetGraphsDivs[0].appendChild(newfigcontdiv)
            
            // Create a new figure and put it in that fig container.
            newfigdiv = document.createElement("DIV")
            newfigdiv.id = figlabel
            newfigcontdiv.appendChild(newfigdiv)           
          } else if ((graphtypes[index] == "coverage") && (coverageGraphsDivs)) {
            // Create the figure container and put it in the coverage graphs div.
            newfigcontdiv = document.createElement("DIV")
            newfigcontdiv.id = figcontainerlabel
            newfigcontdiv.style.display = 'flex'
            newfigcontdiv.style.justifyContent = 'flex-start'
            newfigcontdiv.style.padding = '5px'
            newfigcontdiv.style.border = '1px solid #ddd'
            coverageGraphsDivs[0].appendChild(newfigcontdiv)
            
            // Create a new figure and put it in that fig container.
            newfigdiv = document.createElement("DIV")
            newfigdiv.id = figlabel
            newfigcontdiv.appendChild(newfigdiv)           
          } else if ((graphtypes[index] == "cascade") && (cascadeGraphsDivs)) {
            newfigdiv = document.createElement("DIV")
            newfigdiv.id = figlabel
            cascadeGraphsDivs[0].appendChild(newfigdiv)           
          } else if ((graphtypes[index] == "tb-calibration") && (tbCalibrationDivs)) {
            // Create the figure container and put it in the coverage graphs div.
            newfigcontdiv = document.createElement("DIV")
            newfigcontdiv.id = figcontainerlabel
            newfigcontdiv.style.display = 'flex'
            newfigcontdiv.style.justifyContent = 'flex-start'
            newfigcontdiv.style.padding = '5px'
            newfigcontdiv.style.border = '1px solid #ddd'
            tbCalibrationDivs[0].appendChild(newfigcontdiv)

            // Create a new figure and put it in that fig container.
            newfigdiv = document.createElement("DIV")
            newfigdiv.id = figlabel
            newfigcontdiv.appendChild(newfigdiv)
          } else if ((graphtypes[index] == "tb-advanced") && (tbAdvancedDivs)) {
            // Create the figure container and put it in the coverage graphs div.
            newfigcontdiv = document.createElement("DIV")
            newfigcontdiv.id = figcontainerlabel
            newfigcontdiv.style.display = 'flex'
            newfigcontdiv.style.justifyContent = 'flex-start'
            newfigcontdiv.style.padding = '5px'
            newfigcontdiv.style.border = '1px solid #ddd'
            tbAdvancedDivs[0].appendChild(newfigcontdiv)

            // Create a new figure and put it in that fig container.
            newfigdiv = document.createElement("DIV")
            newfigdiv.id = figlabel
            newfigcontdiv.appendChild(newfigdiv)
          } else if ((graphtypes[index] == "tb-cascade") && (tbCascadeDivs)) {
            // Create the figure container and put it in the budget graphs div.
            newfigcontdiv = document.createElement("DIV")
            newfigcontdiv.id = figcontainerlabel
            newfigcontdiv.style.display = 'flex'
            newfigcontdiv.style.justifyContent = 'flex-start'
            newfigcontdiv.style.padding = '5px'
            newfigcontdiv.style.border = '1px solid #ddd'
            tbCascadeDivs[0].appendChild(newfigcontdiv)

            // Create a new figure and put it in that fig container.
            newfigdiv = document.createElement("DIV")
            newfigdiv.id = figlabel
            newfigcontdiv.appendChild(newfigdiv)
          }

          // Draw the mpld3 figure into the figN div where it belongs.
          try {
            // If we are dealing with a cascade or budget figure... 
            if (graphtypes[index] == "cascade" || graphtypes[index] == "budget" || 
              graphtypes[index] == "tb-cascade") {
              sciris.graphs.mpld3.draw_figure(figlabel, graphdata[index], function (fig, element) {
                fig.axes[0].axisList[0].props.tickformat_formatter = "fixed"         
              }, true)
              
            // Otherwise (if we are dealing with a framework or coverage figure)...
            } else {
              sciris.graphs.mpld3.draw_figure(figlabel, graphdata[index], function (fig, element) {
                fig.setXTicks(6, function (d) {
                  return d3.format('.0f')(d);
                });
              }, true)
            }
          } catch (error) {
            console.log('Could not plot graph: ' + error.message)
          }

          // Draw legends
          // if (index >= 1 && index < n_plots) {
          //   try {
          //     mpld3.draw_figure(legendlabel, legenddata[index], function (fig, element) {
          //     });
          //   } catch (error) {
          //     console.log(error)
          //   }
          //
          // }
          
          // Flag the first occurrence of the type if we encounter it.
          if ((graphtypes[index] == "framework") && (firstOutcomeInd == -1)) {
            firstOutcomeInd = index
          }
          if ((graphtypes[index] == "budget") && (firstBudgetInd == -1)) {
            firstBudgetInd = index
          }
          if ((graphtypes[index] == "coverage") && (firstCoverageInd == -1)) {
            firstCoverageInd = index
          }
          if ((graphtypes[index] == "cascade") && (firstCascadeInd == -1)) {
            firstCascadeInd = index
          }          
          if ((graphtypes[index] == "tb-calibration") && (firstTBCalibrationInd == -1)) {
            firstTBCalibrationInd = index
          }
          if ((graphtypes[index] == "tb-advanced") && (firstTBAdvancedInd == -1)) {
            firstTBAdvancedInd = index
          }
          if ((graphtypes[index] == "tb-cascade") && (firstTBCascadeInd == -1)) {
            firstTBCascadeInd = index
          }
          vm.showGraphDivs[index] = true;
        } // end of for loop
        
        // Add headings after all graphs are up.        
        var newItem, newItem2
        var textnode
        var destdiv
        
        // Add the outcome graphs heading.
        if (firstOutcomeInd != -1) {
          newItem = document.createElement("DIV")
          newItem.classList.add("graph-header")          
          newItem2 = document.createElement("BR")
          newItem.appendChild(newItem2)      
          newItem2 = document.createElement("H2")
          textnode = document.createTextNode("\u00A0\u00A0Outcome Plots")
          newItem2.appendChild(textnode)
          newItem.appendChild(newItem2)
          destdiv = outcomeGraphsDivs[0].parentNode         
          destdiv.insertBefore(newItem, outcomeGraphsDivs[0])
        }
        
        // Add the budget graphs heading.
        if (firstBudgetInd != -1) {
          newItem = document.createElement("DIV")
          newItem.classList.add("graph-header")       
          newItem2 = document.createElement("BR")
          newItem.appendChild(newItem2)        
          newItem2 = document.createElement("H2")
          textnode = document.createTextNode("\u00A0\u00A0Program Spending Plots")
          newItem2.appendChild(textnode)
          newItem.appendChild(newItem2)
          destdiv = budgetGraphsDivs[0].parentNode         
          destdiv.insertBefore(newItem, budgetGraphsDivs[0])
        }
        
        // Add the coverage graphs heading.
        if (firstCoverageInd != -1) {
          newItem = document.createElement("DIV")
          newItem.classList.add("graph-header")   
          newItem2 = document.createElement("BR")
          newItem.appendChild(newItem2)
          newItem2 = document.createElement("H2")
          textnode = document.createTextNode("\u00A0\u00A0Program Coverage Plots")
          newItem2.appendChild(textnode)
          newItem.appendChild(newItem2)
          destdiv = coverageGraphsDivs[0].parentNode         
          destdiv.insertBefore(newItem, coverageGraphsDivs[0])
        }
        
        // Add a the cascade graphs heading.
        if (firstCascadeInd != -1) {
          newItem = document.createElement("DIV")
          newItem.classList.add("graph-header")   
          newItem2 = document.createElement("BR")
          newItem.appendChild(newItem2)
          newItem2 = document.createElement("H2")
          textnode = document.createTextNode("\u00A0\u00A0Care Cascades")
          newItem2.appendChild(textnode)
          newItem.appendChild(newItem2)
          destdiv = cascadeGraphsDivs[0].parentNode         
          destdiv.insertBefore(newItem, cascadeGraphsDivs[0])
        }

        if (firstTBCalibrationInd != -1) {
          newItem = document.createElement("DIV")
          newItem.classList.add("graph-header")
          newItem2 = document.createElement("BR")
          newItem.appendChild(newItem2)
          newItem2 = document.createElement("H2")
          textnode = document.createTextNode("\u00A0\u00A0TB Calibration")
          newItem2.appendChild(textnode)
          newItem.appendChild(newItem2)
          destdiv = tbCalibrationDivs[0].parentNode
          destdiv.insertBefore(newItem, tbCalibrationDivs[0])
        }

        if (firstTBCascadeInd != -1) {
          newItem = document.createElement("DIV")
          newItem.classList.add("graph-header")
          newItem2 = document.createElement("BR")
          newItem.appendChild(newItem2)
          newItem2 = document.createElement("H2")
          textnode = document.createTextNode("\u00A0\u00A0TB Probability Cascades")
          newItem2.appendChild(textnode)
          newItem.appendChild(newItem2)
          destdiv = tbCascadeDivs[0].parentNode
          destdiv.insertBefore(newItem, tbCascadeDivs[0])
        }

        if (firstTBAdvancedInd != -1) {
          newItem = document.createElement("DIV")
          newItem.classList.add("graph-header")
          newItem2 = document.createElement("BR")
          newItem.appendChild(newItem2)
          newItem2 = document.createElement("H2")
          textnode = document.createTextNode("\u00A0\u00A0TB Advanced")
          newItem2.appendChild(textnode)
          newItem.appendChild(newItem2)
          destdiv = tbAdvancedDivs[0].parentNode
          destdiv.insertBefore(newItem, tbAdvancedDivs[0])
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
