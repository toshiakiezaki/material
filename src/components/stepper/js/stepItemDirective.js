(function () {
	'use strict';

	angular.module('material.components.stepper').directive('mdStepItem', stepItemDirective);

	function stepItemDirective() {
		return {
			require: '^?mdStepper',
			link: function link(scope, element, attr, ctrl) {
				if (!ctrl) {
					return;
				}

				ctrl.attachRipple(scope, element);
			}
		};
	}
})();
