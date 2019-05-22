<!--
Calibration Page

Last update: 2019-05-22
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

    <div v-else>

      <!-- ### Start: calibration card ### -->
      <div class="card">
        <div><help reflink="bl-overview" label="Calibration and reconciliation"></help></div>
        <div class="controls-box">
          <button class="btn __green" @click="saveParTable()">Run</button>
          <button class="btn" @click="toggleParams()">
            <span v-if="showParameters">Hide</span>
            <span v-else>Show</span>
            parameters
          </button>
          &nbsp;<help reflink="manual-calibration"></help>
        </div>
        &nbsp;&nbsp;
        <div class="controls-box">
          <button class="btn" @click="autoCalibrate(projectID)">Automatic calibration</button>
          for&nbsp;
          <select v-model="calibTime">
            <option v-for='time in calibTimes'>
              {{ time }}
            </option>
          </select>
          &nbsp;<help reflink="automatic-calibration"></help>
        </div>
        &nbsp;&nbsp;
        <div class="controls-box">
          <b>Parameter set: &nbsp;</b>
          <select v-model="activeParset" @change="loadParTable()">
            <option v-for='parset in parsetOptions'>
              {{ parset }}
            </option>
          </select>&nbsp;
          <button class="btn btn-icon" @click="renameParsetModal()" data-tooltip="Rename"><i class="ti-pencil"></i></button>
          <button class="btn btn-icon" @click="copyParset()" data-tooltip="Copy"><i class="ti-files"></i></button>
          <button class="btn btn-icon" @click="deleteParset()" data-tooltip="Delete"><i class="ti-trash"></i></button>
          <button class="btn btn-icon" @click="downloadParset()" data-tooltip="Download"><i class="ti-download"></i></button>
          <button class="btn btn-icon" @click="uploadParset()" data-tooltip="Upload"><i class="ti-upload"></i></button>&nbsp;
          <help reflink="parameter-sets"></help>
        </div>

        <div class="controls-box">
          <button class="btn" @click="reconcile()">Reconcile</button>&nbsp;
          <help reflink="reconciliation"></help>
        </div>
      </div>
      <!-- ### End: calibration card ### -->


      <!-- ### Start: parameters card ### -->
      <div class="PageSection" v-show="showParameters">
        <div class="card">
          <help reflink="parameters" label="Parameters"></help>

          <input type="text"
                 class="txbox"
                 style="margin-left:0px; margin-bottom:10px; display:inline-block; width:100%"
                 :placeholder="filterPlaceholder"
                 v-model="filterText"/>

          <table class="table table-bordered table-hover table-striped" style="width: 100%">
            <thead>
            <tr>
              <th>Category</th>
              <th>Parameter</th>
              <th>Overall scale factor</th>
              <th v-for="popLabel in poplabels">{{ popLabel }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="par in filteredParlist">
              <td>{{par.parcategory}}</td>
              <td>{{par.parlabel}}</td>
              <td>
                <input type="text"
                       class="txbox"
                       v-model="par.meta_y_factor"/>
              </td>
              <td v-for="poppar in par.pop_y_factors">
                <input type="text"
                       class="txbox"
                       v-model="poppar.dispvalue"/>
              </td>
            </tr>
            </tbody>
          </table>
          <button class="btn __green" @click="saveParTable()">Save & run</button>&nbsp;
        </div>
      </div>
      <!-- ### End: parameters card ### -->


      <!-- ### Start: results card ### -->
      <div class="PageSection" v-if="hasGraphs">
        <div class="card">
          <!-- ### Start: plot controls ### -->
          <div class="calib-title">
            <help reflink="bl-results" label="Results"></help>
            <div>
              <template v-if="simCascades.length>1">
                <b>Cascade: &nbsp;</b>
                <select v-model="activeCascade" @change="reloadGraphs(true)">
                  <option v-for='cascade in simCascades'>
                    {{ cascade }}
                  </option>
                </select>
              </template>
              &nbsp;&nbsp;&nbsp;
              <b>Year: &nbsp;</b>
              <select v-model="simEndYear" @change="reloadGraphs(true)">
                <option v-for='year in simYears'>
                  {{ year }}
                </option>
              </select>
              &nbsp;&nbsp;&nbsp;
              <b>Population: &nbsp;</b>
              <select v-model="activePop" @change="reloadGraphs(true)">
                <option v-for='pop in activePops'>{{ pop }}</option>
              </select>&nbsp;&nbsp;&nbsp;
              <button class="btn btn-icon" @click="scaleFigs(0.9)" data-tooltip="Zoom out">&ndash;</button>
              <button class="btn btn-icon" @click="scaleFigs(1.0)" data-tooltip="Reset zoom"><i class="ti-zoom-in"></i></button>
              <button class="btn btn-icon" @click="scaleFigs(1.1)" data-tooltip="Zoom in">+</button>&nbsp;&nbsp;&nbsp;
              <button class="btn" @click="reloadGraphs(true)">Refresh</button>
              <button v-if="!showPlotControls" class="btn" @click="showPlotControls = true">Show plot selection</button>
              <button v-else class="btn" @click="showPlotControls = false">Hide plot selection</button>                
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
    <modal name="rename-parset"
           height="auto"
           :classes="['v--modal', 'vue-dialog']"
           :pivot-y="0.3"
           :adaptive="true">

      <div class="dialog-content">
        <div class="dialog-c-title">
          Rename parameter set
        </div>
        <div class="dialog-c-text">
          New name:<br>
          <input type="text"
                 class="txbox"
                 v-model="activeParset"/><br>
        </div>
        <div style="text-align:justify">
          <button @click="renameParset()" class='btn __green' style="display:inline-block">
            Rename
          </button>

          <button @click="$modal.hide('rename-parset')" class='btn __red' style="display:inline-block">
            Cancel
          </button>
        </div>
      </div>

    </modal>
    <!-- ### End: rename parset modal ### -->

  </div>
</template>

<script>
import { mixins } from '../../common';

export default {
  name: 'CalibrationPage',
  mixins: [
    mixins.CalibrationMixin 
  ],
  methods: {
    toolName: function(){
      return this.$toolName; 
    }
  }
}
</script>
