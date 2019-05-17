/* global Util */

let units = `imperial`;

/**
 * Temperature scale switcher
 */
(function() {
  let tempSwitchF = document.getElementById('radio--temp-f');
  let tempSwitchC = document.getElementById('radio--temp-c');
  if (tempSwitchF && tempSwitchC) {
    initTemp(); // on page load, if user has already selected a temp scale -> apply it

    tempSwitchF.addEventListener('change', () => {
      resetTemp(); // update temp scale
    });
    tempSwitchC.addEventListener('change', () => {
      resetTemp(); // update temp scale
    });
  }

  function initTemp() {
    chrome.storage.sync.get('tempSwitch', (items) => {
      let celciusSelected = (items.tempSwitch !== null && items.tempSwitch === `metric`);
      // update checkbox
      tempSwitchC.checked = celciusSelected;
      // update var for weather api
      units = celciusSelected ? `metric` : `imperial`;
    });
  }

  function resetTemp() {
    if (tempSwitchC.checked) { // celcius has been selected
      // save temp selection
      chrome.storage.sync.set({
        'tempSwitch': 'metric'
      }, () => {
        units = `metric`;
      });
    } else {
      // reset theme selection
      chrome.storage.sync.remove('tempSwitch', () => {
        units = `imperial`;
      });
    }
  }
}());

// Rate limited :(
document.getElementById('icon--loading').classList.add('is-hidden');
document.getElementById('icon--location-error').classList.remove('is-hidden');
console.log(units);
// (function() {
//   navigator.geolocation.getCurrentPosition((position) => {

//     // https://rapidapi.com/community/api/open-weather-map

//     const params = {
//       headers: {
//         'X-RapidAPI-Host':  `community-open-weather-map.p.rapidapi.com`,
//         'X-RapidAPI-Key':   `ZlAZ9SzJ6VmshPnu3KyHk0VZPAwXp1QgRw1jsn7qlJX11hgRp1`
//       }
//     };

//     /**
//      * Get three-day forecast. Includes today's weather.
//      */
//     fetch(`https://community-open-weather-map.p.rapidapi.com/forecast?lat=${position.coords.latitude}&lon=${position.coords.longitude}&cnt=3&units=${units}`, params)
//     .then(data => {
//       return data.json();
//     })
//     .then(res => {

//       console.log('next 3 days:');
//       console.log(res);

//       // City name
//       document.getElementById('location').innerText = res.city.name;

//       // Today
//       let today = WeatherTab.templates.today({
//         icon: res.list[0].weather[0].icon,
//         text: res.list[0].weather[0].main,
//         temp: Math.round(res.list[0].main.temp)
//       });
//       document.getElementById('today').innerHTML = today;

//       // Forecast
//       // let forecast = WeatherTab.templates.forecast({
//       //   forecast: res
//       // })

//       // Show location icon
//       document.getElementById('icon--loading').classList.add('is-hidden');
//       document.getElementById('icon--location').classList.remove('is-hidden');

//     })
//     .catch(error => {

//       console.log('error:');
//       console.log(error);

//       document.getElementById('icon--loading').classList.add('is-hidden');
//       document.getElementById('icon--location-error').classList.remove('is-hidden');

//     });

//   });
// }());

/**
 * Theme switcher
 */
(function() {
  let themeSwitch = document.getElementById('switch--theme');
  if (themeSwitch) {
    initTheme(); // on page load, if user has already selected a specific theme -> apply it

    themeSwitch.addEventListener('change', () => {
      resetTheme(); // update color theme
    });
  }

  function initTheme() {
    chrome.storage.sync.get('themeSwitch', (items) => {
      let darkThemeSelected = (items.themeSwitch !== null && items.themeSwitch === `dark`);
      // update checkbox
      themeSwitch.checked = darkThemeSelected;
      // update body data-theme attribute
      darkThemeSelected ? document.body.setAttribute('data-theme', 'dark') : document.body.removeAttribute('data-theme');
    });
  }

  function resetTheme() {
    if (themeSwitch.checked) { // dark theme has been selected
      // save theme selection
      chrome.storage.sync.set({
        'themeSwitch': 'dark'
      }, () => {
        document.body.setAttribute('data-theme', 'dark');
      });
    } else {
      // reset theme selection
      chrome.storage.sync.remove('themeSwitch', () => {
        document.body.removeAttribute('data-theme');
      });
    }
  }
}());

/**
 * Temperature scale switcher
 */

