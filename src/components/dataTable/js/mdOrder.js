angular.module('material.components.table').directive('mdOrder', ['$mdUtil', function($mdUtil) {

  function controller() {
  }

  function link($scope, $element, $attrs, $ctrls) {
    var self = $ctrls[0],
        head = $ctrls[1];

    self.setOrder = function (order) {
      self.value = order;

      $mdUtil.nextTick(function () {
        $scope.$eval(self.onReorder);
      });
    };
  };

  return {
    bindToController: true,
    controller: controller,
    controllerAs: '$mdOrder',
    link: link,
    require: ['mdOrder', '^mdHead'],
    restrict: 'A',
    scope: {
      value: '=mdOrder',
      onReorder: '&?mdOnReorder'
    }
  };
}]);