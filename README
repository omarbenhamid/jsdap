# JavaScript AJAX client for DAP services

## Introduction
[OPeNDAP](http://www.opendap.org/) protocol allows publishing huge datasets over internet. The protocols allows describing and querying data in various formats.

This library is designed to allow querying DAP dataset in AJAX based on the url. Main library code is from [Roberto De Almeida's jsdap project on google code](https://code.google.com/p/jsdap/).

## Setup 
The javascript files need to be loaded to the HTML source code, the **test.html** file is a good quickstart to load the libraries. 
Notice also that the cross domain limitations apply to OPeNDAP servers and thus requests must be properly managed or CORS enabled.

## Usage 

To load a dataset the *loadData* function must be used this way :

	loadData("http://www.example.com/dapserver/mydataset.nc.dods?time[1][1:5]",
		function(data) {
			console.log("Received data");
			console.log(data);
		});
Notice that the url **MUST** be a .dods request and that you *CAN* add additionnaly DAP query.

To only load the dataset (ie. information about the structure of data) :
	
	loadDataset("http://www.example.com/dapserver/mydataset.nc.dds", i
		function(info) {
			console.log(info);
		});

Notice that the url **MUST** be a .dds request and you **CANNOT** add additonnal DAP query/

An extra parameter can be added to send additionnal headers to the request.

## Troubleshooting

1. Your requests fail ? Careful about **cross domain requests**
2. You have parsing errors in loadData ? Ensure you passed in .dods request not .ascii or other.
3. You have parsing errors with loadDataset ? Ensure you are doing a .dds request.

Not enought ? Contact me at contact@obenhamid.me or http://obenhamid.me


