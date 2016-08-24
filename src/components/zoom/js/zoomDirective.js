(function() {
	'use strict';

	angular.module('material.components.zoom').directive('mdZoom', zoomDirective);

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
	function zoomDirective() {
		return {
			templateUrl: 'zoom-template.html',
			require: ['ngModel', 'mdZoom', '?^mdInputContainer'],
			scope: {
				zoomFilter: '=?mdFilter',
				options: '=mdOptions',
				keyParam: '=?mdKey',
				nameParam: '=?mdName',
				fetchSize: '=?mdFetchSize',
				onSelect: '=?mdOnSelect',
				onAdd: '=?mdOnAdd',
				placeholder: '@mdPlaceholder'
			},
			controller: ZoomCtrl,
			controllerAs: 'ctrl',
			bindToController: true,
			link: function(scope, element, attr, controllers) {
				var ngModelCtrl = controllers[0];
				var mdZoomCtrl = controllers[1];
				var mdInputContainer = controllers[2];

				mdZoomCtrl.configureNgModel(ngModelCtrl, mdInputContainer);

				if (mdInputContainer) {
					mdInputContainer.setHasPlaceholder(attr.mdPlaceholder);
					mdInputContainer.setHasValue(mdZoomCtrl.hasValue());
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

	var ZOOM_OPTIONS_WIDTH = 360;

	var ZOOM_OPTIONS_HEIGHT = 368;

	var EXTRA_INPUT_SIZE = 3;

	var INVALID_CLASS = 'md-zoom-invalid';

	var INPUT_CONTAINER_CLASS = '_md-zoom-floating-label';

	/**
	* Controller for md-zoom.
	*
	* @ngInject @constructor
	*/
	function ZoomCtrl($scope, $timeout, $element, $attrs, $window, $mdConstant, $mdTheming, $mdUtil, $$rAF, $mdDialog, $filter) {
		/** @final {!angular.Scope} */
		this.$scope = $scope;

		/** @final */
		this.$timeout = $timeout;

		/** @final {!angular.JQLite} */
		this.$element = $element;

		/** @final {!angular.Attributes} */
		this.$attrs = $attrs;

		/** @final */
		this.$window = $window;

		/** @final */
		this.$mdConstant = $mdConstant;

		/* @final */
		this.$mdUtil = $mdUtil;

		/** @final */
		this.$$rAF = $$rAF;

		/** @final */
		this.$mdDialog = $mdDialog;

		/** @final */
		this.$filter = $filter('filter');

 		/** @final*/
 		this.$order = $filter('orderBy');

 		/** @final */
 		this.$limitTo = $filter('limitTo');

		/** @final */
		this.optionsPaneFetchSize = 5;

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
		this.inputContainer = $element[0].querySelector('.md-zoom-input-container');

		/** @type {HTMLElement} Floating clock pane. */
		this.zoomOptions = $element[0].querySelector('.md-zoom-pane');

		/** @type {boolean} */
		this.isFocused = false;

		/** @type {boolean} */
		this.isDisabled;

		/**
		 * Set defaults values
		 */
		if (this.keyParam === null || this.keyParam === undefined) {
			this.keyParam = "id";
		}

		if (this.nameParam === null || this.nameParam === undefined) {
			this.nameParam = "name";
		}

		if (this.fetchSize === null || this.fetchSize === undefined) {
			this.fetchSize = 20;
		}

		this.setDisabled($element[0].disabled || angular.isString($attrs['disabled']));

		/** @type {String} */
		this.filterBy = "";

		/** @type {String} */
		this.orderBy = "name";

		this.indexFocused = -1;

		this.isZoomOptionsOpen = false;

		this.zoomOptionsOpenedFrom = null;

		$mdTheming($element);

		this.zoomOptions.id = 'md-zoom-pane' + $mdUtil.nextUid();

		if (!$attrs['tabindex']) {
			$element.attr('tabindex', '-1');
		}

		this.bodyClickHandler = angular.bind(this, this.handleBodyClick);
		this.bodyMouseMoveHandler = angular.bind(this, this.handleMouseMove);
		this.bodyKeyboardInteractionHandler = angular.bind(this, this.handleBodyKeyboardInteraction);
		this.windowResizeHandler = $mdUtil.debounce(angular.bind(this, this.closeZoomOptions), 100);

		this.installPropertyInterceptors();
		this.attachChangeListeners();
		this.attachInteractionListeners();
	}

	ZoomCtrl.prototype.configureNgModel = function(ngModelCtrl, mdInputContainer) {
		this.ngModelCtrl = ngModelCtrl;
		this.mdInputContainer = mdInputContainer;

		var self = this;
		ngModelCtrl.$render = function() {
			self.selectOption(self.ngModelCtrl.$viewValue);
			self.resizeInputElement();
		};
	};

	ZoomCtrl.prototype.attachChangeListeners = function() {
		this.ngInputElement.on('input', angular.bind(this, this.resizeInputElement));
		this.ngInputElement.on('input', this.$mdUtil.debounce(this.handleInputEvent, 0, this));
	};

	ZoomCtrl.prototype.attachInteractionListeners = function() {
		var self = this;
		var keyCodes = this.$mdConstant.KEY_CODE;

		self.ngInputElement.on('keydown', function(event) {
			var options = self.getFiltredOptions();
			var maxIndex = options.length > 5 ? 4 : (options.length - 1);

			if (event.keyCode == keyCodes.DOWN_ARROW) {
				if (self.isZoomOptionsOpen) {
					if (self.indexFocused >= maxIndex) {
						self.indexFocused = 0;
					} else {
						self.indexFocused++;
					}
				} else {
					self.indexFocused = 0;
					self.openZoomOptions(event);
				}
			} else if (event.keyCode == keyCodes.UP_ARROW) {
				if (self.isZoomOptionsOpen) {
					if (self.indexFocused > 0 && self.indexFocused <= maxIndex) {
						self.indexFocused--;
					} else {
						self.indexFocused = maxIndex;
					}
				} else {
					self.indexFocused = maxIndex;
					self.openZoomOptions(event);
				}
			} else if (event.keyCode == keyCodes.ENTER) {
				if (event.ctrlKey) {
					self.openZoomDialog(event);
				} else {
					self.selectOption(options[self.indexFocused]);
				}
			} else if (event.keyCode == keyCodes.TAB) {
				self.closeZoomOptions();
			} else {
				self.indexFocused = 0;
			}

			self.$scope.$digest();
		});
	};

	ZoomCtrl.prototype.getFiltredOptions = function() {
		var options = this.$filter(this.options, this.filterBy);
		options = this.$order(options, this.orderBy);
		options = this.$limitTo(options, this.optionsPaneFetchSize);

		return options;
	};

	ZoomCtrl.prototype.installPropertyInterceptors = function() {
		var self = this;

		if (this.$attrs['ngDisabled']) {
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

	ZoomCtrl.prototype.setDisabled = function(isDisabled) {
		this.isDisabled = isDisabled;
		this.inputElement.disabled = isDisabled;
	};

	ZoomCtrl.prototype.updateErrorState = function(opt_value) {
		var value = opt_value || this.ngModelCtrl.$viewValue;

		this.clearErrorState();

		this.ngModelCtrl.$setValidity('valid', this.hasValue(value));

		if (angular.isFunction(this.zoomFilter)) {
			this.ngModelCtrl.$setValidity('filtered', this.zoomFilter(time));
		}

		if (!this.ngModelCtrl.$valid) {
			this.inputContainer.classList.add(INVALID_CLASS);
		}
	};

	ZoomCtrl.prototype.clearErrorState = function() {
		this.inputContainer.classList.remove(INVALID_CLASS);
		['filtered', 'valid'].forEach(function(field) {
			this.ngModelCtrl.$setValidity(field, true);
		}, this);
	};

	ZoomCtrl.prototype.resizeInputElement = function() {
		var value = this.ngModelCtrl.$viewValue ? this.ngModelCtrl.$viewValue[this.nameParam] : "";

		this.inputElement.size = value.length + EXTRA_INPUT_SIZE;
	};

	ZoomCtrl.prototype.handleInputEvent = function() {
		this.filterBy = this.inputElement.value;

		this.openZoomOptions({
			target: this.inputElement
		});
	};

	ZoomCtrl.prototype.attachZoomOptions = function() {
		var zoomOptions = this.zoomOptions;
		zoomOptions.style.transform = '';
		this.$element.addClass('md-zoom-open');

		var elementRect = this.inputContainer.getBoundingClientRect();
		var bodyRect = document.body.getBoundingClientRect();

		var paneTop = (elementRect.top + elementRect.height) - bodyRect.top;
		var paneLeft = elementRect.left - bodyRect.left;

		var viewportTop = (bodyRect.top < 0 && document.body.scrollTop == 0) ?
				-bodyRect.top : document.body.scrollTop;

		var viewportLeft = (bodyRect.left < 0 && document.body.scrollLeft == 0) ?
				-bodyRect.left : document.body.scrollLeft;

		var viewportBottom = viewportTop + this.$window.innerHeight;
		var viewportRight = viewportLeft + this.$window.innerWidth;

		if (paneLeft + ZOOM_OPTIONS_WIDTH > viewportRight) {
			if (viewportRight - ZOOM_OPTIONS_WIDTH > 0) {
				paneLeft = viewportRight - ZOOM_OPTIONS_WIDTH;
			} else {
				paneLeft = viewportLeft;
				var scale = this.$window.innerWidth / ZOOM_OPTIONS_WIDTH;
				zoomOptions.style.transform = 'scale(' + scale + ')';
			}

			zoomOptions.classList.add('md-zoom-pos-adjusted');
		}

		if (paneTop + ZOOM_OPTIONS_HEIGHT > viewportBottom &&
				viewportBottom - ZOOM_OPTIONS_HEIGHT > viewportTop) {
			paneTop = viewportBottom - ZOOM_OPTIONS_HEIGHT;
			zoomOptions.classList.add('md-zoom-pos-adjusted');
		}

		zoomOptions.style.left = paneLeft + 'px';
		zoomOptions.style.top = paneTop + 'px';
		document.body.appendChild(zoomOptions);

		this.$$rAF(function() {
			zoomOptions.classList.add('md-options-open');
		});
	};

	ZoomCtrl.prototype.detachZoomOptions = function() {
		this.$element.removeClass('md-zoom-open');
		this.zoomOptions.classList.remove('md-options-open');
		this.zoomOptions.classList.remove('md-zoom-pos-adjusted');

		if (this.zoomOptions.parentNode) {
			this.zoomOptions.parentNode.removeChild(this.zoomOptions);
		}
	};

	ZoomCtrl.prototype.openZoomDialog = function(event) {
		if (!this.isDisabled) {
			var self = this;
			self.gridSelection = [self.ngModelCtrl.$viewValue];

			self.closeZoomOptions();

			self.pagination = {
				page: 1,
				select: false,
				boundaryLinks: true
			};

			self.$mdDialog.show({
				controller: function () {
					return self;
				},
				controllerAs: 'ctrl',
				templateUrl: 'zoom-dialog-template.html', 
				parent: angular.element(document.body),
				targetEvent: event,
				clickOutsideToClose: true,
				fullscreen: true
			});
		}
	};

	ZoomCtrl.prototype.openZoomOptions = function(event) {
		if (!this.isZoomOptionsOpen && !this.isDisabled) {
			this.setFocused(true);
			this.isZoomOptionsOpen = true;
			this.zoomOptionsOpenedFrom = event.target;

			this.$mdUtil.disableScrollAround(this.ZoomOptions);

			this.attachZoomOptions();
			if (this.mdInputContainer) {
				this.mdInputContainer.setFocused(true);
			}

			var self = this;
			this.$mdUtil.nextTick(function() {
				self.documentElement.on('click touchstart', self.bodyClickHandler);
				self.documentElement.on('mousemove touchmove', self.bodyMouseMoveHandler);
				self.documentElement.on('keyup', self.bodyKeyboardInteractionHandler);
			}, false);

			window.addEventListener('resize', this.windowResizeHandler);
		}
	};

	ZoomCtrl.prototype.closeZoomOptions = function() {
		if (this.isZoomOptionsOpen) {
			this.indexFocused = -1;
			this.setFocused(false);
			this.isZoomOptionsOpen = false;

			this.detachZoomOptions();
			this.zoomOptionsOpenedFrom.focus();
			this.zoomOptionsOpenedFrom = null;
			this.$mdUtil.enableScrolling();
			this.updateErrorState();

			this.ngModelCtrl.$setTouched();
			if (this.mdInputContainer) {
				this.mdInputContainer.setHasValue(this.hasValue());
				this.mdInputContainer.setFocused(this.focused);
			}

			this.documentElement.off('click touchstart', this.bodyClickHandler);
			this.documentElement.off('mousemove touchmove', this.bodyMouseMoveHandler);
			this.documentElement.off('keyup', this.bodyKeyboardInteractionHandler);
			window.removeEventListener('resize', this.windowResizeHandler);
		}
	};

	ZoomCtrl.prototype.setFocused = function(isFocused) {
		var self = this;

		if (!isFocused) {
			self.ngModelCtrl.$setTouched();

			self.$timeout(function() {
				self.updateInputValue();
				self.updateErrorState();
			}, 500, self);
		}

		self.isFocused = isFocused;
	};

	ZoomCtrl.prototype.handleMouseMove = function() {
		if (this.isZoomOptionsOpen) {
			this.indexFocused = -1;

			this.$scope.$digest();
		}
	};

	ZoomCtrl.prototype.handleBodyClick = function(event) {
		if (this.isZoomOptionsOpen) {
			var isInClock = this.$mdUtil.getClosest(event.target, 'md-zoom-options');
			if (!isInClock) {
				this.closeZoomOptions();
			}

			this.$scope.$digest();
		}
	};

	ZoomCtrl.prototype.handleBodyKeyboardInteraction = function(event) {
		var keyCodes = this.$mdConstant.KEY_CODE;

		if (event.keyCode == keyCodes.ESCAPE) {
			this.closeZoomOptions(false);
		}
	};

	ZoomCtrl.prototype.selectOption = function(option) {
		if (this.hasValue(option)) {
			this.ngModelCtrl.$setViewValue(option);
			this.updateInputValue();

			if (angular.isFunction(this.onSelect)) {
				this.onSelect.call(this);
			}
		}
	};

	ZoomCtrl.prototype.updateInputValue = function() {
		var hasValue = this.hasValue();

		if (hasValue) {
			var option = this.ngModelCtrl.$viewValue;

			this.filterBy = option[this.nameParam];
			this.inputElement.value = option[this.nameParam];
		} else {
			this.filterBy = "";
			this.inputElement.value = "";
		}

		if (this.mdInputContainer) {
			this.mdInputContainer.setHasValue(hasValue);
		}
	};

	ZoomCtrl.prototype.addOption = function() {
		if (angular.isFunction(this.onAdd)) {
			this.onAdd.call(this, this.filterBy);
		}
	};

	ZoomCtrl.prototype.hasValue = function(opt_value) {
		var value = opt_value || this.ngModelCtrl.$viewValue;

		return (value !== undefined && value !== null && value.toString() !== "NaN" && value !== "");
	};

})();