/**
 * Tooltip
 */
(function() {
	var Tooltip = function(element) {
		this.element = element;
		this.tooltip = false;
		this.tooltipIntervalId = false;
		this.tooltipContent = this.element.getAttribute('title');
		this.tooltipPosition = (this.element.getAttribute('data-tooltip-position')) ? this.element.getAttribute('data-tooltip-position') : 'top';
		this.tooltipClasses = (this.element.getAttribute('data-tooltip-class')) ? this.element.getAttribute('data-tooltip-class') : false;
		this.tooltipId = 'js-tooltip-element'; // id of the tooltip element -> trigger will have the same aria-describedby attr
		// there are cases where you only need the aria-label -> SR do not need to read the tooltip content (e.g., footnotes)
		this.tooltipDescription = (this.element.getAttribute('data-tooltip-describedby') && this.element.getAttribute('data-tooltip-describedby') == 'false') ? false : true;

		this.tooltipDelay = 300; // show tooltip after a delay (in ms)
		this.tooltipDelta = 10; // distance beetwen tooltip and trigger element (in px)
		this.tooltipTriggerHover = false;
		// tooltp sticky option
		this.tooltipSticky = (this.tooltipClasses && this.tooltipClasses.indexOf('tooltip--sticky') > -1);
		this.tooltipHover = false;
		if(this.tooltipSticky) {
			this.tooltipHoverInterval = false;
		}
		initTooltip(this);
	};

	function initTooltip(tooltipObj) {
		// reset trigger element
		tooltipObj.element.removeAttribute('title');
		tooltipObj.element.setAttribute('tabindex', '0');
		// add event listeners
		tooltipObj.element.addEventListener('mouseenter', handleEvent.bind(tooltipObj));
		tooltipObj.element.addEventListener('focus', handleEvent.bind(tooltipObj));
	}

	function removeTooltipEvents(tooltipObj) {
		// remove event listeners
		tooltipObj.element.removeEventListener('mouseleave',  handleEvent.bind(tooltipObj));
		tooltipObj.element.removeEventListener('blur',  handleEvent.bind(tooltipObj));
	}

	function handleEvent(event) {
		// handle events
		switch(event.type) {
			case 'mouseenter':
			case 'focus':
				showTooltip(this, event);
				break;
			case 'mouseleave':
			case 'blur':
				checkTooltip(this);
				break;
		}
	}

	function showTooltip(tooltipObj) {
		// tooltip has already been triggered
		if(tooltipObj.tooltipIntervalId) { return; }
		tooltipObj.tooltipTriggerHover = true;
		// listen to close events
		tooltipObj.element.addEventListener('mouseleave', handleEvent.bind(tooltipObj));
		tooltipObj.element.addEventListener('blur', handleEvent.bind(tooltipObj));
		// show tooltip with a delay
		tooltipObj.tooltipIntervalId = setTimeout(function(){
			createTooltip(tooltipObj);
		}, tooltipObj.tooltipDelay);
	}

	function createTooltip(tooltipObj) {
		tooltipObj.tooltip = document.getElementById(tooltipObj.tooltipId);

		if( !tooltipObj.tooltip ) { // tooltip element does not yet exist
			tooltipObj.tooltip = document.createElement('div');
			document.body.appendChild(tooltipObj.tooltip);
		}

		// reset tooltip content/position
		Util.setAttributes(tooltipObj.tooltip, {'id': tooltipObj.tooltipId, 'class': 'tooltip tooltip--is-hidden js-tooltip', 'role': 'tooltip'});
		tooltipObj.tooltip.innerHTML = tooltipObj.tooltipContent;
		if(tooltipObj.tooltipDescription) { tooltipObj.element.setAttribute('aria-describedby', tooltipObj.tooltipId); }
		if(tooltipObj.tooltipClasses) { Util.addClass(tooltipObj.tooltip, tooltipObj.tooltipClasses); }
		if(tooltipObj.tooltipSticky) { Util.addClass(tooltipObj.tooltip, 'tooltip--sticky'); }
		placeTooltip(tooltipObj);
		Util.removeClass(tooltipObj.tooltip, 'tooltip--is-hidden');

		// if tooltip is sticky, listen to mouse events
		if(!tooltipObj.tooltipSticky) { return; }
		tooltipObj.tooltip.addEventListener('mouseenter', function cb(){
			tooltipObj.tooltipHover = true;
			if(tooltipObj.tooltipHoverInterval) {
				clearInterval(tooltipObj.tooltipHoverInterval);
				tooltipObj.tooltipHoverInterval = false;
			}
			tooltipObj.tooltip.removeEventListener('mouseenter', cb);
			tooltipLeaveEvent(tooltipObj);
		});
	}

	function tooltipLeaveEvent(tooltipObj) {
		tooltipObj.tooltip.addEventListener('mouseleave', function cb(){
			tooltipObj.tooltipHover = false;
			tooltipObj.tooltip.removeEventListener('mouseleave', cb);
			hideTooltip(tooltipObj);
		});
	}

	function placeTooltip(tooltipObj) {
		// set top and left position of the tooltip according to the data-tooltip-position attr of the trigger
		var dimention = [tooltipObj.tooltip.offsetHeight, tooltipObj.tooltip.offsetWidth],
			positionTrigger = tooltipObj.element.getBoundingClientRect(),
			position = [],
			scrollY = window.scrollY || window.pageYOffset;

		position['top'] = [ (positionTrigger.top - dimention[0] - tooltipObj.tooltipDelta + scrollY), (positionTrigger.right/2 + positionTrigger.left/2 - dimention[1]/2)];
		position['bottom'] = [ (positionTrigger.bottom + tooltipObj.tooltipDelta + scrollY), (positionTrigger.right/2 + positionTrigger.left/2 - dimention[1]/2)];
		position['left'] = [(positionTrigger.top/2 + positionTrigger.bottom/2 - dimention[0]/2 + scrollY), positionTrigger.left - dimention[1] - tooltipObj.tooltipDelta];
		position['right'] = [(positionTrigger.top/2 + positionTrigger.bottom/2 - dimention[0]/2 + scrollY), positionTrigger.right + tooltipObj.tooltipDelta];

		var direction = tooltipObj.tooltipPosition;
		if( direction == 'top' && position['top'][0] < scrollY) { direction = 'bottom'; }
		else if( direction == 'bottom' && position['bottom'][0] + tooltipObj.tooltipDelta + dimention[0] > scrollY + window.innerHeight) { direction = 'top'; }
		else if( direction == 'left' && position['left'][1] < 0 ) { direction = 'right'; }
		else if( direction == 'right' && position['right'][1] + dimention[1] > window.innerWidth ) { direction = 'left'; }

		if(direction == 'top' || direction == 'bottom') {
			if(position[direction][1] < 0 ) { position[direction][1] = 0; }
			if(position[direction][1] + dimention[1] > window.innerWidth ) { position[direction][1] = window.innerWidth - dimention[1]; }
		}
		tooltipObj.tooltip.style.top = position[direction][0]+'px';
		tooltipObj.tooltip.style.left = position[direction][1]+'px';
		Util.addClass(tooltipObj.tooltip, 'tooltip--'+direction);
	}

	function checkTooltip(tooltipObj) {
		tooltipObj.tooltipTriggerHover = false;
		if(!tooltipObj.tooltipSticky) { hideTooltip(tooltipObj); }
		else {
			if(tooltipObj.tooltipHover) { return; }
			if(tooltipObj.tooltipHoverInterval) { return; }
			tooltipObj.tooltipHoverInterval = setTimeout(function(){
				hideTooltip(tooltipObj);
				tooltipObj.tooltipHoverInterval = false;
			}, 300);
		}
	}

	function hideTooltip(tooltipObj) {
		if (tooltipObj.tooltipHover || tooltipObj.tooltipTriggerHover) { return; }
		clearInterval(tooltipObj.tooltipIntervalId);
		if (tooltipObj.tooltipHoverInterval) {
			clearInterval(tooltipObj.tooltipHoverInterval);
			tooltipObj.tooltipHoverInterval = false;
		}
		tooltipObj.tooltipIntervalId = false;
		if (!tooltipObj.tooltip) { return; }
		// hide tooltip
		removeTooltip(tooltipObj);
		// remove events
		removeTooltipEvents(tooltipObj);
	}

	function removeTooltip(tooltipObj) {
		Util.addClass(tooltipObj.tooltip, 'tooltip--is-hidden');
		if(tooltipObj.tooltipDescription) { tooltipObj.element.removeAttribute('aria-describedby'); }
	}

	window.Tooltip = Tooltip;

	//initialize the Tooltip objects
	var tooltips = document.getElementsByClassName('js-tooltip-trigger');
	if( tooltips.length > 0 ) {
		for( var i = 0; i < tooltips.length; i++) {
			(function(i){new Tooltip(tooltips[i]);})(i);
		}
	}
}());

