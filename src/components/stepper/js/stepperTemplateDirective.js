(function () {
	'use strict';

	angular.module('material.components.stepper').directive('mdStepperTemplate', stepperTemplateDirective);

	function stepperTemplateDirective($compile, $mdUtil) {
		return {
			restrict: 'A',
			link: link,
			require: '^?mdStepper',
			scope: {
				template: '=mdStepperTemplate',
				connected: '=?mdConnectedIf',
				compileScope: '=mdScope'
			}
		};

		function link(scope, element, attr, ctrl) {
			if (!ctrl) {
				return;
			}

			var compileScope = ctrl.enableDisconnect ? scope.compileScope.$new() : scope.compileScope;

			element.html(scope.template);
			$compile(element.contents())(compileScope);

			element.on('DOMSubtreeModified', function () {
				ctrl.updatePagination();
				ctrl.updateInkBarStyles();
			});

			return $mdUtil.nextTick(handleScope);

			function handleScope() {
				scope.$watch('connected', function (value) {
					value === false ? disconnect() : reconnect();
				});

				scope.$on('$destroy', reconnect);
			}

			function disconnect() {
				if (ctrl.enableDisconnect) {
					$mdUtil.disconnectScope(compileScope);
				}
			}

			function reconnect() {
				if (ctrl.enableDisconnect) {
					$mdUtil.reconnectScope(compileScope);
				}
			}
		}
	}
})();
