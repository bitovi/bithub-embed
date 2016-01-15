import can from "can/";
import initView from "./bits_vertical_infinite.stache!";
import _throttle from "lodash-amd/modern/function/throttle";
import PartitionedColumnList from "./partitioned_column_list";
import BitModel from "models/bit";


import "./bits_vertical_infinite.less!";
import "can/construct/proxy/";
import "can/map/define/";
import "../bit/";
import "can-derive";
import  _map from "lodash-amd/modern/collection/map";

var CARD_MIN_WIDTH = 300;

var calculateColumnCount = function(el){
	var width = el && el.closest('body').width() || 0;
	return Math.max(1, Math.min(5, Math.floor(width / CARD_MIN_WIDTH)));
};

var cookie = function(name, value, ttl, path, domain, secure) {

	if (arguments.length > 1) {
		return document.cookie = name + "=" + encodeURIComponent(value) +
			(ttl ? "; expires=" + new Date(+new Date()+(ttl*1000)).toUTCString() : "") +
			(path   ? "; path=" + path : "") +
			(domain ? "; domain=" + domain : "") +
			(secure ? "; secure" : "");
	}

	return decodeURIComponent((("; "+document.cookie).split("; "+name+"=")[1]||"").split(";")[0]);
};


export var BitsVerticalInfiniteVM = can.Map.extend({
	bitTag: 'bh-bit',
	hasNextPage: true,
	isLoading: false,
	columnCount: 1,
	perPage: 50,
	define : {
		params : {
			value : function(){
				return new can.Map();
			},
			get : function(lastSetValue){
				var bits = this.attr('bits');
				lastSetValue = lastSetValue || new can.Map();
				lastSetValue.attr('offset', lastSetValue.offset || (bits && bits.length) || 0);
				lastSetValue.attr('limit', lastSetValue.limit || this.attr('perPage'));
				return lastSetValue;
			}
		}
	},
	init : function(){
		var self = this;
		this.loadNextPage();
		window.appendData = function(){
			self.bits.push.apply(self.bits, self.bits);
		}
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
	},
	columns : function(){
		console.log('COULUMNS')
		var columnCount = this.attr('columnCount');
		var bits = this.attr('bits');
		var res = _map(new Array(columnCount), function(val, index){
			return bits.dFilter(function(item, idx){
				return idx % columnCount === index;
			});
		});
		
		window.RES = res;

		console.log(res)

		return res;

		var length = bits.attr('length');
		var index = 0;
		for(var i = 0; i < length; i++){
			columns.attr(index).push(bits[i]);
			index++;
			if(index === columnCount){
				index = 0;
			}
		}
		console.log('COLUMN COUNT', columnCount, columns)
		return columns;
	},
	showNewDataNotice : function(){
		return false;
		return this.attr('state').isAdmin() && this.attr('partitionedList').dataWasAddedWhilePrependWasPaused();
	}
});

can.Component.extend({
	tag : 'bh-bits-vertical-infinite',
	template : initView,
	scope : BitsVerticalInfiniteVM,
	events : {
		init: function(){
			this.__cookieName = (this.scope.attr('state.tenant') || "") + 'seen-bits';
			this.__seenBits = cookie(this.__cookieName).split(',');
		},
		inserted : function(){
			this.element.on('scroll', _throttle(this.proxy('scrollHandler'), 200));
			setTimeout(this.proxy('calculateColumnCount'), 100);
		},
		"{window} resize" : "calculateColumnCount",
		calculateColumnCount : function(){
			var self = this;

			clearTimeout(this.__calculateColumnCountTimeout);
			this.__calculateColumnCountTimeout = setTimeout(() => {
				var currentColumnCount = this.scope.attr('columnCount');
				var newColumnCount =  calculateColumnCount(this.element);
				
				if(currentColumnCount !== newColumnCount){
					this.scope.attr('columnCount', newColumnCount);
				}
				
				self.__calculateColumnCountTimeout = setTimeout(self.proxy('calculateColumnCount'), 1000);

			}, 1);
		},
		nextPage : function(){
			return;
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
		'.scroll-to-top click' : function(){
			this.element.scrollTop(0);
		},
		scrollHandler : function(){
			var scrollTop = this.element.scrollTop();
			var scrollHeight = (this.__minHeight || this.element.prop('scrollHeight'));
			var height = this.element.height();
			var partitionedList = this.scope.attr('partitionedList');
			var onBottom = scrollHeight - scrollTop - height < 400;
			var isLoading = this.scope.attr('isLoading');
			
			this.element.trigger('interaction:scroll', [this.scope.attr('state.hubId')]);

			this.calculateSeen();

			if(scrollTop === 0){
				setTimeout(this.proxy('calculateMinHeight'), 1);
			} else {
				if(onBottom && !isLoading){
					this.nextPage();
				}
			}
		},
		calculateSeen: function(elements){
			return;
			if(!this.scope.attr('state').isAdmin()){
				return;
			}

			var containerHeight = this.element.height();
			var self = this;
			elements = elements || this.element.find(this.scope.bitTag + ':not(.was-seen):not(.loading)');

			elements.each(function(){

				var rect = this.getBoundingClientRect();
				var top = rect.top;
				var height = rect.height;
				var isSeen = false;
				var $el = $(this);
				if(top < 0){
					isSeen = true;
				} else if(containerHeight - top - height > 0){
					isSeen = true;
				}

				if(isSeen && !$el.find('.loading').length){
					
					self.markAsSeen($el.data('bitId'));
				}
			});
		},
		markAsSeen: function(id){
			return;
			var self = this;
			clearTimeout(this.__markAsSeenTimeout);

			if(this.__seenBits.indexOf(id+"") === -1){
				this.__seenBits.push(id);
				this.__markAsSeenTimeout = setTimeout(function(){
					cookie(self.__cookieName, self.__seenBits.slice(Math.max(self.__seenBits.length - 300, 0)).join(','), 60*60*24*365);
				}, 100);
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
		"bit:loaded" : function(el, ev){
			var $el = $(ev.target);
			var id = $el.data('bitId');

			console.log('BIT LOADED')

			this.calculateMinHeight();
			
			if(this.scope.attr('state').isAdmin()){
				if(this.__seenBits.indexOf(id + "") > -1){
					$el.addClass('was-seen');
				} else {
					this.calculateSeen($el);
				}
			}
			
		}
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