/**
 * Menu
 */
(function() {
	var Menu = function(element) {
		this.element = element;
		this.menu = this.element.getElementsByClassName('js-menu')[0];
		this.menuItems = this.menu.getElementsByClassName('js-menu__item');
		this.trigger = this.element.getElementsByClassName('js-menu-trigger')[0];
		this.initMenu();
		this.initMenuEvents();
	};

	Menu.prototype.initMenu = function() {
		// init aria-labels
		Util.setAttributes(this.trigger, {'aria-expanded': 'false', 'aria-haspopup': 'true', 'aria-controls': this.menu.getAttribute('id')});
	};

	Menu.prototype.initMenuEvents = function() {
		var self = this;
		this.trigger.addEventListener('click', function(event){
			event.preventDefault();
			self.toggleMenu(!Util.hasClass(self.menu, 'menu--is-visible'), true);
		});
		// keyboard events
		this.element.addEventListener('keydown', function(event) {
			// use up/down arrow to navigate list of menu items
			if( !Util.hasClass(event.target, 'js-menu__item') ) return;
			if( (event.keyCode && event.keyCode == 40) || (event.key && event.key.toLowerCase() == 'arrowdown') ) {
				self.navigateItems(event, 'next');
			} else if( (event.keyCode && event.keyCode == 38) || (event.key && event.key.toLowerCase() == 'arrowup') ) {
				self.navigateItems(event, 'prev');
			}
		});
	};

	Menu.prototype.toggleMenu = function(bool, moveFocus) {
		var self = this;
		// toggle menu visibility
		Util.toggleClass(this.menu, 'menu--is-visible', bool);
		if(bool) {
			this.trigger.setAttribute('aria-expanded', 'true');
			Util.moveFocus(this.menuItems[0]);
			this.menu.addEventListener("transitionend", function(event) {Util.moveFocus(self.menuItems[0]);}, {once: true});
		} else {
			this.trigger.setAttribute('aria-expanded', 'false');
			if(moveFocus) Util.moveFocus(this.trigger);
		}
	};

	Menu.prototype.navigateItems = function(event, direction) {
		event.preventDefault();
		var index = Util.getIndexInArray(this.menuItems, event.target),
			nextIndex = direction == 'next' ? index + 1 : index - 1;
		if(nextIndex < 0) nextIndex = this.menuItems.length - 1;
		if(nextIndex > this.menuItems.length - 1) nextIndex = 0;
		Util.moveFocus(this.menuItems[nextIndex]);
	};

	Menu.prototype.checkMenuFocus = function() {
		var menuParent = document.activeElement.closest('.js-menu');
		if (!menuParent || !this.element.contains(menuParent)) this.toggleMenu(false, false);
	};

	Menu.prototype.checkMenuClick = function(target) {
		if( !this.element.contains(target) ) this.toggleMenu(false);
	};

	//initialize the Menu objects
	var menus = document.getElementsByClassName('js-menu-wrapper');
	if( menus.length > 0 ) {
		var menusArray = [];
		for( var i = 0; i < menus.length; i++) {
			(function(i){menusArray.push(new Menu(menus[i]));})(i);
		}

		// listen for key events
		window.addEventListener('keyup', function(event){
			if( event.keyCode && event.keyCode == 9 || event.key && event.key.toLowerCase() == 'tab' ) {
				//close menu if focus is outside menu element
				menusArray.forEach(function(element){
					element.checkMenuFocus();
				});
			} else if( event.keyCode && event.keyCode == 27 || event.key && event.key.toLowerCase() == 'escape' ) {
				// close menu on 'Esc'
				menusArray.forEach(function(element){
					element.toggleMenu(false, false);
				});
			}
		});
		// close menu when clicking outside it
		window.addEventListener('click', function(event){
			menusArray.forEach(function(element){
				element.checkMenuClick(event.target);
			});
		});
	}
}());

