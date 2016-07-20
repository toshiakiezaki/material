angular.module('material.components.table').directive('mdBody', function() {

  function controller() {
  }

  function compile(tElement) {
    tElement.addClass('md-body');
  }

  return  {
    bindToController: true,
    controller: controller,
    compile: compile,
    controllerAs: '$mdBody',
    require: ['mdHead', '^^mdTable'],
    restrict: 'E'
  };
});

