angular.module('uploaderBasicUsage', ['ngMaterial', 'ngMessages']).controller('AppCtrl', function($scope) {
	$scope.upload = {
		file: undefined,
		fileZip: undefined,
		supportedFormatsZip: "zip",
		url: "upload"
	};
});
