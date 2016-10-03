'use strict';

angular.module('material.components.table').directive('mdPagination', function() {

  function compile(tElement) {
    tElement.addClass('md-pagination');
  }

  function Controller($attrs, $mdUtil, $scope, $http) {
    var self = this;
    var defaultLabel = {
      page: 'Page:',
      rowsPerPage: 'Rows per page:',
      of: 'of'
    };

    if (self.limitOptions) {
      self.limit = self.limitOptions ? self.limitOptions[0] : 5;
    }

    self.label = angular.copy(defaultLabel);

    function isPositive(number) {
      return parseInt(number, 10) > 0;
    }

    self.eval = function (expression) {
      return $scope.$eval(expression);
    };

    self.first = function () {
      self.page = 1;
      self.getPageData();
    };

    self.hasNext = function () {
      return self.page * self.limit < self.total;
    };

    self.hasPrevious = function () {
      return self.page > 1;
    };

    self.last = function () {
      self.page = self.pages();
      self.getPageData();
    };

    self.max = function () {
      return self.hasNext() ? self.page * self.limit : self.total;
    };

    self.min = function () {
      return isPositive(self.total) ? self.page * self.limit - self.limit + 1 : 0;
    };

    self.next = function () {
      self.page++;
      self.getPageData();
    };

    self.onPaginationChange = function () {
      if(angular.isFunction(self.onPaginate)) {
        $mdUtil.nextTick(function () {
          self.onPaginate(self.page, self.limit);
        });
      }
    };

    self.pages = function () {
      return isPositive(self.total) ? Math.ceil(self.total / (isPositive(self.limit) ? self.limit : 1)) : 1;
    };

    self.previous = function () {
      self.page--;
      self.getPageData();
    };

    self.getPageData = function() {
      var self = this;

      if (this.urlFind !== null && 
            this.urlFind !== undefined && 
            this.urlFind.trim() !== '') {
        $http({
          method: 'POST',
          url: self.urlFind,
          responseType: 'json',
          data: {
            page: self.page,
            limit: self.limit,
            search: self.search,
            orderBy: self.order
          }
        }).then(function success(response) {
          if (response) {
            self.tableData = response.data.page;
            self.total = response.data.total;

            self.onPaginationChange();
          } else {
            console.error('Invalid Response!');
          }
        }, function error(response) {
          console.error(response);
        });
      } else {
        self.onPaginationChange();
      }
    };

    self.showBoundaryLinks = function () {
      return $attrs.mdBoundaryLinks === '' || self.boundaryLinks;
    };

    self.showPageSelect = function () {
      return $attrs.mdPageSelect === '' || self.pageSelect;
    };

    self.showLimitSelect = function () {
      return $attrs.mdLimitSelect === '' || self.limitSelect;
    };

    $scope.$watch('$pagination.limit', function (newValue, oldValue) {
      if(isNaN(newValue) || isNaN(oldValue) || newValue === oldValue) {
        return;
      }

      // find closest page from previous min
      self.page = Math.floor(((self.page * oldValue - oldValue) + newValue) / (isPositive(newValue) ? newValue : 1));
      self.getPageData();
    });

    $attrs.$observe('mdLabel', function (label) {
      angular.extend(self.label, defaultLabel, $scope.$eval(label));
    });

    $scope.$watch('$pagination.total', function (newValue, oldValue) {
      if(isNaN(newValue) || newValue === oldValue) {
        return;
      }

      if(self.page > self.pages()) {
        self.last();
      }
    });

    $scope.$watch(function() {
      return self.order;
    }, function(newValue, oldValue) {
      self.getPageData();
    });
  }

  Controller.$inject = ['$attrs', '$mdUtil', '$scope', '$http'];

  return {
    bindToController: {
      boundaryLinks: '=?mdBoundaryLinks',
      disabled: '=ngDisabled',
      limitSelect: '=mdLimitSelect',
      limit: '=mdLimit',
      page: '=mdPage',
      pageSelect: '=?mdPageSelect',
      onPaginate: '=?mdOnPaginate',
      limitOptions: '=?mdLimitOptions',
      total: '@mdTotal',
      order: '=?mdOrder',
      urlFind: '=?mdUrlFind',
      tableData: '=?mdTableData'
    },
    compile: compile,
    controller: Controller,
    controllerAs: '$pagination',
    restrict: 'E',
    templateUrl: 'md-pagination.html'
  };
});

