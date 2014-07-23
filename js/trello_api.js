/*
    trello_api.js

    Description: Contains the code for querying the Trello API
    Author: Tory Martin
*/

/* Initial call to Trello Authorize
    - Pulled from localstorage */
Trello.authorize({
    interactive: false,
    success: onAuthorize
});

/*
    Description: gets specified data from Trello Api
*/
Trello.get("organizations/ycp", {
        fields: 'displayName,url',
        boards: 'open', board_fields: 'name,desc,shortUrl,prefs',
        members: 'all', member_fields: 'username,fullName'
}, function(org) {
    var boards = org.boards;
    console.log(boards);
    var boards_new = {};
    delete org.boards;

    org.boards = {};

    for (var i = 0; i < boards.length; i++) {
        boards_new[boards[i].id] = boards[i];
        delete boards_new[boards[i].id].id;
    }

    org.boards = boards_new;



    getWeeks();

    //var member = org.members[0];
    // Loop through org members and add cards
    $.each(org.members, function(ix, member) {
        member.cards = new Array();
        Trello.get("members/" + member.id + "/cards", {

                fields: "name,url,due,desc,idBoard"
        }, function(cards) {

            // Remove cards without due date and not in current range
            for (var i = cards.length - 1; i >= 0; i--) {
                var card = cards[i];
                if (card.due === null)
                    cards.splice(i, 1);
                else
                    card.due = new Date(card.due);
            }

            member.cards = cards;

            processMemberCards(member);


            trelloCards.set({
                org: org
            });

        });
    });

    trelloCards.update();
});

/* Helper functions */
var onAuthorize = function() {
    updateLoggedIn();
};

var updateLoggedIn = function() {
    /* Fill first name */
    Trello.members.get("me", function(member){
        console.log(member);
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