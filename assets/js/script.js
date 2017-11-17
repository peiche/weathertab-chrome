var TempScale = {
	FAHRENHEIT: 'F',
	CELSIUS: 'C'
};

window.sr = new ScrollReveal();

$(document).ready(function() {
    
	$('.modal').modal();
	
    $('#loader').removeClass('hide');
	
	chrome.storage.sync.get('tempscale', function(items) {
		
		var tempscale = TempScale.FAHRENHEIT;
		if (items.tempscale) {
			tempscale = items.tempscale;
		}
		
		if (TempScale.CELSIUS === tempscale) {
			$('[name="useCelsius"]').attr('checked', true);
		}
		
		init(tempscale, true);
		
	});
	
	$('body').on('change', '[name="useCelsius"]', function() {
		var tempscale = TempScale.FAHRENHEIT;
		if ($(this).prop('checked')) {
			$('[name="useCelsius"]').attr('checked', true).prop('checked', true);
			
			tempscale = TempScale.CELSIUS;
		} else {
			$('[name="useCelsius"]').attr('checked', false).prop('checked', false);
		}
		
		chrome.storage.sync.set({
			'tempscale': tempscale
		}, function() {
			init(tempscale, false);
		});
	});
	
	$('#help').on('click', function() {
		$('#tap-target-location').tapTarget('open').parent().css('position', 'fixed');
	});
	
	$('#temp-tip').on('click', function() {
		$('#tap-target-temp').tapTarget('open').parent().css('position', 'fixed');
	});
});

function init(tempscale, includeFlickr) {
	
	var geoSuccess = function(position) {
        
		/**
		 * Build weather data
		 */
		var q1 = escape(`SELECT * FROM weather.forecast WHERE woeid IN (SELECT woeid FROM geo.places WHERE text="(${position.coords.latitude},${position.coords.longitude})") AND u="${tempscale}"`);
        $.ajax({
			url: `https://query.yahooapis.com/v1/public/yql?q=${q1}&format=json`,
            complete: function() {
				$('#loader').addClass('hide');
			},
			success: function(data) {
                
				var today = WeatherTab.templates.today({
					code: data.query.results.channel.item.condition.code,
					text: data.query.results.channel.item.condition.text,
					temp: data.query.results.channel.item.condition.temp
				});
				$('.weather').empty().append(today);
				
				window.sr.reveal('.weather-item', { duration: 500 }, 200);
				
				$('.location').html(data.query.results.channel.location.city);
				
				var forecast = WeatherTab.templates.forecast({
					forecast: data.query.results.channel.item.forecast.splice(1, data.query.results.channel.item.forecast.length - 6)
				});
				$('.forecast').empty().html(forecast);
				window.sr.reveal('.forecast-item', { duration: 500 }, 200);
				
				if (includeFlickr) {
					var date = new Date();
					var season = getSeason(date.getMonth());
					var timeOfDay = getTimeOfDay(date.getHours());
					
					console.log(data.query.results.channel.item.condition.text);
					console.log(season);
					console.log(timeOfDay);
					
					var search = {
						lat: data.query.results.channel.item.lat,
						lon: data.query.results.channel.item.long,
						weather: data.query.results.channel.item.condition.text,
						timeOfDay: timeOfDay,
						season: season,
						region: data.query.results.channel.location.region
					};
					searchFlickrLatLon(search);
				}
            },
			error: function() {
				
				$('#error--content').empty().text('An error has occurred.');
				$('#error').modal('open');
				
			}
        });
    };
    
    var geoError = function(error) {
		$('#error--content').empty().text(`An error has occurred. Error code: ${error.code}`);
		$('#error').modal('open');
	};
    
    var geoOptions = {
		maximumAge: 5 * 60 * 1000,
		timeout: 10 * 1000
	};
    
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
}

function searchFlickrLatLon(search) {
	var query = `SELECT * FROM flickr.photos.search WHERE api_key="3a284a20775d915c86a9d8426a40d804" AND group_id="1463451@N25" AND has_geo="true" AND lat="${search.lat}" AND lon="${search.lon}" AND radius="20" AND radius_units="mi" AND tags="${search.weather},${search.timeOfDay},${search.season}" AND tag_mode="all"`;
	$.ajax({
		url: `https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`,
		success: function(data) {
			
			if (data.query.results) {
				processFlickrData(data.query.results);
			} else {
				
				console.log('falling back to lat/long weather, season');
				
				query = `SELECT * FROM flickr.photos.search WHERE api_key="3a284a20775d915c86a9d8426a40d804" AND group_id="1463451@N25" AND has_geo="true" AND lat="${search.lat}" AND lon="${search.lon}" AND radius="20" AND radius_units="mi" AND tags="${search.weather},${search.season}" AND tag_mode="all"`;
				$.ajax({
					url: `https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`,
					success: function(data) {
						
						if (data.query.results) {
							processFlickrData(data.query.results);
						} else {
							
							console.log('falling back to lat/long weather');
							
							query = `SELECT * FROM flickr.photos.search WHERE api_key="3a284a20775d915c86a9d8426a40d804" AND group_id="1463451@N25" AND has_geo="true" AND lat="${search.lat}" AND lon="${search.lon}" AND radius="20" AND radius_units="mi" AND tags="${search.weather}"`;
							$.ajax({
								url: `https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`,
								success: function(data) {
									
									if (data.query.results) {
										processFlickrData(data.query.results);
									} else {
										
										console.log('falling back to region weather, time, season');
										searchFlickrRegion(search);
										
									}
								}
							});
						}
					}
				});
			}
		}
	});
}

