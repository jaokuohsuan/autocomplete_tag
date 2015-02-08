'use strict';

// modules

(function(window, document) {
    
    var mojao= window.mojao || (window.mojao = {});

    var modules={};

    // for real using
    var realModules = {};

    
    
    // for injection and singleton
    function getModule(name) {

        var dependencies = [],
            callback;

        if (realModules[name]) {
            return realModules[name];
        }

        if (modules[name]) {
            callback = modules[name].pop();
            for (var i = 0; i < modules[name].length; i++) {
                dependencies.push(getModule(modules[name][i]));
            }
        }

        realModules[name] = callback.apply(window, dependencies);

        return realModules[name];
    }


    //modulzrize function
    mojao.module=function(){
        var args,
            moduleName,
            injection;

        args=Array.prototype.slice.call(arguments);

        moduleName = (args[0] && typeof args[0] === 'string') ? args[0] : null;

        injection = args.pop();
        // when using the module 
        if (typeof injection === 'string') {
            return getModule(moduleName);
        }

        modules[moduleName]=injection;

    };


    //q for mutil-promise
    mojao.module('q', [function () {
        var q = {};

        function defer() {
            var tasks = [];
            var resolved;

            return {
                resolve: function (data) {
                    resolved = data;

                    if (tasks) {
                        for (var i=0; i<tasks.length; i++) {
                            tasks[i][0](resolved);
                        }

                        tasks = undefined;
                    }
                },
                reject: function (error) {

                    console.log('error:',error);

                },
                promise: {
                    then: function (onSuccess, onError) {
                        var deferred = defer();

                        if (tasks) {
                            tasks.push([function (resolved) {
                                deferred.resolve(onSuccess(resolved));
                            }, function (error) {
                                deferred.reject(onError(error));
                            }]);

                        } else {
                            deferred.resolve(onSuccess(resolved));
                        }

                        return deferred.promise;
                    }
                }
            };
        }

        q.defer = defer;

        return q;
    }]);


    //ajax module

    mojao.module('ajax',['q',function(q){

        var ajax = function (url) {

            var thisPromise = q.defer();
            
            var oReq = new XMLHttpRequest();

            function reqListener() {
                var data = this.responseText;
                thisPromise.resolve(data);
            }

            
            oReq.onload = reqListener;
            oReq.open('get', url, true);
            oReq.send();

            return thisPromise.promise;
        };

        return ajax;

    }]);




    

})(window, document);