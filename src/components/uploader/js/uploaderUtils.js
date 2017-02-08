(function() {
	'use strict';

	angular.module('material.components.uploader').factory('$$mdUploaderUtils', function($http) {
		return {
			uploadFiles: uploadFiles,
			getFileName: getFileName,
			acceptsFile: acceptsFile,
			filterFiles: filterFiles
		};

		/**
		 *
		 */
		function uploadFiles(url, files) {
			$http.post(url, files, {
				transformRequest: angular.identity,
				headers: {
					'Content-Type': undefined
				}
			}).success(function() {
				console.info("Success to send file!");
			}).error(function() {
				console.error("Error to send file!");
			});
		};

		/**
		 *
		 */
		function getFileName(files, isMultiple) {
			this._get = function(file) {
				var name = file.name;

				return name.substr(0, name.lastIndexOf("."));
			};

			var response = "";

			if (files) {
				if (isMultiple) {
					for (var f = 0; f < files.length; f++) {
						if (response.length > 0) {
							response += ", ";
						}

						response += this._get(files[f]);
					}
				} else {
					response = this._get(files.length ? files[0] : files);
				}
			}

			return response;
		};

		/**
		 *
		 */
		function getFileFormat(file) {
			var format = file["name"].toLowerCase();

			return format.substr(format.lastIndexOf(".") + 1, format.length);
		};

		/**
		 *
		 */
		function acceptsFile(file, supportedFormats) {
			var supported = false;

			if (file && supportedFormats) {
				var fileFormat = getFileFormat(file);

				if (angular.isString(supportedFormats)) {
					if (supportedFormats.indexOf(" ") > -1) {
						supportedFormats = supportedFormats.replace(/ /g, "");
					}

					supportedFormats = supportedFormats.split(",");
				}

				for (var s = supportedFormats.length; s--;) {
					if (supportedFormats[s].toLowerCase() == fileFormat) {
						supported = true;
						break;
					}
				}
			} else {
				supported = true;
			}

			return supported;
		};

		/**
		 *
		 */
		function filterFiles(files, supportedFormats, isMultiple) {
			var filtredFiles = [];
			var isChanged = false;

			if (isMultiple) {
				for (var f = files.length; f--;) {
					if (this.acceptsFile(files[f], supportedFormats)) {
						filtredFiles.unshift(files[f]);
					} else {
						isChanged = true;
					}
				}
			} else if (this.acceptsFile(files, supportedFormats)) {
				filtredFiles.push(files);
			} else {
				isChanged = true;
			}

			filtredFiles = (filtredFiles.length == 0 ? null : (isMultiple ? filtredFiles : filtredFiles[0]))

			return {
				files: filtredFiles,
				changed: isChanged
			};
		};
	});
})();
