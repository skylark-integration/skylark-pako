define([
    "skylark-langx-ns",
    "./deflates",
    "./inflates"
], function(skylark, deflates,inflates) {


    return skylark.attach("intg.pako", {
        deflates,
        inflates
    });

});