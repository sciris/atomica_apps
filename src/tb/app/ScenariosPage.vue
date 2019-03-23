<!--
Scenarios page

Last update: 2019-03-23
-->

<template>
  <div class="SitePage">

    <div v-if="projectID ==''">
      <div style="font-style:italic">
        <p>No project is loaded.</p>
      </div>
    </div>

    <div v-else-if="!hasData">
      <div style="font-style:italic">
        <p>Data not yet uploaded for the project.  Please upload a databook in the Projects page.</p>
      </div>
    </div>

    <div v-else-if="!hasPrograms">
      <div style="font-style:italic">
        <p>Programs not yet uploaded for the project.  Please upload a program book in the Projects page.</p>
      </div>
    </div>

    <div v-else>

      <!-- ### Start: scenarios card ### -->
      <div class="card">
        <help reflink="scenarios" label="Define scenarios"></help>
        <table class="table table-bordered table-hover table-striped" style="width: 100%">
          <thead>
          <tr>
            <th>Name</th>
            <th>Active</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="scenSummary in scenSummaries">
            <td>
              <b>{{ scenSummary.name }}</b>
            </td>
            <td style="text-align: center">
              <input type="checkbox" v-model="scenSummary.active"/>
            </td>
            <td>
              {{ scenSummary.scentype }}
            </td>
            <td style="white-space: nowrap">
              <button class="btn btn-icon" @click="editScen(scenSummary)" data-tooltip="Edit scenario"><i class="ti-pencil"></i></button>
              <button class="btn btn-icon" @click="copyScen(scenSummary)" data-tooltip="Copy scenario"><i class="ti-files"></i></button>
              <button class="btn btn-icon" @click="deleteScen(scenSummary)" data-tooltip="Delete scenario"><i class="ti-trash"></i></button>
            </td>
          </tr>
          </tbody>
        </table>

        <div>
          <button class="btn __green" :disabled="!scenariosLoaded" @click="runScens()">Run scenarios</button>
          <button class="btn __blue" :disabled="!scenariosLoaded" @click="addScenModal('budget')">Add budget scenario</button>
          <button class="btn __blue" :disabled="!scenariosLoaded" @click="addScenModal('coverage')">Add coverage scenario</button>
          <button class="btn __blue" :disabled="!scenariosLoaded" @click="addScenModal('parameter')">Add parameter scenario</button>          
        </div>
      </div>
      <!-- ### End: scenarios card ### -->


      <!-- ### Start: results card ### -->
      <div class="PageSection" v-if="hasGraphs">
        <div class="card">
          <!-- ### Start: plot controls ### -->
          <div class="calib-title">
            <help reflink="results-plots" label="Results"></help>
            <div>

              <b>Year: &nbsp;</b>
              <select v-model="simEndYear" @change="reloadGraphs(true)">
                <option v-for='year in projectionYears'>
                  {{ year }}
                </option>
              </select>
              &nbsp;&nbsp;&nbsp;
              <b>Population: &nbsp;</b>
              <select v-model="activePop" @change="reloadGraphs(true)">
                <option v-for='pop in activePops'>
                  {{ pop }}
                </option>
              </select>&nbsp;&nbsp;&nbsp;
              <button class="btn btn-icon" @click="scaleFigs(0.9)" data-tooltip="Zoom out">&ndash;</button>
              <button class="btn btn-icon" @click="scaleFigs(1.0)" data-tooltip="Reset zoom"><i class="ti-zoom-in"></i></button>
              <button class="btn btn-icon" @click="scaleFigs(1.1)" data-tooltip="Zoom in">+</button>&nbsp;&nbsp;&nbsp;
              <button class="btn" @click="exportGraphs()">Export graphs</button>
              <button class="btn" @click="exportResults(serverDatastoreId)">Export data</button>
              <button v-if="false" class="btn btn-icon" @click="togglePlotControls()"><i class="ti-settings"></i></button> <!-- When popups are working: v-if="$globaltool=='tb'" -->
            </div>
          </div>
          <!-- ### End: plot controls ### -->


          <!-- ### Start: results and plot selectors ### -->
          <div class="calib-card-body">

            <!-- ### Start: plots ### -->
            <div class="calib-card-body">
              <div class="calib-graphs">

                <div class="other-graphs">
                  <div v-for="index in placeholders">
                    <div :id="'figcontainer'+index" style="display:flex; justify-content:flex-start; padding:5px; border:1px solid #ddd" v-show="showGraphDivs[index]">
                      <div :id="'fig'+index" class="calib-graph">
                        <!--mpld3 content goes here-->
                      </div>
                      <!--<div style="display:inline-block">-->
                      <!--<button class="btn __bw btn-icon" @click="maximize(index)" data-tooltip="Show legend"><i class="ti-menu-alt"></i></button>-->
                      <!--</div>-->
                    </div>
                  </div>
                </div>

                <!-- ### Start: Cascade plot ### -->
                <div class="featured-graphs">
                  <div :id="'fig0'">
                    <!-- mpld3 content goes here, no legend for it -->
                  </div>
                </div>
                <!-- ### End: Cascade plot ### -->

              </div> <!-- ### End: calib-graphs ### -->
            </div>
            <!-- ### End: plots ### -->

            <!-- ### Start: dialogs ### -->
            <!--<div v-for="index in placeholders">-->
            <!--<div class="dialogs" :id="'legendcontainer'+index" style="display:flex" v-show="showLegendDivs[index]">-->
            <!--<dialog-drag :id="'DD'+index"-->
            <!--:key="index"-->
            <!--@close="minimize(index)"-->
            <!--:options="{top: openDialogs[index].options.top, left: openDialogs[index].options.left}">-->

            <!--<span slot='title' style="color:#fff">Legend</span>-->
            <!--<div :id="'legend'+index">-->
            <!--&lt;!&ndash; Legend content goes here&ndash;&gt;-->
            <!--</div>-->
            <!--</dialog-drag>-->
            <!--</div>-->
            <!--</div>-->
            <!-- ### End: dialogs ### -->


            <!-- ### Start: plot selectors ### -->
            <div class="plotopts-main" :class="{'plotopts-main--full': !showPlotControls}" v-if="showPlotControls">
              <div class="plotopts-params">
                <table class="table table-bordered table-hover table-striped" style="width: 100%">
                  <thead>
                  <tr>
                    <th>Plot</th>
                    <th>Active</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="item in plotOptions">
                    <td>
                      {{ item.plot_name }}
                    </td>
                    <td style="text-align: center">
                      <input type="checkbox" v-model="item.active"/>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <!-- ### End: plot selectors ### -->

          </div>  <!-- ### End: card body ### -->
        </div> <!-- ### End: results card ### -->
      </div> <!-- ### End: PageSection/hasGraphs ### -->
    </div> <!-- ### End: v-else project (results) ### -->


    <!-- ### Start: add scenarios modal ### -->
    <modal name="add-edit-scen"
           height="auto"
           :scrollable="true"
           :width="1000"
           :classes="['v--modal', 'vue-dialog']"
           :pivot-y="0.3"
           :adaptive="true">

      <div class="dialog-content">
        <div class="dialog-c-title" v-if="addEditModal.mode=='add'">
          Add scenario
        </div>
        <div class="dialog-c-title" v-else>
          Edit scenario
        </div>
        <div class="dialog-c-text">
          <b>Scenario name</b><br>
          <input type="text"
                 class="txbox"
                 v-model="addEditModal.scenSummary.name"/><br>
                      
          <div style="display:inline-block; padding-right:10px">
            <b>Parameter set</b><br>
            <select v-model="addEditModal.scenSummary.parsetname">
              <option v-for='parset in parsetOptions'>
                {{ parset }}
              </option>
            </select><br><br>
          </div>
          <div style="display:inline-block; padding-right:10px">
            <b>Program set</b><br>
            <select @change="changeProgset()" v-model="addEditModal.scenSummary.progsetname">
              <option>None</option>
              <option v-for='progset in progsetOptions'>
                {{ progset }}
              </option>
            </select><br><br>
          </div>
          <div style="display:inline-block; padding-right:10px">
            <b>Program start year</b><br>
            <select :disabled="addEditModal.scenSummary.progsetname=='None'"
                    v-model="addEditModal.scenSummary.program_start_year">
              <option v-for='year in validProgramStartYears'>
                {{ year }}
              </option>
            </select><br><br>
          </div><br>
          
          <div v-if="addEditModal.scenSummary.scentype == 'budget'">
            <div class="scrolltable" style="max-height: 80vh;">
              <table class="table table-bordered table-hover table-striped" style="width: 100%">
                <thead>
                <tr>
                  <th colspan=100><div class="dialog-header">
                    Program spending
                  </div></th>
                </tr>                
                <tr>
                  <th>Program</th>
                  <th v-for="(val, index) in addEditModal.scenSummary.budgetyears">
                    <select v-model="addEditModal.scenSummary.budgetyears[index]">
                      <option v-for='year in validSimYears'>
                        {{ year }}
                      </option>
                    </select> 
                    <button @click="modalRemoveBudgetYear(index)" class='btn __red' style="display:inline-block">
                      X
                    </button>         
                  </th>                  
                  <th>
                    <button @click="modalAddBudgetYear()" class='btn __green' style="display:inline-block">
                      +
                    </button>
                    <button @click="resetToProgbook()" class='btn __red' style="display:inline-block">
                      Reset to progbook
                    </button>                                        
                  </th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="prog in addEditModal.scenSummary.progs">
                  <td>
                    {{ prog.name }}
                  </td>
                  <td v-for="(val, index) in prog.budgetvals">
                    <input type="text"
                           class="txbox"
                           style="text-align: right"
                           v-model="prog.budgetvals[index]"/>
                  </td>
                  <td>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div v-if="addEditModal.scenSummary.scentype == 'coverage'">
            <div class="scrolltable" style="max-height: 80vh;">
              <table class="table table-bordered table-hover table-striped" style="width: 100%">
                <thead>
                <tr>
                  <th colspan=100><div class="dialog-header">
                    Program coverages (%)
                  </div></th>
                </tr>                
                <tr>
                  <th>Program</th>
                  <th v-for="(val, index) in addEditModal.scenSummary.coverageyears">
                    <select v-model="addEditModal.scenSummary.coverageyears[index]">
                      <option v-for='year in validSimYears'>
                        {{ year }}
                      </option>
                    </select> 
                    <button @click="modalRemoveCoverageYear(index)" class='btn __red' style="display:inline-block">
                      X
                    </button>         
                  </th>                  
                  <th>
                    <button @click="modalAddCoverageYear()" class='btn __green' style="display:inline-block">
                      +
                    </button>
                    <button @click="resetToProgbook()" class='btn __red' style="display:inline-block">
                      Reset to progbook
                    </button>                                        
                  </th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="prog in addEditModal.scenSummary.progs">
                  <td>
                    {{ prog.name }}
                  </td>
                  <td v-for="(val, index) in prog.coveragevals">
                    <input type="text"
                           class="txbox"
                           style="text-align: right"
                           v-model="prog.coveragevals[index]"/>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div v-if="addEditModal.scenSummary.scentype == 'parameter'">
            Complicated parameters GUI logic...<br><br>
          </div>
             
        </div>
        <div style="text-align:justify">
          <button @click="modalSave()" class='btn __green' style="display:inline-block">
            Save scenario
          </button>
          <button @click="$modal.hide('add-edit-scen')" class='btn __red' style="display:inline-block">
            Cancel
          </button>
        </div>
      </div>
    </modal>
    <!-- ### End: add scenarios modal ### -->

  </div>
</template>

<script>
import { mixins } from '../../common';

export default {
  name: 'ScenariosPage',
  mixins: [
    mixins.ScenarioMixin
  ],
  methods: {
    toolName: function(){
      return this.$toolName; 
    }
  }

}
</script>
