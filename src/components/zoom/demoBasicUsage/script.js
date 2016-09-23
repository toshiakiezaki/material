angular.module('zoomBasicUsage', ["ngMaterial", "ngMessages"]).controller("AppCtrl", function($scope) {
	var options = [
		{id: 1, name: "Andre"}, {id: 2, name: "Toshiaki"}, 
		{id: 3, name: "Lucas"}, {id: 4, name: "Rene"}, 
		{id: 5, name: "Fernando"}, {id: 6, name: "Michele"},
		{id: 7, name: "Hisrael"}
	];

	$scope.zoom = {
		selected: options[0],
		options: options,
		fetchSize: 4,
		gridFields: {
			id: "ID",
			name: "Name"
		}
	};

	$scope.logSelect = function() {
		console.log("Selected: " + $scope.zoom.selected.id + "|" + $scope.zoom.selected.name);
	};

	$scope.addNewOption = function(name) {
		var newOption = {
			id: $scope.zoom.options.length + 1,
			name: name
		}

		$scope.zoom.options.push(newOption);
		$scope.zoom.selected = newOption;
	};

	$scope.dependency = {
		selectedGroup: null,
		selectedAnimal: null,
		groups: [
			{
				id: 1, 
				name: "Mamiferos", 
				animals: [
					{
						id: 1,
						name: "Capivara"
					},
					{
						id: 2,
						name: "Dromedario"
					},
					{
						id: 3,
						name: "Esquilo"
					},
					{
						id: 4,
						name: "Furao"
					},
					{
						id: 5,
						name: "Gnu"
					}
				]
			},
			{
				id: 2, 
				name: "Aves", 
				animals: [
					{
						id: 1,
						name: "Dodo"
					},
					{
						id: 2,
						name: "Ema"
					},
					{
						id: 3,
						name: "Quero-quero"
					}
				]
			},
			{
				id: 3, 
				name: "Insetos", 
				animals: [
					{
						id: 1,
						name: "Mosca"
					},
					{
						id: 2,
						name: "Joaninha"
					},
					{
						id: 3,
						name: "Grilo"
					},
					{
						id: 4,
						name: "Borboleta"
					}
				]
			}
		]
	};

	$scope.selectDefaultDependency = function() {
		$scope.dependency.selectedAnimal = $scope.dependency.selectedGroup.animals[0];
	};
});