/**
 * This code exposes PhoneGap File and FileTransfer API to a Vaadin application running in an iframe.
 * 
 * @author Michael Tzukanov
 */

(function() {
    var storageDirectory;
	
	document.addEventListener("deviceready",
		function () {
			if (device.platform === 'Android') {
				storageDirectory = cordova.file.externalDataDirectory
			} else if(device.platform === 'iOS') {
				storageDirectory = cordova.file.dataDirectory;
			} else {
				storageDirectory = '';
			}			
		}, false);

	window.addEventListener('message', function (e) {
	  if (e.data.slice(0, 'download-'.length) == 'download-')
	  {
	    var parts = e.data.replace(/\\-/g,'\*DASH\*').split('-');
	    download(parts[1].replace(/\*DASH\*/g,'-'), parts[2].replace(/\*DASH\*/g,'-'));
	  }
	  else if (e.data.slice(0, 'existsfile-'.length) == 'existsfile-')
		  checkFileExists(e.data.slice('existsfile-'.length));
	  else if (e.data.slice(0, 'openfile-'.length) == 'openfile-')
		  openFile(e.data.slice('openfile-'.length));
	  else if (e.data.slice(0, 'deletefile-'.length) == 'deletefile-')
		  deleteFile(e.data.slice('deletefile-'.length));
	  else if (e.data == 'listfiles')
		  listStorageDirectoryFiles();
	}, false);
	
	function listStorageDirectoryFiles()
	{
		function toArray(list) {
			  return Array.prototype.slice.call(list || [], 0);
			}
		
		window.resolveLocalFileSystemURL(storageDirectory, function(entry) {
			var dirReader = entry.createReader();
            var entries = [];

            // Keep calling readEntries() until no more results are returned.
            var readEntries = function() {
               dirReader.readEntries (function(results) {
                if (!results.length) {
                	sendEntriesMessage(entries);
                } else {
                  entries = entries.concat(toArray(results));
                  readEntries();
                }
              }, function () { alert("Could not read storage directory"); });
            };

            // Start reading the directory.
            readEntries();
		}, function () { alert("Could not read storage directory"); });
	}
	
	function sendEntriesMessage(entries)
	{
        var filenames = [];

        for (var i = 0; i < entries.length; i++) {
			if (entries[i].isFile)
				filenames.push(entries[i].name);
		}
        
        sendMessageToIframe({ "message": "FILE_LIST", "filelist": filenames });
	}
	
	function checkFileExists(filename)
	{
		window.resolveLocalFileSystemURL(encodeURI(storageDirectory + filename), function(entry) {
			sendMessageToIframe({ "message": "FILE_EXISTS", "filename": filename })
		}, function () {});
	}

	function getFileName(fullPath)
	{
		return fullPath.replace(/^.*[\\\/]/, '');
	}
	
   function download(url, auth) {
	   var fileTransfer = new FileTransfer();
	   
	   var filename = getFileName(url);
	   var target = storageDirectory + filename;
	   // TODO: check if needed for WP as well, on Android will prevent files like "test%20 test.pdf" from opening/deleting
	   if (device.platform === 'iOS')
		   target = encodeURI(target);
       
       fileTransfer.onprogress = function(progressEvent) {
    	   sendMessageToIframe({ "message": "PROGRESS", "loaded": progressEvent.loaded, "total": progressEvent.total, "filename" : filename });
       };
       

        fileTransfer.download(
          encodeURI(url),
          target,
          function downloadSuccess(entry) {
       	   		sendMessageToIframe({"message": "DOWNLOAD_SUCCESS", "filename": filename});
          },
          function downloadError(error) {
//              alert("Download error (" + error.code + "). Could not download " + error.source);
       	   	  sendMessageToIframe({"message": "DOWNLOAD_ERROR", "filename": filename, "error_code": error.code, "error_source": error.source});
          },
          false,
          {
            headers: {
              "Authorization": auth
            }
          }
        );
   }

   function openFile(filename)
   {
		window.resolveLocalFileSystemURL(encodeURI(storageDirectory + filename), function(entry) {
			window.openfile.open(entry.toURL());
		}, function () { alert("File not found"); });		
   }
   
   function deleteFile(filename)
   {   
		window.resolveLocalFileSystemURL(encodeURI(storageDirectory + filename), function(entry) {
			entry.remove(
				function(entry) {
					sendMessageToIframe({ "message": "FILE_REMOVED", "filename": filename })
				},
				function(error) {
					alert('Failed to remove file: ' + error);
				});
		}, function () { alert("File not found"); });
   }
   
   function sendMessageToIframe(object) {
	   var iframe = document.getElementById('app');
	   iframe.contentWindow.postMessage("json-" + JSON.stringify(object), "*");
   }   
})();
   