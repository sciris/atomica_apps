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
    </div><br>

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
          <th @click="updateSorting('name')" class="sortable">
            Name
            <span v-show="sortColumn == 'name' && !sortReverse">
                <i class="fas fa-caret-down"></i>
              </span>
            <span v-show="sortColumn == 'name' && sortReverse">
                <i class="fas fa-caret-up"></i>
              </span>
            <span v-show="sortColumn != 'name'">
                <i class="fas fa-caret-up" style="visibility: hidden"></i>
              </span>
          </th>
          <th>Framework actions</th>
          <th @click="updateSorting('creationTime')" class="sortable">
            Created on
            <span v-show="sortColumn == 'creationTime' && !sortReverse">
                <i class="fas fa-caret-down"></i>
              </span>
            <span v-show="sortColumn == 'creationTime' && sortReverse">
                <i class="fas fa-caret-up"></i>
              </span>
            <span v-show="sortColumn != 'creationTime'">
                <i class="fas fa-caret-up" style="visibility: hidden"></i>
              </span>
          </th>
          <th @click="updateSorting('updatedTime')" class="sortable">
            Last modified
            <span v-show="sortColumn == 'updatedTime' && !sortReverse">
                <i class="fas fa-caret-down"></i>
              </span>
            <span v-show="sortColumn == 'updatedTime' && sortReverse">
                <i class="fas fa-caret-up"></i>
              </span>
            <span v-show="sortColumn != 'updatedTime'">
                <i class="fas fa-caret-up" style="visibility: hidden"></i>
              </span>
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="frameworkSummary in sortedFilteredFrameworkSummaries">
          <td>
            <input type="checkbox" @click="uncheckSelectAll()" v-model="frameworkSummary.selected"/>
          </td>
          <td v-if="frameworkSummary.renaming !== ''">
            <input type="text"
                   class="txbox renamebox"
                   @keyup.enter="renameFramework(frameworkSummary)"
                   v-model="frameworkSummary.renaming"/>
          </td>
          <td v-else>
            {{ frameworkSummary.framework.name }}
          </td>
          <td>
            <button class="btn" @click="renameFramework(frameworkSummary)" data-tooltip="Rename">
              <i class="ti-pencil"></i>
            </button>
            <button class="btn" @click="copyFramework(frameworkSummary.framework.id)" data-tooltip="Copy">
              <i class="ti-files"></i>
            </button>

            <button class="btn" @click="downloadFrameworkFile(frameworkSummary.framework.id)" data-tooltip="Download">
              <i class="ti-download"></i>
            </button>
          </td>
          <td>{{ frameworkSummary.framework.creationTime.toUTCString() }}</td>
          <td>{{ frameworkSummary.framework.updatedTime ? frameworkSummary.framework.updatedTime.toUTCString():
            'No modification' }}</td>
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
        this.updateFrameworkSummaries()
        this.getFrameworkOptions()
      }
    },

    methods: {

      beforeOpen (event) {
        console.log(event)
        // Set the opening time of the modal
        this.TEMPtime = Date.now()
      },

      beforeClose (event) {
        console.log(event)
        // If modal was open less then 5000 ms - prevent closing it
        if (this.TEMPtime + this.TEMPduration < Date.now()) {
          event.stop()
        }
      },

      getFrameworkOptions() {
        console.log('getFrameworkOptions() called')
        sciris.rpc('get_framework_options') // Get the current user's framework summaries from the server.
          .then(response => {
            this.frameworkOptions = response.data // Set the frameworks to what we received.
            this.currentFramework = this.frameworkOptions[0]
            console.log(this.frameworkOptions)
          })
          .catch(error => {
            sciris.fail(this, 'Could not load framework options', error)
          })
      },

      updateFrameworkSummaries() {
        console.log('updateFrameworkSummaries() called')
        sciris.rpc('jsonify_frameworks', [this.$store.state.currentUser.username]) // Get the current user's framework summaries from the server.
        .then(response => {
          this.frameworkSummaries = response.data.frameworks // Set the frameworks to what we received.
          this.frameworkToRename = null  // Unset the link to a framework being renamed.
          this.frameworkSummaries.forEach(theFrame => { // Preprocess all frameworks.
            theFrame.selected = false // Set to not selected.
            theFrame.renaming = '' // Set to not being renamed.
            theFrame.framework.creationTime = new Date(theFrame.framework.creationTime) // Extract actual Date objects from the strings.
            theFrame.framework.updatedTime = new Date(theFrame.framework.updatedTime)
          })
          console.log(this.frameworkSummaries)
        })
        .catch(error => {
          sciris.fail(this, 'Could not load frameworks', error)
        })
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
          return (this.$store.state.activeFramework.framework.id === uid)
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
          return frameworks.filter(theFramework => theFramework.framework.name.toLowerCase().indexOf(this.filterText.toLowerCase()) !== -1)
        } catch(err) {
          console.log('Filtering failed: ' + err.message)
        }
      },

      applySorting(frameworks) {
        return frameworks.slice(0).sort((frw1, frw2) =>
          {
            let sortDir = this.sortReverse ? -1: 1
            if      (this.sortColumn === 'name')         {return (frw1.framework.name.toLowerCase() > frw2.framework.name.toLowerCase() ? sortDir: -sortDir)}
            else if (this.sortColumn === 'creationTime') {return (frw1.framework.creationTime       > frw2.framework.creationTime ? sortDir: -sortDir)}
            else if (this.sortColumn === 'updatedTime')  {return (frw1.framework.updatedTime        > frw2.framework.updatedTime ? sortDir: -sortDir)}
          }
        )
      },

      copyFramework(uid) {
        let matchFramework = this.frameworkSummaries.find(theFrame => theFrame.framework.id === uid) // Find the framework that matches the UID passed in.
        console.log('copyFramework() called for ' + matchFramework.framework.name)
        sciris.start(this)
        sciris.rpc('copy_framework', [uid]) // Have the server copy the framework, giving it a new name.
        .then(response => {
          this.updateFrameworkSummaries() // Update the framework summaries so the copied program shows up on the list.
          sciris.succeed(this, 'Framework "'+matchFramework.framework.name+'" copied')
        })
        .catch(error => {
          sciris.fail(this, 'Could not copy framework', error)
        })       
      },

      finishRename(event) {
        // Grab the element of the open textbox for the framework name to be renamed.
        let renameboxElem = document.querySelector('.renamebox')

        // If the click is outside the textbox, rename the remembered framework.
        if (!renameboxElem.contains(event.target)) {
          this.renameFramework(this.frameworkToRename)
        }
      },

      renameFramework(frameworkSummary) {
        console.log('renameFramework() called for ' + frameworkSummary.framework.name)
        if (frameworkSummary.renaming === '') { // If the framework is not in a mode to be renamed, make it so.
          frameworkSummary.renaming = frameworkSummary.framework.name
          // Add a click listener to run the rename when outside the input box is click, and remember
          // which framework needs to be renamed.
          window.addEventListener('click', this.finishRename)
          this.frameworkToRename = frameworkSummary
        }
        else { // Otherwise (it is to be renamed)...
          // Remove the listener for reading the clicks outside the input box, and null out the framework
          // to be renamed.
          window.removeEventListener('click', this.finishRename)
          this.frameworkToRename = null
          let newFrameworkSummary = JSON.parse(JSON.stringify(frameworkSummary)) // Make a deep copy of the frameworkSummary object by JSON-stringifying the old object, and then parsing the result back into a new object.
          newFrameworkSummary.framework.name = frameworkSummary.renaming // Rename the framework name in the client list from what's in the textbox.
          sciris.start(this) 
          sciris.rpc('rename_framework', [newFrameworkSummary]) // Have the server change the name of the framework by passing in the new copy of the summary.
          .then(response => {
            this.updateFrameworkSummaries() // Update the framework summaries so the rename shows up on the list.
            frameworkSummary.renaming = '' // Turn off the renaming mode.
            sciris.succeed(this, '')
          })
          .catch(error => {
            sciris.fail(this, 'Could not rename framework', error)
          })            
        }

        // This silly hack is done to make sure that the Vue component gets updated by this function call.
        // Something about resetting the framework name informs the Vue component it needs to
        // update, whereas the renaming attribute fails to update it.
        // We should find a better way to do this.
        let theName = frameworkSummary.framework.name
        frameworkSummary.framework.name = 'newname'
        frameworkSummary.framework.name = theName
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
        let selectFrameworksUIDs = this.frameworkSummaries.filter(theFrame => theFrame.selected).map(theFrame => theFrame.framework.id) // Pull out the names of the frameworks that are selected.
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
        let selectFrameworksUIDs = this.frameworkSummaries.filter(theFrame => theFrame.selected).map(theFrame => theFrame.framework.id) // Pull out the names of the frameworks that are selected.
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
        let selectFrameworksUIDs = this.frameworkSummaries.filter(theFrame => theFrame.selected).map(theFrame => theFrame.framework.id) // Pull out the names of the frameworks that are selected.
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