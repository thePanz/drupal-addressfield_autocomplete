Addressfield autocomplete
------------------------------------------------------------------------------
Provides a hook into google maps autocomplete API. Implements a new widget
which utilises the addressfield autocomplete functionality.

Dependencies
------------------------------------------------------------------------------
This module extends addressfield. It adds a new widget, so you can choose an
address more easily. It also requires the GMap module and in this module you
must input a google maps API key.

Installation
------------------------------------------------------------------------------
1. Make sure you have installed both the addressfield and GMap modules.
   https://developers.google.com/maps/documentation/javascript/tutorial#api_key
2. Navigate to manage fields inside a content type.
3. Create or edit a new or existing address field, change the widget to Address
   autocomplete.

Issues
------------------------------------------------------------------------------
There is a known issue with addressfield https://drupal.org/node/968112
whereby if you make address an optional field it will still save data to the db.
This is because there is no country -none- option. There is a link to a patch
in the linkabove.
