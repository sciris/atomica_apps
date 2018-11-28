<!--
About page

Last update: 2018sep23
-->

<template>
  <div class="SitePage">
    <div style="max-width:800px; margin:auto" v-model="getVersionInfo">
      <div style="text-align:center;">
        <img src="static/img/cascade-logo-black.png" width="250px">
      </div>
      <br/>
      <br/>
      <p>
        Development of Cascade Analysis Tools is supported through the
        <a href="https://www.ku.dk/english/">University of Copenhagen</a> under the auspices of the
        <a href="http://www.gatesfoundation.org">Bill and Melinda Gates Foundation</a>.
      </p>
      <br/>
      <br/>
      <div class="divTable" style="width:100%">
        <div class="divTableBody">
            <div class="divTableRow">
            <div 
              class="divRowContent" 
              style="text-align:center; padding-bottom:30px">
              <img src="static/img/copenhagen-logo.png" height="60px">
            </div>
            <div 
              class="divRowContent" 
              style="text-align:center; padding-bottom:30px">
              <img src="static/img/gatesfoundation-logo.png" height="60px">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import sciris from 'sciris-js';

export default {
  computed: {
    getVersionInfo() {
      sciris.rpc('get_version_info')
      .then(response => {
        this.version = response.data['version'];
        this.date = response.data['date'];
      })
    }
  }
}
</script>
