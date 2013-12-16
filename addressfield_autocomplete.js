/**
 * @file
 * The addressfield autocomplete js.
 *
 * OO Js to allow user to pick an autocompleted address from
 */
(function($, Drupal) {
  var addressfieldAutocomplete;
  var navigatorLat = 0;
  var navigatorLng = 0;
  var autocompleteList = new Object();

  Drupal.behaviors.addressfield_autocomplete = {
    attach: function(context) {
      //Manually add address
      $('.addressfield-autocomplete-input').once('autocomplete-processed').each(function() {
        var autocomplete = new addressfieldAutocomplete($(this).attr('name'));
        autocomplete.init();
      });

      $('.addressfield-autocomplete-reveal').once('autocomplete-reveal').bind('mousedown', function(e) {
        e.stopPropagation();

        var id = undefined;
        if ($(this).attr('id')) {
          id = $(this).attr('id');
        } else {
          id = $(this).parent().siblings('.addressfield-autocomplete-input').attr('id');
        }

        o = autocompleteList[id];
        o.inputObj.val('Manual');
        e.preventDefault();
        o.manual = true;
        o.loadMap();
        o.map.setZoom(5);
        o.setDefaultPosition();
        //Reset marker to map
        o.marker.setMap(o.map);
        o.addressObj.find('select.country:first').trigger('change');
        o.showAddress();
      });

      $('select.country').once('country').change(function() {
        var wrapper = $(this).closest('div[id^="addressfield-wrapper"]');
        var id = wrapper.prev('.form-item').find('.addressfield-autocomplete-input').attr('id');
        o = autocompleteList[id];
        o.addressObj = $(this).closest('div[id^="addressfield-wrapper"]');
        o.geocodeAddress();
      });

      //If you blur out of the postal code
      $('input.postal-code').once('postal-code').blur(function() {
        var wrapper = $(this).closest('div[id^="addressfield-wrapper"]');
        var id = wrapper.prev('.form-item').find('.addressfield-autocomplete-input').attr('id');
        o = autocompleteList[id];
        o.addressObj = $(this).closest('div[id^="addressfield-wrapper"]');
        o.geocodeAddress();
      });

      if (context) {
        if (context[0] !== undefined) {
          if (context.has('[id^="addressfield-wrapper"]')) {
            var id = context.prev('.form-item').find('.addressfield-autocomplete-input').attr('id');
            if (id !== undefined && autocompleteList[id] !== undefined) {
              o = autocompleteList[id];
              o.addressObj = context;
              o.updateAddress();
            }
          }
        }

        //If the state is in the context
        if ($('select.state', context).length) {
          $('select.state', context).once('state').each(function() {
            if (typeof o !== 'undefined' && o.place.address_components.length > 1) {
              for (var i = 0; i < o.place.address_components.length; i++) {
                switch (o.place.address_components[i].types[0]) {
                  case 'administrative_area_level_1':
                    $(this).val(o.place.address_components[i].short_name);
                    break;
                }
              }
            }
          });
        }
      }
    }
  };

  addressfieldAutocomplete = function(name) {
    var o;
    this.defaultLat = 51.50722;
    this.defaultLng = -0.12750;
    this.infoWindowDisplay = true;
    this.manual = false;
    this.name = name;
    this.inputObj = $("input[name='" + this.name + "']");
    this.input_id = this.inputObj.attr('id');
    this.input = this.inputObj[0];
    this.addressObj = this.inputObj.closest('.form-item').siblings('div[id^="addressfield-wrapper"]:first');
    this.map_obj = this.inputObj.closest('.form-item').siblings('.autocomplete-map:first');
    this.manualLink = this.inputObj.siblings().find('.addressfield-autocomplete-reveal:first');
    this.lat = parseFloat(this.addressObj.find('.latitude').val());
    this.lng = parseFloat(this.addressObj.find('.longitude').val());
    this.mapdId = this.map_obj.attr('id');
    this.map = undefined;
    this.infoWindow = undefined;
    this.autocomplete = undefined;
    this.place = undefined;
    this.marker = undefined;
    this.displayMarker = true;
    this.geocoder = undefined;
    this.prevAddress = "";
    this.init = function() {
      o = this;
      autocompleteList[this.input_id] = o;
      google.maps.event.addDomListener(window, 'load', o.load());
      //If lat lng not undefined then we show the map
      if ((o.lat !== 0 && o.lng !== 0) || o.inputObj.closest('.form-item').prev('.addressfield-autocomplete-hidden-reveal').val() == 1) {
        if (o.lat !== 0 && o.lng !== 0) {
          var pos = new google.maps.LatLng(o.lat, o.lng);
          o.showAddress();
          o.map.setZoom(17);
          o.setMarker(pos);
          o.map.setCenter(pos);
        } else {
          o.geocodeAddress();
          o.showAddress();
        }
      }
      //Add link inside google popup box
      $(document).delegate("input#" + o.input_id, 'keydown', function() {
        $(".pac-container").find(".addressfield-autocomplete-reveal").remove();
        o.manualLink.clone(true).text("Can't find your location?").attr('id', o.input_id).appendTo(".pac-container");
      });
    };
    this.load = function() {
      o.loadMap();
      if (o.geocoder === undefined) {
        o.geocoder = new google.maps.Geocoder();
      }
      o.autocomplete = new google.maps.places.Autocomplete(o.input);

      if (o.map !== undefined) {
        o.marker = new google.maps.Marker({
          map: o.map
        });
        if (o.autocomplete !== undefined) {
          o.autocomplete.bindTo('bounds', o.map);
        }
      }

      if (o.autocomplete !== undefined) {
        google.maps.event.addListener(o.autocomplete, 'place_changed', o.listener);
      }
      google.maps.event.addDomListener(o.input, 'keydown', function(e) {
        if (e.keyCode === 13) {
          e.preventDefault();
        }
      });
      this.loaded = true;
    };
    this.loadMap = function() {
      if (o.map_obj) {
        var mapOptions = {
          zoom: 13,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
          },
          zoomControl: true,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
          },
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        o.map = new google.maps.Map(o.map_obj[0], mapOptions);
        o.setPosition();
      }
    };
    this.mauallyPickLocation = function() {
      o.marker.setDraggable(true);
      //Listener needs to be added and then update lat long values on drop
      google.maps.event.addListener(o.marker, 'position_changed', function() {
        if (o.infoWindow !== undefined) {
          o.infoWindow.close();
        }
        o.addressObj.find('.latitude').val(o.marker.position.lat());
        o.addressObj.find('.longitude').val(o.marker.position.lng());
      });
    };
    this.listener = function() {
      if (o.infoWindow !== undefined) {
        o.infoWindow.close();
      }
      o.marker.setVisible(false);
      o.place = this.getPlace();
      if (!o.place.geometry) {
        return false;
      }

      // If the place has a geometry, then present it on a map.
      if (o.place.geometry.viewport) {
        o.map.fitBounds(o.place.geometry.viewport);
      } else {
        o.map.setZoom(17);
      }

      //Show address_components and put them in the correct position
      o.updateAddress();
      return false;
    };
    this.updateAddress = function() {
      var thoroughfare_completed = false;
      //If thoroughfare already filled out we should probably not update it
      if ($.trim(o.addressObj.find('input.thoroughfare:first').val())) {
        thoroughfare_completed = true;
        o.place.name = o.addressObj.find('input.thoroughfare:first').val();
      }

      if (o.infoWindowDisplay) {
        var address = '';
        if (o.displayMarker) {
          o.setMarker();
        }
        if (o.place.address_components) {
          address = [
            (o.place.address_components[0] && o.place.address_components[0].long_name || ''),
            (o.place.address_components[1] && o.place.address_components[1].long_name || ''),
            (o.place.address_components[2] && o.place.address_components[2].long_name || ''),
            (o.place.address_components[3] && o.place.address_components[3].long_name || ''),
            (o.place.address_components[4] && o.place.address_components[4].long_name || '')
          ].join(',<br />');
        }
        //Reveal the address in the google map info window
        if (o.map !== undefined) {
          var addObj = $('<div class="google-info-window"><address>' + $.trim(address) + '</address></div>');
          if (o.infoWindow === undefined) {
            o.infoWindow = new google.maps.InfoWindow({
              content: addObj[0]
            });
          }
          o.infoWindow.open(o.map, o.marker);
        }
      }

      //Move the components into the correct place
      for (var i = 0; i < o.place.address_components.length; i++) {
        switch (o.place.address_components[i].types[0]) {
          case "street_number":
          case "route":
            if (!thoroughfare_completed) {
              var thoroughfare = o.addressObj.find('input.thoroughfare:first');
              if (thoroughfare.val()) {
                thoroughfare[0].value += " ";
              }
              thoroughfare[0].value += o.place.address_components[i].long_name;
            }
            break;

          case "postal_town":
          case "locality":
            o.addressObj.find('input.locality:first').val(o.place.address_components[i].long_name);
            break;

          case "sub_locality":
            o.addressObj.find('input.dependent-locality:first').val(o.place.address_components[i].long_name);
            break;

          case "administrative_area_level_2":
            o.addressObj.find('input.state:first').val(o.place.address_components[i].long_name);
            break;

          case "postal_code":
            o.addressObj.find('input.postal-code:first').val(o.place.address_components[i].long_name);
            break;

          case "country":
            o.addressObj.find('select.country:first').val(o.place.address_components[i].short_name);
            break;
        }
      }
      o.prevAddress = o.getAddress();
      //Add latitude and longitude values
      o.addressObj.find('.latitude').val(o.place.geometry.location.lat());
      o.addressObj.find('.longitude').val(o.place.geometry.location.lng());
      o.map.setCenter(o.place.geometry.location);
      o.showAddress();
    };
    this.setPosition = function() {
      if (navigator.geolocation && o.manual && (!o.lat && !o.lng) && (!navigatorLat && !navigatorLng)) {
        navigator.geolocation.getCurrentPosition(o.reverseGeocodeAddress);
      } else {
        o.setDefaultPosition();
      }
    };
    this.setDefaultPosition = function() {
      var lat;
      var lng;
      if (o.lat && o.lng) {
        lat = o.lat;
        lng = o.lng;
      } else if (navigatorLat && navigatorLng) {
        lat = navigatorLat;
        lng = navigatorLng;
      } else {
        lng = o.defaultLat;
        lng = o.defaultLng;
      }
      var pos = new google.maps.LatLng(lat, lng);
      o.map.setCenter(pos);
    };
    this.setMarker = function(pos) {
      var location = pos ? pos : o.place.geometry.location;
      o.marker.setPosition(location);
      o.marker.setVisible(true);
    };
    this.showAddress = function() {
      var reveal = o.inputObj.closest('.form-item').prev('.addressfield-autocomplete-hidden-reveal');
      if (reveal.val() == 0) {
        o.addressObj.find('select.country:first').trigger('change');
        reveal.val(1);
        reveal.trigger('change');
      }
      if (o.map !== undefined) {
        o.map_obj.show();
        if (o.map.getCenter() === undefined) {
          o.setDefaultPosition();
        }
        google.maps.event.trigger(o.map, 'resize');
      }
      o.mauallyPickLocation();
    };
    this.getAddress = function() {
      var address = new Array();
      if ($.trim(o.addressObj.find('input.thoroughfare:first').val())) {
        address.push($.trim(o.addressObj.find('input.thoroughfare:first').val()));
      }
      if ($.trim(o.addressObj.find('input.postal-code:first').val())) {
        o.map.setZoom(17);
        address.push($.trim(o.addressObj.find('input.postal-code:first').val()));
      }
      if ($.trim(o.addressObj.find('select.country:first').val())) {
        if (address.length === 0) {
          o.map.setZoom(5);
          o.infoWindowDisplay = o.displayMarker = false;
        }
        address.push($.trim(o.addressObj.find('select.country:first option:selected').text()));
      }
      return address.join(', ');
    };
    this.geocodeAddress = function() {
      o.infoWindowDisplay = o.displayMarker = true;
      var new_address = o.getAddress();
      if (o.prevAddress !== new_address) {
        o.geocoder.geocode({
          'address': new_address
        }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            o.place = results[0];
            o.updateAddress();
          }
        });
        o.prevAddress = new_address;
      }
    };
    this.reverseGeocodeAddress = function(position) {
      navigatorLat = position.coords.latitude;
      navigatorLng = position.coords.longitude;
      var pos = new google.maps.LatLng(navigatorLat, navigatorLng);
      o.geocoder.geocode({
        'latLng': pos
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            o.place = results[0];
            o.updateAddress();
            o.addressObj.find('select.country').trigger('change');
          }
        }
      });
    };
  };
})(jQuery, Drupal);
