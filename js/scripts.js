/*
    scripts.js

    Description: Main data processing scripts
    Author: Tory Martin & David Dierking
*/

var Days = [];
function getWeeks(){
	var today = moment();
	var begin = moment(today).isoWeekday(1);

	var curDate = begin;
	var numWeeks = 2;
	var weeks = [];
	for(var i=0;i<numWeeks;i++){
		var w = {};
		w.WeekNumber = curDate.isoWeek();
		var days = [];
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
	var row = {};
	row.Columns = [];
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
    } else if(days > 0) {
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
	var toRemove = [];
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
	for(var j=toRemove.length - 1; j>=0 ; j--){
		row.Columns.splice(toRemove[j], 1);
	}
}

function processMemberCards(member){

	member.Rows = [];

	for(var i=0;i<member.cards.length;i++){
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

		if(cardIsInRange(card))
			addToColumn(rowToUse(member, card), card);
	}
}
