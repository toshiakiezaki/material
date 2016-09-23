(function () {
	'use strict';

	angular.module('material.components.stepper').factory('$mdStepInkRipple', stepFactory);

	/**
	 * @ngdoc service
	 * @name $mdStepInkRipple
	 * @module md-stepper
	 *
	 * @description
	 * TODO DOCS
	 *
	 */
	function stepFactory($mdInkRipple) {
		return {
			attach: function(scope, element, options) {
				return $mdInkRipple.attach(scope, element, angular.extend({
					center: false,
					dimBackground: true,
					outline: false,
					rippleSize: 'full'
				}, options));
			}
		};
	};
})();
