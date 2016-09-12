(function () {
	'use strict';

	angular.module('material.components.stepper').directive('mdStepper', stepperDirective);

	/**
	 * @ngdoc directive
	 * @name mdStepper
	 * @module md-stepper
	 *
	 * @restrict E
	 *
	 * @description
	 * TODO DOCS
	 *
	 */
	function stepperDirective() {
		return {
			scope: {
				selectedIndex: '=?mdSelected',
				busyText: '=?mdBusyText',
				busy: '=?mdBusy',
				disableTabsBehavior: '=?mdDisableTabsBehavior'
			},
			template: function(element, attr) {
				attr["$mdStepperTemplate"] = element.html();

				var ngClick = attr.mdDisableTabsBehavior ? '' : 'ng-click="$mdStepperCtrl.select(step.getIndex())" ';
				var mdStepClass = attr.mdDisableTabsBehavior ? 'class="md-step md-step-nopointer" ': 'class="md-step" ';

				return '' + 
				'<md-stepper-wrapper> ' + 
				'	<md-step-data></md-step-data> ' + 
				'	<md-stepper-canvas tabindex="{{ $mdStepperCtrl.hasFocus ? -1 : 0 }}" ' + 
				'	  aria-activedescendant="step-item-{{$mdStepperCtrl.steppers[$mdStepperCtrl.focusIndex].id}}" ' + 
				'	  ng-focus="$mdStepperCtrl.redirectFocus()" ng-class="{\'md-paginated\': $mdStepperCtrl.shouldPaginate, ' + 
				'	  \'md-center-stepper\': $mdStepperCtrl.shouldCenterStepper}" ng-keydown="$mdStepperCtrl.keydown($event)" ' + 
				'	  role="steplist"> ' + 
				'		<md-busy ng-show="$mdStepperCtrl.busy">{{$mdStepperCtrl.busyText}}</md-busy>' + 
				'		<md-pagination-wrapper ng-class="{ \'md-center-stepper\': $mdStepperCtrl.shouldCenterStepper }" ' + 
				'		  md-step-scroll="$mdStepperCtrl.scroll($event)"> ' + 
				'			<md-step-item tabindex="-1" ' + mdStepClass + 
				'			  style="max-width: {{ $mdStepperCtrl.maxStepWidth + \'px\' }}" ' + 
				'			  ng-repeat="step in $mdStepperCtrl.steppers" role="step" ' + 
				'			  aria-controls="step-content-{{::step.id}}" ' + 
				'			  aria-selected="{{step.isActive()}}" aria-disabled="{{step.scope.disabled || \'false\'}}" ' + ngClick + 
				'			  ng-class="{\'md-active\':    step.isActive(), \'md-focused\':   step.hasFocus(), ' + 
				'			    \'md-disabled\':  step.scope.disabled, \'md-complete\':  step.scope.complete}" ' + 
				'			  ng-disabled="step.scope.disabled" md-swipe-left="$mdStepperCtrl.nextPage()" ' + 
				'			  md-swipe-right="$mdStepperCtrl.previousPage()" md-scope="::step.parent">' + 
				'				<md-step-label-wrapper stepindex="{{::$index+1}}" md-stepper-template="::step.label" ' + 
				'				  md-scope="::step.parent"></md-step-label-wrapper>' + 
				'			</md-step-item> ' + 
				'		</md-pagination-wrapper> ' + 
				'		<div class="md-visually-hidden md-dummy-wrapper"> ' + 
				'			<md-dummy-step class="md-step" tabindex="-1" stepindex="{{::$index+1}}" ' + 
				'			  id="step-item-{{::step.id}}" role="step" aria-controls="step-content-{{::step.id}}" ' + 
				'			  aria-selected="{{step.isActive()}}" aria-disabled="{{step.scope.disabled || \'false\'}}" ' + 
				'			  ng-focus="$mdStepperCtrl.hasFocus = true" ng-blur="$mdStepperCtrl.hasFocus = false" ' + 
				'			  ng-repeat="step in $mdStepperCtrl.steppers" md-scope="::step.parent">' + 
				'				<md-step-label-wrapper stepindex="{{::$index+1}}" md-stepper-template="::step.label" md-scope="::step.parent"></md-step-label-wrapper>' + 
				'			</md-dummy-step> ' + 
				'		</div> ' + 
				'	</md-stepper-canvas> ' + 
				'</md-stepper-wrapper> ' + 

				'<md-stepper-content-wrapper ng-show="$mdStepperCtrl.hasContent && $mdStepperCtrl.selectedIndex >= 0"> ' + 
				'	<md-step-content id="step-content-{{::step.id}}" role="steppanel" aria-labelledby="step-item-{{::step.id}}" ' + 
				'	  md-swipe-left="$mdStepperCtrl.swipeContent && $mdStepperCtrl.incrementIndex(1)" ' + 
				'	  md-swipe-right="$mdStepperCtrl.swipeContent && $mdStepperCtrl.incrementIndex(-1)" ' + 
				'	  ng-if="$mdStepperCtrl.hasContent" ng-repeat="(index, step) in $mdStepperCtrl.steppers" ' + 
				'	  ng-class="{\'md-no-transition\': $mdStepperCtrl.lastSelectedIndex == null, ' + 
				'	    \'md-active\': step.isActive(), \'md-left\': step.isLeft(), ' + 
				'	    \'md-right\': step.isRight(), \'md-no-scroll\': $mdStepperCtrl.dynamicHeight}"> ' + 
				'		<div md-stepper-template="::step.template" md-connected-if="step.isActive()" ' + 
				'		  md-scope="::step.parent" ng-if="$mdStepperCtrl.enableDisconnect || step.shouldRender()"></div> ' + 
				'	</md-step-content> ' + 
				'</md-stepper-content-wrapper>'
			},
			controller: 'MdStepperController',
			controllerAs: '$mdStepperCtrl',
			bindToController: true
		};
	}
})();
