/*
 * facetApp module definition
 */
(function() {

    'use strict';
    angular.module('facetApp',
        ['sparql', 'facets', 'resultHandler', 'facetUrlState', 'ngTable', 'infinite-scroll'])

    .constant('_', _) // eslint-disable-line no-undef
    .constant('RESULTS_PER_PAGE', 25)
    .constant('PAGES_PER_QUERY', 1);

})();
