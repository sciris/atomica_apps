<!--
Scenarios page

Last update: 2019-06-03
-->

<template>
  <div class="SitePage">

    <div v-if="!projectOpen">
      <div style="font-style:italic">
        <p>No project is loaded.</p>
      </div>
    </div>

    <div v-else-if="!hasData">
      <div style="font-style:italic">
        <p>Data not yet uploaded for the project.  Please upload a databook in the Projects page.</p>
      </div>
    </div>

<!--    <div v-else-if="!hasPrograms">-->
<!--      <div style="font-style:italic">-->
<!--        <p>Programs not yet uploaded for the project.  Please upload a program book in the Projects page.</p>-->
<!--      </div>-->
<!--    </div>-->

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
          <button class="btn __blue" :disabled="!scenariosLoaded || !hasPrograms" @click="addScenModal('budget')">Add budget scenario</button>
          <button class="btn __blue" :disabled="!scenariosLoaded || !hasPrograms" @click="addScenModal('coverage')">Add coverage scenario</button>
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
              &nbsp;&nbsp;&nbsp;
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
              <button class="btn" @click="reloadGraphs(true)">Refresh</button>
              <button v-if="!showPlotControls" class="btn" @click="showPlotControls = true; scaleFigs(0.8)">Show plot selection</button>
              <button v-else class="btn" @click="showPlotControls = false; scaleFigs(1.0)">Hide plot selection</button>               
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
                <div class="outcome-graphs">
                  <!-- multiple figs may be inserted here -->
                </div>               
                <div class="budget-graphs">
                  <!-- multiple figs may be inserted here -->
                </div>
                <div class="coverage-graphs">
                  <!-- multiple figs may be inserted here -->
                </div>
                <div class="cascade-graphs">
                  <!-- multiple figs may be inserted here -->
                </div>         
                
                <!-- ### Start: cascade table ### -->
                <div v-if="table" class="calib-tables">
                  <h4>Cascade stage losses</h4>
                  <table class="table table-striped" style="text-align:right;">
                    <thead>
                    <tr>
                      <th></th>
                      <th v-for="label in table.collabels.slice(0, -1)">{{label}}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(label, index) in table.rowlabels">
                      <td>{{label}}</td>
                      <td v-for="text in table.text[index].slice(0, -1)">{{text}}</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <!-- ### End: cascade table ### -->

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
                <table class="table table-bordered table-hover table-striped" style="width: 100%" v-for="(item, index) in plotOptions.plotgroups">
                  <thead>
                  <tr>
                    <th>
                      <span @click="plotGroupListCollapseToggle(index)">
                      {{ item.group_name }}
                      </span>
                      &nbsp;&nbsp;
                      <input type="checkbox" @click="plotGroupActiveToggle(item.group_name, item.active)" v-model="item.active"/>                    
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!plotGroupsListCollapsed[index]" v-for="name in getPlotsFromPlotGroup(item.group_name)">
                      <td>
                        {{ name }}
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
          <div v-if="addEditModal.scenSummary.scentype != 'parameter'"
               style="display:inline-block; padding-right:10px">
          <b>Program set</b><br>
            <select @change="changeProgset()" v-model="addEditModal.scenSummary.progsetname">
            <option v-for='progset in progsetOptions'>
              {{ progset }}
            </option>
          </select><br><br>
          </div>
          <div v-if="addEditModal.scenSummary.scentype != 'parameter'"
               style="display:inline-block; padding-right:10px">
            <b>Program start year</b><br>
            <select :disabled="addEditModal.scenSummary.progsetname=='None'"
                    v-model="addEditModal.scenSummary.progstartyear">
              <option v-for='year in validProgramStartYears'>
                {{ year }}
              </option>
            </select><br><br>
          </div>

          <template v-if="addEditModal.scenSummary.scentype == 'parameter'">

            <div style="display:inline-block; padding-right:10px">
              <b>Interpolation</b><br>
              <select v-model="addEditModal.scenSummary.interpolation">
                <option value="linear">Linear</option>
                <option value="previous">Stepped</option>
              </select><br><br>
            </div>

            <br><br>

            <div style="display:inline-block; padding-right:10px">
              <b>Parameter group</b><br>
              <select v-model="addEditModal.selectedParamGroup">
                <option v-for='group in paramGroups.grouplist'>
                  {{ group }}
                </option>
              </select><br><br>
            </div>

            <div style="display:inline-block; padding-right:10px">

              <b>Parameters</b><br>
              <select v-model="addEditModal.selectedParams" :size="paramGroupMembers(addEditModal.selectedParamGroup).length" multiple>
                <option v-for="paramname in paramGroupMembers(addEditModal.selectedParamGroup)">
                  {{ paramname }}
                </option>
              </select><br><br>
            </div>

            <div style="display:inline-block; padding-right:10px">

              <b>Populations</b><br>
              <select v-model="addEditModal.selectedPopulations" :size="paramGroups.popnames.length" multiple>
                <option v-for="popname in paramGroups.popnames">
                  {{ popname }}
                </option>
              </select><br><br>
            </div>

            <br><br>

            <div style="display:inline-block; padding-right:10px">

              <button class="btn __blue"
                      @click="modalAddParameters(addEditModal.selectedParamGroup, addEditModal.selectedParams, addEditModal.selectedPopulations)"
                      :disabled="(addEditModal.selectedParams.length == 0) || (addEditModal.selectedPopulations.length == 0)">
                Add parameters...
              </button>
              <br><br>
            </div>
          </template>

          <br>
          
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
                    <button @click="modalRemoveBudgetYear(index)" class='btn-small' style="display:inline-block">
                      <i class="ti-trash"></i>
                    </button>         
                  </th>                  
                  <th>
                    <button @click="modalAddBudgetYear()" class='btn-small' style="display:inline-block">
                      +
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
                    <button @click="modalRemoveCoverageYear(index)" class='btn_small' style="display:inline-block">
                      <i class="ti-trash"></i>
                    </button>         
                  </th>                  
                  <th>
                    <button @click="modalAddCoverageYear()" class='btn_small' style="display:inline-block">
                      +
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
            <div v-if="addEditModal.scenSummary.paramoverwrites.length > 0" class="scrolltable" style="max-height: 80vh;">        
              <table class="table table-bordered table-hover table-striped" style="width: 100%">
                <thead>
                <tr>
                  <th colspan=100><div class="dialog-header">
                    Parameter modifications
                  </div></th>
                </tr>                
                <tr>
                  <th>Parameter</th>
                  <th>Parameter group</th>
                  <th>Population</th>
                  <th v-for="(val, index) in addEditModal.scenSummary.paramyears">
                    <select v-model="addEditModal.scenSummary.paramyears[index]">
                      <option v-for='year in validSimYears'>
                        {{ year }}
                      </option>
                    </select> 
                    <button @click="modalRemoveParamYear(index)" class='btn_small' style="display:inline-block">
                      <i class="ti-trash"></i>
                    </button>         
                  </th>                  
                  <th>
                    <button @click="modalAddParamYear()" class='btn_small' style="display:inline-block">
                      +
                    </button>                                       
                  </th>
                </tr>
                </thead>
                <tbody>
