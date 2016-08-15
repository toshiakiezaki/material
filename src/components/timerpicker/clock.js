(function() {
	'use strict';

	/**
	* @ngdoc module
	* @name material.components.timepicker
	* @description Timepicker
	*/
	angular.module('material.components.timepicker', ['material.core', 'material.components.icon', 
		'material.components.virtualRepeat']).directive('mdClock', clockDirective);

	function clockDirective() {
		return {
			template: '<div class="md-clock-input-mask">' + 
						  '<div class="md-clock-input-hour" ng-class="{\'md-clock-selected-input-mask\': currentMode==\'hour\'}" ng-click="eventChangeSelectionMode(event, \'hour\')">{{(selection.hour < 10 || selection.hour == 24 ? "0" : "") + (selection.hour < 24 ? selection.hour : "0")}}</div>' + 
						  '<div class="md-clock-input-minute" ng-class="{\'md-clock-selected-input-mask\': currentMode==\'minute\'}" ng-click="eventChangeSelectionMode(event, \'minute\')">{{(selection.minute < 10 ? "0" : "") + selection.minute}}</div>' + 
						  '<div class="md-clock-input-second" ng-class="{\'md-clock-selected-input-mask\': currentMode==\'second\'}" ng-click="eventChangeSelectionMode(event, \'second\')">{{(selection.second < 10 ? "0" : "") + selection.second}}</div>' + 
						  '<div class="md-clock-input-period" ng-click="eventChangePeriod()" ng-show="!acceptFullTime">{{selection.period}}</div>' + 
					  '</div>' + 
					  '<div class="md-clock-scroll-mask" ng-mousedown="dragging=true" ng-mouseup="eventChangeSelectionMode($event)" oncontextmenu="return false;">' + 
						  '<ul class="md-clock-container">' + 
								"<li ng-show=\"currentMode=='hour'\">" + 
									'<div ng-repeat="degree in degrees.hour|limitTo:(acceptFullTime ? 24 : 12) track by $index" class="md-clock-fragment md-clock-hour-fragment" ng-class="{\'md-clock-selected-fragment\': selection.level == (acceptFullTime ? ($index >= 12 ? 2 : 1) : 2) && (selection.hour == ($index+1) || (arrowPosition == degree)), \'md-clock-disabled-fragment\': selectionDisabled.hour.indexOf($index+1) >= 0}" data-fulltime=\"{{acceptFullTime}}\" ng-mousedown="eventSelect($index+1, true)" ng-mouseenter="eventSelect($index+1, false)" ng-mousemove="eventHover($index+1, \'hour\')">{{($index+1) < 10 ? ("0" + ($index+1)) : ($index+1 == 24 ? "00" : ($index+1))}}</div>' + 
								'</li>' + 
								"<li ng-show=\"currentMode=='minute'\">" + 
									'<div ng-repeat="degree in degrees.minute" class="md-clock-fragment md-clock-minute-fragment" ng-class="{\'md-clock-selected-fragment\': selection.minute == ((($index+1) == 60) ? 0 : ($index+1)) || arrowPosition == degree, \'md-clock-disabled-fragment\': selectionDisabled.minute.indexOf($index+1) >= 0}" ng-mousedown="eventSelect($index+1, true)" ng-mouseenter="eventSelect($index+1, false)" ng-mousemove="eventHover($index+1, \'minute\')">{{($index+1)%5 == 0 ? (($index+1) < 10 ? "0"+($index+1) : (($index+1) == 60 ? "00" : ($index+1))) : ""}}</div>' + 
								'</li>' + 
								"<li ng-show=\"currentMode=='second'\">" + 
									'<div ng-repeat="degree in degrees.second" class="md-clock-fragment md-clock-minute-fragment" ng-class="{\'md-clock-selected-fragment\': selection.second == ((($index+1) == 60) ? 0 : ($index+1)) || arrowPosition == degree, \'md-clock-disabled-fragment\': selectionDisabled.second.indexOf($index+1) >= 0}" ng-mousedown="eventSelect($index+1, true)" ng-mouseenter="eventSelect($index+1, false)" ng-mousemove="eventHover($index+1, \'second\')">{{($index+1)%5 == 0 ? (($index+1) < 10 ? "0"+($index+1) : (($index+1) == 60 ? "00" : ($index+1))) : ""}}</div>' + 
								'</li>' + 
								'<span class="md-clock-arrow" style="transform: rotateZ({{arrowPosition}}deg);" ng-class="{\'md-clock-disabled-arrow\': selectionDisabled[currentMode].indexOf(selection[currentMode]) >= 0}" data-level="{{selection.level}}"></span>' + 
						  '</ul>' + 
					  '</div>',
			scope: {
				minTime: '=mdMinTime',
				maxTime: '=mdMaxTime',
				timeFilter: '=mdTimeFilter'
			},
			require: ['ngModel', 'mdClock'],
			controller: ClockCtrl,
			controllerAs: 'ctrl',
			bindToController: true,
			link: function(scope, element, attrs, controllers) {
				var ngModelCtrl = controllers[0];
				var mdClockCtrl = controllers[1];

				mdClockCtrl.configureNgModel(ngModelCtrl);
			}
		}
	}

	/** Next identifier for clock instance. */
	var nextUniqueId = 0;

	/**
	* Controller for the mdClock component.
	* @ngInject @constructor
	*/
	function ClockCtrl($element, $attrs, $scope, $animate, $q, $mdConstant,
		$mdTheming, $$mdTimeUtil, $$mdTimeLocale, $mdInkRipple, $mdUtil) {
		$mdTheming($element);

		/** @final {!angular.$animate} */
		this.$animate = $animate;

		/** @final {!angular.$q} */
		this.$q = $q;

		/** @final */
		this.$mdInkRipple = $mdInkRipple;

		/** @final */
		this.$mdUtil = $mdUtil;

		/** @final */
		this.keyCode = $mdConstant.KEY_CODE;

		/** @final */
		this.timeUtil = $$mdTimeUtil;

		/** @final */
		this.timeLocale = $$mdTimeLocale;

		/** @final {!angular.JQLite} */
		this.$element = $element;

		/** @final {!angular.Scope} */
		this.$scope = $scope;

		/** @final {HTMLElement} */
		this.clockElement = $element[0].querySelector('.md-clock');

		/** @final {number} Unique ID for this calendar instance. */
		this.id = nextUniqueId++;

		/** @type {!angular.NgModelController} */
		this.ngModelCtrl = null;

		$scope.degrees = {
			"hour": [31, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 31, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360],
			"minute": [9, 13, 17, 22, 31, 40, 44, 48, 53, 60, 69, 74, 77, 81, 90, 100, 104, 108, 112, 120, 130, 
			133, 137, 141, 150, 160, 163, 167, 171, 180, 189, 193, 196, 200, 210, 219, 223, 227, 230, 240, 249, 
			253, 256, 260, 270, 279, 283, 287, 291, 300, 309, 313, 317, 321, 330, 339, 343, 347, 351, 360],
			"second": [9, 13, 17, 22, 31, 40, 44, 48, 53, 60, 69, 74, 77, 81, 90, 100, 104, 108, 112, 120, 130, 
			133, 137, 141, 150, 160, 163, 167, 171, 180, 189, 193, 196, 200, 210, 219, 223, 227, 230, 240, 249, 
			253, 256, 260, 270, 279, 283, 287, 291, 300, 309, 313, 317, 321, 330, 339, 343, 347, 351, 360]
		};

		$scope.selection = {
			"hour": 0,
			"minute": 0,
			"second": 0,
			"period": "AM",
			"level": 2
		};

		$scope.selectionDisabled = {
			"hour": [],
			"minute": [],
			"second": []
		};

		$scope.dragging = false;
		$scope.currentMode = "hour";
		$scope.acceptFullTime = this.timeLocale.isFullTime();
		$scope.arrowPosition = $scope.degrees[$scope.currentMode][$scope.selection[$scope.currentMode] - 1];

		// Unless the user specifies so, the calendar should not be a tab stop.
		// This is necessary because ngAria might add a tabindex to anything with an ng-model
		// (based on whether or not the user has turned that particular feature on/off).
		if (!$attrs['tabindex']) {
			$element.attr('tabindex', '-1');
		}
	}

	/**
	* Sets up the controller's reference to ngModelController.
	* @param {!angular.NgModelController} ngModelCtrl
	*/
	ClockCtrl.prototype.configureNgModel = function(ngModelCtrl) {
		this.ngModelCtrl = ngModelCtrl;

		this.$scope.eventChangeSelectionMode = function(event, mode) {
			if (mode === undefined) {
				var modes = ["hour", "minute", "second"];
				var currentMode = modes.indexOf(this.ctrl.$scope.currentMode);
				currentMode = event.which == 1 ? ++currentMode : --currentMode;
				currentMode = currentMode > (modes.length - 1) ? 0 : (currentMode < 0 ? (modes.length - 1) : currentMode);

				mode = modes[currentMode];
			}

			this.ctrl.changeSelectionMode(mode);
		};

		this.$scope.eventChangePeriod = function() {
			var selection = this.ctrl.$scope.selection;
			selection.period = (selection.period === "AM" ? "PM" : "AM");

			var currentMode = this.ctrl.$scope.currentMode;
			this.ctrl.validateSelection(selection[currentMode], currentMode);
		};

		this.$scope.eventSelect = function(object, forceSelect) {
			var ctrl = this.ctrl;

			if (!ctrl.$scope.dragging && !forceSelect) {
				return false;
			}

			if (object == 60) {
				object = 0;
			}

			this.ctrl.select(object);
		};

		this.$scope.eventHover = function(time, fragment) {
			this.ctrl.validateSelection(time, fragment);
		};
	};

	ClockCtrl.prototype.load = function(time) {
		var hour = time ? (time.getHours() == 0 ? 24 : time.getHours()) : 24;
		var minute = time ? time.getMinutes() : 0;
		var second = time ? time.getSeconds() : 0;

		if (!this.$scope.acceptFullTime) {
			this.$scope.selection.period = (hour >= 12 && hour < 24 ? "PM" : "AM");

			if (hour > 12) {
				hour -= 12;
			}
		}

		this.$scope.currentMode = "hour";
		this.select(hour);

		this.$scope.currentMode = "minute";
		this.select(minute);

		this.$scope.currentMode = "second";
		this.select(second);

		this.changeSelectionMode("hour");

		this.$scope.$apply();
	};

	ClockCtrl.prototype.changeSelectionMode = function(mode) {
		this.$scope.currentMode = mode;

		this.done();
	};

	ClockCtrl.prototype.select = function(object) {
		var currentMode = this.$scope.currentMode;
		this.$scope.selection[currentMode] = object;

		this.done();
	};

	ClockCtrl.prototype.done = function() {
		var currentMode = this.$scope.currentMode;
		var selection = this.$scope.selection[currentMode];

		this.$scope.arrowPosition = this.$scope.degrees[currentMode][(selection == 0 ? 60 : selection) - 1];

		this.validateSelection(selection, currentMode);
		this.controlArrowLevel(selection);
	};

	ClockCtrl.prototype.validateSelection = function(time, fragment) {
		var selection = this.$scope.selection;
		var minTime = this.minTime;
		var maxTime = this.maxTime;
		var disabled = false;

		if (time == 60) {
			time = 0;
		}

		var selectedHour = fragment === "hour" ? time : selection.hour;
		if (!this.$scope.acceptFullTime) {
			var isPM = selection.period == "PM";

			if ((isPM && selectedHour < 12) ||
				(!isPM && selectedHour == 12)) {
				selectedHour += 12;
			}
		}

		if (this.timeUtil.isValidTime(minTime) && this.timeUtil.isValidTime(maxTime)) {
			if (fragment === "hour") {
				disabled = selectedHour < minTime.getHours() || selectedHour > maxTime.getHours();
			} else if (fragment === "minute") {
				disabled = selectedHour >= maxTime.getHours() && (time < minTime.getMinutes() || time > maxTime.getMinutes());
			} else {
				disabled = selectedHour >= maxTime.getHours() && selection["minute"] >= maxTime.getMinutes() && (time < minTime.getSeconds() || time > maxTime.getSeconds());
			}
		} else if (this.timeUtil.isValidTime(minTime)) {
			if (fragment === "hour") {
				disabled = selectedHour < minTime.getHours();
			} else if (fragment === "minute") {
				disabled = selectedHour == minTime.getHours() && time < minTime.getMinutes();
			} else {
				disabled = selectedHour == minTime.getHours() && selection["minute"] == minTime.getMinutes() && time < minTime.getSeconds();
			}
		} else if (this.timeUtil.isValidTime(maxTime)) {
			if (fragment === "hour") {
				disabled = selectedHour > maxTime.getHours();
			} else if (fragment === "minute") {
				disabled = selectedHour >= maxTime.getHours() && time > maxTime.getMinutes();
			} else {
				disabled = selectedHour >= maxTime.getHours() && selection["minute"] >= maxTime.getMinutes() && time > maxTime.getSeconds();
			}
		}

		var target = this.$scope.selectionDisabled[fragment];
		if (disabled && target.indexOf(time) < 0) {
			target.push(time);
		} else if (!disabled && target.indexOf(time) >= 0) {
			target.splice(target.indexOf(time), 1);
		}
	};

	ClockCtrl.prototype.controlArrowLevel = function(degree) {
		var currentMode = this.$scope.currentMode;

		if (currentMode == "hour") {
			this.$scope.selection.level = (degree > 12 ? 2 : (this.$scope.acceptFullTime ? 1 : 2));
		} else {
			this.$scope.selection.level = 2;
		}
	};

})();
