(function() {
	'use strict';

	angular.module('material.components.timepicker').factory('$$mdTimeLocale', function($locale) {

		return {
			formatTime: defaultFormatTime,
			parseTime: defaultParseTime,
			isTimeComplete: defaultIsTimeComplete,
			isFullTime: isFullTime,
			msgClock: defaultMsgClock,
			msgOpenClock: defaultMsgOpenClock
		};

		/**
		 * Default time-to-string formatting function.
		 * @param {!Date} time
		 * @returns {string}
		 */
		function defaultFormatTime(time) {
			if (!time) {
				return '';
			}

			return time.toLocaleTimeString();
		};

		/**
		 * Default string-to-time parsing function.
		 * @param {string} timeString
		 * @returns {!Date}
		 */
		function defaultParseTime(time) {
			if (time instanceof Object) {
				time = [time.hour, time.minute, time.second + " " + time.period];
			} else {
				time = time.split(":");
			}

			var hour = Number(time[0] || 0);
			var minute = Number(time[1] || 0);

			var second = 0;
			if (time[2]) {
				var isPM = time[2].replace(/[0-9]+ /g, "").toLowerCase() == "pm";

				second = Number(time[2].replace(/[^0-9]+/g, ""));

				if (!isFullTime()) {
					if ((isPM && hour < 12) ||
						(!isPM && hour == 12)) {
						hour += 12;
					}
				}
			}

			time = new Date();
			time.setHours(hour);
			time.setMinutes(minute);
			time.setSeconds(second);
			time.setMilliseconds(0);
			return time;
		};

		/**
		 * Default function to determine whether a string makes sense to be
		 * parsed to a Date object.
		 *
		 * This is very permissive and is just a basic sanity check to ensure that
		 * things like single integers aren't able to be parsed into dates.
		 * @param {string} timeString
		 * @returns {boolean}
		 */
		function defaultIsTimeComplete(timeString) {
			timeString = timeString.trim();

			// Looks for two or three chunks of content separated by delimiters.
			var re = /^(([a-zA-Z]{3,}|[0-9]{1,4})([ \.,]+|[\/\-])){2}([a-zA-Z]{3,}|[0-9]{1,4})$/;
			return re.test(timeString);
		};

		/**
		 * Default function to determine whether to use full time
		 *
		 * @returns {boolean}
		 */
		function isFullTime() {
			var countriesWithPartialHours = ["us", "gb", "ph", "ca", "au", "nz", "in", "eg", "sa", "co", "pk", "my"];

			var countryCode = $locale.id;
			countryCode = countryCode.substring(countryCode.indexOf("-") + 1);

			return countriesWithPartialHours.indexOf(countryCode) < 0;
		};

		var defaultMsgClock = "Clock";
		var defaultMsgOpenClock = "Open clock";

	});

})();
