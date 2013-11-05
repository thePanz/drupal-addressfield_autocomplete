<?php

/**
 * @file
 * The addressfield autocomplete admin.
 *
 * Settings for so the user can set a google maps api key.
 */

/**
 * Admin settings form.
 */
function addressfield_autocomplete_settings() {
  $form = array();
  $form['google_maps_api'] = array(
    '#type' => 'fieldset',
    '#title' => 'Google maps API settings',
    '#collapsible' => TRUE,
    'addressfield_autocomplete_google_maps_api_key' => array(
      '#type' => 'textfield',
      '#title' => t('API key'),
      '#maxlength' => 200,
      '#default_value' => variable_get('addressfield_autocomplete_google_maps_api_key', ''),
    ),
  );
  return system_settings_form($form);
}
