<!--
Manage projects page

Last update: 2019Aug23
-->

<template>
  <div class="SitePage">

    <!-- ### Start: Projects controls ### -->
    <div class="card">
      <help reflink="create-projects" label="Create projects"></help>

      <div class="ControlsRow">
        <button class="btn __blue" @click="addDemoProjectModal">Add demo project</button>
        <button class="btn __blue" @click="createNewProjectModal">Create new project</button>
        <button class="btn __blue" @click="uploadProjectFromFile">Upload project from file</button>
      </div>
    </div>
    <!-- ### End: Projects controls ### -->

    <!-- ### Start: Projects table ### -->
    <div class="PageSection" v-if="projectSummaries.length > 0">
      <div class="card">
        <help reflink="manage-projects" label="Manage projects"></help>

        <input type="text"
               class="txbox"
               style="margin-bottom: 20px"
               :placeholder="filterPlaceholder"
               v-model="filterText"/>

        <table class="table table-bordered table-hover table-striped" style="width: 100%">
          <thead>
          <tr>
            <th style="text-align:center">
              <input type="checkbox" @click="selectAll()" v-model="allSelected"/>
            </th>
            <th-sortable column="name" :sortReverse="sortReverse" :sortColumn="sortColumn" @sortingUpdated="updateSorting">Name</th-sortable>
            <th style="text-align:left">Project actions</th>
            <th-sortable column="updatedTime" :sortReverse="sortReverse" :sortColumn="sortColumn" @sortingUpdated="updateSorting">Last modified</th-sortable>
            <th style="text-align:left">Framework</th>
            <th style="text-align:left">Databook</th>
            <th style="text-align:left">Program book</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="projectSummary in sortedFilteredProjectSummaries"
              :class="{ highlighted: projectSummary.loaded }">
            <td>
              <input type="checkbox" @click="uncheckSelectAll()" v-model="projectSummary.selected"/>
            </td>
            <td v-if="projectSummary.renaming">
              <input type="text" v-model="projectSummary.new_name" class="txbox renamebox" @keyup.escape="cancelRename(projectSummary)" @keyup.enter="renameProject(projectSummary)"/>
            </td>
            <td v-else>
              <div v-if="projectSummary.loaded">
                <b>{{ projectSummary.name }}</b>
              </div>
              <div v-else>
                {{ projectSummary.name }}
              </div>
            </td>
            <td style="text-align:left">

              <button
                  v-if="projectSummary.updateRequired"
                  class="btn __red"
                  :data-tooltip="projectSummary.updateString"
                  @click="updateProject(projectSummary)">
                <span>Update</span>
              </button>
              <button
                  v-else
                  class="btn __green"
                  :disabled="projectSummary.loaded"
                  @click="openProject(projectSummary)">
                <span>Open</span>
              </button>

              <button
                  class="btn btn-icon"
                  data-tooltip="Rename"
                  :disabled="projectSummary.renaming"
                  @click="startRename(projectSummary)">
                <i class="ti-pencil"></i>
              </button>
              <button
                  v-if="!projectSummary.updateRequired"
                  class="btn btn-icon"
                  data-tooltip="Copy"
                  @click="copyProject(projectSummary)">
                <i class="ti-files"></i>
              </button>
              <button
                  class="btn btn-icon"
                  data-tooltip="Download"
                  @click="downloadProjectFile(projectSummary)">
                <i class="ti-download"></i>
              </button>
            </td>
            <td style="text-align:left">
              {{ projectSummary.updatedTimeString }}
            </td>
            <td style="text-align:left">
              <button class="btn btn-icon"
                      :disabled="projectSummary.updateRequired"
                      @click="downloadFramework(projectSummary.id)"
                      data-tooltip="Download">
                <i class="ti-download"></i>
              </button>
              {{ projectSummary.framework }}
            </td>
            <td style="text-align:left">
              <button
                  class="btn __blue btn-icon"
                  :disabled="projectSummary.updateRequired"
                  @click="uploadDatabookModal(projectSummary.id)"
                  data-tooltip="Upload">
                <i class="ti-upload"></i>
              </button>
              <button
                  class="btn btn-icon"
                  :disabled="!projectSummary.hasData || projectSummary.updateRequired"
                  @click="downloadDatabook(projectSummary.id)"
                  data-tooltip="Download">
                <i class="ti-download"></i>
              </button>
            </td>
            <td style="white-space: nowrap; text-align:left">
              <button
                  class="btn btn-icon"
                  :disabled="!projectSummary.hasData || projectSummary.updateRequired"
                  @click="createProgbookModal(projectSummary.id)"
                  data-tooltip="New">
                <i class="ti-plus"></i>
              </button>
              <button
                  class="btn __blue btn-icon"
                  :disabled="!projectSummary.hasData || projectSummary.updateRequired"
                  @click="uploadProgbook(projectSummary.id)"
                  data-tooltip="Upload">
                <i class="ti-upload"></i>
              </button>
              <button
                  class="btn btn-icon"
                  :disabled="!projectSummary.hasPrograms || projectSummary.updateRequired"
                  @click="downloadProgbook(projectSummary.id)"
                  data-tooltip="Download">
                <i class="ti-download"></i>
              </button>
            </td>
          </tr>
          </tbody>
        </table>

        <div class="ControlsRow">
          <button class="btn" @click="deleteModal()">Delete selected</button>
          &nbsp; &nbsp;
          <button class="btn" @click="downloadSelectedProjects">Download selected</button>
        </div>
      </div>
    </div>
    <!-- ### End: Projects table ### -->

    <!-- ### Start: demo project modal (only visible for Cascade) ### -->
    <modal name="demo-project"
           height="auto"
           :classes="['v--modal', 'vue-dialog']"
           :width="600"
           :pivot-y="0.3"
           :adaptive="true">
      <div class="dialog-content">
        <div class="dialog-c-title">
          Create demo project
        </div>
        <div class="dialog-c-text">
          <select v-model="demoOption">
            <option v-for='project in demoOptions' :value="project.id">
              {{ project.name }}
            </option>
          </select><br><br>
        </div>
        <div style="text-align:justify">
          <button @click="addDemoProject()" class='btn __green' style="display:inline-block">
            Add selected
          </button>

          <button @click="$modal.hide('demo-project')" class='btn __red' style="display:inline-block">
            Cancel
          </button>
        </div>
      </div>
    </modal>
    <!-- ### End: demo project modal ### -->


    <!-- ### Start: create project modal ### -->
    <modal name="create-project"
           height="auto"
           :classes="['v--modal', 'vue-dialog']"
           :width="400"
           :pivot-y="0.3"
           :adaptive="true">
      <!-- ### Start: Cascade demo project modal ### -->
      <div class="dialog-content">
        <div class="dialog-c-title">
          Create new project
        </div>

        <div v-if="frameworkSummaries.length>0">
          <div class="dialog-c-text">
            Project name:<br>
            <input type="text"
                   class="txbox"
                   v-model="newProjectData.name"/><br>
            Framework:<br>
            <select v-model="newProjectData.frameworkID">
              <option v-for='frameworkSummary in frameworkSummaries' :value="frameworkSummary.id">
                {{ frameworkSummary.name }}
              </option>
            </select><br><br>
            Number of populations:<br>
            <input type="text"
                   class="txbox"
                   v-model.number="newProjectData.num_pops"/><br>
            Number of transfers:<br>
            <input type="text"
                   class="txbox"
                   v-model.number="newProjectData.num_transfers"/><br>
            First year for data entry:<br>
            <input type="text"
                   class="txbox"
                   v-model="newProjectData.data_start"/><br>
            Final year for data entry:<br>
            <input type="text"
                   class="txbox"
                   v-model="newProjectData.data_end"/><br>
          </div>
          <div style="text-align:justify">
            <button @click="createNewProject()" class='btn __green' style="display:inline-block">
              Create
            </button>

            <button @click="$modal.hide('create-project')" class='btn __red' style="display:inline-block">
              Cancel
            </button>
          </div>
        </div>

        <div v-else>
          <div class="dialog-c-text">
            Before creating a new project, please create or upload at least one framework.
          </div>
          <br>
          <div style="text-align:justify">
            <button @click="$modal.hide('create-project')" class='btn' style="display:inline-block">
              Ok
            </button>
          </div>
        </div>
        <!-- ### End: Cascade demo project modal ### -->

      </div>
    </modal>
    <!-- ### End: New project modal ### -->


    <!-- ### Start: New progbook modal ### -->
    <modal name="create-progbook"
           height="auto"
           :classes="['v--modal', 'vue-dialog']"
           :pivot-y="0.3"
           :adaptive="true">

      <div class="dialog-content">
        <div class="dialog-c-title">
          Create program book
        </div>

        <div class="divTable">
          <div class="divTableBody">
            <div class="divTableRow">
              <div class="divRowContent" style="padding-bottom:10px"><b>Start year: &nbsp;</b></div>
              <div class="divRowContent" style="padding-bottom:10px"><select v-model="progStartYear">
                <option v-for='year in simYears'>{{ year }}</option>
              </select></div>
            </div>
            <div class="divTableRow">
              <div class="divRowContent" style="padding-bottom:10px"><b>End year: &nbsp;</b></div>
              <div class="divRowContent" style="padding-bottom:10px"><select v-model="progEndYear">
                <option v-for='year in simYears'>{{ year }}</option>
              </select></div>
            </div>
          </div>
        </div>

        <div>
          <div class="dialog-c-text">
            Number of programs:<br>
            <input type="text"
                   class="txbox"
                   v-model="num_progs"/><br>
          </div>
          <div style="text-align:justify">
            <button @click="createProgbook()" class='btn __green' style="display:inline-block">Create</button>&nbsp;&nbsp;&nbsp;
            <button @click="$modal.hide('create-progbook')" class='btn __red' style="display:inline-block">Cancel</button>
          </div>
        </div>
      </div>

    </modal>
    <!-- ### End: New progbook modal ### -->

  </div>

