<!--
Optimizations Page

Last update: 2019-06-03
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
        <p>Data not yet uploaded for the project. Please upload a databook in the Projects page.</p>
      </div>
    </div>

    <div v-else-if="!hasPrograms">
      <div style="font-style:italic">
        <p>Programs not yet uploaded for the project. Please upload a program book in the Projects page.</p>
      </div>
    </div>

    <div v-else>

      <!-- ### Start: optimizations card ### -->
      <div class="card">
        <help reflink="optimizations" label="Define optimizations"></help>
        <table class="table table-bordered table-hover table-striped" style="width: 100%">
          <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="optimSummary in optimSummaries">
            <td>
              <b>{{ optimSummary.name }}</b>
            </td>
            <td>
              {{ statusFormatStr(optimSummary) }}
              {{ timeFormatStr(optimSummary) }}
              <button class="btn btn-icon" v-if="optimSummary.status === 'error'" @click="showError(optimSummary)"><i class="ti-info"></i></button>
            </td>
            <td style="white-space: nowrap">
              <button class="btn __green" :disabled="!canRunTask(optimSummary)" @click="runOptim(optimSummary, 3600)">Run</button>
              <button class="btn" :disabled="!canRunTask(optimSummary)" @click="runOptim(optimSummary, 10)">Test run</button>
              <button class="btn __green" :disabled="!canPlotResults(optimSummary)" @click="plotResults(optimSummary)">Plot results</button>
              <button class="btn" :disabled="!canCancelTask(optimSummary)" @click="clearTask(optimSummary)">Clear run</button>
              <button class="btn btn-icon" @click="editOptim(optimSummary)" data-tooltip="Edit optimization"><i class="ti-pencil"></i></button>
              <button class="btn btn-icon" @click="copyOptim(optimSummary)" data-tooltip="Copy optimization"><i class="ti-files"></i></button>
              <button class="btn btn-icon" @click="deleteOptim(optimSummary)" data-tooltip="Delete optimization"><i class="ti-trash"></i></button>
            </td>
          </tr>
          </tbody>
        </table>

        <div>
          <button class="btn" @click="addOptimModal('outcome')">Add outcome optimization</button>&nbsp;&nbsp;
          <button class="btn" @click="addOptimModal('money')">Add money optimization</button>
        </div>
      </div>
      <!-- ### End: optimizations card ### -->


      <!-- ### Start: results card ### -->
      <div class="PageSection" v-if="hasGraphs">
        <div class="card">
          <!-- ### Start: plot controls ### -->
          <div class="calib-title">
            <help reflink="results-plots" label="Results"></help>
            <div>
              &nbsp;&nbsp;&nbsp;
              <b>Year: &nbsp;</b>
              <select v-model="simEndYear" @change="reloadGraphs(displayResultDatastoreId, true)">
                <option v-for='year in projectionYears'>
                  {{ year }}
                </option>
              </select>
              &nbsp;&nbsp;&nbsp;
              <b>Population: &nbsp;</b>
              <select v-model="activePop" @change="reloadGraphs(displayResultDatastoreId, true)">
                <option v-for='pop in activePops'>
                  {{ pop }}
                </option>
              </select>&nbsp;&nbsp;&nbsp;
              <button class="btn btn-icon" @click="scaleFigs(0.9)" data-tooltip="Zoom out">&ndash;</button>
              <button class="btn btn-icon" @click="scaleFigs(1.0)" data-tooltip="Reset zoom"><i class="ti-zoom-in"></i></button>
              <button class="btn btn-icon" @click="scaleFigs(1.1)" data-tooltip="Zoom in">+</button>&nbsp;&nbsp;&nbsp;
              <button class="btn" @click="reloadGraphs(displayResultDatastoreId, true)">Refresh</button>
              <button v-if="!showPlotControls" class="btn" @click="showPlotControls = true; scaleFigs(0.8)">Show plot selection</button>
              <button v-else class="btn" @click="showPlotControls = false; scaleFigs(1.0)">Hide plot selection</button>
              <button class="btn" @click="exportGraphs()">Export graphs</button>
              <button class="btn" @click="exportResults(displayResultDatastoreId)">Export data</button>
              <button v-if="false" class="btn btn-icon" @click="togglePlotControls()"><i class="ti-settings"></i></button> <!-- When popups are working: v-if="this.$globaltool=='tb'" -->
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
                <div class="tb-calibration-graphs">
                  <!-- multiple figs may be inserted here -->
                </div>
                <div class="tb-advanced-graphs">
                  <!-- multiple figs may be inserted here -->
                </div>
                <div class="tb-cascade-graphs">
                  <!-- multiple figs may be inserted here -->
                </div>
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


    <!-- ### Start: add optimization modal ### -->
    <modal name="add-optim"
           height="auto"
           :scrollable="true"
           :width="800"
           :classes="['v--modal', 'vue-dialog']"
           :pivot-y="0.3"
           :adaptive="true"
           :clickToClose="false"
    >

      <div class="dialog-content">
        <div class="dialog-c-title" v-if="addEditDialogMode=='add'">
          Add optimization
        </div>
        <div class="dialog-c-title" v-else>
          Edit optimization
        </div>
        <div class="dialog-c-text">
          <div style="display:inline-block">
            <b>Optimization name</b><br>
            <input type="text"
                   class="txbox"
                   v-model="modalOptim.name"/><br>
            <b>Parameter set</b><br>
            <select v-model="parsetOptions[0]">
              <option v-for='parset in parsetOptions'>
                {{ parset }}
              </option>
            </select><br><br>
            <b>Start programs in year</b><br>
            <input type="text"
                   class="txbox"
                   v-model="modalOptim.start_year"/><br>
            <b>Optimize allocation in year</b><br>
            <input type="text"
                   class="txbox"
                   v-model="modalOptim.adjustment_year"/><br>
            <b>Target year for optimizing outcomes</b><br>
            <input type="text"
                   class="txbox"
                   v-model="modalOptim.end_year"/><br>
            <span v-if="modalOptim.optim_type!=='money'">
              <b>Budget factor</b><br>
              <input type="text"
                     class="txbox"
                     v-model="modalOptim.budget_factor"/><br>
            </span>
          </div>
          <br>
          <b>Objectives</b><br>
          <table class="table table-bordered table-hover table-striped" style="width: 100%">
            <thead>
            <tr>
              <th>Objective</th>
              <th v-if="modalOptim.optim_type=='outcome'">Weight</th>
              <th v-if="modalOptim.optim_type=='money'">Reduction target (%)</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(val,key) in modalOptim.objective_labels">
              <td>
                {{ modalOptim.objective_labels[key] }}
              </td>
              <td>
                <input type="text"
                       class="txbox"
                       v-model="modalOptim.objective_weights[key]"/>
              </td>
            </tr>
            </tbody>
          </table>
          <b>Spending constraints (absolute)</b><br>
          <table class="table table-bordered table-hover table-striped" style="width: 100%">
            <thead>
            <tr>
              <th>Program</th>
              <th>Minimum</th>
              <th>Maximum</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(val,key) in modalOptim.prog_spending">
              <td>
                {{ modalOptim.prog_spending[key].label }}
              </td>
              <td>
                <input type="text"
                       class="txbox"
                       v-model="modalOptim.prog_spending[key].min"/>
              </td>
              <td>
                <input type="text"
                       class="txbox"
                       v-model="modalOptim.prog_spending[key].max"/>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div style="text-align:justify">
          <button @click="saveOptim()" class='btn __green' style="display:inline-block">
            Save optimization
          </button>
          <button @click="cancelOptim()" class='btn __red' style="display:inline-block">
            Cancel
          </button>
        </div>
      </div>
    </modal>
    <!-- ### End: add optimization modal ### -->

  </div>
</template>


<script>
  import {mixins} from '../../common';

  export default {
    name: 'OptimizationsPage',
    mixins: [
      mixins.OptimizationMixin
    ],
    methods: {
      toolName: function () {
        return this.$toolName;
      },
      getOptimizationRPCName: function () {
        return 'run_tb_optimization';
      }
    }
  }
</script>
