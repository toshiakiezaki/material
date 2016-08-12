(function() {
  'use strict';

  angular.module('material.components.zoom')
      .directive('mdZoom', zoomDirective);

  /**
   * @ngdoc directive
   * @name mdZoom
   * @module material.components.zoom
   *
   * @usage
   * <hljs lang="html">
   *   <md-zoom ng-model="country"></md-zoom>
   * </hljs>
   *
   */
  function zoomDirective($$mdSvgRegistry) {
    return {
      template: '<div></div>',
      require: ['ngModel', 'mdZoom', '?^mdInputContainer'],
      scope: {
      },
      controller: ZoomCtrl,
      controllerAs: 'ctrl',
      bindToController: true,
      link: function(scope, element, attr, controllers) {
        var ngModelCtrl = controllers[0];
        var mdZoomCtrl = controllers[1];
        var mdInputContainer = controllers[2];

        mdZoom.configureNgModel(ngModelCtrl, mdInputContainer);

        if (mdInputContainer) {
          mdInputContainer.setHasPlaceholder(attr.mdPlaceholder);
          mdInputContainer.element.addClass(INPUT_CONTAINER_CLASS);
          mdInputContainer.input = element;

          if (!mdInputContainer.label) {
            $mdAria.expect(element, 'aria-label', attr.mdPlaceholder);
          }

          scope.$watch(mdInputContainer.isErrorGetter || function() {
            return ngModelCtrl.$invalid && ngModelCtrl.$touched;
          }, mdInputContainer.setInvalid);
        }
      }
    };
  }

  /**
   * Controller for md-zoom.
   *
   * @ngInject @constructor
   */
  function ZoomCtrl($scope, $element, $attrs, $compile, $timeout, $window, $mdConstant, $mdTheming, $mdUtil, $$rAF) {
    /** @final */
    this.$compile = $compile;

    /** @final */
    this.$timeout = $timeout;

    /** @final */
    this.$window = $window;

    /** @final */
    this.$mdConstant = $mdConstant;

    /* @final */
    this.$mdUtil = $mdUtil;

    /** @final */
    this.$$rAF = $$rAF;

    /**
     * The root document element. This is used for attaching a top-level click handler to
     * close the zoom panel when a click outside said panel occurs. We use `documentElement`
     * instead of body because, when scrolling is disabled, some browsers consider the body element
     * to be completely off the screen and propagate events directly to the html element.
     * @type {!angular.JQLite}
     */
    this.documentElement = angular.element(document.documentElement);

    /** @type {!angular.NgModelController} */
    this.ngModelCtrl = null;

    /** @final {!angular.JQLite} */
    this.$element = $element;

    /** @final {!angular.Attributes} */
    this.$attrs = $attrs;

    /** @final {!angular.Scope} */
    this.$scope = $scope;

    /** @final */
    this.mdInputContainer = null;
  }

  /**
   * Sets up the controller's reference to ngModelController.
   * @param {!angular.NgModelController} ngModelCtrl
   */
  ZoomCtrl.prototype.configureNgModel = function(ngModelCtrl, mdInputContainer) {
    this.ngModelCtrl = ngModelCtrl;
    this.mdInputContainer = mdInputContainer;
  };

})();
