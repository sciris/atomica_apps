<!--
Manage frameworks page

Last update: 2018oct04
-->

<template>
  <div class="SitePage">
    <div class="card">
      <help reflink="create-frameworks" label="Create frameworks"></help>

      <div class="ControlsRow">
        <button class="btn __blue" @click="addDemoFrameworkModal">Load framework from library</button>&nbsp; &nbsp;
        <button class="btn __blue" @click="createNewFrameworkModal">Create new framework</button>&nbsp; &nbsp;
        <button class="btn __blue" @click="uploadFrameworkFromFile">Upload framework from file</button>
      </div>
    </div>
    <br>

    <div class="card"
         v-if="frameworkSummaries.length > 0">
      <help reflink="manage-frameworks" label="Manage frameworks"></help>

      <input type="text"
             class="txbox"
             style="margin-bottom: 20px"
             :placeholder="filterPlaceholder"
             v-model="filterText"/>

      <table class="table table-bordered table-hover table-striped" style="width: 100%">
        <thead>
        <tr>
          <th>
            <input type="checkbox" @click="selectAll()" v-model="allSelected"/>
          </th>
          <th-sortable column="name" :sortReverse="sortReverse" :sortColumn="sortColumn" @sortingUpdated="updateSorting">Name</th-sortable>
          <th>Framework actions</th>
          <th-sortable column="creationTime" :sortReverse="sortReverse" :sortColumn="sortColumn" @sortingUpdated="updateSorting">Created on</th-sortable>
          <th-sortable column="updatedTime" :sortReverse="sortReverse" :sortColumn="sortColumn" @sortingUpdated="updateSorting">Last modified</th-sortable>
        </tr>
        </thead>
        <tbody>
        <tr v-for="frameworkSummary in sortedFilteredFrameworkSummaries">
          <td>
            <input type="checkbox" @click="uncheckSelectAll()" v-model="frameworkSummary.selected"/>
          </td>

          <td v-if="frameworkSummary.renaming">
              <input type="text" v-model="frameworkSummary.new_name" class="txbox renamebox" @keyup.escape="cancelRename(frameworkSummary)" @keyup.enter="renameFramework(frameworkSummary)"/>
          </td>
          <td v-else>
            {{ frameworkSummary.name }}
          </td>

          <td>
            <button
                class="btn btn-icon"
                data-tooltip="Rename"
                :disabled="frameworkSummary.renaming"
                @click="startRename(frameworkSummary)">
              <i class="ti-pencil"></i>
            </button>
            <button class="btn" @click="copyFramework(frameworkSummary.id)" data-tooltip="Copy">
              <i class="ti-files"></i>
            </button>

            <button class="btn" @click="downloadFrameworkFile(frameworkSummary.id)" data-tooltip="Download">
              <i class="ti-download"></i>
            </button>
          </td>
          <td>{{ frameworkSummary.creationTime.toUTCString() }}</td>
          <td>{{ frameworkSummary.updatedTime ? frameworkSummary.updatedTime.toUTCString():
            'No modification' }}
          </td>
        </tr>
        </tbody>
      </table>

      <div class="ControlsRow">
        <button class="btn" @click="deleteModal()">Delete selected</button>
        <button class="btn" @click="downloadSelectedFrameworks">Download selected</button>
      </div>
    </div>


    <modal name="demo-framework"
           height="auto"
           :classes="['v--modal', 'vue-dialog']"
           :pivot-y="0.3"
           :adaptive="true">

      <div class="dialog-content">
        <div class="dialog-c-title">
          Load framework from library
        </div>
        <p>
          <a href="https://docs.google.com/document/d/18zgBsP95ThjrDm2Uzzw9aS_jN1ykADAEkGKtif0qvPY/edit?usp=sharing" target="_blank">Framework details</a>
        </p>
        <div class="dialog-c-text">
          <select v-model="currentFramework">
            <option v-for='framework in frameworkOptions'>
              {{ framework }}
            </option>
          </select><br><br>
        </div>
        <div style="text-align:justify">
          <button @click="addDemoFramework()" class='btn __green' style="display:inline-block">
            Add selected
          </button>

          <button @click="$modal.hide('demo-framework')" class='btn __red' style="display:inline-block">
            Cancel
          </button>
        </div>
      </div>
    </modal>

    <modal name="create-framework"
           height="auto"
           :classes="['v--modal', 'vue-dialog']"
           :width="300"
           :pivot-y="0.3"
           :adaptive="true">

      <div class="dialog-content" style="padding-left:30px">
        <div class="dialog-c-title">
          Create new framework
        </div>
        <div style="text-align:justify">

          <br>
          <b>Framework type</b><br>
          <input type="radio" v-model="advancedFramework" value="0">&nbsp;Standard framework<br>
          <input type="radio" v-model="advancedFramework" value="1">&nbsp;Advanced framework<br>
          <br>
          <button @click="createNewFramework()" class='btn __green' style="display:inline-block">
            Create framework
          </button>

          <button @click="$modal.hide('create-framework')" class='btn __red' style="display:inline-block">
            Cancel
          </button>
        </div>
      </div>
    </modal>

  </div>

