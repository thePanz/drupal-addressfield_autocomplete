Addressfield autocomplete
------------------------------------------------------------------------------
Provides a hook into google maps autocomplete API. Implements a new widget
which utilises the addressfield autocomplete functionality.

Dependencies
------------------------------------------------------------------------------
This module extends addressfield. It adds a new widget, so you can choose an
address more easily

Installation
------------------------------------------------------------------------------
1. Install the module in the usual way.
2. Setup Google Maps API key more information on how to do this can be found here https://developers.google.com/maps/signup
3. Copy the key to here /admin/config/system/addressfield_autocomplete and save
3. Navigate to manage fields inside a content type.
4. Create or edit a new or existing address field, change the widget to Address autocomplete.

Issues
------------------------------------------------------------------------------
* There is a known issue with addressfield https://drupal.org/node/968112 whereby
if you make address an optional field it will still save data to the db. This is
because there is no country -none- option. There is a link to a patch in the link
above.