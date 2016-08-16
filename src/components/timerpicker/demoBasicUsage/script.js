angular.module('timerpickerBasicUsage', ["ngMaterial", "ngMessages"]).controller("AppCtrl", function($scope) {

	var myTime = new Date();
	myTime.setHours(8);
	myTime.setMinutes(0);
	myTime.setSeconds(0);
	$scope.myTime = myTime;

	var minTime = new Date();
	minTime.setHours(8);
	minTime.setMinutes(0);
	minTime.setSeconds(0);
	$scope.minTime = minTime;

	var maxTime = new Date();
	maxTime.setHours(18);
	maxTime.setMinutes(0);
	maxTime.setSeconds(0);
	$scope.maxTime = maxTime;

	$scope.onlyBusinessHoursPredicate = function(time) {
		return (time >= this.minTime && time <= this.maxTime);
	};

});