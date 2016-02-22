(function() {

    'use strict';

    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    /*
     * Casualty service
     */
    .service( 'casualtyService', casualtyService );

    /* @ngInject */
    function casualtyService( $q, SparqlService, Results ) {
        var endpointUrl = 'http://ldf.fi/warsa/sparql';

        var facets = {
            '<http://www.w3.org/2004/02/skos/core#prefLabel>': { name: 'Nimi', type: 'text' },
            '<kuolinaika>' : {
                name: 'Kuolinaikarange',
                type: 'timespan',
                start: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>',
                end: '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>',
                min: '1939-10-01',
                max: '1989-12-31'
            },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/ammatti>': { name: 'Ammatti' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/asuinkunta>': { name: 'Asuinkunta' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/kansalaisuus>': { name: 'Kansalaisuus' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinkunta>': { name: 'Kuolinkunta' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/kuolinaika>': { name: 'Kuolinaika' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/osasto>': { name: 'Joukko-osasto' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/sukupuoli>': { name: 'Sukupuoli' },
            '<http://ldf.fi/schema/narc-menehtyneet1939-45/siviilisaeaety>': { name: 'Siviilisääty' }
        };

        var resultHandler = new Results(endpointUrl, facets);

        var properties = {
            '?name': '',
            '?occupation': '<http://ldf.fi/schema/narc-menehtyneet1939-45/ammatti>',
            '?marital_status': '',
            '?death_municipality': '',
            '?tod': '',
            '?rank': '',
            '?unit': '',
            '?casualty_class': ''
        };

        var facetOptions = {
            endpointUrl: endpointUrl,
            graph : '<http://ldf.fi/narc-menehtyneet1939-45/>',
            rdfClass: '<http://xmlns.com/foaf/0.1/Person>',
            preferredLang : 'fi'
        };

        var prefixes = '' +
            ' PREFIX skos: <http://www.w3.org/2004/02/skos/core#>' +
            ' PREFIX wgs84: <http://www.w3.org/2003/01/geo/wgs84_pos#>' +
            ' PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>' +
            ' PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>' +
            ' PREFIX foaf: <http://xmlns.com/foaf/0.1/>' +
            ' PREFIX owl:  <http://www.w3.org/2002/07/owl#>' +
            ' PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
            ' PREFIX georss: <http://www.georss.org/georss/>' +
            ' PREFIX text: <http://jena.apache.org/text#>' +
            ' PREFIX m: <http://ldf.fi/sotasampo/narc/menehtyneet/>' +
            ' PREFIX m_schema: <http://ldf.fi/schema/narc-menehtyneet1939-45/>';

        var resultSet = '' +
            '     SELECT ?s ?id ?name { ' +
            '       GRAPH <http://ldf.fi/narc-menehtyneet1939-45/> {' +
            '         <FACET_SELECTIONS> ' +
            '         ?s a foaf:Person .' +
            '         ?s skos:prefLabel ?name .' +
            '         BIND(?s AS ?id) ' +
            '       } ' +
            '     } ORDER BY ?name ' +
            '     <PAGE> ';

        var resultSetQry = prefixes + resultSet;

        var query = prefixes +
            ' SELECT ?id ?s <PROPERTIES> ' +
            ' WHERE {' +
            '   { ' +
            '     <RESULTSET> ' +
            '   } ' +
            ' GRAPH <http://ldf.fi/narc-menehtyneet1939-45/> {' +

            ' OPTIONAL {' +
            ' ?s m_schema:siviilisaeaety ?siviilisaeaetyuri .' +
            ' ?siviilisaeaetyuri skos:prefLabel ?marital_status . }' +
//            ' OPTIONAL { ?s m_schema:sukupuoli ?sukupuoliuri .' +
//            ' ?sukupuoliuri skos:prefLabel ?sukupuoli . }' +
//            ' OPTIONAL { ?s m_schema:lasten_lukumaeaerae ?lasten_lukumaeaerae . }' +
//            ' OPTIONAL { ?s m_schema:kansalaisuus ?kansalaisuusuri .' +
//            ' ?kansalaisuusuri skos:prefLabel ?kansalaisuus . }' +
//            ' OPTIONAL { ?s m_schema:aeidinkieli ?aeidinkieliuri .' +
//            ' ?aeidinkieliuri skos:prefLabel ?aeidinkieli . }' +
            ' OPTIONAL { ?s m_schema:menehtymisluokka ?menehtymisluokkauri .' +
            ' ?menehtymisluokkauri skos:prefLabel ?casualty_class . }' +
            ' OPTIONAL { ?s m_schema:kuolinkunta ?kuolinkunta_uri .' +
            ' OPTIONAL {' +
            ' 	GRAPH <http://ldf.fi/warsa/places/municipalities> {' +
            ' 		?kuolinkunta_uri skos:prefLabel ?kuolinkunta_warsa .' +
            ' 	}' +
            ' } OPTIONAL {' +
            ' 	?kuolinkunta_uri skos:prefLabel ?kuolinkunta_narc .' +
            ' }' +
            ' }' +
            ' OPTIONAL { ?s m_schema:kuolinaika ?tod .' +

            ' }' +
            ' OPTIONAL { ?s m_schema:ammatti ?occupation . }' +
//                    ' OPTIONAL { ?s m_schema:kuolinpaikka ?kuolinpaikka . }' +
            ' OPTIONAL { ?s m_schema:sotilasarvo ?arvouri .' +
            '   GRAPH <http://ldf.fi/warsa/actors/actor_types> {' +
            '     ?arvouri skos:prefLabel ?rank  .' +
            '   }' +
            ' }' +
            ' OPTIONAL { ?s m_schema:osasto ?osastouri .' +
            '   GRAPH <http://ldf.fi/warsa/actors> {' +
            '     ?osastouri skos:prefLabel ?unit  .' +
            '   }' +
            ' }' +

            ' }' +
                ' BIND(COALESCE(?kuolinkunta_warsa, ?kuolinkunta_narc) as ?death_municipality)' +
            ' } ORDER BY ?name ';

        query = query.replace(/<RESULTSET>/g, resultSet);
        query = query.replace(/<PROPERTIES>/g, Object.keys( properties ).join(' '));

        this.getResults = getResults;
        this.getFacets = getFacets;
        this.getFacetOptions = getFacetOptions;

        function getResults(facetSelections) {
            return resultHandler.getResults(facetSelections, query, resultSetQry);
        }

        function getFacets() {
            return facets;
        }

        function getFacetOptions() {
            return facetOptions;
        }
    }
})();
