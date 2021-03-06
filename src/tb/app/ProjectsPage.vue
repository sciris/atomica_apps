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
        <button class="btn __blue" @click="addDemoProject">Add demo project</button>&nbsp; &nbsp;
        <button class="btn __blue" @click="createNewProjectModal">Create new project</button>&nbsp; &nbsp;
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
              <button
                  :disabled="projectSummary.updateRequired"
                  class="btn __blue btn-icon"
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
                  @click="uploadProgbookModal(projectSummary.id)"
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

    <!-- ### Start: create project modal ### -->
    <modal name="create-project"
           height="auto"
           :classes="['v--modal', 'vue-dialog']"
           :width="400"
           :pivot-y="0.3"
           :adaptive="true">

      <!-- ### Start: TB demo project modal ### -->
      <div class="dialog-content">
        <div class="dialog-c-title">
          Create new project
        </div>
        <div class="dialog-c-text">
          Project name:<br>
          <input type="text"
                 class="txbox"
                 v-model="newProjectData.name"/><br>
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
      <!-- ### End: TB demo project modal ### -->

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
          <div class="scrolltable" style="max-height: 70vh;">
            <table class="table table-bordered table-striped table-hover">
              <thead>
              <tr>
                <th>Program name</th>
                <th style="text-align: center">Include?</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="defaultProgram in defaultPrograms">
                <td>
                  {{ defaultProgram.name }}
                </td>
                <td style="text-align: center">
                  <input type="checkbox" v-model="defaultProgram.included"/>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div style="text-align:justify">
            <br>
            <button @click="createDefaultProgbook()" class='btn __green' style="display:inline-block">Create</button>&nbsp;&nbsp;&nbsp;
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
      return {}
    },

    methods: {
      toolName: function () {
        return this.$toolName;
      },
      getFrameworkID: function () {
        return null;
      },
      getAppRouter: function () {
        return router;
      },

      async addDemoProject() {
        this.$sciris.start(this);
        try{
          let response = await this.$sciris.rpc('add_demo_project', [this.userName,'tb',this.toolName()]);
          this.updateProjectSummaries(response.data.projectID);
          this.$sciris.succeed(this, '');
        } catch (error) {
          this.$sciris.fail(this, 'Could not add demo project', error)
        }
      },

    },

    created() {
      this.newProjectData.data_start = 2000;
      this.newProjectData.data_end = 2017;
      this.newProjectData.num_pops = 5; // Default to 5 in TB
      this.newProjectData.num_transfers = 1; // Default to 1 in TB
      this.getDefaultPrograms();
      this.updateProjectSummaries(this.projectID)
    }
  }
</script>
