angular.module('material.components.table').directive('mdAlign', ['$mdUtil', function($mdUtil) {

  function link($scope, $element, $attrs) {
    $attrs.$observe('mdAlign', function (align) {
      $element.data('align', align);
    });
  }

  return  {
    link: link,
    require: ['mdCell', '^^mdHead'],
    restrict: 'A'
  };
}]);