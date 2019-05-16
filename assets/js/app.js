const units = `imperial`; // TODO store preference

navigator.geolocation.getCurrentPosition((position) => {

  // https://rapidapi.com/community/api/open-weather-map

  /**
   * Get current weather
   */
  const params = {
    headers: {
      'X-RapidAPI-Host':  `community-open-weather-map.p.rapidapi.com`,
      'X-RapidAPI-Key':   `ZlAZ9SzJ6VmshPnu3KyHk0VZPAwXp1QgRw1jsn7qlJX11hgRp1`
    }
  };

  fetch(`https://community-open-weather-map.p.rapidapi.com/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}&units=${units}`, params)
    .then(data => {
      return data.json();
    })
    .then(res => {
      console.log(res);

      console.log(Math.round(res.main.temp));

      let today = WeatherTab.templates.today({
        icon:   res.weather[0].icon,
        desc:   res.weather[0].description,
        text:   res.weather[0].main,
        temp:   Math.round(res.main.temp)
      });

      document.getElementById('icon--loading').classList.add('is-hidden');
      document.getElementById('icon--location').classList.remove('is-hidden');
      document.getElementById('location').innerText = res.name;

      // this should clear out the existing content as well
      document.getElementById('today').innerHTML = today;

    })
    .catch(error => {

      console.log(error);

      document.getElementById('icon--loading').classList.add('is-hidden');
      document.getElementById('icon--location-error').classList.remove('is-hidden');

    });

    /**
     * Get three-day forecast
     */


});
