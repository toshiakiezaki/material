(function() {
	'use strict';

	/**
	 * Utility for performing date calculations to facilitate operation of the clock and
	 * timepicker.
	 */
	angular.module('material.components.timepicker').factory('$$mdTimeUtil', function() {

		return {
			isValidTime: isValidTime,
			isSameTime: isSameTime,
			isBetween: isBetween,
			instanceTimeIgnoreDate: instanceTimeIgnoreDate
		};

		/**
		 * Checks whether a time is valid.
		 * @param {Date} date
		 * @return {boolean} Whether the time is a valid Date.
		 */
		function isValidTime(time) {
			return time != null && time.getTime && !isNaN(time.getTime());
		};

		/**
		 * Gets whether two time are the same time. (not not necesarily the same date).
		 * @param {Date} t1
		 * @param {Date} t2
		 * @returns {boolean}
		 */
		function isSameTime(t1, t2) {
			return t1.getHours() == t2.getHours() && t1.getMinutes() == t2.getMinutes()
					&& t1.getSeconds() == t2.getSeconds() && t1.getMilliseconds() == t2.getMilliseconds();
		};

		function instanceTimeIgnoreDate(time) {
			if (this.isValidTime(time)) {
				var newTime = new Date();
				newTime.setHours(time.getHours());
				newTime.setMinutes(time.getMinutes());
				newTime.setSeconds(time.getSeconds());
				newTime.setMilliseconds(0);
				return newTime;
			}

			return null;
		};

		function isBetween(time, start, end) {
			if (this.isValidTime(start) && this.isValidTime(end)) {
				return time >= start && time <= end;
			} else if (this.isValidTime(start)) {
				return time >= start;
			} else if (this.isValidTime(end)) {
				return time <= end;
			}

			return true;
		};

	});

})();
