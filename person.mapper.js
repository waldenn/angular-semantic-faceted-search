(function() {
    'use strict';

    /*
    * Service for transforming SPARQL result triples into more manageable objects.
    *
    * Author Erkki Heino.
    */
    /* eslint-disable angular/no-service-method */
    angular.module('facetApp')

    .constant('_', _) // eslint-disable-line no-undef

    .service('photoMapperService', photoMapperService);

    /* ngInject */
    function photoMapperService(_, objectMapperService) {
        PhotoMapper.prototype.makeObjectList = makeObjectList;

        var proto = Object.getPrototypeOf(objectMapperService);
        PhotoMapper.prototype = angular.extend({}, proto, PhotoMapper.prototype);

        return new PhotoMapper();

        function PhotoMapper() {
            this.objectClass = Object;
        }

        function makeObjectList(objects) {
            // Create a list of the SPARQL results where triples with the same
            // subject are merged into one object.
            var self = this;
            var obj_list = _.transform(objects, function(result, obj) {
                if (!obj.id) {
                    return null;
                }
                obj = self.makeObject(obj);
                // Check if this object has been constructed earlier.
                // Assume the results are sorted by id.
                var old = _.find(result, { id: obj.id });
                if (old) {
                    // Merge this triple into the object constructed earlier
                    self.mergeObjects(old, obj);
                }
                else {
                    // This is the first triple related to the id
                    result.push(obj);
                }
            });
            return self.postProcess(obj_list);
        }
    }
})();
