'use strict';

angular.module('zoom-template.html', []).run(['$templateCache', function($templateCache) {
	$templateCache.put('zoom-template.html',
		'<div class="md-zoom-input-container" ng-class="{\'md-zoom-focused\': ctrl.isFocused}">' + 
		'	<input class="md-zoom-input" aria-haspopup="true" ' + 
		'		ng-focus="ctrl.setFocused(true)" ng-blur="ctrl.setFocused(false)"/>' + 
		'	<md-button type="button" md-no-ink class="md-zoom-triangle-button md-icon-button" ng-click="ctrl.openZoomOptions($event)" ' + 
		'	aria-label="Open options container">' + 
		'		<div class="md-zoom-expand-triangle"></div>' + 
		'	</md-button>' + 
		'	<md-button type="button" md-no-ink class="md-zoom-other-button md-icon-button" ng-click="ctrl.openZoomDialog($event)"' + 
		'	aria-label="Open options dialog">' + 
		'		<div class="md-zoom-expand-other">...</div>' + 
		'	</md-button>' + 
		'</div>' + 

		// This pane will be detached from here and re-attached to the document body.
		'<md-zoom-options class="md-zoom-pane md-whiteframe-z1">' + 
		'	<ul class="md-zoom-options-container">' + 
		'		<li ng-repeat="option in ctrl.getFiltredOptions()"' + 
		'		ng-class="{\'md-zoom-selected-option\': ctrl.ngModelCtrl.$viewValue[ctrl.keyParam] === option[ctrl.keyParam], ' + 
		'		\'md-zoom-focused-option\': ctrl.indexFocused === $index}"' + 
		'		ng-click="ctrl.selectOption(option)" title="{{option[ctrl.nameParam]}}">' + 
		'			{{option[ctrl.nameParam]}}' + 
		'		</li>' + 
		'		<md-button md-no-ink class="md-primary" ng-click="ctrl.addOption()" ng-show="ctrl.onAdd">' + 
		'			<md-icon class="material-icons">add</md-icon> Adicionar' + 
		'		</md-button>' + 
		'	</ul>' + 
		'</md-zoom-options>'
	);
}]);

angular.module('zoom-dialog-template.html', []).run(['$templateCache', function($templateCache) {
	$templateCache.put('zoom-dialog-template.html',
		'<md-zoom-dialog-container>' + 
			'<div class="md-dialog-content">' + 
				'<md-input-container>' + 
					'<label>Buscar</label>' + 
					'<input ng-model="ctrl.filterBy">' + 
				'</md-input-container>' + 

				'<md-pagination md-limit="ctrl.fetchSize" md-page="ctrl.pagination.page" md-total="{{(ctrl.options | filter: ctrl.filterBy).length}}" md-page-select="ctrl.pagination.select" md-boundary-links="ctrl.pagination.boundaryLinks"></md-pagination>' + 

				'<md-table-container>' + 
					'<md-table md-table-data="ctrl.options" multiple="false" md-row-select="true" ng-model="ctrl.gridSelection" md-progress="promise">' + 
						'<md-head md-order="ctrl.orderBy">' + 
							'<md-row>' + 
								'<md-column md-order-by="id">' + 
									'<span>ID</span>' + 
								'</md-column>' + 
								'<md-column md-order-by="name">' + 
									'<span>Nome</span>' + 
								'</md-column>' + 
							'</md-row>' + 
						'</md-head>' + 
						'<md-body>' + 
							'<md-row ng-repeat="option in ctrl.options | filter: ctrl.filterBy | orderBy: ctrl.orderBy | limitTo: ctrl.fetchSize : (ctrl.pagination.page - 1) * ctrl.fetchSize" md-select="option" md-on-select="ctrl.selectOption" md-auto-select="true">' + 
								'<md-cell>{{option[ctrl.keyParam]}}</md-cell>' + 
								'<md-cell>{{option[ctrl.nameParam]}}</md-cell>' + 
							'</md-row>' + 
						'</md-body>' + 
					'</md-table>' + 
				'</md-table-container>' + 
			'</div>' + 
		'</md-zoom-dialog-container>'
	);
}]);

angular.module('zoom.templates', ['zoom-template.html', 'zoom-dialog-template.html']);