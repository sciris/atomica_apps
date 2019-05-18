<!--
Optimizations Page

Last update: 2019-05-18
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
              <template v-if="simCascades.length>1">
                <b>Cascade: &nbsp;</b>
                <select v-model="activeCascade" @change="reloadGraphs(displayResultDatastoreId, true)">
                  <option v-for='cascade in simCascades'>
                    {{ cascade }}
                  </option>
                </select>
              </template>
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


    <!-- ### Start: add optimization modal ### -->
    <modal name="add-optim"
           height="auto"
           :scrollable="true"
           :width="800"
           :classes="['v--modal', 'vue-dialog']"
           :pivot-y="0.3"
           :adaptive="true">

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
            <b>Use optimal allocation of funds beginning in year</b><br>
            <input type="text"
                   class="txbox"
                   v-model="modalOptim.start_year"/><br>
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
import { mixins } from '../../common';

export default {
  name: 'OptimizationsPage',
  mixins: [
    mixins.OptimizationMixin
  ],
  methods: {
    toolName: function(){
      return this.$toolName; 
    },
    getOptimizationRPCName: function(){
      return 'run_tb_optimization';
    }
  }
}
</script>
