export const PROFILE_UPDATED_EVENT = "cue:profile-updated";
export const REQUEST_CITY_CHANGE_EVENT = "cue:request-city-change";

export function dispatchProfileUpdated() {
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
}

export function dispatchCityChangeRequested() {
  window.dispatchEvent(new CustomEvent(REQUEST_CITY_CHANGE_EVENT));
}
