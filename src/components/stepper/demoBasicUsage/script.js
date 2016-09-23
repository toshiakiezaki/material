angular.module('stepperBasicUsage', ["ngMaterial", "ngMessages"]).controller("AppCtrl", function($scope) {
	$scope.currentStep = 0;
	$scope.progress = 0;

	$scope.steps = [{
		label: "Step 1",
		description: "Content Step 1",
		completed: false
	}, {
		label: "Step 2",
		description: "Content Step 2",
		completed: false
	}, {
		label: "Step 3",
		description: "Content Step 3",
		completed: false
	}, {
		label: "Step 4",
		description: "Content Step 4",
		completed: false
	}, {
		label: "Step 5",
		description: "Content Step 5",
		completed: false
	}, {
		label: "Finish",
		description: "Content Step 6",
		completed: false
	}];

	$scope.changeStep = function(option) {
		var scope = $scope;

		if (scope.progress === 0) {
			scope.progress = 10;
		}

		setTimeout(function() {
			scope.progress += 10;

			if (scope.progress === 100) {
				scope.progress = 0;

				if (option === "prev") {
					scope.currentStep--;
				} else if (option === "next") {
					scope.currentStep++;
				}

				scope.$digest();
			} else {
				scope.$digest();
				scope.changeStep(option);
			}

		}, (scope.currentStep * 100));
	};

	$scope.$watch(function() {
		return $scope.currentStep;
	}, function(currentStep, previousStep) {
		if (currentStep > previousStep) {
			$scope.steps[previousStep]["completed"] = true;
		}
	});
});