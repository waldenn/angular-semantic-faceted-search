(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facets')
    .factory('FacetSelectionFormatter', function (_) {
        return function( facets ) {

            this.parseFacetSelections = parseFacetSelections;

            function parseFacetSelections( facetSelections ) {
                var result = '';
                var i = 0;
                _.forOwn( facetSelections, function( val, key ) {
                    if (val && val.value && facets[key].type === 'text') {
                        // Free-text facet
                        var textVar = '?text' + i++;
                        result = result + '?s ' + key + ' ' + textVar;
                        var words = val.value.replace(/[,.-_*'\\/]/g, '');

                        words.split(' ').forEach(function(word) {
                            result = result + ' FILTER(REGEX(' + textVar + ', "' + word + '", "i")) ';
                        });
                    } else if (val && val.value) {
                        // Basic facet
                        result = result + '?s ' + key + ' ' + val.value + ' . ';
                    }
                });
                return result;
            }
        };
    });
})();
