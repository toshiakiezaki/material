(function () {
	'use strict';

	angular.module('material.components.stepper').directive('mdStepScroll', stepScrollDirective);

	function stepScrollDirective($parse) {
		return {
			restrict: 'A',
			compile: function ($element, attr) {
				var fn = $parse(attr.mdStepScroll, null, true);

				return function ngEventHandler(scope, element) {
					element.on('mousewheel', function (event) {
						scope.$apply(function () {
							fn(scope, {
								$event: event 
							});
						});
					});
				};
			}
		}
	}
})();