</template>

<script>
  import {mixins} from '../../common';
  import router from '../router.js'

  export default {
    name: 'ProjectsPage',
    mixins: [
      mixins.ProjectMixin
    ],
    data() {
      return {
        frameworkSummaries: [],
        num_progs: 5,

        demoOptions: [
          {id: 'udt', name: 'Undiagnosed-diagnosed-treated'},
          {id: 'usdt', name: 'Undiagnosed-screened-diagnosed-treated'},
          {id: 'cervicalcancer', name: 'Cervical cancer'},
          {id: 'sir', name: 'SIR model'},
          {id: 'diabetes', name: 'Diabetes'},
          {id: 'hypertension', name: 'Hypertension'},
          {id: 'hypertension_dyn', name: 'Hypertension with demography'},
          {id: 'hiv', name: 'HIV care cascade'},
          {id: 'hiv_dyn', name: 'HIV care cascade with demography'},
          {id: 'tb_simple', name: 'Tuberculosis'},
          {id: 'tb_simple_dyn', name: 'Tuberculosis with demography'},
          {id: 'environment', name: 'SIR model with environment'},
          {id: 'tb', name: 'Tuberculosis with transmission dynamics'},
        ],
        demoOption: 'udt',

      }
    },

    created() {
      this.data_start = 2015;
      this.data_end = 2018;
      this.newProjectData.num_pops = 1; // Default to 1 in CAT
      this.newProjectData.num_transfers = 0; // Default to 0 in CAT
      this.getDefaultPrograms();
      this.updateFrameworkSummaries();
      this.updateProjectSummaries(this.projectID);
    },

    methods: {
      toolName: function () {
        return this.$toolName;
      },

      getAppRouter: function () {
        return router;
      },

      async createProgbook() {
        // Find the project that matches the UID passed in.
        let uid = this.activeuid;
        console.log('createProgbook() called');
        this.$modal.hide('create-progbook');
        this.$sciris.start(this, 'Creating program book...');
        try {
          let response = await this.$sciris.download('create_progbook', [uid, this.num_progs, this.progStartYear, this.progEndYear]);
          this.$sciris.succeed(this, '');
        } catch (error) {
          this.$sciris.fail(this, 'Could not create program book', error);
        }
      },

      async updateFrameworkSummaries() {
        try {
          let response = await this.$sciris.rpc('jsonify_frameworks', [this.userName]);
          this.frameworkSummaries = response.data;
          if (this.frameworkSummaries.length) {
            this.newProjectData.frameworkID = this.frameworkSummaries[0].id;
          }
        } catch (error) {
          this.$sciris.fail(this, 'Could not load frameworks', error)
        }
      },


      addDemoProjectModal() {
        // Open a model dialog for creating a new project
        console.log('addDemoProjectModal() called');
        this.$modal.show('demo-project');
      },

      async addDemoProject() {
        this.$sciris.start(this);
        try {
          let response = await this.$sciris.rpc('add_demo_project', [this.userName, this.demoOption, this.toolName()]);
          this.updateProjectSummaries(response.data.projectID);
          this.$modal.hide('demo-project');
          this.$sciris.succeed(this, '');
        } catch (error) {
          this.$sciris.fail(this, 'Could not add demo project', error)
        }
      },

    },
  }
</script>

<style scoped>
  .ControlsRow {
    display: flex;
  }

  .ControlsRow > button {
    margin-right: 5px;
  }
</style>
