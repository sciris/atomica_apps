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
                <b>{{ projectSummary.project.name }}</b>
              </div>
              <div v-else>
                {{ projectSummary.project.name }}
              </div>
            </td>
            <td style="text-align:left">
              <button
                  v-if="sortedFilteredProjectSummaries.length>1"
                  class="btn __green"
                  :disabled="projectSummary.loaded"
                  @click="openProject(projectSummary.project.id)">
                <span>Open</span>
              </button>
              <button
                  class="btn btn-icon"
                  data-tooltip="Rename"
                  @click="startRename(projectSummary)">
                <i class="ti-pencil"></i>
              </button>
              <button
                  class="btn btn-icon"
                  data-tooltip="Copy"
                  @click="copyProject(projectSummary.project.id)">
                <i class="ti-files"></i>
              </button>
              <button
                  class="btn btn-icon"
                  data-tooltip="Download"
                  @click="downloadProjectFile(projectSummary.project.id)">
                <i class="ti-download"></i>
              </button>
            </td>
            <td style="text-align:left">
              {{ projectSummary.project.updatedTime ? projectSummary.project.updatedTime:
              'No modification' }}
            </td>
            <td style="text-align:left">
              <button
                  class="btn __blue btn-icon"
                  @click="uploadDatabookModal(projectSummary.project.id)"
                  data-tooltip="Upload">
                <i class="ti-upload"></i>
              </button>
              <button
                  class="btn btn-icon"
                  :disabled="!projectSummary.project.hasData"
                  @click="downloadDatabook(projectSummary.project.id)"
                  data-tooltip="Download">
                <i class="ti-download"></i>
              </button>
            </td>
            <td style="white-space: nowrap; text-align:left">
              <button
                  class="btn btn-icon"
                  @click="createProgbookModal(projectSummary.project.id)"
                  data-tooltip="New">
                <i class="ti-plus"></i>
              </button>
              <button
                  class="btn __blue btn-icon"
                  @click="uploadProgbookModal(projectSummary.project.id)"
                  data-tooltip="Upload">
                <i class="ti-upload"></i>
              </button>
              <button
                  class="btn btn-icon"
                  :disabled="!projectSummary.project.hasPrograms"
                  @click="downloadProgbook(projectSummary.project.id)"
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
           :width="400"
           :pivot-y="0.3"
           :adaptive="true"
           :clickToClose="false"
    >
      <div class="dialog-content">
        <div class="dialog-c-title">
          Create demo project
        </div>
        <div class="dialog-c-text">
          <select v-model="demoOption">
            <option v-for='project in demoOptions'>
              {{ project }}
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
           :adaptive="true"
           :clickToClose="false"
    >

      <!-- ### Start: TB demo project modal ### -->
      <div class="dialog-content">
        <div class="dialog-c-title">
          Create new project
        </div>
        <div class="dialog-c-text">
          Project name:<br>
          <input type="text"
                 class="txbox"
                 v-model="proj_name"/><br>
          Number of populations:<br>
          <input type="text"
                 class="txbox"
                 v-model="num_pops"/><br>
          First year for data entry:<br>
          <input type="text"
                 class="txbox"
                 v-model="data_start"/><br>
          Final year for data entry:<br>
          <input type="text"
                 class="txbox"
                 v-model="data_end"/><br>
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
           :adaptive="true"
           :clickToClose="false"
    >

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
  import sciris from 'sciris-js';
  import router from '../router.js'

  export default {
    name: 'ProjectsPage',
    mixins: [
      mixins.ProjectMixin
    ],
    data() {
      return {
        data_start: 2000, // For creating a new project: number of populations
        data_end: 2017, // For creating a new project: number of populations
      }
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
    },

    created() {
      let projectID = null
      // If we have no user logged in, automatically redirect to the login page.
      if (this.$store.state.currentUser.displayname === undefined) {
        this.getAppRouter().push('/login')
      } else {
        // Get the active project ID if there is an active project.
        if (this.$store.state.activeProject.project !== undefined) {
          projectID = this.$store.state.activeProject.project.id
        }
        this.getDefaultPrograms()
        this.getDemoOptions()
        // Load the frameworks so the new project dialog is populated
        this.updateFrameworkSummaries()
        // Load the project summaries of the current user.
        this.updateProjectSummaries(projectID)
      }
    },
  }
</script>