</template>

<script>
  import router from '../router.js';
  import sciris from 'sciris-js';

  export default {
    name: 'FrameworksPage',

    data() {
      return {
        filterPlaceholder: 'Type here to filter frameworks', // Placeholder text for table filter box
        filterText: '',  // Text in the table filter box
        allSelected: false, // Are all of the frameworks selected?
        frameworkToRename: null, // What framework is being renamed?
        sortColumn: 'name',  // Column of table used for sorting the frameworks: name, country, creationTime, updatedTime, dataUploadTime
        sortReverse: false, // Sort in reverse order?
        frameworkSummaries: [], // List of summary objects for frameworks the user has
        frame_name: 'New framework', // For creating a new framework: number of populations
        num_comps: 5, // For creating a new framework: number of populations
        frameworkOptions: [],
        currentFramework: '',
        advancedFramework: 0
      }
    },

    computed: {
      sortedFilteredFrameworkSummaries() {
        return this.applyNameFilter(this.applySorting(this.frameworkSummaries))
      }
    },

    created() {
      // If we have no user logged in, automatically redirect to the login page.
      if (this.$store.state.currentUser.username === undefined) {
        router.push('/login')
      }

      // Otherwise...
      else {
        // Load the framework summaries of the current user.
        this.updateFrameworkSummaries();
        this.getFrameworkOptions();
      }
    },

    methods: {

      beforeOpen(event) {
        console.log(event)
        // Set the opening time of the modal
        this.TEMPtime = Date.now()
      },

      beforeClose(event) {
        console.log(event)
        // If modal was open less then 5000 ms - prevent closing it
        if (this.TEMPtime + this.TEMPduration < Date.now()) {
          event.stop()
        }
      },

      getFrameworkOptions() {
        console.log('getFrameworkOptions() called');
        sciris.rpc('get_framework_options') // Get the current user's framework summaries from the server.
            .then(response => {
              this.frameworkOptions = response.data;// Set the frameworks to what we received.
              this.currentFramework = this.frameworkOptions[0];
              console.log(this.frameworkOptions);
            })
            .catch(error => {
              sciris.fail(this, 'Could not load framework options', error)
            })
      },

      async updateFrameworkSummaries() {
        try {
          let response = await sciris.rpc('jsonify_frameworks', [this.$store.state.currentUser.username]);
          for (let i = 0; i < response.data.length; i++) {
            response.data[i].new_name = ''; // Store the string in the edit text box for renaming (create the property here so that the text boxes can bind to it)
            response.data[i].selected = false; // Flag whether the checkbox is checked or not
            response.data[i].renaming = false; // Flag whether to show the edit text box or not
            response.data[i].creationTime = new Date(response.data[i].creationTime); // Extract actual Date objects from the strings.
            response.data[i].updatedTime = new Date(response.data[i].updatedTime);
          }
          this.frameworkSummaries = response.data;
        } catch (error) {
          sciris.fail(this, 'Could not load frameworks', error)
        }
      },

      addDemoFramework() {
        console.log('addDemoFramework() called')
        this.$modal.hide('demo-framework')
        sciris.start(this)
        sciris.rpc('add_demo_framework', [this.$store.state.currentUser.username, this.currentFramework]) // Have the server create a new framework.
            .then(response => {
              this.updateFrameworkSummaries() // Update the framework summaries so the new framework shows up on the list.
              sciris.succeed(this, 'Library framework loaded') // Indicate success.
            })
            .catch(error => {
              sciris.fail(this, 'Could not load framework', error)
            })
      },

      addDemoFrameworkModal() {
        // Open a model dialog for creating a new framework
        console.log('addDemoFrameworkModal() called');
        this.$modal.show('demo-framework');
      },

      createNewFrameworkModal() {
        // Open a model dialog for creating a new framework
        console.log('addNewFrameworkModal() called');
        this.$modal.show('create-framework');
      },

      createNewFramework() {
        console.log('createNewFramework() called with advanced=' + this.advancedFramework)
        this.$modal.hide('create-framework')
        sciris.start(this)
        sciris.download('download_new_framework', [this.advancedFramework]) // Have the server create a new framework.
            .then(response => {
              sciris.succeed(this, '')
            })
            .catch(error => {
              sciris.fail(this, 'Could not download the framework', error)
            })
      },

      uploadFrameworkFromFile() {
        console.log('uploadFrameworkFromFile() called')
        sciris.upload('upload_new_frameworkbook', [this.$store.state.currentUser.username], {}, '.xlsx') // Have the server upload the framework.
            .then(response => {
              sciris.start(this)
              this.updateFrameworkSummaries() // Update the framework summaries so the new framework shows up on the list.
              sciris.succeed(this, 'Framework uploaded')
            })
            .catch(error => {
              sciris.fail(this, 'Could not upload the framework', error)
            })
            .finally(response => {
            })
      },

      frameworkIsActive(uid) {
        if (this.$store.state.activeFramework.framework === undefined) { // If the framework is undefined, it is not active.
          return false
        } else { // Otherwise, the framework is active if the UIDs match.
          return (this.$store.state.activeFramework.id === uid)
        }
      },

      selectAll() {
        console.log('selectAll() called')
        this.frameworkSummaries.forEach(theFramework => theFramework.selected = !this.allSelected)
      },

      uncheckSelectAll() {
        this.allSelected = false
      },

      updateSorting(sortColumn) {
        console.log('updateSorting() called')
        if (this.sortColumn === sortColumn) { // If the active sorting column is clicked...
          this.sortReverse = !this.sortReverse // Reverse the sort.
        } else { // Otherwise.
          this.sortColumn = sortColumn // Select the new column for sorting.
          this.sortReverse = false // Set the sorting for non-reverse.
        }
      },

      applyNameFilter(frameworks) {
        try {
          console.log('Filtering frameworks')
          return frameworks.filter(theFramework => theFramework.name.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1)
        } catch (err) {
          console.log('Filtering failed: ' + err.message)
        }
      },

      applySorting(frameworks) {
        return frameworks.slice(0).sort((frw1, frw2) => {
              let sortDir = this.sortReverse ? -1 : 1
              if (this.sortColumn === 'name') {
                return (frw1.name.toLowerCase() > frw2.name.toLowerCase() ? sortDir : -sortDir)
              } else if (this.sortColumn === 'creationTime') {
                return (frw1.creationTime > frw2.creationTime ? sortDir : -sortDir)
              } else if (this.sortColumn === 'updatedTime') {
                return (frw1.updatedTime > frw2.updatedTime ? sortDir : -sortDir)
              }
            }
        )
      },

      copyFramework(uid) {
        let matchFramework = this.frameworkSummaries.find(theFrame => theFrame.id === uid) // Find the framework that matches the UID passed in.
        console.log('copyFramework() called for ' + matchFramework.name)
        sciris.start(this)
        sciris.rpc('copy_framework', [uid]) // Have the server copy the framework, giving it a new name.
            .then(response => {
              this.updateFrameworkSummaries() // Update the framework summaries so the copied program shows up on the list.
              sciris.succeed(this, 'Framework "' + matchFramework.name + '" copied')
            })
            .catch(error => {
              sciris.fail(this, 'Could not copy framework', error)
            })
      },

      startRename(frameworkSummary) {
        console.log('renaming');
        console.log(frameworkSummary);
        frameworkSummary.renaming = true;
        frameworkSummary.new_name = frameworkSummary.name;
      },

      cancelRename(frameworkSummary) {
        frameworkSummary.renaming = false;
      },

      async renameFramework(frameworkSummary) {

        // First check for collisions on the client's end to speed things up
        // and allow the user to continue editing without losing their partial edit
        for (let i = 0; i < this.frameworkSummaries.length; i++) {
          if ((frameworkSummary !== this.frameworkSummaries[i]) && (frameworkSummary.new_name === this.frameworkSummaries[i].name)) {
            this.$sciris.fail(this, 'Duplicate name already exists');
            return
          }
        }

        this.$sciris.start(this);
        frameworkSummary.renaming = false; // End renaming even if there is a server-side error
        try {
          await this.$sciris.rpc('rename_framework', [frameworkSummary.id, frameworkSummary.new_name]); // This function will error for any DB failure, so if it succeeds then we must have successfully renamed
          frameworkSummary.name = frameworkSummary.new_name; // Update the table, no need to refresh the entire page
          this.$sciris.succeed(this, '')  // No green popup.
        } catch (error) {
          this.$sciris.fail(this, 'Could not rename framework', error)
        }
      },

      downloadFrameworkFile(uid) {
        console.log('downloadFrameworkFile() called')
        sciris.start(this)
        sciris.download('download_framework', [uid]) // Make the server call to download the framework to a .prj file.
            .then(response => {
              sciris.succeed(this, '')
            })
            .catch(error => {
              sciris.fail(this, 'Could not rename framework', error)
            })
      },

      deleteModal() {
        let selectFrameworksUIDs = this.frameworkSummaries.filter(theFrame => theFrame.selected).map(theFrame => theFrame.id) // Pull out the names of the frameworks that are selected.
        if (selectFrameworksUIDs.length > 0) { // Only if something is selected...
          var obj = { // Alert object data
            message: 'Are you sure you want to delete the selected frameworks?',
            useConfirmBtn: true,
            customConfirmBtnClass: 'btn __red',
            customCloseBtnClass: 'btn',
            onConfirm: this.deleteSelectedFrameworks
          }
          this.$Simplert.open(obj)
        }
      },

      deleteSelectedFrameworks() {
        let selectFrameworksUIDs = this.frameworkSummaries.filter(theFrame => theFrame.selected).map(theFrame => theFrame.id) // Pull out the names of the frameworks that are selected.
        console.log('deleteSelectedFrameworks() called for ', selectFrameworksUIDs)
        if (selectFrameworksUIDs.length > 0) { // Have the server delete the selected frameworks.
          sciris.start(this)
          sciris.rpc('delete_frameworks', [selectFrameworksUIDs, this.$store.state.currentUser.username])
              .then(response => {
                this.updateFrameworkSummaries(null)
                sciris.succeed(this, '')
              })
              .catch(error => {
                sciris.fail(this, 'Could not delete framework(s)', error)
              })
        }
      },

      downloadSelectedFrameworks() {
        let selectFrameworksUIDs = this.frameworkSummaries.filter(theFrame => theFrame.selected).map(theFrame => theFrame.id) // Pull out the names of the frameworks that are selected.
        console.log('downloadSelectedFrameworks() called for ', selectFrameworksUIDs)
        if (selectFrameworksUIDs.length > 0) { // Have the server download the selected frameworks.
          sciris.start(this)
          sciris.download('download_frameworks', [selectFrameworksUIDs, this.$store.state.currentUser.username])
              .then(response => {
                sciris.succeed(this, '')
              })
              .catch(error => {
                sciris.fail(this, 'Could not download framework(s)', error)
              })
        }
      }
    }
  }
</script>
