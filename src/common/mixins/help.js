var HelpMixin = {

  data () {
    return {
      username: '',
      useragent: '',
      version: '',
      date: '',
      gitbranch: '',
      githash: '',
      scversion: '',
      swversion: '',
      atversion: '',
      server: '',
      cpu: '',
      timestamp: '',
      adv_showConsole: false,
      adv_authentication: '',
      adv_query: '',
      adv_response: 'No response',
    }
  },

  computed: {
    getVersionInfo() {
      this.$sciris.rpc('get_version_info')
        .then(response => {
          this.username  = this.$store.state.currentUser.username
          this.useragent = window.navigator.userAgent
          this.timestamp = Date(Date.now()).toLocaleString()
          this.version   = response.data['version'];
          this.date      = response.data['date'];
          this.gitbranch = response.data['gitbranch'];
          this.githash   = response.data['githash'];
          this.scversion = response.data['scversion'];
          this.swversion = response.data['swversion'];
          this.atversion = response.data['atversion'];
          this.server    = response.data['server'];
          this.cpu       = response.data['cpu'];
        })
    },

  },

  methods: {

    adv_consoleModal() {
      if (!this.adv_showConsole) {
        var obj = { // Alert object data
          message: 'WARNING: This option is for authorized developers only. Unless you have received prior written authorization to use this feature, exit now. If you click "Yes", your details will be logged, and any misuse will result in immediate account suspension.',
          useConfirmBtn: true,
          customConfirmBtnText: 'Yes, I will take the risk',
          customCloseBtnText: 'Oops, get me out of here',
          customConfirmBtnClass: 'btn __red',
          customCloseBtnClass: 'btn',
          onConfirm: this.adv_toggleConsole
        }
        this.$Simplert.open(obj)
      } else {
        this.adv_showConsole = false
      }
    },

    adv_toggleConsole() {
      this.adv_showConsole = !this.adv_showConsole
    },

    adv_submit() {
      console.log('adv_submit() called')
      this.$sciris.rpc('run_query', [this.adv_authentication, this.adv_query]) // Have the server copy the project, giving it a new name.
        .then(response => {
          console.log(response.data)
          this.adv_response = response.data.replace(/\n/g,'<br>')
          this.$sciris.succeed(this, 'Query run')    // Indicate success.
        })
        .catch(error => {
          this.$sciris.fail(this, 'Could not run query', error)
        })
    },

  },
}

export default HelpMixin;
