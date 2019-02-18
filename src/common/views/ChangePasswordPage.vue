<!--
Change the user's password

Last update: 2018-08-26
-->

<template>
  <div>
    <p v-if="changeResult != ''">{{ changeResult }}</p>

    <form 
      class="password-change-form"
      name="ChangePasswordForm" 
      @submit.prevent="tryChangePassword">

      <div class="section form-input-validate">
        <input 
          class="txbox __l"
          type="password"
          name="oldpassword"
          placeholder="Reenter old password"
          required="required"
          v-model='oldPassword'/>
      </div>

      <div class="section form-input-validate">
        <input 
          class="txbox __l"
          type="password"
          name="password"
          placeholder="Enter new password"
          required="required"
          v-model='newPassword'/>
      </div>

      <button type="submit" class="section btn __l __block">Update</button>

      <br/>

    </form>
  </div>
</template>

<script>
import EventBus from '../eventbus.js'; 
import { events } from '../eventbus.js'; 

export default {

  name: 'ChangePasswordPage',

  data () {
    return {
      oldPassword: '',
      newPassword: '',
      changeResult: ''
    }
  },

  methods: {
    tryChangePassword () {
      this.$sciris.changeUserPassword(this.oldPassword, this.newPassword)
        .then(response => {
          if (response.data === 'success') {
            this.$sciris.succeed(this, 'Password updated')
            // Read in the full current user information.
            this.$sciris.getCurrentUserInfo()
              .then(response2 => {
                // Set the username to what the server indicates.
                let user = response2.data.user;
                this.$store.commit('newUser', user)

                // Navigate automatically to the home page.
                EventBus.$emit(events.EVENT_PASSWORD_CHANGE_SUCCESS, user); 
              })
              .catch(error => {
                // Set the username to {}.  An error probably means the
                // user is not logged in.
                this.$store.commit('newUser', {})
              })
          } else {
            this.changeResult = response.data
          }
        })
        .catch(error => {
          this.$sciris.fail(this, 'Password updated failed', error);
          EventBus.$emit(events.EVENT_PASSWORD_CHANGE_FAIL, error); 
        })
    }
  }
}
</script>
