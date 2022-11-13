define([
    "skylark-langx-ns",
    "./deflates",
    "./inflates",
    "./zlib/constants"
], function(skylark, deflates,inflates,constants) {


    var pako= skylark.attach("intg.pako", {
        deflates,
        inflates
    });

	const { Deflate, deflate, deflateRaw, gzip } = deflates;

	const { Inflate, inflate, inflateRaw, ungzip } = inflates;


	pako.Deflate = Deflate;
	pako.deflate = deflate;
	pako.deflateRaw = deflateRaw;
	pako.gzip = gzip;
	pako.Inflate = Inflate;
	pako.inflate = inflate;
	pako.inflateRaw = inflateRaw;
	pako.ungzip = ungzip;
	pako.constants = constants;

	return pako;
});