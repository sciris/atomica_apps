<!--
Scenarios page

Last update: 2018-09-09
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
          <button class="btn __blue" :disabled="!scenariosLoaded" @click="addBudgetScenModal()">Add scenario</button>
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
              <select v-model="endYear" @change="reloadGraphs(true)">
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

      <!-- ### Start: JS Cascade plot ### -->
      <div style="margin: 0 auto 50px;">
        <stacked-bar-view class="cascade"
          :budgetData="jsonBudgetData"
          :colourScheme="jsonBudgetColors"
        />
      </div>

      <div style="margin: 0 auto;">
        <multibar-view class="cascade"
          :scenariosData="jsonData"
          :colourScheme="jsonColors"
        />
      </div>
      <!-- ### End: Cascade plot ### -->
      
    </div> <!-- ### End: v-else project (results) ### -->


    <!-- ### Start: add scenarios modal ### -->
    <modal name="add-budget-scen"
           height="auto"
           :scrollable="true"
           :width="500"
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
          <b>Parameter set</b><br>
          <select v-model="parsetOptions[0]">
            <option v-for='parset in parsetOptions'>
              {{ parset }}
            </option>
          </select><br><br>
          <b>Program set</b><br>
          <select v-model="progsetOptions[0]">
            <option v-for='progset in progsetOptions'>
              {{ progset }}
            </option>
          </select><br><br>
          <b>Budget year</b><br>
          <input type="text"
                 class="txbox"
                 v-model="addEditModal.scenSummary.alloc_year"/><br>
          <table class="table table-bordered table-hover table-striped" style="width: 100%">
            <thead>
            <tr>
              <th>Program</th>
              <th>Budget</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="item in addEditModal.scenSummary.alloc">
              <td>
                {{ item[2] }}
              </td>
              <td>
                <input type="text"
                       class="txbox"
                       v-model="item[1]"
                       style="text-align: right"
                />
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div style="text-align:justify">
          <button @click="addBudgetScen()" class='btn __green' style="display:inline-block">
            Save scenario
          </button>
          <button @click="$modal.hide('add-budget-scen')" class='btn __red' style="display:inline-block">
            Cancel
          </button>
        </div>
      </div>
    </modal>
    <!-- ### End: add scenarios modal ### -->

  </div>
</template>

<script>
  import MultibarView from './Vis/Multibar/MultibarView.vue'
  import StackedBarView from './Vis/StackedBar/StackedBarView.vue'

  export default {
    name: 'ScenariosPage',
    components: {
      MultibarView,
      StackedBarView,
    },
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
