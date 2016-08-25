app.controller('ldcontroller', ['$scope', '$http', 'ngDialog', function($scope, $http, ngDialog) {
	  
	  $scope.openAuthor = function (authorID) {
	    	uri = authorID;
	    	var n = uri.lastIndexOf('/');
	    	var viafId = uri.substring(n + 1);
	      	var SCHEMA = $rdf.Namespace("http://schema.org/")
	      	
	        kb = $rdf.graph();
	    	$http({
	    	  	  method: 'GET',
	    	  	  url: uri + '/',
	    	  	  headers: {
	    	  		   'Accept': 'application/rdf+xml'
	    	  		 },
	    	  	}).then(function successCallback(response) {
	    	  		$rdf.parse(response.data, kb, uri, 'application/rdf+xml');   
	    	  		$scope.names = kb.each($rdf.sym(uri), SCHEMA('name'));
	    	  		$scope.birthDate = kb.the($rdf.sym(uri), SCHEMA('birthDate')).value;
	    	  		$scope.deathDate = kb.the($rdf.sym(uri), SCHEMA('deathDate')).value;
	    	          
	    	  	  }, function errorCallback(response) {
	    	  		console.log(response);
	    	  	  });
	    	
	    	//create the sparql query to wikidata
	    	sparql_url = 'https://query.wikidata.org/sparql?query=';
	    	sparql_url +=	'SELECT ?birthplaceLabel ?description' +
	    		' WHERE {' + 
	    		' ?author wdt:P214 "' + viafId  + '".' +
	    		' ?author schema:description ?description.' +
	    		' ?author wdt:P19 ?birthplace.' +
	    		' SERVICE wikibase:label {' +
	    		 ' bd:serviceParam wikibase:language "en" .' +
	    		'}' +
	    		' FILTER(LANG(?description) = "en")' + 
	    		'}';
	    	sparql_url += '&format=json';
	    	
	    	$http({
	    		method: 'GET',
	    	  	  url: sparql_url
	    		}).then(function successCallback(sparql_response) {
	    	  		//parse the JSON response from the SPARQL query 
	    	  		result = angular.fromJson(sparql_response.data);
	    	  		$scope.birthplace = result.results.bindings[0].birthplaceLabel.value;
	    	  		$scope.description = result.results.bindings[0].description.value;
	    	          
	    		}, function errorCallback(response) {
	    	  	console.log(response);
	    		});
	 
	    	//create the sparql query to dbpedia
	    	dbpedia_sparql_url = 'http://dbpedia.org/sparql?query=';
	    	dbpedia_sparql_query = [
	    	                        "SELECT ?type ?givenName ?surname",
	    	                        "WHERE {",
	    	                        "{",
	    	                        "?author dbp:viaf " + viafId + " .",
	    	                        "?s dbp:influenced ?author .",
	    	                        "?s foaf:givenName ?givenName .",
	    	                        "?s foaf:surname ?surname .",
	    	                        "BIND(\"influencedBy\" AS ?type) .",
	    	                        "}",
	    	                        "UNION",
	    	                        "{",
	    	                        "?author dbp:viaf " + viafId + " .",
	    	                        "?s dbp:influences ?author .",
	    	                        "?s foaf:givenName ?givenName .",
	    	                        "?s foaf:surname ?surname .",
	    	                        "BIND(\"influences\" AS ?type) .",
	    	                        "}",
	    	                        "}",
	    	                        "ORDER BY ?type",
	    	                        ].join(" ");
	    	dbpedia_sparql_url += dbpedia_sparql_query + '&format=json';
	    	
	    	$http({
	    		method: 'GET',
	    	  	  url: dbpedia_sparql_url
	    		}).then(function successCallback(dbpedia_sparql_url_response) {
	    	  		//parse the JSON response from the SPARQL query 
	    	  		result = angular.fromJson(dbpedia_sparql_url_response.data);
	    	  		influenced = [];
	    	  		influences = [];
		            nodes = result.results.bindings;
		            for (i = 0; i < nodes.length; i++) {
		            	if (nodes[i].type.value == 'influences') {
		            		influenced.push(nodes[i].givenName.value + ' ' + nodes[i].surname.value);
		            	}else{
		            		influences.push(nodes[i].givenName.value + ' ' + nodes[i].surname.value);
		            	}
		            }
		            $scope.influenced_persons = influenced;
		            $scope.influences_persons = influences;
		            
		            console.log($scope);
	    	          
	    		}, function errorCallback(response) {
	    	  	console.log(response);
	    		});	    	
	    	
	    	
	    	ngDialog.open({
	    	    template: 'author-template.html',
	    	    className: 'ngdialog-theme-default',
	    	    scope: $scope
	    	});
	    };
    }]);