function searchFlickrRegion(search) {
	var query = `SELECT * FROM flickr.photos.search WHERE api_key="3a284a20775d915c86a9d8426a40d804" AND group_id="1463451@N25" AND has_geo="true" AND place_id IN (SELECT place_id FROM flickr.places WHERE query="${search.region}" AND api_key="3a284a20775d915c86a9d8426a40d804") AND tags="${search.weather},${search.timeOfDay},${search.season}" AND tag_mode="all"`;
	$.ajax({
		url: `https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`,
		success: function(data) {
			
			if (data.query.results) {
				processFlickrData(data.query.results);
			} else {
				
				console.log('falling back to region weather, season');
				
				query = `SELECT * FROM flickr.photos.search WHERE api_key="3a284a20775d915c86a9d8426a40d804" AND group_id="1463451@N25" AND has_geo="true" AND place_id IN (SELECT place_id FROM flickr.places WHERE query="${search.region}" AND api_key="3a284a20775d915c86a9d8426a40d804") AND tags="${search.weather},${search.season}" AND tag_mode="all"`;
				$.ajax({
					url: `https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`,
					success: function(data) {
						
						if (data.query.results) {
							processFlickrData(data.query.results);
						} else {
							
							console.log('falling back to region weather');
							
							query = `SELECT * FROM flickr.photos.search WHERE api_key="3a284a20775d915c86a9d8426a40d804" AND group_id="1463451@N25" AND has_geo="true" AND place_id IN (SELECT place_id FROM flickr.places WHERE query="${search.region}" AND api_key="3a284a20775d915c86a9d8426a40d804") AND tags="${search.weather}"`;
							$.ajax({
								url: `https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`,
								success: function(data) {
									
									if (data.query.results) {
										processFlickrData(data.query.results);
									} else {
										
										console.log('falling back to locationless weather');
										
										query = `SELECT * FROM flickr.photos.search WHERE api_key="3a284a20775d915c86a9d8426a40d804" AND group_id="1463451@N25" AND tags="${search.weather}"`;
										$.ajax({
											url: `https://query.yahooapis.com/v1/public/yql?q=${query}&format=json`,
											success: function(data) {
												if (data.query.results) {
													processFlickrData(data.query.results);
												}
											}
										});
									}
								}
							});
						}
					}
				});
			}
		}
	});
}

function processFlickrData(results) {
	
	var photoId = 0;
	var id = getRandomInt(0, results.photo.length);
	if (isNaN(id)) {
		photoId = results.photo.id;
	} else {
		photoId = results.photo[id].id;
	}
	
	var infoQ = `SELECT * FROM flickr.photos.info WHERE photo_id="${photoId}" AND api_key="3a284a20775d915c86a9d8426a40d804"`;
	$.ajax({
		url: `https://query.yahooapis.com/v1/public/yql?q=${infoQ}&format=json`,
		success: function(data) {
			
			if (data.query.results) {
				var name = data.query.results.photo.owner.username;
				if (data.query.results.photo.owner.realname) {
					name = data.query.results.photo.owner.realname;
				}

				$('.flickr__info').empty().html(`<a href="${data.query.results.photo.urls.url.content}">&copy; by ${name} on <b>flickr</b></a>`);
			}

		}
	});

	var sizesQ = `SELECT * FROM flickr.photos.sizes WHERE photo_id="${photoId}" AND api_key="3a284a20775d915c86a9d8426a40d804"`;
	$.ajax({
		url: `https://query.yahooapis.com/v1/public/yql?q=${sizesQ}&format=json`,
		success: function(data) {

			if (data.query.results) {
				$('<img />').attr('src', data.query.results.size[data.query.results.size.length - 1].source).on('load', function() {
					$(this).remove();
					$('.flickr__image').css({
						'background-image': `url(${data.query.results.size[data.query.results.size.length - 1].source})`
					});
					$('.flickr').addClass('open');
				});
			}

		}
	});
}

function getTimeOfDay(hour) {
	if (hour > 4 && hour < 12) {
		return 'morning';
	}
	
	if (hour > 11 && hour < 17) {
		return 'afternoon';
	}
	
	if (hour > 16 && hour < 22) {
		return 'evening';
	}
	
	return 'night';
}

function getSeason(month) {
	if (3 <= month && month <= 5) {
        return 'spring';
    }
	
	if (6 <= month && month <= 8) {
        return 'summer';
    }
	
	if (9 <= month && month <= 11) {
        return 'fall';
    }
	
	// Months 12, 01, 02
    return 'winter';
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
