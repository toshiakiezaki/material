(function () {
	'use strict';

	angular.module('material.components.stepper').directive('mdStepLabel', stepLabelDirective);

	function stepLabelDirective() {
		return {
			terminal: true
		};
	}
})();
