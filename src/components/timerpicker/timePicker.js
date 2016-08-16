(function() {
	'use strict';

	angular.module('material.components.timepicker')
			.directive('mdTimepicker', timePickerDirective);

	/**
	 * @ngdoc directive
	 * @name mdTimepicker
	 * @module material.components.timepicker
	 *
	 * @param {Date} ng-model The component's model. Expects a JavaScript Date object.
	 * @param {expression=} ng-change Expression evaluated when the model value changes.
	 * @param {Date=} md-min-time Expression representing a min time (inclusive).
	 * @param {Date=} md-max-time Expression representing a max time (inclusive).
	 * @param {(function(Date): boolean)=} md-time-filter Function expecting a date and returning a boolean whether it can be selected or not.
	 * @param {String=} md-placeholder The time input placeholder value.
	 * @param {boolean=} ng-disabled Whether the timepicker is disabled.
	 * @param {boolean=} ng-required Whether a value is required for the timepicker.
	 *
	 * @description
	 * `<md-timepicker>` is a component used to select a single time.
	 * For information on how to configure internationalization for the time picker,
	 * see `$mdTimeLocaleProvider`.
	 *
	 * This component supports [ngMessages](https://docs.angularjs.org/api/ngMessages/directive/ngMessages).
	 * Supported attributes are:
	 * * `required`: whether a required time is not set.
	 * * `mintime`: whether the selected time is before the minimum allowed time.
	 * * `maxtime`: whether the selected time is after the maximum allowed time.
	 *
	 * @usage
	 * <hljs lang="html">
	 *   <md-timepicker ng-model="alarm"></md-timepicker>
	 * </hljs>
	 *
	 */
	function timePickerDirective() {
		return {
			template:
					// Buttons are not in the tab order because users can open the clock via keyboard
					// interaction on the text input, and multiple tab stops for one component (picker)
					// may be confusing.
					'<div class="md-timepicker-input-container" ' +
							'ng-class="{\'md-timepicker-focused\': ctrl.isFocused}">' +
						'<input class="md-timepicker-input" aria-haspopup="true" ' +
								'ng-focus="ctrl.setFocused(true)" ng-blur="ctrl.setFocused(false)" value="{{ctrl.timeLocale.formatTime(ctrl.ngModelCtrl.$viewValue)}}"/>' +
						'<md-button type="button" md-no-ink ' +
								'class="md-timepicker-triangle-button md-icon-button" ' +
								'ng-click="ctrl.openClockPane($event)" ' +
								'aria-label="{{::ctrl.timeLocale.msgOpenClock}}">' +
							'<div class="md-timepicker-expand-triangle"></div>' +
						'</md-button>' +
					'</div>' +

					// This pane will be detached from here and re-attached to the document body.
					'<div class="md-timepicker-clock-pane md-whiteframe-z1">' + 
						'<div class="md-timepicker-clock">' +
							'<md-clock role="dialog" aria-label="{{::ctrl.timeLocale.msgClock}}" ' +
									'md-min-time="ctrl.minTime" md-max-time="ctrl.maxTime"' +
									'md-time-filter="ctrl.timeFilter"' +
									'ng-model="ctrl.time" ng-if="ctrl.isClockOpen">' +
							'</md-clock>' +
						'</div>' +
					'</div>',
			require: ['ngModel', 'mdTimepicker', '?^mdInputContainer'],
			scope: {
				minTime: '=?mdMinTime',
				maxTime: '=?mdMaxTime',
				timeFilter: '=?mdTimeFilter',
				placeholder: '@mdPlaceholder'
			},
			controller: TimePickerCtrl,
			controllerAs: 'ctrl',
			bindToController: true,
			link: function(scope, element, attr, controllers) {
				var ngModelCtrl = controllers[0];
				var mdTimePickerCtrl = controllers[1];
				var mdInputContainer = controllers[2];

				mdTimePickerCtrl.configureNgModel(ngModelCtrl, mdInputContainer);
			}
		}
	}

	/** Additional offset for the input's `size` attribute, which is updated based on its content. */
	var EXTRA_INPUT_SIZE = 3;

	/** Class applied to the container if the time is invalid. */
	var INVALID_CLASS = 'md-timepicker-invalid';

	/** Default time in ms to debounce input event by. */
	var DEFAULT_DEBOUNCE_INTERVAL = 500;

	/**
	 * Height of the clock pane used to check if the pane is going outside the boundary of
	 * the viewport. See clock.scss for how $md-clock-height is computed; an extra 20px is
	 * also added to space the pane away from the exact edge of the screen.
	 *
	 *  This is computed statically now, but can be changed to be measured if the circumstances
	 *  of clock sizing are changed.
	 */
	var CLOCK_PANE_HEIGHT = 368;

	/**
	 * Width of the clock pane used to check if the pane is going outside the boundary of
	 * the viewport. See clock.scss for how $md-clock-width is computed; an extra 20px is
	 * also added to space the pane away from the exact edge of the screen.
	 *
	 *  This is computed statically now, but can be changed to be measured if the circumstances
	 *  of clock sizing are changed.
	 */
	var CLOCK_PANE_WIDTH = 360;

	/**
	 * Controller for md-timepicker.
	 *
	 * @ngInject @constructor
	 */
	function TimePickerCtrl($scope, $element, $attrs, $compile, $timeout, $window,
			$mdConstant, $mdTheming, $mdUtil, $$mdTimeLocale, $$mdTimeUtil, $$rAF) {
		/** @final */
		this.$compile = $compile;

		/** @final */
		this.$timeout = $timeout;

		/** @final */
		this.$window = $window;

		/** @final */
		this.timeLocale = $$mdTimeLocale;

		/** @final */
		this.timeUtil = $$mdTimeUtil;

		/** @final */
		this.$mdConstant = $mdConstant;

		/* @final */
		this.$mdUtil = $mdUtil;

		/** @final */
		this.$$rAF = $$rAF;

		/**
		 * The root document element. This is used for attaching a top-level click handler to
		 * close the clock panel when a click outside said panel occurs. We use `documentElement`
		 * instead of body because, when scrolling is disabled, some browsers consider the body element
		 * to be completely off the screen and propagate events directly to the html element.
		 * @type {!angular.JQLite}
		 */
		this.documentElement = angular.element(document.documentElement);

		/** @type {!angular.NgModelController} */
		this.ngModelCtrl = null;

		/** @type {!angular.MdInputContainer} */
		this.mdInputContainer = null;

		/** @type {HTMLInputElement} */
		this.inputElement = $element[0].querySelector('input');

		/** @final {!angular.JQLite} */
		this.ngInputElement = angular.element(this.inputElement);

		/** @type {HTMLElement} */
		this.inputContainer = $element[0].querySelector('.md-timepicker-input-container');

		/** @type {HTMLElement} Floating clock pane. */
		this.clockPane = $element[0].querySelector('.md-timepicker-clock-pane');

		/** @final {!angular.JQLite} */
		this.$element = $element;

		/** @final {!angular.Attributes} */
		this.$attrs = $attrs;

		/** @final {!angular.Scope} */
		this.$scope = $scope;

		/** @type {Date} */
		this.time = null;

		/** @type {Date} */
		this.minTime = this.timeUtil.instanceTimeIgnoreDate(this.minTime);

		/** @type {Date} */
		this.maxTime = this.timeUtil.instanceTimeIgnoreDate(this.maxTime);

		/** @type {boolean} */
		this.isFocused = false;

		/** @type {boolean} */
		this.isDisabled;
		this.setDisabled($element[0].disabled || angular.isString($attrs['disabled']));

		/** @type {boolean} Whether the time-picker's clock pane is open. */
		this.isClockOpen = false;

		/**
		 * Element from which the clock pane was opened. Keep track of this so that we can return
		 * focus to it when the pane is closed.
		 * @type {HTMLElement}
		 */
		this.clockPaneOpenedFrom = null;

		this.clockPane.id = 'md-clock-pane' + $mdUtil.nextUid();

		$mdTheming($element);

		/** Pre-bound click handler is saved so that the event listener can be removed. */
		this.bodyClickHandler = angular.bind(this, this.handleBodyClick);
		this.bodyMouseupHandler = angular.bind(this, this.handleBodyMouseup);
		this.bodyKeyboardInteractionHandler = angular.bind(this, this.handleBodyKeyboardInteraction);

		/** Pre-bound resize handler so that the event listener can be removed. */
		this.windowResizeHandler = $mdUtil.debounce(angular.bind(this, this.closeClockPane), 100);

		// Unless the user specifies so, the timepicker should not be a tab stop.
		// This is necessary because ngAria might add a tabindex to anything with an ng-model
		// (based on whether or not the user has turned that particular feature on/off).
		if (!$attrs['tabindex']) {
			$element.attr('tabindex', '-1');
		}

		this.installPropertyInterceptors();
		this.attachChangeListeners();
		this.attachInteractionListeners();

		var self = this;
		$scope.$on('$destroy', function() {
			self.detachClockPane();
		});
	};

	/**
	 * Sets up the controller's reference to ngModelController.
	 * @param {!angular.NgModelController} ngModelCtrl
	 */
	TimePickerCtrl.prototype.configureNgModel = function(ngModelCtrl, mdInputContainer) {
		this.ngModelCtrl = ngModelCtrl;
		this.mdInputContainer = mdInputContainer;

		var self = this;
		ngModelCtrl.$render = function() {
			var value = self.ngModelCtrl.$viewValue;

			if (value && !(value instanceof Date)) {
				throw Error('The ng-model for md-timepicker must be a Date instance. ' +
						'Currently the model is a: ' + (typeof value));
			}

			self.time = self.timeUtil.instanceTimeIgnoreDate(value);

			self.resizeInputElement();
			self.updateErrorState();
		};
	};

	/**
	 * Attach event listeners for both the text input and the md-clock.
	 * Events are used instead of ng-model so that updates don't infinitely update the other
	 * on a change. This should also be more performant than using a $watch.
	 */
	TimePickerCtrl.prototype.attachChangeListeners = function() {
		this.ngInputElement.on('input', angular.bind(this, this.resizeInputElement));
		this.ngInputElement.on('input', this.$mdUtil.debounce(this.handleInputEvent,
				DEFAULT_DEBOUNCE_INTERVAL, this));
	};

	/** Attach event listeners for user interaction. */
	TimePickerCtrl.prototype.attachInteractionListeners = function() {
		var self = this;
		var $scope = this.$scope;
		var keyCodes = this.$mdConstant.KEY_CODE;

		// Add event listener through angular so that we can triggerHandler in unit tests.
		self.ngInputElement.on('keydown', function(event) {
			if (event.altKey && event.keyCode == keyCodes.DOWN_ARROW) {
				self.openClockPane(event);
				$scope.$digest();
			}
		});
	};

	/**
	 * Capture properties set to the time-picker and imperitively handle internal changes.
	 * This is done to avoid setting up additional $watches.
	 */
	TimePickerCtrl.prototype.installPropertyInterceptors = function() {
		var self = this;

		if (this.$attrs['ngDisabled']) {
			// The expression is to be evaluated against the directive element's scope and not
			// the directive's isolate scope.
			var scope = this.$scope.$parent;

			if (scope) {
				scope.$watch(this.$attrs['ngDisabled'], function(isDisabled) {
					self.setDisabled(isDisabled);
				});
			}
		}

		Object.defineProperty(this, 'placeholder', {
			get: function() { return self.inputElement.placeholder; },
			set: function(value) { self.inputElement.placeholder = value || ''; }
		});
	};

	/**
	 * Sets whether the time-picker is disabled.
	 * @param {boolean} isDisabled
	 */
	TimePickerCtrl.prototype.setDisabled = function(isDisabled) {
		this.isDisabled = isDisabled;
		this.inputElement.disabled = isDisabled;
	};

	/**
	 * Sets the custom ngModel.$error flags to be consumed by ngMessages. Flags are:
	 *   - mintime: whether the selected time is before the minimum time.
	 *   - maxtime: whether the selected flag is after the maximum time.
	 *   - filtered: whether the selected time is allowed by the custom filtering function.
	 *   - valid: whether the entered text input is a valid time
	 *
	 * The 'required' flag is handled automatically by ngModel.
	 *
	 * @param {Date=} opt_time Date to check. If not given, defaults to the timepicker's model value.
	 */
	TimePickerCtrl.prototype.updateErrorState = function(opt_time) {
		var time = this.timeUtil.instanceTimeIgnoreDate(opt_time || this.time);

		// Clear any existing errors to get rid of anything that's no longer relevant.
		this.clearErrorState();

		if (this.timeUtil.isValidTime(time)) {
			if (this.timeUtil.isValidTime(this.minTime)) {
				this.ngModelCtrl.$setValidity('mintime', time >= this.minTime);
			}

			if (this.timeUtil.isValidTime(this.maxTime)) {
				this.ngModelCtrl.$setValidity('maxtime', time <= this.maxTime);
			}

			if (angular.isFunction(this.timeFilter)) {
				this.ngModelCtrl.$setValidity('filtered', this.timeFilter(time));
			}
		} else {
			// The time is seen as "not a valid time" if there is *something* set
			// (i.e.., not null or undefined), but that something isn't a valid time.
			this.ngModelCtrl.$setValidity('valid', time == null);
		}

		// TODO(jelbourn): Change this to classList.toggle when we stop using PhantomJS in unit tests
		// because it doesn't conform to the DOMTokenList spec.
		// See https://github.com/ariya/phantomjs/issues/12782.
		if (!this.ngModelCtrl.$valid) {
			this.inputContainer.classList.add(INVALID_CLASS);
		}
	};

	/** Clears any error flags set by `updateErrorState`. */
	TimePickerCtrl.prototype.clearErrorState = function() {
		this.inputContainer.classList.remove(INVALID_CLASS);
		['mintime', 'maxtime', 'filtered', 'valid'].forEach(function(field) {
			this.ngModelCtrl.$setValidity(field, true);
		}, this);
	};

	/** Resizes the input element based on the size of its content. */
	TimePickerCtrl.prototype.resizeInputElement = function() {
		var value = this.ngModelCtrl.$viewValue || "";
		if (value) {
			value = value.toLocaleTimeString();
		}

		this.inputElement.size = value.length + EXTRA_INPUT_SIZE;
	};

	/**
	 * Sets the model value if the user input is a valid time.
	 * Adds an invalid class to the input element if not.
	 */
	TimePickerCtrl.prototype.handleInputEvent = function() {
		var inputString = this.inputElement.value;
		var parsedTime = inputString ? this.timeLocale.parseTime(inputString) : null;
		//TODO: REVER FUNCAO this.timeUtil.setDateTimeToMinimumDate(parsedTime);

		// An input string is valid if it is either empty (representing no time)
		// or if it parses to a valid time that the user is allowed to select.
		var isValidInput = inputString != '' || (
			this.timeUtil.isValidTime(parsedTime) &&
			this.timeLocale.isTimeComplete(inputString) &&
			this.isTimeEnabled(parsedTime)
		);

		// The timepicker's model is only updated when there is a valid input.
		if (isValidInput) {
			this.ngModelCtrl.$setViewValue(parsedTime);
			this.time = parsedTime;
		}

		this.updateErrorState(parsedTime);
	};
	
	/**
	 * Check whether time is in range and enabled
	 * @param {Date=} opt_time
	 * @return {boolean} Whether the time is enabled.
	 */
	TimePickerCtrl.prototype.isTimeEnabled = function(opt_time) {
		return this.timeUtil.isTimeWithinRange(opt_time, this.minTime, this.maxTime) && 
					(!angular.isFunction(this.timeFilter) || this.timeFilter(opt_time));
	};
	
	/** Position and attach the floating clock to the document. */
	TimePickerCtrl.prototype.attachClockPane = function() {
		var clockPane = this.clockPane;
		clockPane.style.transform = '';
		this.$element.addClass('md-timepicker-open');

		var elementRect = this.inputContainer.getBoundingClientRect();
		var bodyRect = document.body.getBoundingClientRect();

		// Check to see if the clock pane would go off the screen. If so, adjust position
		// accordingly to keep it within the viewport.
		var paneTop = elementRect.top - bodyRect.top;
		var paneLeft = elementRect.left - bodyRect.left;

		// If ng-material has disabled body scrolling (for example, if a dialog is open),
		// then it's possible that the already-scrolled body has a negative top/left. In this case,
		// we want to treat the "real" top as (0 - bodyRect.top). In a normal scrolling situation,
		// though, the top of the viewport should just be the body's scroll position.
		var viewportTop = (bodyRect.top < 0 && document.body.scrollTop == 0) ?
				-bodyRect.top :
				document.body.scrollTop;

		var viewportLeft = (bodyRect.left < 0 && document.body.scrollLeft == 0) ?
				-bodyRect.left :
				document.body.scrollLeft;

		var viewportBottom = viewportTop + this.$window.innerHeight;
		var viewportRight = viewportLeft + this.$window.innerWidth;

		// If the right edge of the pane would be off the screen and shifting it left by the
		// difference would not go past the left edge of the screen. If the clock pane is too
		// big to fit on the screen at all, move it to the left of the screen and scale the entire
		// element down to fit.
		if (paneLeft + CLOCK_PANE_WIDTH > viewportRight) {
			if (viewportRight - CLOCK_PANE_WIDTH > 0) {
				paneLeft = viewportRight - CLOCK_PANE_WIDTH;
			} else {
				paneLeft = viewportLeft;
				var scale = this.$window.innerWidth / CLOCK_PANE_WIDTH;
				clockPane.style.transform = 'scale(' + scale + ')';
			}

			clockPane.classList.add('md-timepicker-pos-adjusted');
		}

		// If the bottom edge of the pane would be off the screen and shifting it up by the
		// difference would not go past the top edge of the screen.
		if (paneTop + CLOCK_PANE_HEIGHT > viewportBottom &&
				viewportBottom - CLOCK_PANE_HEIGHT > viewportTop) {
			paneTop = viewportBottom - CLOCK_PANE_HEIGHT;
			clockPane.classList.add('md-timepicker-pos-adjusted');
		}

		clockPane.style.left = paneLeft + 'px';
		clockPane.style.top = paneTop + 'px';
		document.body.appendChild(clockPane);

		// Add CSS class after one frame to trigger open animation.
		this.$$rAF(function() {
			clockPane.classList.add('md-pane-open');
		});
	};

	/** Detach the floating clock pane from the document. */
	TimePickerCtrl.prototype.detachClockPane = function() {
		this.$element.removeClass('md-timepicker-open');
		this.clockPane.classList.remove('md-pane-open');
		this.clockPane.classList.remove('md-timepicker-pos-adjusted');

		if (this.clockPane.parentNode) {
			// Use native DOM removal because we do not want any of the angular state of this element
			// to be disposed.
			this.clockPane.parentNode.removeChild(this.clockPane);
		}
	};

	/**
	 * Open the floating clock pane.
	 * @param {Event} event
	 */
	TimePickerCtrl.prototype.openClockPane = function(event) {
		if (!this.isClockOpen && !this.isDisabled) {
			this.isClockOpen = true;
			this.clockPaneOpenedFrom = event.target;

			// Because the clock pane is attached directly to the body, it is possible that the
			// rest of the component (input, etc) is in a different scrolling container, such as
			// an md-content. This means that, if the container is scrolled, the pane would remain
			// stationary. To remedy this, we disable scrolling while the clock pane is open, which
			// also matches the native behavior for things like `<select>` on Mac and Windows.
			this.$mdUtil.disableScrollAround(this.clockPane);

			this.attachClockPane();
			this.focusClock();
			if (this.mdInputContainer) {
				this.mdInputContainer.setFocused(true);
			}

			// Attach click listener inside of a timeout because, if this open call was triggered by a
			// click, we don't want it to be immediately propogated up to the body and handled.
			var self = this;
			this.$mdUtil.nextTick(function() {
				// Use 'touchstart` in addition to click in order to work on iOS Safari, where click
				// events aren't propogated under most circumstances.
				// See http://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
				self.documentElement.on('click touchstart', self.bodyClickHandler);
				self.documentElement.on('mouseup touchend', self.bodyMouseupHandler);
				self.documentElement.on('keyup', self.bodyKeyboardInteractionHandler);
			}, false);

			window.addEventListener('resize', this.windowResizeHandler);
		}
	};

	/** Close the floating clock pane. */
	TimePickerCtrl.prototype.closeClockPane = function(updateTime) {
		if (this.isClockOpen) {
			this.isClockOpen = false;

			if (updateTime || updateTime === undefined) {
				this.updateTimeToShow();
			}

			this.detachClockPane();
			this.clockPaneOpenedFrom.focus();
			this.clockPaneOpenedFrom = null;
			this.$mdUtil.enableScrolling();
			this.updateErrorState();

			this.ngModelCtrl.$setTouched();
			if (this.mdInputContainer) {
				this.mdInputContainer.setHasValue(this.time != null);
				this.mdInputContainer.setFocused(this.focused);
			}

			this.documentElement.off('click touchstart', this.bodyClickHandler);
			this.documentElement.off('mouseup touchend', this.bodyMouseupHandler);
			this.documentElement.off('keyup', this.bodyKeyboardInteractionHandler);
			window.removeEventListener('resize', this.windowResizeHandler);
		}
	};

	/** Gets the controller instance for the clock in the floating pane. */
	TimePickerCtrl.prototype.getClockCtrl = function() {
		return angular.element(this.clockPane.querySelector('md-clock')).controller('mdClock');
	};

	/** Focus the clock in the floating pane. */
	TimePickerCtrl.prototype.focusClock = function() {
		// Use a timeout in order to allow the clock to be rendered, as it is gated behind an ng-if.
		var self = this;
		this.$mdUtil.nextTick(function() {
			self.getClockCtrl().load(self.time);
		}, false);
	};

	/**
	 * Sets whether the input is currently focused.
	 * @param {boolean} isFocused
	 */
	TimePickerCtrl.prototype.setFocused = function(isFocused) {
		if (!isFocused) {
			this.ngModelCtrl.$setTouched();
		}
		this.isFocused = isFocused;
	};

	/**
	 * Handles a click on the document body when the floating clock pane is open.
	 * Closes the floating clock pane if the click is not inside of it.
	 * @param {MouseEvent} event
	 */
	TimePickerCtrl.prototype.handleBodyClick = function(event) {
		if (this.isClockOpen) {
			// TODO(jelbourn): way want to also include the md-timepicker itself in this check.
			var isInClock = this.$mdUtil.getClosest(event.target, 'md-clock');
			if (!isInClock) {
				this.closeClockPane();
			}

			this.$scope.$digest();
		}
	};

	/**
	 * Handles a mouseup on the document body when the floating clock pane is open.
	 */
	TimePickerCtrl.prototype.handleBodyMouseup = function(event) {
		this.getClockCtrl().$scope.dragging = false;
	};

	/**
	 * Handles a click on the document body when the floating clock pane is open.
	 * Closes the floating clock pane if the click is not inside of it.
	 * @param {MouseEvent} event
	 */
	TimePickerCtrl.prototype.handleBodyKeyboardInteraction = function(event) {
		var keyCodes = this.$mdConstant.KEY_CODE;

		if (event.keyCode == keyCodes.ESCAPE) {
			this.closeClockPane(false);
		}
	};

 	/**
 	 * Apply the clock hours
 	 */
	TimePickerCtrl.prototype.updateTimeToShow = function() {
		var selection = this.getClockCtrl().$scope.selection;
		var parsedTime = this.timeLocale.parseTime(selection);

		if (this.timeUtil.isBetween(parsedTime, this.minTime, this.maxTime)) {
			this.ngModelCtrl.$setViewValue(parsedTime);
			this.time = parsedTime;

			this.inputElement.value = this.timeLocale.formatTime(parsedTime);
		}
	};

})();
