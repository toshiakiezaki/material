(function () {
	'use strict';

	angular.module('material.components.stepper').directive('mdStep', stepDirective);

	/**
	 * @ngdoc directive
	 * @name mdStep
	 * @module material.components.stepper
	 *
	 * @restrict E
	 *
	 */
	function stepDirective() {
		return {
			require: '^?mdStepper',
			terminal: true,
			compile: function (element, attr) {
				var label = getChildByTag(element, 'md-step-label');
				var body = getChildByTag(element, 'md-step-body');
				var actions = getChildByTag(element, 'md-step-actions');

				if (label.length == 0) {
					label = angular.element('<md-step-label></md-step-label>');
					if (attr.mdTitle) {
						label.text("{{" + attr.mdTitle + "}}");
					}

					if (body.length == 0) {
						var contents = element.contents().detach();
						body = angular.element('<md-step-body></md-step-body>');
						body.append(contents);
					}
				}

				element.append(label);

				if (body.html()) {
					element.append(body);
				}

				return postLink;
			},
			scope: {
				title: '=?mdTitle',
				complete: '=?mdComplete',
				active: '=?mdActive',
				disabled: '=?ngDisabled',
				select: '&?mdOnSelect',
				deselect: '&?mdOnDeselect'
			}
		};

		function postLink(scope, element, attr, ctrl) {
			if (!ctrl) {
				return;
			}

			var index = ctrl.getStepElementIndex(element);
			var body = getChildByTag(element, 'md-step-body').remove();
			var label = getChildByTag(element, 'md-step-label').remove();
			var data = ctrl.insertStep({
				scope: scope,
				parent: scope.$parent,
				index: index,
				element: element,
				template: body.html(),
				label: label.html()
			}, index);

			scope.select = scope.select || angular.noop;
			scope.deselect = scope.deselect || angular.noop;

			scope.$watch('active', function(active) {
				if (active) {
					ctrl.select(data.getIndex());
				}
			});

			scope.$watch('complete', function() {
				ctrl.refreshIndex();
			});

			scope.$watch('disabled', function() {
				ctrl.refreshIndex();
			});

			scope.$watch(function() {
				return ctrl.getStepElementIndex(element);
			}, function (newIndex) {
				data.index = newIndex;
				ctrl.updateStepOrder();
			});

			scope.$on('$destroy', function() {
				ctrl.removeStep(data);
			});
		}

		function getChildByTag(element, tagName) {
			var children = element[0].children;

			for (var i = 0; i < children.length; i++) {
				var child = children[i];

				if (child.tagName === tagName.toUpperCase()) {
					return angular.element(child);
				}
			}

			return angular.element();
		}
	}
})();
