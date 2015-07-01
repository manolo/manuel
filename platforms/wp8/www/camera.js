/**
 * This source file exposes PhoneGap camera API to a Vaadin application running
 * in iframe.
 * 
 * @author Michael Tzukanov
 */

(function() {

	window.addEventListener('message', function(e) {
		if (e.data.slice(0, 'camera-'.length) == 'camera-') {
			var parts = e.data.split('-');
			takePicture(parts[1]);
		}
	}, false);

	function takePicture(source) {
		navigator.camera.getPicture(function(imageURI) {
			var iframe = document.getElementById('app');

			if (iframe)
				iframe.contentWindow.postMessage("image-"
						+ imageURI, "*");

		}, function(err) {
			iframe.contentWindow.postMessage("image-error-" + err, "*");
		},
		// TODO: consider exposing the parameters, so that they can be specified
		// from a Vaadin app
		{
			quality : 75,
			destinationType : Camera.DestinationType.DATA_URL,
			sourceType : Camera.PictureSourceType[source],
			// sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
			// allowEdit : true,
			encodingType : Camera.EncodingType.JPEG,
			targetWidth : 300,
			targetHeight : 200
			// saveToPhotoAlbum: false
		});
	}

})();