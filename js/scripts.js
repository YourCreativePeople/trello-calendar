/*
 * Trello Calendar
 * Author: Tory Martin
 * Licensed under the MIT license
 */

/* Globals */
var orgData;

/* Init Ractive */
var trelloCards = new Ractive({
    // The `el` option can be a node, an ID, or a CSS selector.
    el: 'container',

    // We could pass in a string, but for the sake of convenience
    // we're passing the ID of the <script> tag above.
    template: '#template',

    // Here, we're passing in some initial data
    data: {
        org: orgData,
        tempFunction: function() {},
        getBoard: function(idBoard) {
            if (trelloCards.data.org.boards[idBoard].name !== '')
                return trelloCards.data.org.boards[idBoard].name;
            else
                return "Board in another org";

        }
    }
});

/* Ractive Events */
trelloCards.on({
    change: function(event) {

    }
});

/* Ractive Observers */
trelloCards.observe( 'org', function( items ) {
    /* Save to localstorage */
    if (trelloCards.data.org)
        localStorage['trelloCalendar'] = JSON.stringify(trelloCards.data.org);
});

trelloCards.observe( 'org.boards', function( items ) {
    /* Save to localstorage */
    if (trelloCards.data.org)
        localStorage['trelloCalendar'] = JSON.stringify(trelloCards.data.org);
});

/* Trello Api Code */
var onAuthorize = function() {
    updateLoggedIn();

    trelloCards.set({
        org: JSON.parse(localStorage['trelloCalendar'])
    });

    // Trello.get("organizations/ycp", {
    //     fields: 'displayName,url',
    //     boards: 'open', board_fields: 'name,desc,shortUrl',
    //     members: 'all', member_fields: 'username,fullName'
    // }, function(org) {
    //     var boards = org.boards;
    //     var boards_new = {};
    //     delete org.boards;

    //     org.boards = {};

    //     for (var i = 0; i < boards.length; i++) {
    //         boards_new[boards[i].id] = boards[i];
    //         delete boards_new[boards[i].id].id;
    //     }

    //     org.boards = boards_new;

    //     trelloCards.set({
    //         org: org
    //     });

    //     console.log(trelloCards.data.org);

    //     // Loop through org members and add cards
    //     $.each(org.members, function(ix, member) {
    //         member.cards = new Array();
    //         Trello.get("members/" + member.id + "/cards", {
    //                 fields: "name,url,due,desc,idBoard"
    //         }, function(cards) {

    //             // Remove cards without due date
    //             for (var i = cards.length - 1; i >= 0; i--) {
    //                 if (cards[i].due === null)
    //                     cards.splice(i, 1);
    //                 else
    //                     cards[i].due = new Date(cards[i].due);
    //             }

    //             member.cards = cards;
    //             trelloCards.set({
    //                 org: org
    //             });

    //         });
    //     });

    //     trelloCards.update();
    // });
};

var updateLoggedIn = function() {
    Trello.members.get("me", function(member){
        $("#fullName").text(member.fullName);
    });

    var isLoggedIn = Trello.authorized();
    $(".loggedout").toggle(!isLoggedIn);
    $(".loggedin").toggle(isLoggedIn);
};

var logout = function() {
    Trello.deauthorize();
    updateLoggedIn();
};

Trello.authorize({
    interactive: false,
    success: onAuthorize
});

/* Event Handlers */
$("#connectLink").click(function(){
    Trello.authorize({
        type: "popup",
        success: onAuthorize
    })
});

$("#disconnect").click(logout);