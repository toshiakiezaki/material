(function() {
	'use strict';

	angular.module('material.components.uploader')
		.directive('mdUploader', uploaderDirective);

	/**
	 * @ngdoc directive
	 * @name mdUploader
	 * @module material.components.uploader
	 *
	 * @usage
	 * <hljs lang="html">
	 *   <md-uploader ng-model="file"></md-uploader>
	 * </hljs>
	 *
	 */
	function uploaderDirective() {
		return {
			template: function(tElement, tAttrs) {
				var templateForInput = '' + 
				'<div class="md-uploader-input-container" ng-class="{\'md-uploader-focused\': ctrl.isFocused}">' + 
				'	<a md-autofocus href="#" class="md-uploader-text" ng-focus="ctrl.setFocused(true)" ng-blur="ctrl.setFocused(false)"></a>' + 
				'	<md-button class="md-uploader-button md-icon-button" type="button" ' + 
				'	  tabindex="-1" aria-hidden="true" title="{{ctrl.placeholder}}">' +
				'		<md-icon class="material-icons">file_upload</md-icon>' + 
				'		<input type="file" ng-focus="ctrl.setFocused(true)" ng-blur="ctrl.setFocused(false)" ' + (tAttrs.hasOwnProperty("mdMultiple") ? 'multiple' : '') + ' />' + 
				'	</md-button>' + 
				'</div>';

				if (!tAttrs.hasOwnProperty(DIRECTIVE_NAME)) {
					return templateForInput;
				}
			},
			require: ['ngModel', 'mdUploader', '?^form'],
			scope: {
				placeholder: '@mdPlaceholder',
				url: '=mdUrlUpload',
				supportedFormats: '=mdSupportedFormats',
				isMultiple: '=?mdMultiple'
			},
			controller: UploaderCtrl,
			controllerAs: 'ctrl',
			bindToController: true,
			link: function(scope, element, attr, controllers) {
				var ngModelCtrl = controllers[0];
				var mdUploaderCtrl = controllers[1];

				mdUploaderCtrl.configureNgModel(ngModelCtrl, element);
			}
		};
	}

	/** Class applied to the container if the file is invalid. */
	var INVALID_CLASS = 'md-uploader-invalid';

	/** */
	var DIRECTIVE_NAME = 'mdUploader';

	/**
	 * Controller for md-uploader.
	 * 
	 * @ngInject @constructor
	 */
	function UploaderCtrl($scope, $element, $attrs, $mdTheming, $compile, $$mdUploaderUtils) {

		/** @final */
		this.$compile = $compile;

		/** @final */
		this.$$mdUploaderUtils = $$mdUploaderUtils;

		/** @type {!angular.NgModelController} */
		this.ngModelCtrl = null;

		/** @type {HTMLInputElement} */
		this.inputElement = $element[0].querySelector('.md-uploader-text');

		/** @final {!angular.JQLite} */
		this.ngInputElement = angular.element(this.inputElement);

		/** @type {HTMLElement} */
		this.inputContainer = $element[0].querySelector('.md-uploader-input-container');

		/** @type {HTMLElement} */
		this.inputFileContainer = null;

		/** @type {HTMLElement} */
		this.mdInputContainer = null;

		/** @final {!angular.JQLite} */
		this.$element = $element;

		/** @final {!angular.Attributes} */
		this.$attrs = $attrs;

		/** @final {!angular.Scope} */
		this.$scope = $scope;

		/** @type {boolean} */
		this.isDisabled = ($element[0].disabled || angular.isString($attrs.disabled));

		/** @type {boolean} */
		this.isFocused = false;

		/** @type {boolean} */
		this.isDroppable = $attrs.hasOwnProperty(DIRECTIVE_NAME);

		/** @type {boolean} */
		this.isDropping = false;

		/** @type {object} */
		this.files = undefined;

		/** @type {boolean} */
		this.isMultiple = this.$attrs.hasOwnProperty("mdMultiple");

		/** @type {boolean} */
		this.isLoaded = false;

		// Unless the user specifies so, the uploader should not be a tab stop.
		// This is necessary because ngAria might add a tabindex to anything with an ng-model
		// (based on whether or not the user has turned that particular feature on/off).
		if (!$attrs.tabindex) {
			$element.attr('tabindex', '-1');
		}

		$mdTheming($element);

		if (this.isDroppable) {
			this.buildDroppableStructure();
		} else {
			this.installPropertyInterceptors();
		}
	}

	/**
	 * Sets up the controller's reference to ngModelController.
	 * @param {!angular.NgModelController} ngModelCtrl
	 */
	UploaderCtrl.prototype.configureNgModel = function(ngModelCtrl, mdElement) {
		this.ngModelCtrl = ngModelCtrl;
		this.attachWatcher();

		if (!this.isDroppable && mdElement.parent()[0].nodeName == "MD-INPUT-CONTAINER") {
			this.mdInputContainer = angular.element(mdElement.parent()[0]);
		}

		var self = this;
		ngModelCtrl.$render = function() {
			var file = self.ngModelCtrl.$viewValue;

			if (!self.isDroppable) {
				self.inputFileContainer = self.inputContainer.querySelector('input[type="file"]');
			}

			self.setDisabled(self.isDisabled);
			self.installInterceptors();
		};
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.buildDroppableStructure = function() {
		this.contentDroppableInfo = angular.element('' + 
			'<div ng-show="ctrl.isDropping" class="content-droppable-info">' + 
			'	<span class="content-droppable-icon material-icons">' + 
			'		file_upload' + 
			'		<span></span>' + 
			'	</span>' + 
			'	<div class="content-droppable-text"> ' + 
			'		<label>Drop Here!</label>' + 
			'	</div>' + 
			'</div>'
		);

		this.$element.append(this.contentDroppableInfo);
		this.$compile(this.contentDroppableInfo)(this.$scope);

		var contentElementDropped = angular.element('' + 
		'<div ' + (this.isMultiple ? 'ng-repeat="file in ctrl.files track by $index"' : 'ng-if="ctrl.files"') + ' class="md-file-content" title="{{' + (this.isMultiple ? 'file.name' : 'ctrl.files.name') + '}}">' + 
		'	<md-icon class="material-icons">insert_drive_file</md-icon>' + 
		'	<label ng-bind="ctrl.$$mdUploaderUtils.getFileName(' + (this.isMultiple ? 'file' : 'ctrl.files') + ')"></label>' + 
		'</div>');

		this.$element.append(contentElementDropped);
		this.$compile(contentElementDropped)(this.$scope);
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.installPropertyInterceptors = function() {
		var self = this;

		Object.defineProperty(self, 'placeholder', {
			get: function() {
				return self.inputElement.placeholder;
			},
			set: function(value) {
				self.inputElement.placeholder = value || '';
			}
		});
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.attachWatcher = function() {
		var self = this;

		self.$scope.$watch(function() {
			return self.ngModelCtrl.$viewValue;
		}, function(newFiles) {
			var isLoaded = self.isLoaded;
			self.isLoaded = true;

			if (newFiles) {
				if (self.isMultiple) {
					if (!newFiles.length) {
						newFiles = [newFiles];
					}

					var oldFiles = self.files;
					if (oldFiles) {
						newFiles = oldFiles.concat(self.convertFileListToList(newFiles));
					} else {
						newFiles = self.convertFileListToList(newFiles);
					}
				} else if (!self.isMultiple && newFiles.length) {
					newFiles = newFiles[0];
				}

				var filtred = self.$$mdUploaderUtils.filterFiles(newFiles, self.supportedFormats, self.isMultiple);
				if (filtred.changed) {
					self.files = undefined;
					self.ngModelCtrl.$setViewValue(filtred.files);
				} else {
					self.addNewFiles(filtred.files, isLoaded);
				}
			} else {
				self.addNewFiles(newFiles, isLoaded);
			}
		});
	};

	/**
	 * Sets whether the uploader is disabled.
	 * @param {boolean} isDisabled
	 */
	UploaderCtrl.prototype.setDisabled = function(isDisabled) {
		this.isDisabled = isDisabled;

		if (!this.isDroppable) {
			this.inputFileContainer.disabled = isDisabled;
		}
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.setFocused = function(isFocused) {
		if (!this.isDisabled) {
			if (isFocused) {
				this.mdInputContainer && this.mdInputContainer.addClass("md-input-focused");
			} else {
				this.mdInputContainer && this.mdInputContainer.removeClass("md-input-focused");
			}

			this.isFocused = isFocused;

			var self = this;
			setTimeout(function() {
				self.updateValueState();
			}, 20);
		}
	};

	/**
	 * Sets the custom ngModel.$error flags to be consumed by ngMessages. Flags are:
	 *   - valid: whether the entered text input is a valid file
	 *
	 * The 'required' flag is handled automatically by ngModel.
	 *
	 * @param {Object=} opt_file File to check. If not given, defaults to the uploader's model value.
	 */
	UploaderCtrl.prototype.updateErrorState = function() {
		// Clear any existing errors to get rid of anything that's no longer relevant.
		this.clearErrorState();

		this.ngModelCtrl.$setValidity('valid', (this.files !== null));

		// TODO(jelbourn): Change this to classList.toggle when we stop using PhantomJS in unit tests
		// because it doesn't conform to the DOMTokenList spec.
		// See https://github.com/ariya/phantomjs/issues/12782.
		if (!this.ngModelCtrl.$valid) {
			var target;

			if (this.isDroppable) {
				target = this.$element[0];
			} else {
				target = this.inputContainer;
			}

			target.classList.add(INVALID_CLASS);
		}
	};

	/** Clears any error flags set by `updateErrorState`. */
	UploaderCtrl.prototype.clearErrorState = function() {
		var target;

		if (this.isDroppable) {
			target = this.$element[0];
		} else {
			target = this.inputContainer;
		}

		target.classList.remove(INVALID_CLASS);
		this.ngModelCtrl.$setValidity('valid', true);
	};

	/**
	 * Event's for uploader droppable
	 */
	UploaderCtrl.prototype.installInterceptors = function() {
		var self = this;
		if (self.isDroppable) {
			self.contentDroppableInfo.on("dragover", function(event) {
				self.eventDragListener(event);
			});

			self.contentDroppableInfo.on("dragleave", function(event) {
				self.eventDragListener(event);
			});

			self.$element.on("dragover", function(event) {
				self.eventDragListener(event);
			});

			self.$element.on("dragleave", function(event) {
				self.eventDragListener(event);
			});

			self.$element.on("drop", function(event) {
				event.stopPropagation();
				event.preventDefault();

				self.receiveFiles(event.dataTransfer.files);
			});
		} else {
			self.inputFileContainer.onchange = function(event) {
				self.receiveFiles(event.target.files);
			};
		}
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.eventDragListener = function(event) {
		event.stopPropagation();
		event.preventDefault();

		this.isDropping = (event.type == 'dragover');
		if (this.isDropping) {
			this.positionDroppableInfo();
		}

		this.$scope.$digest();
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.receiveFiles = function(newFiles) {
		if (newFiles) {
			this.ngModelCtrl.$setViewValue(newFiles);

			if (this.isDroppable) {
				this.isDropping = false;
				this.$scope.$digest();
			}
		}
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.convertFileListToList = function(fileList) {
		var converted = [];
		for (var f = fileList.length; f--;) {
			converted.unshift(fileList[f]);
		}

		return converted;
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.addNewFiles = function(newFiles, uploadFiles) {
		this.files = newFiles;

		if (!this.isDroppable) {
			var text;
			if (newFiles && !this.isDisabled) {
				text = this.$$mdUploaderUtils.getFileName(newFiles, this.isMultiple);
			} else {
				text = this.placeholder;
			}

			this.inputElement.textContent = text;
			this.inputElement.setAttribute('title', text);

			this.updateValueState();
		}

		this.updateErrorState();

		if (uploadFiles && this.files) {
			this.prepareFilesToUpload();
		}
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.updateValueState = function(isOver) {
		if (this.files && !this.isDisabled) {
			this.inputElement && this.inputElement.classList.add('md-input-has-value');
			this.mdInputContainer && this.mdInputContainer.addClass('md-input-has-value');
		} else {
			this.inputElement && this.inputElement.classList.remove('md-input-has-value');
			this.mdInputContainer && this.mdInputContainer.removeClass('md-input-has-value');
		}
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.positionDroppableInfo = function() {
		var container = this.$element[0];
		var containerBoundingRect = container.getBoundingClientRect();
		var contentDroppableInfo = this.contentDroppableInfo[0];

		contentDroppableInfo.style.top = ((container.offsetHeight + container.offsetTop - 165) + "px");
		contentDroppableInfo.style.left = (((container.offsetWidth / 2) + container.offsetLeft - 200) + "px");
	};

	/**
	 * 
	 */
	UploaderCtrl.prototype.prepareFilesToUpload = function() {
		var filesToUpload = new FormData();

		if (this.isMultiple && this.files.length) {
			for (var f = 0; f < this.files.length; f++) {
				filesToUpload.append(('file' + f), this.files[f]);
			}
		} else {
			filesToUpload.append('file', this.files);
		}

		this.$$mdUploaderUtils.uploadFiles(this.url, filesToUpload);
	};

})();