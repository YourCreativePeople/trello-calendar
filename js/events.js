/*
    events.js

    Description: Contains the jquery event handlers needed
    Author: Tory Martin
*/

$("#connectLink").click(function(){
    Trello.authorize({
        type: "popup",
        success: onAuthorize
    });
});

$("#disconnect").click(logout);
