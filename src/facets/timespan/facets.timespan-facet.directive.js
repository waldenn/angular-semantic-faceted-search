(function() {
    'use strict';

    /**
    * @ngdoc directive
    * @name seco.facetedSearch.directive:secoTimespanFacet
    * @restrict 'E'
    * @element ANY
    * @description
    * A facet for selecting date ranges.
    *
    * Does not make any SPARQL queries, just generates SPARQL triple patterns
    * out of the selected dates for other facets to use.
    *
    * Currently only supports values of the type <http://www.w3.org/2001/XMLSchema#date>.
    *
    * @param {Object} options The configuration object with the following structure:
    * - **facetId** - `{string}` - A friendly id for the facet.
    *   Should be unique in the set of facets, and should be usable as a SPARQL variable.
    * - **name** - `{string}` - The title of the facet. Will be displayed to end users.
    * - **startPredicate** - `{string}` - The predicate or property path that defines
    *   the start date of the date range.
    * - **endPredicate** - `{string}` - The predicate or property path that defines
    *   the end date of the date range.
    * - **[min]** - `{Date}` - The earliest selectable date.
    * - **[max]** - `{Date}` - The latest selectable date.
    * - **[enabled]** `{boolean}` - Whether or not the facet is enabled by default.
    *   If undefined, the facet will be disabled by default.
    */
    angular.module('seco.facetedSearch')
    .directive('secoTimespanFacet', timespanFacet);

    function timespanFacet() {
        return {
            restrict: 'E',
            scope: {
                options: '='
            },
            controller: 'TimespanFacetController',
            controllerAs: 'vm',
            templateUrl: 'src/facets/timespan/facets.timespan-facet.directive.html'
        };
    }
})();
