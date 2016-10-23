/*
* Facet handler service.
*/
(function() {
    'use strict';

    angular.module('seco.facetedSearch')

    .factory('Facets', Facets);

    /* ngInject */
    function Facets($log, $rootScope, $location, _, facetUrlStateHandlerService,
            EVENT_FACET_CONSTRAINTS, EVENT_FACET_CHANGED, EVENT_REQUEST_CONSTRAINTS,
            EVENT_INITIAL_CONSTRAINTS) {

        return FacetHandler;

        function FacetHandler(config) {
            var self = this;

            /* Public API */

            self.update = update;

            /* Implementation */

            init();

            function init() {
                self.state = { facets: {} };

                var defaultConfig = {
                    preferredLang: 'en',
                    urlHandler: facetUrlStateHandlerService
                };

                self.config = angular.extend({}, defaultConfig, config);

                self.changeListener = $rootScope.$on(EVENT_FACET_CHANGED, update);
                self.initListener = $rootScope.$on(EVENT_REQUEST_CONSTRAINTS, broadCastInitial);

                if (!self.config.urlHandler) {
                    var noop = function() { };
                    var noopUrlHandler = {
                        getFacetValuesFromUrlParams: noop,
                        updateUrlParams: noop
                    };
                    self.urlHandler = noopUrlHandler;
                } else {
                    self.urlHandler = self.config.urlHandler;
                }

                self.state.facets = self.urlHandler.getFacetValuesFromUrlParams();
                if (self.config.constraint) {
                    self.state.default = getInitialConstraints(self.config);
                }
                $log.log('Initial state', self.state);
            }

            // Update state, and broadcast them to listening facets.
            function update(event, constraint) {
                $log.debug('Update', constraint);
                self.state.facets[constraint.id] = constraint;
                self.urlHandler.updateUrlParams(self.state.facets);
                broadCastConstraints(EVENT_FACET_CONSTRAINTS);
            }

            function broadCastInitial() {
                $log.debug('Broadcast initial');
                broadCastConstraints(EVENT_INITIAL_CONSTRAINTS);
            }

            function broadCastConstraints(event) {
                var constraint = getConstraint();
                constraint.push(self.state.default);
                var data = { facets: self.state.facets, constraint: constraint };
                $log.log('Broadcast', data);
                $rootScope.$broadcast(event, data);
            }

            function getConstraint() {
                return _(self.state.facets).values().map('constraint').compact().value();
            }

            // Combine the possible RDF class and constraint definitions in the config.
            function getInitialConstraints(config) {
                var state = config.rdfClass ? ' ?s a ' + config.rdfClass + ' . ' : '';
                state = state + (config.constraint || '');
                return state;
            }
        }
    }
})();
