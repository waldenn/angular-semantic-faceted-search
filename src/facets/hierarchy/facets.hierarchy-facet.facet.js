/*
* Facet for selecting a simple value.
*/
(function() {
    'use strict';

    angular.module('seco.facetedSearch')

    .factory('HierarchyFacet', HierarchyFacet);

    /* ngInject */
    function HierarchyFacet(_, BasicFacet) {

        HierarchyFacetConstructor.prototype = Object.create(BasicFacet.prototype);

        HierarchyFacetConstructor.prototype.getSelectedValue = getSelectedValue;
        HierarchyFacetConstructor.prototype.getConstraint = getConstraint;
        HierarchyFacetConstructor.prototype.getTriplePattern = getTriplePattern;
        HierarchyFacetConstructor.prototype.buildQueryTemplate = buildQueryTemplate;
        HierarchyFacetConstructor.prototype.buildQuery = buildQuery;
        HierarchyFacetConstructor.prototype.getHierarchyClasses = getHierarchyClasses;

        return HierarchyFacetConstructor;

        function HierarchyFacetConstructor(options) {

            var queryTemplate =
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +
            ' SELECT DISTINCT ?cnt ?facet_text ?value WHERE {' +
            ' { ' +
            '  { ' +
            '   SELECT DISTINCT (count(DISTINCT ?s) as ?cnt) { ' +
            '    <OTHER_SELECTIONS> ' +
            '   } ' +
            '  } ' +
            '  BIND("<NO_SELECTION_STRING>" AS ?facet_text) ' +
            ' } UNION ' +
            '  {' +
            '   SELECT DISTINCT ?cnt ?value ?facet_text {' +
            '    {' +
            '     SELECT DISTINCT (count(DISTINCT ?s) as ?cnt) ?value ?class {' +
            '      VALUES ?class { ' +
            '       <HIERARCHY_CLASSES> ' +
            '      } ' +
            '      ?value <PROPERTY> ?class . ' +
            '      ?h <PROPERTY> ?value . ' +
            '      ?s <ID> ?h .' +
            '      <OTHER_SELECTIONS> ' +
            '     } GROUP BY ?class ?value ' +
            '    } ' +
            '    FILTER(BOUND(?value))' +
            '    <LABEL_PART> ' +
            '    BIND(COALESCE(?lbl, STR(?value)) as ?label)' +
            '    BIND(IF(?value = ?class, ?label, CONCAT("-- ", ?label)) as ?facet_text)' +
            '    BIND(IF(?value = ?class, 0, 1) as ?order)' +
            '   } ORDER BY ?class ?order ?facet_text' +
            '  } ' +
            ' } ';

            options.queryTemplate = options.queryTemplate || queryTemplate;

            BasicFacet.call(this, options);

            this.selectedValue = {};

            // Initial value
            var constVal = options.initialConstraints.facets[this.facetId];
            if (constVal && constVal.value) {
                this._isEnabled = true;
                this.selectedValue = { value: constVal.value };
            }

            var triplePatternTemplate =
            ' VALUES ?class { ' +
            '  <HIERARCHY_CLASSES> ' +
            ' } ' +
            ' ?hv <PROPERTY> ?class . ' +
            ' ?h <PROPERTY> ?hv . ' +
            ' ?s <ID> ?h .';

            this.triplePatternTemplate = this.buildQueryTemplate(triplePatternTemplate);
        }

        function buildQueryTemplate(template) {
            var templateSubs = [
                {
                    placeHolder: /<ID>/g,
                    value: this.predicate
                },
                {
                    placeHolder: /<PROPERTY>/g,
                    value: this.config.hierarchy
                },
                {
                    placeHolder: /<LABEL_PART>/g,
                    value: this.config.labelPart
                },
                {
                    placeHolder: /<NO_SELECTION_STRING>/g,
                    value: this.config.noSelectionString
                }
            ];

            templateSubs.forEach(function(s) {
                template = template.replace(s.placeHolder, s.value);
            });
            return template;
        }

        function getHierarchyClasses() {
            return this.config.classes || [];
        }

        function getTriplePattern() {
            var res = this.triplePatternTemplate
                .replace(/<HIERARCHY_CLASSES>/g, this.getHierarchyClasses().join(' '));

            return res;
        }

        function getConstraint() {
            if (!this.getSelectedValue()) {
                return;
            }
            var res = this.triplePatternTemplate
                .replace(/<HIERARCHY_CLASSES>/g, this.getSelectedValue());

            return res;
        }

        function getSelectedValue() {
            var val;
            if (this.selectedValue) {
                val = this.selectedValue.value;
            }
            return val;
        }

        // Build the facet query
        function buildQuery(constraints) {
            constraints = constraints || [];
            var query = this.queryTemplate
                .replace(/<OTHER_SELECTIONS>/g, this.getOtherSelections(constraints))
                .replace(/<HIERARCHY_CLASSES>/g,
                    this.getSelectedValue() || this.getHierarchyClasses().join(' '))
                .replace(/<PREF_LANG>/g, this.getPreferredLang());

            return query;
        }
    }
})();
