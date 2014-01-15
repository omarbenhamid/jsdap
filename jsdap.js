function proxyUrl(url, callback, binary, extraheaders) {
    // Mozilla/Safari/IE7+
    if (window.XMLHttpRequest) {
        var xml = new XMLHttpRequest();
    // IE6
    } else if (window.ActiveXObject) {
        var xml = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xml.open("GET", url, true);
    if (xml.overrideMimeType) {
        xml.overrideMimeType('text/plain; charset=x-user-defined');
    } else {
        xml.setRequestHeader('Accept-Charset', 'x-user-defined');
    }
    if(extraheaders) {
	    for(var key in extraheaders) {
		xml.setRequestHeader(key,extraheaders[key]);
	    }
    }

    xml.onreadystatechange = function() {
        if (xml.readyState == 4) {
            if (!binary) {
                callback(xml.responseText);
            } else if (IE_HACK) {
                callback(BinaryToArray(xml.responseBody).toArray());
            } else {
                callback(getBuffer(xml.responseText));
            }
        }
    };
    xml.send('');
}

/**
 * Load the dataset and call the callback with (dataset) where dataset is the dataset "metadata";
 * - url (string): the url (must be a bare OPeNDAP url, without "format extension" nor query parameters). 
 * - callback (function(data)): the callback which will receive parsed data.
 * - extraheaders (map/object) : Javascript Object or map that contains keys and values of additonnal headers for the request.
 */
function loadDataset(url, callback, extraheaders) {

    // Load DDS.
    proxyUrl(url + '.dds', function(dds) {
        var dataset = new ddsParser(dds).parse();

        // Load DAS.
        proxyUrl(url + '.das', function(das) {
            dataset = new dasParser(das, dataset).parse();
            callback(dataset);
        },false,extraheaders);
    },false,extraheaders);
}

/** Flatten the data array as data attributes of elements of dapvar */
function _applydata(data,dapvar) {
	var i = 0;
	for(child in dapvar) {
	  if(!dapvar[child].type) continue;
	  dapvar[child].data=data[i++];
	  if(dapvar[child].type == 'Structure') {
		_applydata(dapvar[child].data,dapvar[child]);
          }
	}
 
}
/**
 * Load the dataset and call the callback with (data) where data is an array of data
 * the url must be a url with .dods extension.
 * @params:
 * - url (string): the url (must be a .dods url, it might have additonnal slicing OpENDAP query string)
 * - callback (function(data)): the callback which will receive parsed data.
 * - extraheaders (map/object) : Javascript Object or map that contains keys and values of additonnal headers for the request.
 */
function loadData(url, callback, extraheaders) {

    proxyUrl(url, function(dods) {
        var dds = '';
        while (!dds.match(/\nData:\n$/)) {
	    var c = dods.splice(0, 1);
	    if(c.length === 0) throw new Error("Error reading data, are you sur this is a .dods request ?");
            dds += String.fromCharCode(c);
        }
        dds = dds.substr(0, dds.length-7);

        var dapvar = new ddsParser(dds).parse();
        var data = new dapUnpacker(dods, dapvar).getValue();
	_applydata(data,dapvar);
       callback(dapvar);
    }, true, extraheaders);
}