/**
 * Modal
 */
(function() {
	var Modal = function(element) {
		this.element = element;
		this.triggers = document.querySelectorAll('[aria-controls="'+this.element.getAttribute('id')+'"]');
		this.firstFocusable = null;
		this.lastFocusable = null;
		this.selectedTrigger = null;
		this.showClass = "modal--is-visible";
		this.initModal();
	};

	Modal.prototype.initModal = function() {
		var self = this;
		//open modal when clicking on trigger buttons
		if ( this.triggers ) {
			for(var i = 0; i < this.triggers.length; i++) {
				this.triggers[i].addEventListener('click', function(event) {
					event.preventDefault();
					self.selectedTrigger = event.target;
					self.showModal();
					self.initModalEvents();
				});
			}
		}

		// listen to the openModal event -> open modal without a trigger button
		this.element.addEventListener('openModal', function(event){
			if(event.detail) self.selectedTrigger = event.detail;
			self.showModal();
			self.initModalEvents();
		});
	};

	Modal.prototype.showModal = function() {
		var self = this;
		Util.addClass(this.element, this.showClass);
		this.getFocusableElements();
		this.firstFocusable.focus();
		// wait for the end of transitions before moving focus
		this.element.addEventListener("transitionend", function cb(event) {
			self.firstFocusable.focus();
			self.element.removeEventListener("transitionend", cb);
		});
		this.emitModalEvents('modalIsOpen');
	};

	Modal.prototype.closeModal = function() {
		Util.removeClass(this.element, this.showClass);
		this.firstFocusable = null;
		this.lastFocusable = null;
		if(this.selectedTrigger) this.selectedTrigger.focus();
		//remove listeners
		this.cancelModalEvents();
		this.emitModalEvents('modalIsClose');
	};

	Modal.prototype.initModalEvents = function() {
		//add event listeners
		this.element.addEventListener('keydown', this);
		this.element.addEventListener('click', this);
	};

	Modal.prototype.cancelModalEvents = function() {
		//remove event listeners
		this.element.removeEventListener('keydown', this);
		this.element.removeEventListener('click', this);
	};

	Modal.prototype.handleEvent = function (event) {
		switch(event.type) {
			case 'click': {
				this.initClick(event);
			}
			case 'keydown': {
				this.initKeyDown(event);
			}
		}
	};

	Modal.prototype.initKeyDown = function(event) {
		if( event.keyCode && event.keyCode == 27 || event.key && event.key == 'Escape' ) {
			//close modal window on esc
			this.closeModal();
		} else if( event.keyCode && event.keyCode == 9 || event.key && event.key == 'Tab' ) {
			//trap focus inside modal
			this.trapFocus(event);
		}
	};

	Modal.prototype.initClick = function(event) {
		//close modal when clicking on close button or modal bg layer
		if( !event.target.closest('.js-modal__close') && !Util.hasClass(event.target, 'js-modal') ) return;
		event.preventDefault();
		this.closeModal();
	};

	Modal.prototype.trapFocus = function(event) {
		if( this.firstFocusable == document.activeElement && event.shiftKey) {
			//on Shift+Tab -> focus last focusable element when focus moves out of modal
			event.preventDefault();
			this.lastFocusable.focus();
		}
		if( this.lastFocusable == document.activeElement && !event.shiftKey) {
			//on Tab -> focus first focusable element when focus moves out of modal
			event.preventDefault();
			this.firstFocusable.focus();
		}
	}

	Modal.prototype.getFocusableElements = function() {
		//get all focusable elements inside the modal
		var allFocusable = this.element.querySelectorAll('[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable], audio[controls], video[controls], summary');
		this.getFirstVisible(allFocusable);
		this.getLastVisible(allFocusable);
	};

	Modal.prototype.getFirstVisible = function(elements) {
		//get first visible focusable element inside the modal
		for(var i = 0; i < elements.length; i++) {
			if( elements[i].offsetWidth || elements[i].offsetHeight || elements[i].getClientRects().length ) {
				this.firstFocusable = elements[i];
				return true;
			}
		}
	};

	Modal.prototype.getLastVisible = function(elements) {
		//get last visible focusable element inside the modal
		for(var i = elements.length - 1; i >= 0; i--) {
			if( elements[i].offsetWidth || elements[i].offsetHeight || elements[i].getClientRects().length ) {
				this.lastFocusable = elements[i];
				return true;
			}
		}
	};

	Modal.prototype.emitModalEvents = function(eventName) {
		var event = new CustomEvent(eventName, {detail: this.selectedTrigger});
		this.element.dispatchEvent(event);
	};

	//initialize the Modal objects
	var modals = document.getElementsByClassName('js-modal');
	if( modals.length > 0 ) {
		for( var i = 0; i < modals.length; i++) {
			(function(i){new Modal(modals[i]);})(i);
		}
	}
}());
