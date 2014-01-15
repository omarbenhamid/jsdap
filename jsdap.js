function proxyUrl(url, callback, binary) {
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


function loadDataset(url, callback, proxy) {
    // User proxy?
    if (proxy) url = proxy + '?url=' + encodeURIComponent(url);

    // Load DDS.
    proxyUrl(url + '.dds', function(dds) {
        var dataset = new ddsParser(dds).parse();

        // Load DAS.
        proxyUrl(url + '.das', function(das) {
            dataset = new dasParser(das, dataset).parse();
            callback(dataset);
        });
    });
}


function loadData(url, callback, proxy) {
    // User proxy?
    if (proxy) url = proxy + '?url=' + encodeURIComponent(url);

    proxyUrl(url, function(dods) {
        var dds = '';
        while (!dds.match(/\nData:\n$/)) {
            dds += String.fromCharCode(dods.splice(0, 1));
        }
        dds = dds.substr(0, dds.length-7);

        var dapvar = new ddsParser(dds).parse();
        var data = new dapUnpacker(dods, dapvar).getValue();
        callback(data);
    }, true);
}
