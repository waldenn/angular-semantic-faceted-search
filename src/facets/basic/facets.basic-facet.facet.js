
/*
* Facet for selecting a simple value.
*/
(function() {
    'use strict';

    angular.module('seco.facetedSearch')
    .factory('BasicFacet', BasicFacet);

    /* ngInject */
    function BasicFacet($q, $log, _, SparqlService, facetMapperService, NO_SELECTION_STRING) {

        BasicFacetConstructor.prototype.update = update;
        BasicFacetConstructor.prototype.getState = getState;
        BasicFacetConstructor.prototype.fetchState = fetchState;
        BasicFacetConstructor.prototype.getConstraint = getConstraint;
        BasicFacetConstructor.prototype.getTriplePattern = getTriplePattern;
        BasicFacetConstructor.prototype.getFacetUri = getFacetUri;
        BasicFacetConstructor.prototype.getName = getName;
        BasicFacetConstructor.prototype.getPredicate = getPredicate;
        BasicFacetConstructor.prototype.getPreferredLang = getPreferredLang;
        BasicFacetConstructor.prototype.isBusy = isBusy;
        BasicFacetConstructor.prototype.buildQueryTemplate = buildQueryTemplate;
        BasicFacetConstructor.prototype.buildQuery = buildQuery;
        BasicFacetConstructor.prototype.buildServiceUnions = buildServiceUnions;
        BasicFacetConstructor.prototype.buildSelections = buildSelections;
        BasicFacetConstructor.prototype.getOtherSelections = getOtherSelections;
        BasicFacetConstructor.prototype.getDeselectUnionTemplate = getDeselectUnionTemplate;
        BasicFacetConstructor.prototype.disable = disable;
        BasicFacetConstructor.prototype.enable = enable;
        BasicFacetConstructor.prototype.isLoading = isLoading;
        BasicFacetConstructor.prototype.isEnabled = isEnabled;
        BasicFacetConstructor.prototype.getSelectedValue = getSelectedValue;

        return BasicFacetConstructor;

        function BasicFacetConstructor(options) {

            /* Implementation */

            this.previousConstraints;
            this.state = {};

            var labelPart =
            ' { ' +
            '  ?value skos:prefLabel|rdfs:label [] . ' +
            '  OPTIONAL {' +
            '   ?value skos:prefLabel ?lbl . ' +
            '   FILTER(langMatches(lang(?lbl), "<PREF_LANG>")) .' +
            '  }' +
            '  OPTIONAL {' +
            '   ?value rdfs:label ?lbl . ' +
            '   FILTER(langMatches(lang(?lbl), "<PREF_LANG>")) .' +
            '  }' +
            '  OPTIONAL {' +
            '   ?value skos:prefLabel ?lbl . ' +
            '   FILTER(langMatches(lang(?lbl), "")) .' +
            '  }' +
            '  OPTIONAL {' +
            '   ?value rdfs:label ?lbl . ' +
            '   FILTER(langMatches(lang(?lbl), "")) .' +
            '  } ' +
            '  FILTER(BOUND(?lbl)) ' +
            ' }' +
            ' UNION { ' +
            '  FILTER(!ISURI(?value)) ' +
            '  BIND(STR(?value) AS ?lbl) ' +
            '  FILTER(BOUND(?lbl)) ' +
            ' } ';

            var queryTemplate =
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#> ' +
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> ' +

            ' SELECT DISTINCT ?cnt ?id ?facet_text ?value WHERE {' +
            ' { ' +
            '  { ' +
            '   SELECT DISTINCT (count(DISTINCT ?s) as ?cnt) { ' +
            '    <OTHER_SELECTIONS> ' +
            '   } ' +
            '  } ' +
            '  BIND("<NO_SELECTION_STRING>" AS ?facet_text) ' +
            '  BIND(<ID> AS ?id) ' +
            ' } UNION ' +
            '  {' +
            '   SELECT DISTINCT ?cnt ?id ?value ?facet_text { ' +
            '    {' +
            '     SELECT DISTINCT (count(DISTINCT ?s) as ?cnt) (sample(?s) as ?ss) ?id ?value {' +
            '      <SELECTIONS> ' +
            '      BIND(<ID> AS ?id) ' +
            '     } GROUP BY ?id ?value ' +
            '    } ' +
            '    FILTER(BOUND(?id)) ' +
            '    <LABEL_PART> ' +
            '    <OTHER_SERVICES> ' +
            '    BIND(COALESCE(?lbl, IF(ISURI(?value), REPLACE(STR(?value),' +
            '     "^.+/(.+?)$", "$1"), STR(?value))) AS ?facet_text)' +
            '   } ORDER BY ?id ?facet_text ' +
            '  }' +
            ' } ';

            var defaultConfig = {
                preferredLang: 'fi',
                queryTemplate: queryTemplate,
                labelPart: labelPart,
                noSelectionString: NO_SELECTION_STRING
            };

            this.config = angular.extend({}, defaultConfig, options);

            this.name = this.config.name;
            this.facetUri = this.config.facetUri;
            this.predicate = this.config.predicate;
            if (this.config.enabled) {
                this.enable();
            } else {
                this.disable();
            }

            this.endpoint = new SparqlService(this.config.endpointUrl);

            // Initial value
            var constVal = options.initialConstraints.facets[this.getFacetUri()];
            if (constVal && constVal.value) {
                this._isEnabled = true;
                this.selectedValue = { value: constVal.value };
            }

            this.queryTemplate = this.buildQueryTemplate(this.config.queryTemplate);
        }

        function update(constraints) {
            var self = this;
            $log.warn(self.getName(), constraints.constraint, self.previousConstraints);
            if (!self.isEnabled()) {
                return $q.when();
            }
            if (self.previousConstraints && _.isEqual(constraints.constraint,
                    self.previousConstraints)) {
                return $q.when();
            }
            self.previousConstraints = _.clone(constraints.constraint);

            self._isBusy = true;

            return self.fetchState(constraints).then(function(state) {
                if (!_.isEqual(self.previousConstraints, constraints.constraint)) {
                    return $q.reject('Facet state changed');
                }
                $log.warn(self.getName(), state);
                self.state = state;
                self._isBusy = false;

                return state;
            });
        }

        function getState() {
            return this.state;
        }

        function isBusy() {
            return this._isBusy;
        }

        // Build a query with the facet selection and use it to get the facet state.
        function fetchState(constraints) {
            var query = this.buildQuery(constraints.constraint);

            $log.warn(this.getName(), query);

            return this.endpoint.getObjects(query).then(function(results) {
                var res = facetMapperService.makeObjectList(results);
                return _.first(res);
            });
        }

        function getTriplePattern() {
            return '?s ' + this.getPredicate() + ' ?value . ';
        }

        function getConstraint() {
            if (!this.getSelectedValue()) {
                return;
            }
            if (this.getSelectedValue()) {
                return ' ?s ' + this.getPredicate() + ' ' + this.getSelectedValue() + ' . ';
            }
        }

        function getPredicate() {
            return this.predicate;
        }

        function getFacetUri() {
            return this.facetUri;
        }

        function getName() {
            return this.name;
        }

        function getDeselectUnionTemplate() {
            return this.deselectUnionTemplate;
        }

        function getPreferredLang() {
            return this.config.preferredLang;
        }

        // Build the facet query
        function buildQuery(constraints) {
            constraints = constraints || [];
            var query = this.queryTemplate
                .replace(/<OTHER_SERVICES>/g, this.buildServiceUnions(this.config.services))
                .replace(/<OTHER_SELECTIONS>/g, this.getOtherSelections(constraints))
                .replace(/<SELECTIONS>/g, this.buildSelections(constraints))
                .replace(/<PREF_LANG>/g, this.getPreferredLang());

            return query;
        }

        function buildSelections(constraints) {
            constraints = constraints.join(' ');
            return constraints + ' ' + this.getTriplePattern();
        }

        function getOtherSelections(constraints) {
            var ownConstraint = this.getConstraint();
            var deselections = _.reject(constraints, function(v) { return v === ownConstraint; });
            return deselections.join(' ');
        }

        function buildServiceUnions(services) {
            var unions = '';
            _.forEach(services, function(service) {
                unions = unions +
                ' UNION { ' +
                '  SERVICE ' + service + ' { ' +
                    this.config.labelPart +
                '  } ' +
                ' } ';
            });
            return unions;
        }

        // Replace placeholders in the query template using the configuration.
        function buildQueryTemplate(template) {
            var templateSubs = [
                {
                    placeHolder: /<ID>/g,
                    value: this.facetUri
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

        function getSelectedValue() {
            var val;
            if (this.selectedValue) {
                val = this.selectedValue.value;
            }
            return val;
        }

        function isEnabled() {
            return this._isEnabled;
        }

        function enable() {
            this._isEnabled = true;
        }

        function disable() {
            this.selectedValue = {};
            this._isEnabled = false;
        }

        function isLoading() {
            return this.isBusy();
        }
    }
})();
