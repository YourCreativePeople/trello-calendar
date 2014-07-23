/*
    ractive.js

    Description: Contains the ractive for the app
    Author: Tory Martin & David Dierking
*/


/* Placeholder global */
var orgData;

/*
    Function: trelloCards

    Description: Initiates the ractive

    Parameters: n/a

    Returns: n/a
*/
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
        /* Generate Table */
        renderRows:function(mem){
            var s = "";
            for(var i=0;i<mem.Rows.length;i++){
                var row = mem.Rows[i];
                s += "<tr>";
                if(i == 0)
                    s += "<td rowspan=\"" + mem.Rows.length.toString() + "\">" + mem.fullName + "</td>";
                for(var c=0;c<row.Columns.length;c++){
                	var column = row.Columns[c];
                    var bgColor = "none";
                    var bClass = "";
                    var t = "";
                    var bID = column.BoardID;
                    if(bID !== ''){
                        var b = trelloCards.data.org.boards[column.BoardID];
                        if(b.prefs.backgroundColor !== ''){
                        	bgColor = b.prefs.backgroundColor;
                        	bClass = "bgColor";
                        }
                        if (b.name !== '')
                            t= b.name;
                        else
                        	t = "Board in another org";
                    }
                    
                    s += "<td class=\"" + bClass + "\" style=\"background: " + bgColor + ";\" colspan=\"" + column.Span.toString() + "\">";
                    //s += "<td colspan=\"" + column.Span.toString() + "\">";
                    if(t !== '')
	                    s += "<a target=\"_blank\" href=\"" + column.Url + "\">" + t + "</a>";

                    s += "</td>";
                
                
                
					/*
                    //var column = row.Columns[c];
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
                    */
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
    if (trelloCards.data.org)
        localStorage['trelloCalendar'] = JSON.stringify(trelloCards.data.org);

});

trelloCards.observe( 'org.boards', function( items ) {
    /* Save to localstorage */
    if (trelloCards.data.org)
        localStorage['trelloCalendar'] = JSON.stringify(trelloCards.data.org);
});