<!--                <tr v-for="paramoverwrite in addEditModal.scenSummary.paramoverwrites"> -->
                <tr v-for="paramoverwrite in sortedParamOverwrites">
                  <td>
                    <select v-model="paramoverwrite.paramname">
                      <option v-for="paramname in paramGroupMembers(paramoverwrite.groupname)">
                        {{ paramname }}
                      </option>
                    </select>
                  </td>
                  <td>
                    {{ paramoverwrite.groupname }}
                  </td>
                  <td>
                    <select v-model="paramoverwrite.popname">
                      <option v-for="popname in paramGroups.popnames">
                        {{ popname }}
                      </option>
                    </select>
                  </td>                  
                  <td v-for="(val, index) in paramoverwrite.paramvals">
                    <input type="text"
                           class="txbox"
                           style="text-align: right"
                           v-model="paramoverwrite.paramvals[index]"/>
                  </td>
                  <td>
                    <button @click="modalDeleteParameter(paramoverwrite)" class="btn_small">
                      <i class="ti-trash"></i>
                    </button>                   
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
             
        </div>
        <div style="text-align:justify">
          <button @click="modalSave()" class='btn __green' style="display:inline-block">
            Save scenario
          </button>
          <button @click="resetToDefaultValues(false)" class='btn' style="display:inline-block">
            Fill with baseline
          </button>
          <button @click="resetToDefaultValues(true)" class='btn' style="display:inline-block">
            Reset to baseline
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
