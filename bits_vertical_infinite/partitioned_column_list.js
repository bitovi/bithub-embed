import can from "can/";
import _map from "lodash/collection/map";
import _reduce from "lodash/collection/reduce";
import "can/construct/proxy/";

import "./bits_vertical_infinite.less!";


var makeColumns = function(count){
	return _map(Array(count), () => { return []; });
};

var makeCalculateCurrent = function(currentColumn, columnCount){
	return function(){
		currentColumn++;
		if(currentColumn === columnCount){
			currentColumn = 0;
		}
		return currentColumn;
	};
};

var makePerColumnAmount = function(columnCount, limit){
	var columns = _map(Array(columnCount), () => { return 0; });
	var currentColumn = 0;
	var calculateCurrent = makeCalculateCurrent(0, columnCount);

	for(var i = 0; i < limit; i++){
		columns[currentColumn]++;
		currentColumn = calculateCurrent();
	}

	return columns;
};

var totalCount = function(columns){
	return _reduce(columns, (acc, c) => { return acc + c.length; }, 0);
};

export default can.Map.extend({
	PER_PAGE : 50,
	init : function(source){
		this.attr({
			__allData : source || [],
			__columns : [],
			__currentColumn : 0,
			__currentPrependColumn : 0,
			__columnCount : 0,
			__limit : Infinity,
			__prependPaused: false,
		});

		if(source){
			source.on('add', this.proxy('replicateChangesFromSource'));
			source.on('remove', this.proxy('replicateChangesFromSource'));
		}
	},
	replicateChangesFromSource : function(ev, elements, index){
		var isPrependPaused = this.attr('__prependPaused');
		var what = ev.type;
		var isTail;

		if(what === 'add'){
			isTail = this.__allData.length - elements.length === index;
			if(isTail){
				this.append(elements);
			} else if(!isPrependPaused){
				if(index === 0){
					this.prependImmediately(elements);
				} else {
					can.batch.start();
					this.clearColumns();
					this.resetCurrentColumn();
					this.append();
					can.batch.stop();
				}
			} else if(isPrependPaused){
				this.attr('__dataAddedWhilePrependPaused', true);
			}
		} else if(what === 'remove'){
			this.removeItems(elements);
		}
	},
	removeItems : function(items){
		var columns = this.attr('__columns');
		var index;
		can.batch.start();
		for(var i = 0; i < items.length; i++){
			for(var j = 0; j < columns.length; j++){
				index = columns[j].indexOf(items[i]);
				if(index > -1){
					columns[j].splice(index, 1);
				}
			}
		}
		can.batch.stop();
	},
	clearColumns : function(){
		var columns = this.attr('__columns');
		for(var i = 0; i < columns.length; i++){
			columns[i].splice(0);
		}
	},
	resetCurrentColumn : function(){
		this.attr('__currentColumn', 0);
	},
	prependPaused : function(val){
		this.attr('__prependPaused', val);
		if(!val){
			this.attr({
				__currentPrependColumn: 0,
				__dataAddedWhilePrependPaused: false
			});
		}
	},
	columns : function(){
		return this.attr('__columns');
	},
	columnCount : function(){
		return this.attr('__columnCount');
	},
	limit : function(){
		return this.attr('__limit');
	},
	hasPending : function(){
		return !this.__pendingItems || this.__pendingItems.length === 0;
	},
	source : function(){
		return this.attr('__allData');
	},
	addPending : function(item){
		return item;
	},
	append : function(newData){
		var currentColumn = this.attr('__currentColumn');
		var columnCount = this.attr('__columnCount');
		var allData = this.attr('__allData');
		var columns = this.columns();
		var limit = this.attr('__limit');
		var calculateCurrent = makeCalculateCurrent(currentColumn, columnCount);
		var appendingData = newData ? newData : allData;

		
		if(!columnCount){
			return;
		}
		
		can.batch.start();


		for(var i = 0; i < appendingData.length; i++){
			if(limit === Infinity || totalCount(columns) < limit){
				columns[currentColumn].push(this.addPending(appendingData[i]));
				currentColumn = calculateCurrent();
			}
		}

		this.attr({
			__columns: columns,
			currentColumn: currentColumn
		});

		can.batch.stop();
	},
	prependImmediately : function(newData){
		var columnCount = this.attr('__columnCount');
		var columns = this.columns();
		var currentPrependColumn = this.attr('__currentPrependColumn');
		var calculateCurrent = makeCalculateCurrent(currentPrependColumn, columnCount);
		var currentLimit = this.attr('__limit');
		can.batch.start();
		for(var i = 0; i < newData.length; i++){
			columns[currentPrependColumn].unshift(this.addPending(newData[i], true));
			currentPrependColumn = calculateCurrent();
		}
		this.attr({
			__currentPrependColumn: currentPrependColumn,
			__limit: currentLimit + newData.length
		});
		can.batch.stop();
	},
	resetColumns : function(newColumnCount, resetLimit){
		var currentColumnCount = this.attr('__columnCount');
		newColumnCount = newColumnCount || this.attr('__columnCount');
		
		can.batch.start();
		this.attr({
			__currentColumn : 0,
			__columnCount : newColumnCount
		});

		if(resetLimit){
			this.attr('__limit', this.PER_PAGE);
		}
		
		if(currentColumnCount !== newColumnCount){
			this.attr('__columns').replace(makeColumns(newColumnCount));
		} else {
			this.clearColumns();
		}
		// We need to append current data to new columns
		this.append();
		can.batch.stop();
	},
	resetColumnsAndAppend : function(newColumnCount, data){
		can.batch.start();
		this.resetColumns(newColumnCount);
		this.append(data);
		can.batch.stop();
	},
	setLimitAndFillColumns : function(limit){
		var columns = this.columns();
		var columnCount = this.attr('__columnCount');
		var currentLimit = this.attr('__limit');
		var currentColumn = this.attr('__currentColumn');
		var calculateCurrent = makeCalculateCurrent(currentColumn, columnCount);
		var allData = this.attr('__allData');
		var appendUntil = limit > allData.length ? allData.length : limit;
		var perColumnAmount, i;
		
		can.batch.start();
		if(appendUntil >= currentLimit){
			for(i = currentLimit; i < appendUntil; i++){
				columns[currentColumn].push(this.addPending(allData[i]));
				currentColumn = calculateCurrent();
			}
			this.attr('__currentColumn', currentColumn);
		} else if(limit !== Infinity) {
			// Mutate column lists in place so we wouldn't trigger
			// CanJS live binding for columns. This way items that stay
			// in page won't be removed and then inserted again.
			perColumnAmount = makePerColumnAmount(columnCount, appendUntil);
			for(i = 0; i < columnCount; i++){
				columns[i].splice(perColumnAmount[i], columns[i].length);
			}
			
			currentColumn = (appendUntil % columnCount);
			if(currentColumn === columnCount){
				currentColumn = 0;
			}

			this.attr('__currentColumn', currentColumn);
		}
		this.attr('__limit', limit);
		can.batch.stop();
	},
	nextPage : function(){
		this.setLimitAndFillColumns(this.limit() + this.PER_PAGE);
	},
	hasDataAfterLimit : function(){
		var allData = this.attr('__allData');
		var firstIndex = allData.indexOf(this.columns()[0][0]);
		var length = allData.length;
		var limit = this.attr('__limit');
		
		return (length - firstIndex - limit > 0);
	},
	resetFromTopIfNeeded : function(){
		can.batch.start();
		if(this.dataWasAddedWhilePrependWasPaused()){
			this.attr('__limit', this.PER_PAGE);
			this.resetColumns();
		} else {
			this.setLimitAndFillColumns(this.PER_PAGE);
		}
		this.prependPaused(false);
		can.batch.stop();
	},
	dataWasAddedWhilePrependWasPaused: function(){
		return this.attr('__dataAddedWhilePrependPaused');
	}
});
