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

        },
        formatDate: function(d){
	        return d.format("DD - MMM");
        },
        renderRows:function(mem){
        	var s = "";
        	for(var i=0;i<mem.Rows.length;i++){
        		var row = mem.Rows[i];
	        	s += "<tr>";
	        	if(i == 0)
		        	s += "<td rowspan=\"" + mem.Rows.length.toString() + "\">" + mem.fullName + "</td>";
		        for(var c=0;c<row.Columns.length;c++){
		        	var column = row.Columns[c];
			        s += "<td colspan=\"" + column.Span.toString() + "\">";
			        
			        var bID = column.BoardID;
			        if(bID !== ''){
				        var b = trelloCards.data.org.boards[column.BoardID];
				        if (b.name !== '')
			                s += b.name;
			            else
			                s += "Board in another org";
	                }
			        
			        s += "</td>";
		        }
		        s += "</tr>";
	        	
        	}
        	return s;
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
    /*
if (trelloCards.data.org)
        localStorage['trelloCalendar'] = JSON.stringify(trelloCards.data.org);
*/
});

trelloCards.observe( 'org.boards', function( items ) {
    /* Save to localstorage */
    if (trelloCards.data.org)
        localStorage['trelloCalendar'] = JSON.stringify(trelloCards.data.org);
});

/* Trello Api Code */
var onAuthorize = function() {
    updateLoggedIn();

/*
trelloCards.set({
        org: JSON.parse(localStorage['trelloCalendar'])
    });
    console.log(trelloCards.data.org);
*/

Trello.get("organizations/ycp", {
        fields: 'displayName,url',
        boards: 'open', board_fields: 'name,desc,shortUrl',
        members: 'all', member_fields: 'username,fullName'
    }, function(org) {
        var boards = org.boards;
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
            //console.log(member);
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

Date.prototype.getWeekNumber = function(){
    var d = new Date(+this);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

var Days = new Array();
function getWeeks(){
	var today = moment();
	var begin = moment(today).isoWeekday(1);

	var curDate = begin;
	var numWeeks = 2;
	var weeks = new Array();
	for(var i=0;i<numWeeks;i++){
		var w = new Object();
		w.WeekNumber = curDate.isoWeek();
		var days = new Array();
		for(var d=0;d<5;d++){
			days.push(curDate);
			w.Days = days;
			Days.push(curDate);
			curDate = moment(curDate).add('days', 1);
		}
		weeks.push(w);
		curDate = moment(curDate).add('days', 2);
	}
	
	trelloCards.set({
            weeks: weeks
        });
	//--console.log(weeks);
}

function getDateIndex(d){
	for(var i=0;i<Days.length;i++){
		if(Days[i].isSame(moment(d), "day"))
			return i;
	}
	return -1;
}

function cardIsInRange(card){
	return !card.StartDate.isAfter(Days[Days.length - 1], "day")
		&&
		!card.EndDate.isBefore(Days[0], "day");
}

function newRow(){
	var row = new Object();
	row.Columns = new Array();
	for(var i=0;i<Days.length;i++){
		var column = new Object();
		column.Span = 1;
		column.StartDate = Days[i];
		column.EndDate = Days[i];
		column.BoardID = "";
		row.Columns.push(column);
		
	}
	return row;
}

function rowToUse(member, card){
	for(var i=0;i<member.Rows.length;i++){
		var canUse = true;
		var r = member.Rows[i];
		for(var c=0;c<r.Columns.length;c++){
			var column = r.Columns[c];
			if(column.BoardID !== '' &&
				!card.StartDate.isAfter(column.EndDate, "day")
				&&
				!card.EndDate.isBefore(column.StartDate, "day")
			){
				canUse = false;
				break;
			}
		}
		if(canUse)
			return r;
	}
	
	var row = newRow();
	member.Rows.push(row);
	return row;
}

function addWeekdays(date, days) {
  date = moment(date); // use a clone
  if(days < 0){
	  while (days < 0) {
	    date = date.add(-1, 'days');
	    // decrease "days" only if it's a weekday.
	    if (date.isoWeekday() !== 6 && date.isoWeekday() !== 7) {
	      days += 1;
	    }
	  }
  }else if(days > 0){
	  while (days > 0) {
	    date = date.add(1, 'days');
	    // decrease "days" only if it's a weekday.
	    if (date.isoWeekday() !== 6 && date.isoWeekday() !== 7) {
	      days -= 1;
	    }
	  }
  }

  return date;
}

function addToColumn(row, card){
	var columnToUse;
	var toRemove = new Array();
	if(card.StartDate.isBefore(Days[0], "day"))
		card.StartDate = moment(Days[0]);
	for(var i=0;i<row.Columns.length;i++){
		var isSameAsStart = row.Columns[i].StartDate.isSame(card.StartDate, "day");
		var isAfterStart = row.Columns[i].StartDate.isAfter(card.StartDate, "day");
		var isSameAsEnd = row.Columns[i].StartDate.isSame(card.EndDate, "day");
		if(isSameAsStart){
			columnToUse = row.Columns[i];
			columnToUse.BoardID = card.idBoard;
			columnToUse.Span = 1;
			if(isSameAsEnd)
				break;
		}
		if(isAfterStart)
		{
			columnToUse.EndDate = row.Columns[i].StartDate;
			columnToUse.Span = columnToUse.Span + 1;
			toRemove.push(i);
			if(isSameAsEnd)
				break;
		}
	}
	for(var i=toRemove.length - 1;i>=0;i--){
		row.Columns.splice(toRemove[i], 1);
	}
}

function processMemberCards(member){
	//console.log(cards);
	
	member.Rows = new Array();
	
	//member.Rows.push(newRow());
	
	//var card = cards[0];
	//card.EndDate = moment(card.due);
	//card.StartDate = moment(card.EndDate).add('days', -1);
	//addToColumn(rowToUse(member), card);
	//addToColumn(member.Rows[0], cards[0]);
	
	
	//for(var i=0;i<cards.length;i++){
	for(var i=0;i<member.cards.length;i++){
		//console.log(cards[i].due.toString());
		//var dayInt = getDateIndex(cards[i].due);
		var card = member.cards[i];
		card.EndDate = moment(card.due);
		if(card.desc){
			var d = card.desc.replace(/ /g,'').toLowerCase();
			var dString = "duration:";
			var ind = d.indexOf(dString);
			if(ind > -1){
				ind = ind + dString.length;
				d = d.substring(ind);
				var dInd = d.indexOf("d");
				if(dInd > 0){
					try{
						var dNum = parseInt(d.substring(0, dInd));
						card.StartDate = addWeekdays(card.EndDate, -(dNum - 1));
					}catch(e){}
				}
			}
		}
		if(typeof card.StartDate === 'undefined')
			card.StartDate = moment(card.EndDate);
		//card.StartDate = moment(card.EndDate).add('days', -1);
		
		
		if(cardIsInRange(card))
			addToColumn(rowToUse(member, card), card);
	}	
}

$("#disconnect").click(logout);