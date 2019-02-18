import Vue from 'vue';

const EVENT_LOGIN_SUCCESS = 'sciris:login:success';
const EVENT_LOGIN_FAIL = 'sciris:login:fail';
const EVENT_PASSWORD_CHANGE_SUCCESS = 'sciris:passwordchange:success';
const EVENT_PASSWORD_CHANGE_FAIL = 'sciris:passwordchange:fail';
const EVENT_REGISTER_SUCCESS = 'sciris:register:success';
const EVENT_REGISTER_FAIL = 'sciris:register:fail';
const EVENT_INFO_CHANGE_SUCCESS = 'sciris:infochange:success';
const EVENT_INFO_CHANGE_FAIL = 'sciris:infochange:fail';
const EVENT_LOGOUT_SUCCESS = 'sciris:logout:success';

const events = {
  EVENT_LOGIN_FAIL, 
  EVENT_LOGIN_SUCCESS,
  EVENT_REGISTER_SUCCESS,
  EVENT_REGISTER_FAIL, 
  EVENT_PASSWORD_CHANGE_SUCCESS, 
  EVENT_PASSWORD_CHANGE_FAIL,
  EVENT_INFO_CHANGE_SUCCESS, 
  EVENT_INFO_CHANGE_FAIL, 
  EVENT_LOGOUT_SUCCESS 
}

const EventBus = new Vue();

export default EventBus;

export {
  events
}
