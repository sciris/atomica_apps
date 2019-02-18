<!--
Login page

Last update: 2018sep22
-->

<template>
  <div class="SitePage" style="background-color:#f8f8f4; position:fixed; min-height:100%; min-width:100%; padding:0 0 0 0" v-model="getVersionInfo"> <!-- Should match _variables.scss:$bg-nude -->
    <div style="background-color: #0c2544; position:absolute; height:100%; width:260px">
      <div class="logo">
        <div class="simple-text" style="font-size:20px; color:#fff; font-weight:bold; padding:20px">
          <div v-if="favicon" class="logo-img" style="height:40px; width:40px; line-height:40px; border-radius:40px; background-color:#fff; text-align:center; display:inline-block">
            <img :src="favicon" width="21px" vertical-align="middle" alt>
          </div>
          <span style="padding-left:10px">
            <a v-if="homepage" :href="homepage" target="_blank">
              <img :src="logo" width="160px" vertical-align="middle" alt>
            </a>
            <img v-else :src="logo" width="160px" vertical-align="middle" alt>
          </span>
          <br/><br/>
          <div v-if="version" style="font-size:14px; font-weight:normal">
            <div v-if="verboseToolName">
              {{ verboseToolName }} 
            </div>
            Version {{ version }} ({{ date }})
          </div>
        </div>
      </div>
    </div>
    <div style="margin-right:-260px">
      <form name="LogInForm" @submit.prevent="tryLogin" style="max-width: 500px; min-width: 100px; margin: 0 auto">

        <div class="modal-body">
          <h2>Login</h2>

          <div class="section" v-if="loginResult != ''">{{ loginResult }}</div>

          <div class="section form-input-validate">
            <input class="txbox __l"
                   type="text"
                   name="username"
                   placeholder="User name"
                   required="required"
                   v-model='loginUserName'/>
          </div>

          <div class="section form-input-validate">
            <input class="txbox __l"
                   type="password"
                   name="password"
                   placeholder="Password"
                   required="required"
                   v-model='loginPassword'/>
          </div>

          <button type="submit" class="section btn __l __block">Login</button>

          <div class="section">
            New user?
            <router-link to="/register">
              Register here
            </router-link>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import EventBus from '../eventbus.js'; 
import { events } from '../eventbus.js'; 

export default {
  name: 'LoginPage',

  props: {
    homepage: {
      type: String,
      default: ""
    },
    logo: {
      type: String,
      default: ""
    },
    verboseToolName: {
      type: String,
      default: ""
    },
    authBackgroundColour: {
      type: String,
      default: "#0c2544"
    },
    favicon: {
      type: String,
      default: ""
    },
  },

  data () {
    return {
      loginUserName: '',
      loginPassword: '',
      loginResult: '',
      version: '',
      date: '',
    }
  },

  computed: {
    getVersionInfo() {
      this.$sciris.rpc('get_version_info')
      .then(response => {
        this.version = response.data['version'];
        this.date = response.data['date'];
      })
    },
  },

  methods: {
    tryLogin () {
      this.$sciris.loginCall(this.loginUserName, this.loginPassword)
      .then(response => {
        if (response.data === 'success') {
          // Set a success result to show.
          this.loginResult = 'Logging in...'

          // Read in the full current user information.
          this.$sciris.getCurrentUserInfo()
          .then(response2 => {
            // Set the username to what the server indicates.
            let user = response2.data.user;
            this.$store.commit('newUser', user)

            // Navigate automatically to the home page.
            EventBus.$emit(events.EVENT_LOGIN_SUCCESS, user); 
          })
          .catch(error => {
            // Set the username to {}.  An error probably means the
            // user is not logged in.
            this.$store.commit('newUser', {})
          })
        } else {
          // Set a failure result to show.
          this.loginResult = response.data
        }
      })
      .catch(error => {
        EventBus.$emit(events.EVENT_LOGIN_FAIL, error); 
        console.log('Login failed', error)
        this.loginResult = "We're sorry, it seems we're having trouble communicating with the server.  Please contact support or try again later."
      })
    }
  }
}
</script>
