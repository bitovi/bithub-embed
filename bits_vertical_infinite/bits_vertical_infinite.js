import can from "can/";
import initView from "./bits_vertical_infinite.stache!";
import _throttle from "lodash/function/throttle";
import PartitionedColumnList from "./partitioned_column_list";
import BitModel from "models/bit";

import "./bits_vertical_infinite.less!";
import "can/construct/proxy/";
import "can/map/define/";
import "../bit/";

var CARD_MIN_WIDTH = 300;

var calculateColumnCount = function(el){
	var width = el && el.width() || 0;
	if(width < CARD_MIN_WIDTH) {
		return 1;
	}
	return Math.min(5, Math.floor(width / CARD_MIN_WIDTH));
};

var PartitionedColumnListWithDeferredRendering = PartitionedColumnList.extend({
	addPending : function(item, shouldUnshift){
		can.batch.start();
		item.attr('@pendingRender', true);

		this.__pendingItems = this.__pendingItems || [];

		if(shouldUnshift){
			this.__pendingItems.unshift(item);
		} else {
			this.__pendingItems.push(item);
		}
		
		clearTimeout(this.__renderPendingTimeout);
		this.__renderPendingTimeout = setTimeout(this.proxy('renderPending'), 1);
		can.batch.stop();
		return item;
	},
	renderPending : function(){
		var items = this.__pendingItems || [];
		var renderFn = function(){
			// We render items in batches of 5 so live binding setup
			// wouldn't block the scrolling.
			var toProcess = items.splice(0, 5);

			can.batch.start();
			for(var i = 0; i < toProcess.length; i++){
				toProcess[i].attr('@pendingRender', false);
			}
			can.batch.stop();

			if(items.length){
				setTimeout(renderFn, 1);
			}
		};
		setTimeout(renderFn, 1);
	}
});

export var BitsVerticalInfiniteVM = can.Map.extend({
	bitTag: 'bh-bit',
	hasNextPage: true,
	isLoading: false,
	define : {
		params : {
			value : function(){
				return new can.Map();
			},
			get : function(lastSetValue){
				lastSetValue = lastSetValue || new can.Map();
				lastSetValue.attr('offset', lastSetValue.offset || this.attr('bits').length || 0);
				lastSetValue.attr('limit', lastSetValue.limit || this.attr('partitionedList.PER_PAGE'));
				return lastSetValue;
			}
		}
	},
	init : function(){
		this.attr('partitionedList', new PartitionedColumnListWithDeferredRendering(this.attr('bits')));
		this.loadNextPage();
	},
	loadNextPage : function(){
		var self = this;
		var params;
		if(this.attr('hasNextPage')){
			this.attr('isLoading', true);

			params = this.attr('params').attr();


			BitModel.findAll(params).then(function(data){
				can.batch.start();
				
				if(data.length < self.attr('params.limit')){
					self.attr('hasNextPage', false);
				}

				self.attr('params.offset', self.attr('params.offset') + data.length);
				self.attr('isLoading', false);
				self.attr('bits').push.apply(self.attr('bits'), data);
				
				can.batch.stop();
			}, function(){
				self.attr({
					isLoading: false,
					hasNextPage: false
				});
			});
		}
	}
});

can.Component.extend({
	tag : 'bh-bits-vertical-infinite',
	template : initView,
	scope : BitsVerticalInfiniteVM,
	events : {
		inserted : function(){
			this.element.on('scroll', _throttle(this.proxy('scrollHandler'), 200));
			setTimeout(this.proxy('calculateColumnCount'), 100);
		},
		"{window} resize" : "calculateColumnCount",
		calculateColumnCount : function(){
			setTimeout(() => {
				var partitionedList = this.scope.attr('partitionedList');
				var currentColumnCount = partitionedList.columnCount();
				var newColumnCount =  calculateColumnCount(this.element);
				
				if(currentColumnCount !== newColumnCount){
					partitionedList.resetColumns(newColumnCount, true);
				}
			}, 1);
		},
		nextPage : function(){
			var partitionedList = this.scope.attr('partitionedList');
			
			// If we already made a request at this scroll height
			if(this.__minHeight === this.__minHeightTriggeredReq){
				return;
			}

			this.__minHeightTriggeredReq = this.__minHeight;
			
			if(partitionedList.hasDataAfterLimit()){
				partitionedList.nextPage();
			} else {
				partitionedList.setLimitAndFillColumns(Infinity);
				this.scope.loadNextPage();
			}
		},
		scrollHandler : function(){
			var scrollTop = this.element.scrollTop();
			var scrollHeight = (this.__minHeight || this.element.prop('scrollHeight'));
			var height = this.element.height();
			var partitionedList = this.scope.attr('partitionedList');
			var onBottom = scrollHeight - scrollTop - height < 400;
			var isLoading = this.scope.attr('isLoading');
			
			this.element.trigger('interaction:scroll', [this.scope.attr('state.hubId')]);

			if(scrollTop === 0){
				partitionedList.resetFromTopIfNeeded();
				setTimeout(this.proxy('calculateMinHeight'), 1);
			} else {
				partitionedList.prependPaused(true);
				if(onBottom && !isLoading){
					this.nextPage();
				}
			}
		},
		calculateMinHeight : function(){
			if(!this.element){
				return;
			}
			var heights = can.map(this.element.find('.column'), function(c){
				return $(c).height();
			});

			var minHeight = Math.min.apply(Math, heights);
			delete this.__minHeightTriggeredReq;
			this.__minHeight = minHeight;
		},
		"bit:loaded" : 'calculateMinHeight'
	},
	helpers : {
		eachColumn : function(opts){
			var partitioned = this.attr('partitionedList');
			var columns = partitioned.columns();
			var columnCount = partitioned.columnCount();
			var result = [];
			for(var i = 0; i < columnCount; i++){
				result.push(opts.fn(opts.scope.add({items: columns[i]})));
			}
			return result;
		},
		renderCard : function(bit, opts){
			var tag = this.attr('bitTag');
			var template = can.stache('<' + tag + ' bit="{bit}" state="{state}"></' + tag + '>');
			return template(opts.scope.add({bit: bit}));
		}
	}
});
